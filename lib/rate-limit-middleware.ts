/**
 * Middleware global de Rate Limiting para Next.js
 * Aplica rate limiting automaticamente baseado na rota
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMIT_CONFIGS } from './rate-limiter';
import { logger } from './logger';

// Mapeamento de rotas para tipos de rate limiting
const ROUTE_RATE_LIMIT_MAP: Record<string, keyof typeof RATE_LIMIT_CONFIGS> = {
  // Autenticação
  '/api/auth': 'auth',
  '/api/login': 'auth',
  '/api/register': 'auth',
  '/api/forgot-password': 'auth',
  '/api/reset-password': 'auth',
  
  // APIs de ML e Analytics
  '/api/ml': 'ml',
  '/api/signals': 'ml',
  '/api/analytics': 'ml',
  '/api/kpis': 'ml',
  
  // APIs de dados em tempo real
  '/api/realtime-data': 'realtime',
  '/api/roulette-status': 'realtime',
  '/api/live': 'realtime',
  
  // APIs administrativas
  '/api/admin': 'admin',
  '/api/user-backup': 'admin',
  '/api/seed-demo-data': 'admin',
  
  // APIs de pagamento - CRÍTICAS (rate limiting rigoroso)
  '/api/payments': 'auth',
  '/api/checkout-link': 'auth', 
  '/api/pagarme': 'auth',
  '/api/billing': 'auth',
  '/api/subscription': 'auth',
  
  // APIs públicas (padrão)
  '/api': 'public',
};

// Rotas que devem ser ignoradas pelo rate limiting
const IGNORED_ROUTES = [
  '/api/health',
  '/api/status',
  '/api/_next',
  '/api/favicon.ico',
];

// Função para determinar o tipo de rate limiting baseado na rota
function getRateLimitType(pathname: string): keyof typeof RATE_LIMIT_CONFIGS | null {
  // Verifica se a rota deve ser ignorada
  if (IGNORED_ROUTES.some(route => pathname.startsWith(route))) {
    return null;
  }
  
  // Busca correspondência exata primeiro
  if (ROUTE_RATE_LIMIT_MAP[pathname]) {
    return ROUTE_RATE_LIMIT_MAP[pathname];
  }
  
  // Busca correspondência por prefixo (mais específico primeiro)
  const sortedRoutes = Object.keys(ROUTE_RATE_LIMIT_MAP)
    .sort((a, b) => b.length - a.length);
  
  for (const route of sortedRoutes) {
    if (pathname.startsWith(route)) {
      return ROUTE_RATE_LIMIT_MAP[route];
    }
  }
  
  // Se é uma rota de API mas não mapeada, usa público
  if (pathname.startsWith('/api/')) {
    return 'public';
  }
  
  return null;
}

// Middleware principal de rate limiting
export async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
  const pathname = new URL(req.url).pathname;
  
  // Determina o tipo de rate limiting
  const rateLimitType = getRateLimitType(pathname);
  
  if (!rateLimitType) {
    // Não aplica rate limiting
    return null;
  }
  
  try {
    // Aplica rate limiting
    const response = await withRateLimit(req, rateLimitType);
    
    if (response) {
      // Rate limit excedido
      logger.warn('Rate limit applied', {
        metadata: {
          pathname,
          rateLimitType,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent'),
        }
      });
    }
    
    return response;
    
  } catch (error) {
    logger.error('Rate limit middleware error', {
      metadata: {
        error,
        pathname,
        rateLimitType,
      }
    });
    
    // Em caso de erro, permite a requisição
    return null;
  }
}

// Função para adicionar headers de rate limiting em respostas bem-sucedidas
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  limit: number,
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());
  
  return response;
}

// Configuração personalizada para rotas específicas
export const CUSTOM_RATE_LIMITS = {
  // Upload de arquivos - mais restritivo
  '/api/upload': {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10,
  },
  
  // Busca/pesquisa - moderado
  '/api/search': {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 30,
  },
  
  // Exportação de dados - muito restritivo
  '/api/export': {
    windowMs: 24 * 60 * 60 * 1000, // 24 horas
    maxRequests: 5,
  },
};

// Middleware com configuração personalizada
export async function customRateLimitMiddleware(
  req: NextRequest,
  customConfig?: Record<string, any>
): Promise<NextResponse | null> {
  const pathname = new URL(req.url).pathname;
  
  // Verifica se há configuração personalizada para esta rota
  const customRouteConfig = CUSTOM_RATE_LIMITS[pathname as keyof typeof CUSTOM_RATE_LIMITS];
  
  if (customRouteConfig) {
    return withRateLimit(req, 'public', customRouteConfig);
  }
  
  // Usa configuração padrão
  return rateLimitMiddleware(req);
}

// Função helper para verificar se uma rota tem rate limiting
export function hasRateLimit(pathname: string): boolean {
  return getRateLimitType(pathname) !== null;
}

// Função para obter informações de rate limiting de uma rota
export function getRateLimitInfo(pathname: string): {
  type: keyof typeof RATE_LIMIT_CONFIGS | null;
  config: any;
  hasCustomConfig: boolean;
} {
  const type = getRateLimitType(pathname);
  const hasCustomConfig = pathname in CUSTOM_RATE_LIMITS;
  
  let config = null;
  if (type) {
    config = RATE_LIMIT_CONFIGS[type];
  }
  
  if (hasCustomConfig) {
    config = CUSTOM_RATE_LIMITS[pathname as keyof typeof CUSTOM_RATE_LIMITS];
  }
  
  return {
    type,
    config,
    hasCustomConfig,
  };
}

// Exporta configurações para uso em outros módulos
export { ROUTE_RATE_LIMIT_MAP, IGNORED_ROUTES };