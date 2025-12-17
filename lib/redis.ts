/**
 * Sistema de cache em memória para otimização de performance
 * Implementação simplificada que funciona tanto no cliente quanto no servidor
 */

import { logger } from './logger';

// Tipo para compatibilidade
type RedisClientType = any;

// Cache em memória simples
class MemoryCache {
  private cache = new Map<string, { value: any; expires?: number }>();

  async connect() {
    return Promise.resolve();
  }

  async disconnect() {
    return Promise.resolve();
  }

  async set(key: string, value: any, options?: { EX?: number }) {
    const expires = options?.EX ? Date.now() + (options.EX * 1000) : undefined;
    this.cache.set(key, { value, expires });
    return 'OK';
  }

  // Compat: método similar ao Redis para set com TTL
  async setEx(key: string, ttl: number, value: any) {
    return this.set(key, value, { EX: ttl });
  }

  async get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async del(key: string) {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string) {
    const item = this.cache.get(key);
    if (!item) return 0;
    
    if (item.expires && Date.now() > item.expires) {
      this.cache.delete(key);
      return 0;
    }
    
    return 1;
  }

  async expire(key: string, seconds: number) {
    const item = this.cache.get(key);
    if (!item) return 0;
    
    item.expires = Date.now() + (seconds * 1000);
    return 1;
  }

  async keys(pattern: string) {
    const keys = Array.from(this.cache.keys());
    if (pattern === '*') return keys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  async flushAll() {
    this.cache.clear();
    return 'OK';
  }

  get isOpen() {
    return true;
  }

  get isReady() {
    return true;
  }
}

// Função para criar cliente de cache (condicional)
class IoRedisCompat {
  private client: any;
  constructor(client: any) {
    this.client = client;
  }
  async connect() { if (this.client.connect) await this.client.connect(); }
  async disconnect() { if (this.client.quit) await this.client.quit(); }
  async setEx(key: string, ttl: number, value: any) { await this.client.set(key, value, 'EX', ttl); }
  async get(key: string) { return await this.client.get(key); }
  async del(key: string) { return await this.client.del(key); }
  async exists(key: string) { return await this.client.exists(key); }
  async expire(key: string, seconds: number) { return await this.client.expire(key, seconds); }
  async keys(pattern: string) { return await this.client.keys(pattern); }
  async flushAll() { if (this.client.flushall) { await this.client.flushall(); } }
  get isOpen() { return true; }
  get isReady() { return true; }
}

const createClient = async (config: any): Promise<RedisClientType> => {
  const isBrowser = typeof window !== 'undefined';
  const hasRedisUrl = !!process.env.REDIS_URL;
  if (!isBrowser && hasRedisUrl) {
    try {
      const mod = await import('ioredis');
      const RedisCtor = (mod as any).default || mod;
      const client = new RedisCtor(config.url, { lazyConnect: config.lazyConnect, maxRetriesPerRequest: config.maxRetriesPerRequest });
      return new IoRedisCompat(client);
    } catch (error) {
      logger.warn('Falling back to memory cache', { metadata: { error: error instanceof Error ? error.message : 'Unknown error' } });
    }
  }
  return new MemoryCache();
};

// Configuração do Redis
const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

// TTL padrão em segundos
export const CACHE_TTL = {
  SHORT: 60, // 1 minuto
  MEDIUM: 300, // 5 minutos
  LONG: 1800, // 30 minutos
  VERY_LONG: 3600, // 1 hora
  DAILY: 86400, // 24 horas
} as const;

// Prefixos para organização das chaves
export const CACHE_KEYS = {
  USER: 'user:',
  API: 'api:',
  SESSION: 'session:',
  ANALYTICS: 'analytics:',
  RATE_LIMIT: 'rate_limit:',
  TEMP: 'temp:',
} as const;

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      this.client = await createClient(REDIS_CONFIG);
      await (this.client as any).connect();
      this.isConnected = true;
      const type = this.client instanceof MemoryCache ? 'memory' : 'redis';
      logger.info(`${type === 'redis' ? 'Redis' : 'Memory'} cache initialized`, { metadata: { context: 'cache', type } });
    } catch (error) {
      logger.error('Failed to initialize cache', { 
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
      throw error;
    }
  }

  private async ensureConnection(): Promise<boolean> {
    if (this.isConnected && this.client) {
      return true;
    }

    if (!this.client) {
      await this.initializeClient();
      return this.isConnected;
    }

    // Para MemoryCache, não precisa de conexão adicional
    if (this.client instanceof MemoryCache) {
      return this.isConnected;
    }

    if (!this.connectionPromise && this.client) {
      this.connectionPromise = this.client.connect().then(() => {
        this.connectionPromise = null;
        this.isConnected = true;
      }).catch((error: any) => {
        this.connectionPromise = null;
        logger.error('Failed to connect to Redis', { 
          metadata: {
            error: error.message,
            context: 'redis'
          }
        });
        throw error;
      });
    }

    if (this.connectionPromise) {
      await this.connectionPromise;
    }

    return this.isConnected;
  }

  /**
   * Define um valor no cache
   */
  async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return false;
      }

      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      
      logger.debug('Cache set', { 
        metadata: {
          key, 
          ttl, 
          size: serializedValue.length,
          context: 'redis'
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to set cache', { 
        metadata: {
          key, 
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'redis'
        }
      });
      return false;
    }
  }

  /**
   * Obtém um valor do cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return null;
      }

      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      const parsed = JSON.parse(value) as T;
      
      logger.debug('Cache hit', { 
        metadata: {
          key,
          context: 'cache'
        }
      });
      
      return parsed;
    } catch (error) {
      logger.error('Failed to get cache', { 
        metadata: {
          key, 
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
      return null;
    }
  }

  /**
   * Remove um valor do cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return false;
      }

      const result = await this.client.del(key);
      
      logger.debug('Cache deleted', { 
        metadata: {
          key,
          deleted: result > 0,
          context: 'cache'
        }
      });
      
      return result > 0;
    } catch (error) {
      logger.error('Failed to delete cache', { 
        metadata: {
          key, 
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
      return false;
    }
  }

  /**
   * Busca chaves por padrão
   */
  async getKeys(pattern: string): Promise<string[]> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return [];
      }

      const keys = await this.client.keys(pattern);
      return keys;
    } catch (error) {
      logger.error('Failed to get keys by pattern', { 
        metadata: {
          pattern, 
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
      return [];
    }
  }

  /**
   * Remove múltiplas chaves por padrão
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return 0;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      let deleted = 0;
      for (const key of keys) {
        const result = await this.client.del(key);
        deleted += result;
      }
      
      logger.debug('Cache pattern deleted', { 
        metadata: {
          pattern,
          keysFound: keys.length,
          deleted,
          context: 'cache'
        }
      });
      
      return deleted;
    } catch (error) {
      logger.error('Failed to delete cache pattern', { 
        metadata: {
          pattern, 
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
      return 0;
    }
  }

  /**
   * Verifica se uma chave existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Failed to check cache existence', { 
        metadata: {
          key, 
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
      return false;
    }
  }

  /**
   * Define TTL para uma chave existente
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return false;
      }

      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Failed to set cache expiration', { 
        metadata: {
          key, 
          ttl,
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
      return false;
    }
  }

  /**
   * Incrementa um contador
   */
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return 0;
      }

      // Simular incremento com MemoryCache
      const current = await this.client.get(key);
      const value = current ? parseInt(current) + 1 : 1;
      await this.client.set(key, value.toString(), ttl ? { EX: ttl } : undefined);
      
      return value;
    } catch (error) {
      logger.error('Failed to increment cache', { 
        metadata: {
          key, 
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
      return 0;
    }
  }

  /**
   * Obtém informações do cache
   */
  async getInfo(): Promise<Record<string, any> | null> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return null;
      }

      const keys = await this.client.keys('*');
      const stats = {
        connected: this.isConnected,
        type: 'memory',
        keyCount: keys.length,
        info: 'In-memory cache active'
      };
      
      return stats;
    } catch (error) {
      logger.error('Failed to get cache info', { 
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
      return null;
    }
  }

  /**
   * Limpa todo o cache
   */
  async flush(): Promise<boolean> {
    try {
      const connected = await this.ensureConnection();
      if (!connected || !this.client) {
        return false;
      }

      await this.client.flushAll();
      
      logger.info('Cache flushed', { metadata: { context: 'cache' } });
      
      return true;
    } catch (error) {
      logger.error('Failed to flush cache', { 
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
      return false;
    }
  }

  /**
   * Fecha a conexão
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        logger.info('Cache client disconnected', { metadata: { context: 'cache' } });
      }
    } catch (error) {
      logger.error('Failed to disconnect cache client', { 
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          context: 'cache'
        }
      });
    }
  }
}

// Exporta a classe RedisCache
export { RedisCache };

// Instância singleton
export const redisCache = new RedisCache();

// Utilitários para cache
export const cacheUtils = {
  /**
   * Gera chave de cache formatada
   */
  key: (prefix: string, ...parts: (string | number)[]): string => {
    return `${prefix}${parts.join(':')}`;
  },

  /**
   * Cache com fallback - tenta buscar no cache, se não encontrar executa a função
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    const cached = await redisCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFn();
    await redisCache.set(key, fresh, ttl);
    return fresh;
  },

  /**
   * Invalidação de cache por tags
   */
  async invalidateByTag(tag: string): Promise<number> {
    return await redisCache.delPattern(`*:${tag}:*`);
  }
};

// Exportação nomeada para compatibilidade
export const redis = redisCache;

export default redisCache;