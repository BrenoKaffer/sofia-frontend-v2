import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from './lib/rate-limit-middleware';
import { auth } from './lib/auth-server';
import { edgeApiAuth } from './lib/api-auth-server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { userHasAccess, userIsBlocked, userIsAdmin, userIsSuperAdmin, AccountStatus } from '@/lib/user-status';

// Rotas protegidas que requerem autenticação
const protectedRoutes = [
  '/dashboard',
  '/analytics',
  '/bankroll',
  '/daily-goals',
  '/help',
  '/historico-de-padroes',
  '/history',
  '/logs',
  '/monitoring',
  '/profit',
  '/rate-limiting',
  '/roulette-status',
  '/settings',
  '/simulator',
  '/strategies',
  '/profile',
  '/admin',
  '/checkout',
  '/subscription',
  '/builder'
];

// Rotas que requerem status premium
const premiumRoutes = [
  '/premium',
  '/advanced-features'
];

// Rotas de administração
const adminRoutes = [
  '/admin',
  '/admin/users',
  '/admin/settings',
  '/admin/analytics',
  '/builder'
];

// Rotas exclusivas para super administradores
const superAdminRoutes = [
  '/admin/system',
  '/admin/database',
  '/admin/logs',
  '/admin/security'
];

// Rotas públicas (não requerem autenticação)
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/blocked',
  '/pending-verification',
  '/account-inactive',
  '/upgrade',
  '/unauthorized'
];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

function isPremiumRoute(pathname: string): boolean {
  return premiumRoutes.some(route => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => pathname.startsWith(route));
}

function isSuperAdminRoute(pathname: string): boolean {
  return superAdminRoutes.some(route => pathname.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

// APIs que requerem autenticação
const protectedApiRoutes = [
  '/api/kpis',
  '/api/roulette-status', 
  '/api/realtime-data',
  '/api/auth/api-keys',
  '/api/dynamic-strategies'
];

function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some(route => pathname.startsWith(route));
}

export default async function middleware(request: NextRequest) {
  // Liberar o sandbox do resolver em desenvolvimento sem exigir autenticação
  if (request.nextUrl.pathname.startsWith('/strategies/resolver-sandbox')) {
    return NextResponse.next();
  }

  // Aplica rate limiting primeiro para APIs
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const rateLimitResponse = await rateLimitMiddleware(request);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Continua com a requisição em caso de erro
    }

    // Verifica autenticação para APIs protegidas
    // Bypass de autenticação para APIs protegidas em desenvolvimento
    const isAuthBypassEnabled = process.env.NEXT_PUBLIC_AUTH_DEV_BYPASS === 'true' || process.env.AUTH_DEV_BYPASS === 'true';
    if (isAuthBypassEnabled && isProtectedApiRoute(request.nextUrl.pathname)) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-auth-bypass', 'true');
      requestHeaders.set('x-user-id', 'dev-bypass-user');
      requestHeaders.set('x-auth-type', 'bypass');
      console.warn('[AUTH] Bypass de autenticação ATIVO para API protegida:', request.nextUrl.pathname);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    if (isProtectedApiRoute(request.nextUrl.pathname)) {
      try {
        const authResult = await edgeApiAuth.authenticateRequest(request);
        
        if (!authResult.success) {
          return NextResponse.json(
            { 
              error: 'Unauthorized', 
              message: authResult.error || 'Token de acesso inválido ou expirado' 
            },
            { status: 401 }
          );
        }

        // Adicionar informações do usuário ao header DA REQUISIÇÃO encaminhada
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', authResult.userId || '');
        requestHeaders.set('x-auth-type', authResult.method || '');
        
        return NextResponse.next({ request: { headers: requestHeaders } });
      } catch (error) {
        console.error('Erro no middleware de autenticação da API:', error);
        return NextResponse.json(
          { error: 'Internal Server Error', message: 'Erro interno de autenticação' },
          { status: 500 }
        );
      }
    }
  }
  
  // Aplica autenticação personalizada para rotas protegidas da aplicação
  if (isProtectedRoute(request.nextUrl.pathname)) {
    const isAuthBypassEnabled = process.env.NEXT_PUBLIC_AUTH_DEV_BYPASS === 'true' || process.env.AUTH_DEV_BYPASS === 'true';
    if (isAuthBypassEnabled) {
      const response = NextResponse.next();
      response.headers.set('x-auth-bypass', 'true');
      console.warn('[AUTH] Bypass de autenticação ATIVO para rota protegida:', request.nextUrl.pathname);
      return response;
    }
    // Usar Supabase Auth Helpers no middleware para obter a sessão corretamente
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Erro ao obter sessão do Supabase no middleware:', sessionError);
    }
    if (!session) {
      // Fallback: validar cookie customizado "auth_token" (compatível com versão anterior)
      const customToken = request.cookies.get('auth_token')?.value;
      if (customToken) {
        try {
          const tokenResult = await edgeApiAuth.validateJWT(customToken);
          if (tokenResult.success && tokenResult.userId) {
            res.headers.set('x-user-id', tokenResult.userId);
            return res;
          }
        } catch (e) {
          console.warn('Falha ao validar auth_token no middleware:', e);
        }
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const userId = session.user.id;

    // Verificar status da conta do usuário usando Supabase
    try {
      // supabase client já criado acima
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('account_status, permissions')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        // Em caso de erro, permitir acesso mas logar o problema
        return res;
      }

      const accountStatus = profile?.account_status as AccountStatus;
      const permissions = profile?.permissions || {};
      const pathname = request.nextUrl.pathname;

      // Verificar se usuário está bloqueado
      if (userIsBlocked(accountStatus)) {
        if (pathname !== '/blocked') {
          const url = new URL('/blocked', request.url);
          url.searchParams.set('reason', accountStatus);
          return NextResponse.redirect(url);
        }
      }

      // Verificar se usuário tem acesso geral
      if (!userHasAccess(accountStatus) && !isPublicRoute(pathname)) {
        if (accountStatus === 'pending') {
          return NextResponse.redirect(new URL('/pending-verification', request.url));
        }
        
        if (accountStatus === 'inactive') {
          return NextResponse.redirect(new URL('/account-inactive', request.url));
        }
      }

      // Verificar rotas premium
      if (isPremiumRoute(pathname) && !['premium', 'trial'].includes(accountStatus)) {
        const url = new URL('/upgrade', request.url);
        url.searchParams.set('feature', pathname);
        return NextResponse.redirect(url);
      }

      // Verificar rotas de administração
      if (isAdminRoute(pathname)) {
        if (!userIsAdmin(accountStatus)) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }

      // Verificar rotas exclusivas de super administrador
      if (isSuperAdminRoute(pathname)) {
        if (!userIsSuperAdmin(accountStatus)) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }

      // Adicionar headers com informações do usuário
      res.headers.set('x-user-id', userId);
      res.headers.set('x-user-status', accountStatus);
      res.headers.set('x-user-has-access', userHasAccess(accountStatus).toString());
      res.headers.set('x-user-is-premium', ['premium', 'trial'].includes(accountStatus).toString());
      res.headers.set('x-user-is-admin', userIsAdmin(accountStatus).toString());
      res.headers.set('x-user-is-superadmin', userIsSuperAdmin(accountStatus).toString());

      return res;

    } catch (error) {
      console.error('Erro ao verificar status do usuário:', error);
      // Em caso de erro, permitir acesso mas logar
      return res;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};