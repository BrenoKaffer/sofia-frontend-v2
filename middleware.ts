import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from './lib/rate-limit-middleware';
import { auth } from './lib/auth-server';
import { apiAuth } from './lib/api-auth';
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
  '/subscription'
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
  '/admin/analytics'
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
  '/api/auth/api-keys'
];

function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some(route => pathname.startsWith(route));
}

export default async function middleware(request: NextRequest) {
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
    if (isProtectedApiRoute(request.nextUrl.pathname)) {
      try {
        const authResult = await apiAuth.authenticateRequest(request);
        
        if (!authResult.success) {
          return NextResponse.json(
            { 
              error: 'Unauthorized', 
              message: authResult.error || 'Token de acesso inválido ou expirado' 
            },
            { status: 401 }
          );
        }

        // Adicionar informações do usuário ao header
        const response = NextResponse.next();
        response.headers.set('x-user-id', authResult.userId || '');
        response.headers.set('x-auth-type', authResult.method || '');
        
        return response;
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verificar status da conta do usuário usando Supabase
    try {
      const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('account_status, permissions')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        // Em caso de erro, permitir acesso mas logar o problema
        return NextResponse.next();
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
      const response = NextResponse.next();
      response.headers.set('x-user-id', userId);
      response.headers.set('x-user-status', accountStatus);
      response.headers.set('x-user-has-access', userHasAccess(accountStatus).toString());
      response.headers.set('x-user-is-premium', ['premium', 'trial'].includes(accountStatus).toString());
      response.headers.set('x-user-is-admin', userIsAdmin(accountStatus).toString());
      response.headers.set('x-user-is-superadmin', userIsSuperAdmin(accountStatus).toString());

      return response;

    } catch (error) {
      console.error('Erro ao verificar status do usuário:', error);
      // Em caso de erro, permitir acesso mas logar
      return NextResponse.next();
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};