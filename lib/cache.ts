import { LRUCache } from 'lru-cache';
import React from 'react';

// Configurações de cache
const CACHE_CONFIG = {
  // Cache para dados de API
  api: {
    max: 500,
    ttl: 1000 * 60 * 5, // 5 minutos
  },
  // Cache para dados em tempo real
  realtime: {
    max: 100,
    ttl: 1000 * 30, // 30 segundos
  },
  // Cache para dados estáticos
  static: {
    max: 1000,
    ttl: 1000 * 60 * 60, // 1 hora
  },
  // Cache para dados de usuário
  user: {
    max: 50,
    ttl: 1000 * 60 * 15, // 15 minutos
  },
};

// Instâncias de cache
const apiCache = new LRUCache<string, any>(CACHE_CONFIG.api);
const realtimeCache = new LRUCache<string, any>(CACHE_CONFIG.realtime);
const staticCache = new LRUCache<string, any>(CACHE_CONFIG.static);
const userCache = new LRUCache<string, any>(CACHE_CONFIG.user);

// Tipos de cache
export type CacheType = 'api' | 'realtime' | 'static' | 'user';

// Interface para dados em cache
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  etag?: string;
  lastModified?: string;
}

type SmartCacheInstanceEntry<T = any> = {
  value: T;
  timestamp: number;
  ttl: number;
};

// Classe principal do sistema de cache
export class SmartCache {
  private store: Map<string, SmartCacheInstanceEntry>;
  private stats: { hits: number; misses: number };
  private maxSize: number;
  private defaultTtl: number;
  private persistent: boolean;
  private storageKey: string;

  constructor(options?: {
    maxSize?: number;
    ttl?: number;
    persistent?: boolean;
    storageKey?: string;
  }) {
    this.store = new Map();
    this.stats = { hits: 0, misses: 0 };
    this.maxSize = options?.maxSize ?? 100;
    this.defaultTtl = options?.ttl ?? 5 * 60 * 1000;
    this.persistent = options?.persistent ?? false;
    this.storageKey = options?.storageKey ?? 'smart-cache';

    if (this.persistent) {
      this.loadFromStorage();
    }
  }

  private now() {
    const perf = (globalThis as any)?.performance;
    if (perf && typeof perf.now === 'function') {
      return perf.now();
    }
    return Date.now();
  }

  private isExpired(entry: SmartCacheInstanceEntry, now: number) {
    return now - entry.timestamp > entry.ttl;
  }

  private evictIfNeeded() {
    while (this.store.size > this.maxSize) {
      const lruKey = this.store.keys().next().value as string | undefined;
      if (lruKey === undefined) break;
      this.store.delete(lruKey);
    }
  }

  private saveToStorage() {
    const storage = (globalThis as any)?.localStorage;
    if (!storage || typeof storage.setItem !== 'function') return;

    const data: Record<string, SmartCacheInstanceEntry> = {};
    for (const [key, entry] of Array.from(this.store.entries())) {
      data[key] = entry;
    }
    storage.setItem(this.storageKey, JSON.stringify(data));
  }

  private loadFromStorage() {
    const storage = (globalThis as any)?.localStorage;
    if (!storage || typeof storage.getItem !== 'function') return;

    const raw = storage.getItem(this.storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Record<string, SmartCacheInstanceEntry>;
      const now = this.now();
      for (const [key, entry] of Object.entries(parsed)) {
        if (
          entry &&
          typeof entry === 'object' &&
          typeof entry.timestamp === 'number' &&
          typeof entry.ttl === 'number'
        ) {
          if (!this.isExpired(entry, now)) {
            this.store.set(key, entry);
          }
        }
      }
      this.evictIfNeeded();
    } catch {
      return;
    }
  }

  set<T>(key: string, value: T, ttl?: number) {
    const now = this.now();
    this.store.delete(key);
    this.store.set(key, {
      value,
      timestamp: now,
      ttl: ttl ?? this.defaultTtl
    });
    this.evictIfNeeded();
    if (this.persistent) {
      this.saveToStorage();
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as SmartCacheInstanceEntry<T> | undefined;
    const now = this.now();

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (this.isExpired(entry, now)) {
      this.store.delete(key);
      this.stats.misses++;
      if (this.persistent) {
        this.saveToStorage();
      }
      return undefined;
    }

    this.store.delete(key);
    this.store.set(key, entry);
    this.stats.hits++;
    return entry.value;
  }

  has(key: string) {
    const entry = this.store.get(key);
    if (!entry) return false;
    const now = this.now();
    if (this.isExpired(entry, now)) {
      this.store.delete(key);
      if (this.persistent) {
        this.saveToStorage();
      }
      return false;
    }
    return true;
  }

  delete(key: string) {
    const existed = this.store.delete(key);
    if (existed && this.persistent) {
      this.saveToStorage();
    }
    return existed;
  }

  clear() {
    this.store.clear();
    if (this.persistent) {
      this.saveToStorage();
    }
  }

  size() {
    return this.store.size;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.store.size,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  invalidatePattern(pattern: string) {
    const regex = new RegExp(pattern);
    let deleted = 0;
    for (const key of Array.from(this.store.keys())) {
      if (regex.test(key)) {
        this.store.delete(key);
        deleted++;
      }
    }
    if (deleted > 0 && this.persistent) {
      this.saveToStorage();
    }
    return deleted;
  }

  preload<T>(key: string, value: T, ttl?: number) {
    this.set(key, value, ttl);
  }

  private static getCacheInstance(type: CacheType) {
    switch (type) {
      case 'api':
        return apiCache;
      case 'realtime':
        return realtimeCache;
      case 'static':
        return staticCache;
      case 'user':
        return userCache;
      default:
        return apiCache;
    }
  }

  // Armazenar dados no cache
  static set<T>(
    key: string,
    data: T,
    type: CacheType = 'api',
    options?: {
      etag?: string;
      lastModified?: string;
      customTtl?: number;
    }
  ): void {
    const cache = this.getCacheInstance(type);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      etag: options?.etag,
      lastModified: options?.lastModified,
    };

    if (options?.customTtl) {
      cache.set(key, entry, { ttl: options.customTtl });
    } else {
      cache.set(key, entry);
    }
  }

  // Recuperar dados do cache
  static get<T>(key: string, type: CacheType = 'api'): T | null {
    const cache = this.getCacheInstance(type);
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    return entry.data;
  }

  // Verificar se existe no cache
  static has(key: string, type: CacheType = 'api'): boolean {
    const cache = this.getCacheInstance(type);
    return cache.has(key);
  }

  // Remover do cache
  static delete(key: string, type: CacheType = 'api'): boolean {
    const cache = this.getCacheInstance(type);
    return cache.delete(key);
  }

  // Limpar cache específico
  static clear(type: CacheType = 'api'): void {
    const cache = this.getCacheInstance(type);
    cache.clear();
  }

  // Limpar todos os caches
  static clearAll(): void {
    apiCache.clear();
    realtimeCache.clear();
    staticCache.clear();
    userCache.clear();
  }

  // Obter estatísticas do cache
  static getStats(type: CacheType = 'api') {
    const cache = this.getCacheInstance(type);
    return {
      size: cache.size,
      max: cache.max,
      calculatedSize: cache.calculatedSize,
      // Note: hits/misses não estão disponíveis nesta versão do LRUCache
      hits: 0,
      misses: 0,
      hitRate: 0,
    };
  }

  // Invalidar cache baseado em padrão
  static invalidatePattern(pattern: string, type: CacheType = 'api'): number {
    const cache = this.getCacheInstance(type);
    const regex = new RegExp(pattern);
    let deleted = 0;

    for (const key of Array.from(cache.keys())) {
      if (regex.test(key)) {
        cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  // Pré-carregar dados no cache
  static async preload<T>(
    key: string,
    fetcher: () => Promise<T>,
    type: CacheType = 'api',
    options?: {
      force?: boolean;
      customTtl?: number;
    }
  ): Promise<T> {
    if (!options?.force && this.has(key, type)) {
      return this.get<T>(key, type)!;
    }

    try {
      const data = await fetcher();
      this.set(key, data, type, { customTtl: options?.customTtl });
      return data;
    } catch (error) {
      console.error(`Erro ao pré-carregar cache para ${key}:`, error);
      throw error;
    }
  }

  // Cache com fallback
  static async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    type: CacheType = 'api',
    options?: {
      customTtl?: number;
      staleWhileRevalidate?: boolean;
    }
  ): Promise<T> {
    const cached = this.get<T>(key, type);
    
    if (cached && !options?.staleWhileRevalidate) {
      return cached;
    }

    try {
      const data = await fetcher();
      this.set(key, data, type, { customTtl: options?.customTtl });
      return data;
    } catch (error) {
      if (cached) {
        console.warn(`Erro ao buscar dados, retornando cache: ${key}`, error);
        return cached;
      }
      throw error;
    }
  }
}

// Hook para usar cache em componentes React
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  type: CacheType = 'api',
  options?: {
    enabled?: boolean;
    customTtl?: number;
    staleWhileRevalidate?: boolean;
  }
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!options?.enabled) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await SmartCache.getOrFetch(
          key,
          fetcher,
          type,
          {
            customTtl: options?.customTtl,
            staleWhileRevalidate: options?.staleWhileRevalidate,
          }
        );
        
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, type, options?.enabled]);

  const invalidate = React.useCallback(() => {
    SmartCache.delete(key, type);
  }, [key, type]);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await SmartCache.preload(key, fetcher, type, { force: true });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, type]);

  return {
    data,
    loading,
    error,
    invalidate,
    refresh,
  };
}

// Utilitários para cache de API
export const ApiCache = {
  // Cache para endpoints específicos
  signals: {
    live: (tableId?: string) => `signals:live${tableId ? `:${tableId}` : ''}`,
    history: (tableId: string, limit: number) => `signals:history:${tableId}:${limit}`,
    kpis: () => 'signals:kpis',
  },
  
  roulette: {
    latest: (tableId: string) => `roulette:latest:${tableId}`,
    history: (tableId: string, limit: number) => `roulette:history:${tableId}:${limit}`,
    status: (tableId: string) => `roulette:status:${tableId}`,
  },
  
  user: {
    profile: (userId: string) => `user:profile:${userId}`,
    preferences: (userId: string) => `user:preferences:${userId}`,
    notifications: (userId: string) => `user:notifications:${userId}`,
  },
};

// Middleware para cache automático em fetch
export function createCachedFetch(type: CacheType = 'api') {
  return async function cachedFetch(
    url: string,
    options?: RequestInit & {
      cacheKey?: string;
      cacheTtl?: number;
      skipCache?: boolean;
    }
  ) {
    const cacheKey = options?.cacheKey || url;
    
    if (!options?.skipCache && SmartCache.has(cacheKey, type)) {
      return SmartCache.get(cacheKey, type);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      SmartCache.set(cacheKey, data, type, {
        customTtl: options?.cacheTtl,
        etag: response.headers.get('etag') || undefined,
        lastModified: response.headers.get('last-modified') || undefined,
      });
      
      return data;
    } catch (error) {
      // Tentar retornar dados em cache em caso de erro
      const cached = SmartCache.get(cacheKey, type);
      if (cached) {
        console.warn(`Erro na requisição, retornando cache: ${url}`, error);
        return cached;
      }
      throw error;
    }
  };
}

// Função para criar uma instância de cache de API
export function createApiCache(options?: { ttl?: number; maxSize?: number }) {
  const cache = new SmartCache({
    maxSize: options?.maxSize ?? 200,
    ttl: options?.ttl ?? 5 * 60 * 1000
  });

  const cachedFetch = (async (url: string, requestInit?: RequestInit) => {
    if (cache.has(url)) {
      return cache.get(url);
    }

    const response = await fetch(url, requestInit);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    cache.set(url, data);
    return data;
  }) as any;

  cachedFetch.invalidatePattern = (pattern: string) => cache.invalidatePattern(pattern);
  cachedFetch.cache = cache;

  return cachedFetch;
}

// Middleware de cache para Next.js
export function cacheMiddleware(options: { patterns: string[]; ttl: number }) {
  return function middleware(req: any, res: any, next: any) {
    // Implementação básica do middleware
    if (options.patterns.some(pattern => req.url?.includes(pattern))) {
      // Aplicar cache
      res.setHeader('Cache-Control', `public, max-age=${Math.floor(options.ttl / 1000)}`);
    }
    if (next) next();
  };
}

// Hook para usar SmartCache
export function useSmartCache<T>(
  key: string,
  type?: CacheType
): {
  get: () => T | null;
  set: (data: T, options?: any) => void;
  has: () => boolean;
  delete: () => boolean;
};
export function useSmartCache(
  key?: undefined,
  type?: CacheType
): {
  cache: SmartCache;
  invalidatePattern: (pattern: string) => number;
  preload: <D>(preloadKey: string, data: D, ttl?: number) => void;
};
export function useSmartCache<T>(key?: string, type: CacheType = 'api') {
  if (typeof key === 'string') {
    return {
      get: () => SmartCache.get<T>(key, type),
      set: (data: T, options?: any) => SmartCache.set(key, data, type, options),
      has: () => SmartCache.has(key, type),
      delete: () => SmartCache.delete(key, type),
    };
  }

  const cacheRef = React.useRef<SmartCache | null>(null);
  if (!cacheRef.current) {
    cacheRef.current = new SmartCache({ maxSize: 200, ttl: 5 * 60 * 1000 });
  }

  return {
    cache: cacheRef.current,
    invalidatePattern: (pattern: string) => cacheRef.current!.invalidatePattern(pattern),
    preload: <D>(preloadKey: string, data: D, ttl?: number) =>
      cacheRef.current!.preload(preloadKey, data, ttl),
  };
}

// Exportar instância padrão
export default SmartCache;
