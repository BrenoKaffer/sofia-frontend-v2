import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Configurações de rate limiting
interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requests por janela
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

// Store para rate limiting (em produção, usar Redis)
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value);
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.get(key);
    
    if (existing) {
      existing.count++;
      this.set(key, existing);
      return existing;
    } else {
      const newEntry = { count: 1, resetTime: now + windowMs };
      this.set(key, newEntry);
      return newEntry;
    }
  }

  // Limpeza periódica
  cleanup(): void {
    const now = Date.now();
    Array.from(this.store.entries()).forEach(([key, value]) => {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    });
  }
}

const rateLimitStore = new RateLimitStore();

// Limpeza periódica do store (a cada 5 minutos)
if (typeof window === 'undefined') {
  setInterval(() => {
    rateLimitStore.cleanup();
  }, 5 * 60 * 1000);
}

// Middleware de rate limiting
export function createRateLimit(config: RateLimitConfig) {
  return function rateLimit(req: NextRequest): NextResponse | null {
    const key = config.keyGenerator 
      ? config.keyGenerator(req)
      : getClientIdentifier(req);

    const { count, resetTime } = rateLimitStore.increment(key, config.windowMs);

    if (count > config.maxRequests) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Muitas requisições. Tente novamente mais tarde.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Adicionar headers informativos
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', (config.maxRequests - count).toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());

    return null; // Continuar processamento
  };
}

// Obter identificador do cliente
function getClientIdentifier(req: NextRequest): string {
  // Tentar obter IP real
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Incluir User-Agent para melhor identificação
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  return `${ip}:${userAgent}`;
}

// Configurações pré-definidas de rate limiting
export const RateLimitConfigs = {
  // API geral
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
  },
  
  // Autenticação
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5,
  },
  
  // Upload de arquivos
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10,
  },
  
  // Busca/pesquisa
  search: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30,
  },
  
  // Dados em tempo real
  realtime: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 60,
  },
};

// Validação de entrada
export class InputValidator {
  // Schemas comuns
  static schemas = {
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    uuid: z.string().uuid('UUID inválido'),
    tableId: z.string().regex(/^[a-zA-Z0-9_-]+$/, 'ID da mesa inválido'),
    betAmount: z.number().min(0.01, 'Valor mínimo de aposta é 0.01').max(10000, 'Valor máximo de aposta é 10000'),
    pagination: z.object({
      page: z.number().min(1, 'Página deve ser maior que 0'),
      limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100'),
    }),
  };

  // Validar dados de entrada
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Dados inválidos: ${messages.join(', ')}`);
      }
      throw error;
    }
  }

  // Sanitizar string
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remover tags HTML básicas
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, ''); // Remover event handlers
  }

  // Validar e sanitizar objeto
  static sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Validar headers de segurança
  static validateSecurityHeaders(req: NextRequest): boolean {
    const contentType = req.headers.get('content-type');
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    
    // Validar Content-Type para requests POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (!contentType || !contentType.includes('application/json')) {
        return false;
      }
    }
    
    // Validar Origin/Referer em produção
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (origin && !allowedOrigins.includes(origin)) {
        return false;
      }
    }
    
    return true;
  }
}

// Middleware de validação de entrada
export function createInputValidator<T>(schema: z.ZodSchema<T>) {
  return function validateInput(req: NextRequest): T | NextResponse {
    try {
      // Validar headers de segurança
      if (!InputValidator.validateSecurityHeaders(req)) {
        return new NextResponse(
          JSON.stringify({ error: 'Headers de segurança inválidos' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Obter dados do request
      let data: unknown;
      if (req.method === 'GET') {
        const url = new URL(req.url);
        data = Object.fromEntries(url.searchParams.entries());
      } else {
        // Para POST/PUT/PATCH, os dados virão do body
        // Nota: em middleware, o body precisa ser lido de forma especial
        data = {}; // Placeholder - implementar leitura do body conforme necessário
      }

      // Sanitizar dados
      if (typeof data === 'object' && data !== null) {
        data = InputValidator.sanitizeObject(data as Record<string, any>);
      }

      // Validar com schema
      return InputValidator.validate(schema, data);
    } catch (error) {
      return new NextResponse(
        JSON.stringify({
          error: 'Dados inválidos',
          message: error instanceof Error ? error.message : 'Erro de validação',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

// Middleware de segurança geral
export function securityMiddleware(req: NextRequest): NextResponse | null {
  const response = NextResponse.next();

  // Headers de segurança
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP (Content Security Policy)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // HSTS em produção
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return null; // Continuar processamento
}

// Utilitários para autenticação
export class AuthUtils {
  // Verificar token JWT (simplificado)
  static verifyToken(token: string): boolean {
    try {
      // Implementar verificação real do JWT
      // Por enquanto, apenas verificar se não está vazio
      return token.length > 0;
    } catch {
      return false;
    }
  }

  // Extrair token do header Authorization
  static extractToken(req: NextRequest): string | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Middleware de autenticação
  static createAuthMiddleware(options?: { required?: boolean }) {
    return function authMiddleware(req: NextRequest): NextResponse | null {
      const token = AuthUtils.extractToken(req);
      
      if (!token) {
        if (options?.required) {
          return new NextResponse(
            JSON.stringify({ error: 'Token de autenticação necessário' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return null;
      }

      if (!AuthUtils.verifyToken(token)) {
        return new NextResponse(
          JSON.stringify({ error: 'Token inválido' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return null; // Token válido, continuar
    };
  }
}

// Combinar múltiplos middlewares
export function combineMiddlewares(...middlewares: Array<(req: NextRequest) => NextResponse | null>) {
  return function combinedMiddleware(req: NextRequest): NextResponse | null {
    for (const middleware of middlewares) {
      const result = middleware(req);
      if (result) {
        return result; // Parar na primeira resposta
      }
    }
    return null; // Todos os middlewares passaram
  };
}

// Exportar configurações prontas
export const SecurityMiddlewares = {
  // API pública com rate limiting básico
  publicApi: combineMiddlewares(
    securityMiddleware,
    createRateLimit(RateLimitConfigs.api)
  ),
  
  // API privada com autenticação
  privateApi: combineMiddlewares(
    securityMiddleware,
    AuthUtils.createAuthMiddleware({ required: true }),
    createRateLimit(RateLimitConfigs.api)
  ),
  
  // Autenticação com rate limiting rigoroso
  auth: combineMiddlewares(
    securityMiddleware,
    createRateLimit(RateLimitConfigs.auth)
  ),
  
  // Upload com validação especial
  upload: combineMiddlewares(
    securityMiddleware,
    AuthUtils.createAuthMiddleware({ required: true }),
    createRateLimit(RateLimitConfigs.upload)
  ),
};

// Export default nomeado para evitar export anônimo
export const Security = {
  RateLimitConfigs,
  InputValidator,
  AuthUtils,
  SecurityMiddlewares,
};

export default Security;