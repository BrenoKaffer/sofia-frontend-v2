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

// Classe principal do sistema de cache
export class SmartCache {
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
  return createCachedFetch('api');
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
export function useSmartCache<T>(key: string, type: CacheType = 'api') {
  return {
    get: () => SmartCache.get<T>(key, type),
    set: (data: T, options?: any) => SmartCache.set(key, data, type, options),
    has: () => SmartCache.has(key, type),
    delete: () => SmartCache.delete(key, type),
  };
}

// Exportar instância padrão
export default SmartCache;