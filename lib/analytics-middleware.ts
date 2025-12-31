/**
 * Middleware de Analytics para Next.js
 * Captura automaticamente métricas de API, performance e eventos
 */

import { NextRequest, NextResponse } from 'next/server';
import { analytics } from './analytics';
import { logger } from './logger';

// Interface para contexto de analytics
export interface AnalyticsContext {
  startTime: number;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  path: string;
  method: string;
}

// Middleware principal de analytics
export async function analyticsMiddleware(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;
  
  // Extrai informações do usuário
  const userAgent = request.headers.get('user-agent') || undefined;
  const ip = getClientIP(request);
  const userId = extractUserId(request);
  const sessionId = extractSessionId(request);
  
  // Cria contexto de analytics
  const context: AnalyticsContext = {
    startTime,
    userId,
    sessionId,
    userAgent,
    ip,
    path,
    method,
  };
  
  // Adiciona contexto ao request
  const requestWithContext = new Request(request, {
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'x-analytics-context': JSON.stringify(context),
    },
  });
  
  // Processa a requisição
  const response = NextResponse.next({
    request: requestWithContext,
  });
  
  // Captura métricas após o processamento
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Registra métricas de API se for uma rota de API
  if (path.startsWith('/api/')) {
    await trackApiMetrics(context, response, duration);
  }
  
  // Registra page view se for uma página
  if (!path.startsWith('/api/') && !path.startsWith('/_next/')) {
    await trackPageView(context);
  }
  
  // Adiciona headers de analytics à resposta
  response.headers.set('x-analytics-session', sessionId || 'unknown');
  response.headers.set('x-analytics-duration', duration.toString());
  
  return response;
}

// Extrai IP do cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'unknown';
}

// Extrai ID do usuário (pode ser de cookies, headers, etc.)
function extractUserId(request: NextRequest): string | undefined {
  // Tenta extrair de cookie de autenticação
  const authCookie = request.cookies.get('__session');
  if (authCookie) {
    try {
      // Aqui você pode decodificar o token JWT ou cookie de sessão
      // Por simplicidade, vamos usar um placeholder
      return 'user_from_cookie';
    } catch (error) {
      logger.error('Failed to extract user ID from cookie', undefined, error as Error);
    }
  }
  
  // Tenta extrair de header de autorização
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Aqui você pode decodificar o JWT
      return 'user_from_token';
    } catch (error) {
      logger.error('Failed to extract user ID from token', undefined, error as Error);
    }
  }
  
  return undefined;
}

// Extrai ou gera ID de sessão
function extractSessionId(request: NextRequest): string {
  const sessionCookie = request.cookies.get('session_id');
  if (sessionCookie) {
    return sessionCookie.value;
  }
  
  // Gera novo ID de sessão
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Registra métricas de API
async function trackApiMetrics(
  context: AnalyticsContext,
  response: NextResponse,
  duration: number
): Promise<void> {
  try {
    const statusCode = response.status;
    
    analytics.trackApiCall(
      context.path,
      context.method,
      statusCode,
      duration,
      context.userId
    );
    
    // Registra métricas específicas para diferentes tipos de endpoint
    if (context.path.includes('/ml/')) {
      await trackMLApiMetrics(context, response, duration);
    }
    
    if (context.path.includes('/auth/')) {
      await trackAuthApiMetrics(context, response, duration);
    }
    
    if (context.path.includes('/trading/')) {
      await trackTradingApiMetrics(context, response, duration);
    }
    
  } catch (error) {
    logger.error('Failed to track API metrics', { metadata: { context } }, error as Error);
  }
}

// Registra métricas específicas de ML
async function trackMLApiMetrics(
  context: AnalyticsContext,
  response: NextResponse,
  duration: number
): Promise<void> {
  analytics.track('api_call', 'ml_api_request', {
    endpoint: context.path,
    method: context.method,
    statusCode: response.status,
    duration,
    category: 'machine_learning',
    success: response.status >= 200 && response.status < 300,
  }, context.userId);
}

// Registra métricas específicas de autenticação
async function trackAuthApiMetrics(
  context: AnalyticsContext,
  response: NextResponse,
  duration: number
): Promise<void> {
  const isLogin = context.path.includes('/login');
  const isRegister = context.path.includes('/register');
  const isLogout = context.path.includes('/logout');
  
  let actionType = 'auth_other';
  if (isLogin) actionType = 'login';
  if (isRegister) actionType = 'register';
  if (isLogout) actionType = 'logout';
  
  analytics.track('api_call', 'auth_api_request', {
    endpoint: context.path,
    method: context.method,
    statusCode: response.status,
    duration,
    category: 'authentication',
    actionType,
    success: response.status >= 200 && response.status < 300,
  }, context.userId);
}

// Registra métricas específicas de trading
async function trackTradingApiMetrics(
  context: AnalyticsContext,
  response: NextResponse,
  duration: number
): Promise<void> {
  analytics.track('api_call', 'trading_api_request', {
    endpoint: context.path,
    method: context.method,
    statusCode: response.status,
    duration,
    category: 'trading',
    success: response.status >= 200 && response.status < 300,
  }, context.userId);
}

// Registra page view
async function trackPageView(context: AnalyticsContext): Promise<void> {
  try {
    analytics.trackPageView(context.path, context.userId, {
      userAgent: context.userAgent,
      ip: context.ip,
      sessionId: context.sessionId,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Failed to track page view', { metadata: { context } }, error as Error);
  }
}

// Hook para capturar métricas de performance do lado cliente
export function capturePerformanceMetrics(userId?: string): void {
  if (typeof window === 'undefined') return;
  
  // Aguarda o carregamento completo da página
  window.addEventListener('load', () => {
    setTimeout(() => {
      try {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
        const lcp = getLCP();
        const cls = getCLS();
        const fid = getFID();
        
        const metrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          firstContentfulPaint: fcp?.startTime || 0,
          largestContentfulPaint: lcp,
          cumulativeLayoutShift: cls,
          firstInputDelay: fid,
          timeToInteractive: getTTI(),
          memoryUsage: getMemoryUsage(),
          connectionType: getConnectionType(),
        };
        
        analytics.trackPerformance(metrics, userId);
        
      } catch (error) {
        logger.error('Failed to capture performance metrics', {}, error as Error);
      }
    }, 1000); // Aguarda 1 segundo após o load
  });
}

// Obtém Largest Contentful Paint
function getLCP(): number {
  return new Promise((resolve) => {
    let lcp = 0;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcp = lastEntry.startTime;
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // Resolve após 5 segundos
    setTimeout(() => {
      observer.disconnect();
      resolve(lcp);
    }, 5000);
  }) as any;
}

// Obtém Cumulative Layout Shift
function getCLS(): number {
  let cls = 0;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        cls += (entry as any).value;
      }
    }
  });
  
  observer.observe({ entryTypes: ['layout-shift'] });
  
  // Para o observer após 5 segundos
  setTimeout(() => observer.disconnect(), 5000);
  
  return cls;
}

// Obtém First Input Delay
function getFID(): number {
  return new Promise((resolve) => {
    let fid = 0;
    
    const observer = new PerformanceObserver((list) => {
      const firstEntry = list.getEntries()[0] as any;
      fid = (firstEntry.processingStart || firstEntry.startTime) - firstEntry.startTime;
      observer.disconnect();
      resolve(fid);
    });
    
    observer.observe({ entryTypes: ['first-input'] });
    
    // Timeout após 10 segundos
    setTimeout(() => {
      observer.disconnect();
      resolve(fid);
    }, 10000);
  }) as any;
}

// Obtém Time to Interactive (aproximação)
function getTTI(): number {
  if (typeof window === 'undefined') return 0;
  
  const navigation = performance.getEntriesByType('navigation')[0] as any;
  return navigation.domInteractive - (navigation.navigationStart || navigation.fetchStart);
}

// Obtém uso de memória
function getMemoryUsage(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  
  const memory = (performance as any).memory;
  if (memory) {
    return memory.usedJSHeapSize;
  }
  
  return undefined;
}

// Obtém tipo de conexão
function getConnectionType(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    return connection.effectiveType || connection.type;
  }
  
  return undefined;
}

// Função para capturar métricas de engajamento
export function captureEngagementMetrics(userId?: string): (() => void) | void {
  if (typeof window === 'undefined') return;
  
  let startTime = Date.now();
  let scrollDepth = 0;
  let clickCount = 0;
  let maxScrollDepth = 0;
  
  // Rastreia scroll
  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollDepth = Math.round((scrollTop / docHeight) * 100);
    maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
  };
  
  // Rastreia cliques
  const handleClick = () => {
    clickCount++;
  };
  
  // Adiciona listeners
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('click', handleClick);
  
  // Envia métricas ao sair da página
  const sendEngagementMetrics = () => {
    const timeOnPage = Date.now() - startTime;
    
    analytics.trackEngagement({
      timeOnPage,
      scrollDepth: maxScrollDepth,
      clicksPerSession: clickCount,
      pagesPerSession: 1, // Será agregado no backend
      bounceRate: 0, // Será calculado no backend
      returnVisitor: false, // Será determinado no backend
      featureUsage: {}, // Será preenchido conforme necessário
    }, userId);
  };
  
  // Envia métricas antes de sair
  window.addEventListener('beforeunload', sendEngagementMetrics);
  window.addEventListener('pagehide', sendEngagementMetrics);
  
  // Cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('click', handleClick);
    window.removeEventListener('beforeunload', sendEngagementMetrics);
    window.removeEventListener('pagehide', sendEngagementMetrics);
  };
}

// Função para rastrear eventos customizados
export function trackCustomEvent(
  category: string,
  action: string,
  label?: string,
  value?: number,
  userId?: string
): void {
  analytics.track('user_action', action, {
    category,
    label,
    value,
    timestamp: Date.now(),
  }, userId);
}

// Função para rastrear erros JavaScript
export function setupErrorTracking(userId?: string): void {
  if (typeof window === 'undefined') return;
  
  // Rastreia erros JavaScript
  window.addEventListener('error', (event) => {
    analytics.trackError(
      new Error(event.message),
      'javascript_error',
      userId,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      }
    );
  });
  
  // Rastreia promises rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    analytics.trackError(
      new Error(event.reason?.message || 'Unhandled promise rejection'),
      'promise_rejection',
      userId,
      {
        reason: event.reason,
      }
    );
  });
}

// Exporta funções utilitárias
export {
  analytics,
};