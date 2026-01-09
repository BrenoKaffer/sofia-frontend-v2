/**
 * Middleware de autenticação para rotas da API
 * Integra com Supabase Auth para validação de usuários
 */

import { auth } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiErrorHandler } from './api-error-handler';
import { logger } from './logger';
import type { User } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { userIsAdmin } from '@/lib/user-status';

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  orgId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  user_metadata?: any;
}

export interface AuthContext {
  user: AuthenticatedUser;
  isAuthenticated: boolean;
}

/**
 * Converte usuário do Supabase para formato do middleware
 */
function convertToAuthenticatedUser(supabaseUser: User, sessionId: string): AuthenticatedUser {
  const fullName = supabaseUser.user_metadata?.full_name || '';
  const [firstName, ...lastNameParts] = fullName.split(' ');
  const lastName = lastNameParts.join(' ');

  return {
    userId: supabaseUser.id,
    sessionId,
    email: supabaseUser.email,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    user_metadata: supabaseUser.user_metadata,
  };
}

/**
 * Middleware para verificar autenticação do usuário
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  try {
    const authResult = await auth();
    const { userId, user, session, isAuthenticated } = authResult;

    if (!isAuthenticated || !userId || !user || !session) {
      logger.warn('Unauthorized access attempt', {
        metadata: {
          url: req.url,
          method: req.method,
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
        }
      });
      
      throw ApiErrorHandler.unauthorized('Authentication required');
    }

    const authenticatedUser = convertToAuthenticatedUser(user, session.access_token);

    logger.info('User authenticated', {
      metadata: {
        userId,
        email: user.email,
        url: req.url,
        method: req.method
      }
    });

    return {
      user: authenticatedUser,
      isAuthenticated: true
    };
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error; // Re-throw API errors
    }
    
    logger.error('Authentication error', {
      metadata: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        url: req.url,
        method: req.method
      }
    }, error instanceof Error ? error : new Error(String(error)));
    
    throw ApiErrorHandler.unauthorized('Invalid authentication');
  }
}

/**
 * Middleware para verificar se o usuário tem permissões de admin
 */
export async function requireAdmin(req: NextRequest): Promise<AuthContext> {
  const authContext = await requireAuth(req);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseServiceKey) {
    logger.warn('Admin access denied - missing Supabase admin credentials', {
      metadata: {
        userId: authContext.user.userId,
        url: req.url,
        method: req.method
      }
    });
    throw ApiErrorHandler.forbidden('Admin access required');
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('user_id', authContext.user.userId)
    .maybeSingle();

  if (error || !profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    logger.warn('Admin access denied', {
      metadata: {
        userId: authContext.user.userId,
        url: req.url,
        method: req.method
      }
    });
    
    throw ApiErrorHandler.forbidden('Admin access required');
  }
  
  logger.info('Admin access granted', {
    metadata: {
      userId: authContext.user.userId,
      url: req.url,
      method: req.method
    }
  });
  
  return authContext;
}

/**
 * Middleware opcional de autenticação (não falha se não autenticado)
 */
export async function optionalAuth(req: NextRequest): Promise<AuthContext | null> {
  try {
    return await requireAuth(req);
  } catch (error) {
    // Silently fail for optional auth
    return null;
  }
}

/**
 * HOC para wrapping de handlers de API com autenticação
 */
export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authContext = await requireAuth(req);
      return await handler(req, authContext);
    } catch (error) {
      return ApiErrorHandler.handle(error, `Auth middleware - ${req.method} ${req.url}`);
    }
  };
}

/**
 * HOC para wrapping de handlers de API com autenticação de admin
 */
export function withAdminAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authContext = await requireAdmin(req);
      return await handler(req, authContext);
    } catch (error) {
      return ApiErrorHandler.handle(error, `Admin auth middleware - ${req.method} ${req.url}`);
    }
  };
}

/**
 * HOC para wrapping de handlers de API com autenticação opcional
 */
export function withOptionalAuth(
  handler: (req: NextRequest, context: AuthContext | null) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authContext = await optionalAuth(req);
      return await handler(req, authContext);
    } catch (error) {
      return ApiErrorHandler.handle(error, `Optional auth middleware - ${req.method} ${req.url}`);
    }
  };
}

/**
 * Utilitário para extrair informações do usuário do contexto de autenticação
 */
export function getUserInfo(context: AuthContext): AuthenticatedUser {
  return context.user;
}

/**
 * Utilitário para verificar se o usuário está autenticado
 */
export function isAuthenticated(context: AuthContext | null): context is AuthContext {
  return context !== null && context.isAuthenticated;
}

const authMiddleware = {
  requireAuth,
  requireAdmin,
  optionalAuth,
  withAuth,
  withAdminAuth,
  withOptionalAuth,
  getUserInfo,
  isAuthenticated
};

export default authMiddleware;
