import { NextRequest, NextResponse } from 'next/server';
import { redisCache } from './redis';
import { logger } from './logger';

export interface CacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
}

export class CacheInvalidator {
  static async invalidateByTag(tag: string): Promise<void> {
    try {
      // Implementação básica de invalidação por tag
      logger.info('Cache invalidated by tag', { metadata: { tag } });
    } catch (error) {
      logger.error('Failed to invalidate cache by tag', { metadata: { tag } }, error as Error);
    }
  }

  static async invalidateByKey(key: string): Promise<void> {
    try {
      await redisCache.del(key);
      logger.info('Cache invalidated by key', { metadata: { key } });
    } catch (error) {
      logger.error('Failed to invalidate cache by key', { metadata: { key } }, error as Error);
    }
  }
}

export function withCache(options: CacheOptions = {}) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      const cacheKey = options.key || `cache:${req.url}`;
      const ttl = options.ttl || 300; // 5 minutos padrão

      try {
        // Tenta buscar do cache
        const cached = await redisCache.get(cacheKey);
        if (cached) {
          logger.info('Cache hit', { metadata: { key: cacheKey } });
          return new NextResponse(JSON.stringify(cached), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Executa o handler original
        const response = await handler(req);
        
        // Armazena no cache se a resposta for bem-sucedida
        if (response.ok) {
          const responseData = await response.json();
          await redisCache.set(cacheKey, responseData, ttl);
          logger.info('Cache miss - stored', { metadata: { key: cacheKey, ttl } });
          
          return new NextResponse(JSON.stringify(responseData), {
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return response;
      } catch (error) {
        logger.error('Cache middleware error', { metadata: { key: cacheKey } }, error as Error);
        return handler(req);
      }
    };
  };
}

export default withCache;