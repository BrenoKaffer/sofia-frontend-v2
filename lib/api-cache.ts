/**
 * Sistema de cache local para otimizar performance das requisições
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live em milissegundos
  maxSize?: number; // Máximo de entradas no cache
  staleWhileRevalidate?: boolean; // Retorna dados stale enquanto revalida
  tags?: string[]; // Tags para invalidação em grupo
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Classe principal do sistema de cache
 */
export class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private stats = { hits: 0, misses: 0 };
  private maxSize: number;
  private tagMap = new Map<string, Set<string>>(); // tag -> set of keys

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Gera uma chave de cache baseada na URL e parâmetros
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const headers = JSON.stringify(options?.headers || {});
    const body = options?.body || '';
    
    return `${method}:${url}:${headers}:${body}`;
  }

  /**
   * Verifica se uma entrada está expirada
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Verifica se uma entrada está stale (expirada mas ainda utilizável)
   */
  private isStale(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp;
  }

  /**
   * Remove entradas antigas quando o cache está cheio
   */
  private evictOldEntries(): void {
    if (this.cache.size <= this.maxSize) return;

    // Ordenar por timestamp (mais antigo primeiro)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    // Remover 25% das entradas mais antigas
    const toRemove = Math.ceil(this.cache.size * 0.25);
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.delete(key);
    }
  }

  /**
   * Adiciona tags para uma chave
   */
  private addTags(key: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(key);
    });
  }

  /**
   * Remove tags para uma chave
   */
  private removeTags(key: string): void {
    this.tagMap.forEach((keys, tag) => {
      keys.delete(key);
      if (keys.size === 0) {
        this.tagMap.delete(tag);
      }
    });
  }

  /**
   * Armazena dados no cache
   */
  set<T>(
    url: string,
    data: T,
    options: CacheOptions & { requestOptions?: RequestInit } = {}
  ): void {
    const {
      ttl = 5 * 60 * 1000, // 5 minutos padrão
      tags = [],
      requestOptions
    } = options;

    const key = this.generateKey(url, requestOptions);
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      key
    };

    // Remover entrada antiga se existir
    if (this.cache.has(key)) {
      this.removeTags(key);
    }

    this.cache.set(key, entry);
    this.addTags(key, tags);
    this.evictOldEntries();
  }

  /**
   * Recupera dados do cache
   */
  get<T>(
    url: string,
    requestOptions?: RequestInit
  ): { data: T; isStale: boolean } | null {
    const key = this.generateKey(url, requestOptions);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return {
      data: entry.data,
      isStale: this.isStale(entry)
    };
  }

  /**
   * Remove uma entrada específica do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeTags(key);
    }
    return deleted;
  }

  /**
   * Remove entradas por URL
   */
  deleteByUrl(url: string): number {
    let deleted = 0;
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(url)) {
        this.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Invalida cache por tags
   */
  invalidateByTags(tags: string[]): number {
    let deleted = 0;
    tags.forEach(tag => {
      const keys = this.tagMap.get(tag);
      if (keys) {
        keys.forEach(key => {
          if (this.delete(key)) {
            deleted++;
          }
        });
      }
    });
    return deleted;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.tagMap.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): number {
    let removed = 0;
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (this.isExpired(entry)) {
        this.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

// Instância global do cache
export const apiCache = new ApiCache(200);

/**
 * Configurações de cache para diferentes tipos de dados
 */
export const cacheConfigs = {
  // Dados em tempo real - cache muito curto
  realtime: {
    ttl: 30 * 1000, // 30 segundos
    tags: ['realtime'],
    staleWhileRevalidate: true
  },
  
  // Dados históricos - cache longo
  historical: {
    ttl: 10 * 60 * 1000, // 10 minutos
    tags: ['historical'],
    staleWhileRevalidate: true
  },
  
  // Configurações - cache muito longo
  config: {
    ttl: 30 * 60 * 1000, // 30 minutos
    tags: ['config'],
    staleWhileRevalidate: false
  },
  
  // Dados do usuário - cache médio
  user: {
    ttl: 5 * 60 * 1000, // 5 minutos
    tags: ['user'],
    staleWhileRevalidate: true
  },
  
  // Estratégias - cache longo
  strategies: {
    ttl: 15 * 60 * 1000, // 15 minutos
    tags: ['strategies'],
    staleWhileRevalidate: true
  }
};

/**
 * Função helper para fazer requisições com cache
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & {
    cacheOptions?: CacheOptions;
    bypassCache?: boolean;
  } = {}
): Promise<T> {
  const { cacheOptions, bypassCache = false, ...fetchOptions } = options;
  
  // Verificar cache primeiro (se não for bypass)
  if (!bypassCache) {
    const cached = apiCache.get<T>(url, fetchOptions);
    if (cached) {
      // Se os dados estão stale mas staleWhileRevalidate está ativo,
      // retorna os dados e faz revalidação em background
      if (cached.isStale && cacheOptions?.staleWhileRevalidate) {
        // Revalidação em background
        setTimeout(async () => {
          try {
            const response = await fetch(url, fetchOptions);
            if (response.ok) {
              const freshData = await response.json();
              apiCache.set(url, freshData, { ...cacheOptions, requestOptions: fetchOptions });
            }
          } catch (error) {
            console.warn('Background revalidation failed:', error);
          }
        }, 0);
      }
      
      return cached.data;
    }
  }
  
  // Fazer requisição
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data: T = await response.json();
  
  // Armazenar no cache
  if (cacheOptions) {
    apiCache.set(url, data, { ...cacheOptions, requestOptions: fetchOptions });
  }
  
  return data;
}

/**
 * Hook para limpeza automática do cache
 */
if (typeof window !== 'undefined') {
  // Limpeza automática a cada 5 minutos
  setInterval(() => {
    const removed = apiCache.cleanup();
    if (removed > 0) {
      console.log(`Cache cleanup: removed ${removed} expired entries`);
    }
  }, 5 * 60 * 1000);
  
  // Log de estatísticas a cada 10 minutos (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const stats = apiCache.getStats();
      console.log('Cache stats:', stats);
    }, 10 * 60 * 1000);
  }
}

/**
 * Utilitários para invalidação de cache
 */
export const cacheUtils = {
  // Invalidar dados de usuário
  invalidateUser: () => apiCache.invalidateByTags(['user']),
  
  // Invalidar dados em tempo real
  invalidateRealtime: () => apiCache.invalidateByTags(['realtime']),
  
  // Invalidar dados históricos
  invalidateHistorical: () => apiCache.invalidateByTags(['historical']),
  
  // Invalidar configurações
  invalidateConfig: () => apiCache.invalidateByTags(['config']),
  
  // Invalidar estratégias
  invalidateStrategies: () => apiCache.invalidateByTags(['strategies']),
  
  // Invalidar tudo
  invalidateAll: () => apiCache.clear(),
  
  // Obter estatísticas
  getStats: () => apiCache.getStats()
};