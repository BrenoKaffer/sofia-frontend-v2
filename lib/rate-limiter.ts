/**
 * Sistema de Rate Limiting para APIs
 * Implementa controle de taxa de requisições por IP e usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { RedisCache } from './redis';

// Configurações de rate limiting por endpoint
export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições na janela
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  onLimitReached?: (req: NextRequest) => void;
}

// Configurações padrão por tipo de endpoint
export const RATE_LIMIT_CONFIGS = {
  // APIs públicas - mais restritivo
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  
  // APIs de autenticação - muito restritivo
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5,
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  },
  
  // APIs de dados em tempo real - moderado
  realtime: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 60,
    skipSuccessfulRequests: true,
    skipFailedRequests: true,
  },
  
  // APIs de ML/Analytics - restritivo
  ml: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 20,
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
  },
  
  // APIs administrativas - muito restritivo
  admin: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
} as const;

// Singleton de cache compartilhado entre requisições
const sharedCache = new RedisCache();

// Classe principal do Rate Limiter
export class RateLimiter {
  private cache: RedisCache;
  private config: RateLimitConfig;
  
  constructor(config: RateLimitConfig) {
    // Usar cache compartilhado para persistência entre requisições
    this.cache = sharedCache;
    this.config = config;
  }
  
  // Gera chave única para o rate limiting
  private generateKey(req: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }
    
    // Usa IP como padrão
    const ip = this.getClientIP(req);
    const pathname = new URL(req.url).pathname;
    return `rate_limit:${pathname}:${ip}`;
  }
  
  // Extrai IP do cliente
  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }
  
  // Verifica se a requisição deve ser limitada
  async checkLimit(req: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const key = this.generateKey(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    try {
      // Busca dados existentes
      const existingData = await this.cache.get<number[]>(key);
      let hits: number[] = [];
      
      if (existingData && Array.isArray(existingData)) {
        hits = existingData;
      }
      
      // Remove hits fora da janela de tempo
      hits = hits.filter(timestamp => timestamp > windowStart);
      
      // Adiciona hit atual
      hits.push(now);
      
      // Salva dados atualizados
      await this.cache.set(
        key,
        hits,
        Math.ceil(this.config.windowMs / 1000)
      );
      
      const totalHits = hits.length;
      const allowed = totalHits <= this.config.maxRequests;
      const remaining = Math.max(0, this.config.maxRequests - totalHits);
      const resetTime = windowStart + this.config.windowMs;
      
      // Log se limite foi atingido
      if (!allowed) {
        logger.warn('Rate limit exceeded', {
          metadata: {
            key,
            totalHits,
            maxRequests: this.config.maxRequests,
            ip: this.getClientIP(req),
            pathname: new URL(req.url).pathname,
          }
        });
        
        this.config.onLimitReached?.(req);
      }
      
      return {
        allowed,
        remaining,
        resetTime,
        totalHits,
      };
      
    } catch (error) {
      logger.error('Rate limiter error', { metadata: { error, key } });
      
      // Em caso de erro, permite a requisição
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        totalHits: 0,
      };
    }
  }
  
  // Middleware para Next.js
  async middleware(req: NextRequest): Promise<NextResponse | null> {
    const result = await this.checkLimit(req);
    
    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );
      
      // Headers de rate limiting
      response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
      
      return response;
    }
    
    return null; // Permite a requisição
  }
}

// Função helper para criar rate limiter
export function createRateLimiter(type: keyof typeof RATE_LIMIT_CONFIGS, customConfig?: Partial<RateLimitConfig>): RateLimiter {
  const baseConfig = RATE_LIMIT_CONFIGS[type];
  const config = { ...baseConfig, ...customConfig };
  return new RateLimiter(config);
}

// Rate limiters pré-configurados
export const rateLimiters = {
  public: createRateLimiter('public'),
  auth: createRateLimiter('auth'),
  realtime: createRateLimiter('realtime'),
  ml: createRateLimiter('ml'),
  admin: createRateLimiter('admin'),
};

// Middleware para rotas específicas
export async function withRateLimit(
  req: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIGS,
  customConfig?: Partial<RateLimitConfig>
): Promise<NextResponse | null> {
  const limiter = createRateLimiter(type, customConfig);
  return limiter.middleware(req);
}

// Função para verificar status sem aplicar limite
export async function getRateLimitStatus(
  req: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIGS
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}> {
  const limiter = createRateLimiter(type);
  return limiter.checkLimit(req);
}

// Função para resetar rate limit de um IP/chave específica
export async function resetRateLimit(
  key: string
): Promise<void> {
  const cache = new RedisCache();
  await cache.del(key);
  logger.info('Rate limit reset', { metadata: { key } });
}

// Função para obter estatísticas de rate limiting
export async function getRateLimitStats(): Promise<{
  totalKeys: number;
  activeKeys: string[];
}> {
  const cache = new RedisCache();
  
  try {
    const keys = await cache.getKeys('rate_limit:*');
    return {
      totalKeys: keys.length,
      activeKeys: keys,
    };
  } catch (error) {
    logger.error('Error getting rate limit stats', { metadata: { error } });
    return {
      totalKeys: 0,
      activeKeys: [],
    };
  }
}