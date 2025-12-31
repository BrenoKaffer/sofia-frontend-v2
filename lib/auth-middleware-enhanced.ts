import { NextRequest, NextResponse } from 'next/server';
import { AuthService, AuthenticatedUser } from './auth-service';
import { logger } from './logger';

export interface AuthContext {
  user: AuthenticatedUser;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isModerator: () => boolean;
}

export interface AuthMiddlewareOptions {
  required?: boolean;
  permissions?: string[];
  roles?: string[];
  adminOnly?: boolean;
  moderatorOnly?: boolean;
}

/**
 * Middleware principal de autenticação
 */
export async function authenticate(
  req: NextRequest, 
  options: AuthMiddlewareOptions = {}
): Promise<{ success: boolean; context?: AuthContext; response?: NextResponse }> {
  
  try {
    // Extrair token
    const token = AuthService.extractToken(req);
    
    // Se token não fornecido e autenticação é obrigatória
    if (!token && options.required) {
      return {
        success: false,
        response: createErrorResponse('Token de autorização necessário', 401)
      };
    }

    // Se token não fornecido mas autenticação é opcional
    if (!token) {
      return { success: true };
    }

    // Validar token
    const authResult = await AuthService.validateToken(token);
    
    if (!authResult.success || !authResult.user) {
      return {
        success: false,
        response: createErrorResponse(authResult.error || 'Token inválido', 401)
      };
    }

    const user = authResult.user;

    // Atualizar último login
    await AuthService.updateLastLogin(user.id);

    // Verificar permissões específicas
    if (options.permissions && options.permissions.length > 0) {
      const hasRequiredPermission = options.permissions.some(permission =>
        AuthService.hasPermission(user, permission)
      );

      if (!hasRequiredPermission) {
        logger.warn('Acesso negado - permissões insuficientes', {
          metadata: {
            userId: user.id,
            requiredPermissions: options.permissions,
            userPermissions: user.permissions,
            url: req.url,
            method: req.method
          }
        });

        return {
          success: false,
          response: createErrorResponse('Permissões insuficientes', 403)
        };
      }
    }

    // Verificar roles específicas
    if (options.roles && options.roles.length > 0) {
      if (!options.roles.includes(user.role.id)) {
        logger.warn('Acesso negado - role insuficiente', {
          metadata: {
            userId: user.id,
            requiredRoles: options.roles,
            userRole: user.role.id,
            url: req.url,
            method: req.method
          }
        });

        return {
          success: false,
          response: createErrorResponse('Role insuficiente', 403)
        };
      }
    }

    // Verificar se é admin (quando necessário)
    if (options.adminOnly && !AuthService.isAdmin(user)) {
      logger.warn('Acesso negado - admin necessário', {
        metadata: {
          userId: user.id,
          userRole: user.role.id,
          url: req.url,
          method: req.method
        }
      });

      return {
        success: false,
        response: createErrorResponse('Acesso de administrador necessário', 403)
      };
    }

    // Verificar se é moderador ou superior (quando necessário)
    if (options.moderatorOnly && !AuthService.isModerator(user)) {
      logger.warn('Acesso negado - moderador necessário', {
        metadata: {
          userId: user.id,
          userRole: user.role.id,
          url: req.url,
          method: req.method
        }
      });

      return {
        success: false,
        response: createErrorResponse('Acesso de moderador necessário', 403)
      };
    }

    // Verificar permissões do endpoint
    const method = req.method;
    const path = new URL(req.url).pathname;
    
    if (!AuthService.hasEndpointPermission(user, method, path)) {
      logger.warn('Acesso negado - endpoint não autorizado', {
        metadata: {
          userId: user.id,
          method,
          path,
          userPermissions: user.permissions,
          url: req.url
        }
      });

      return {
        success: false,
        response: createErrorResponse('Acesso não autorizado para este endpoint', 403)
      };
    }

    // Criar contexto de autenticação
    const context: AuthContext = {
      user,
      isAuthenticated: true,
      hasPermission: (permission: string) => AuthService.hasPermission(user, permission),
      isAdmin: () => AuthService.isAdmin(user),
      isModerator: () => AuthService.isModerator(user)
    };

    logger.info('Usuário autenticado com sucesso', {
      metadata: {
        userId: user.id,
        email: user.email,
        role: user.role.id,
        method,
        path
      }
    });

    return { success: true, context };

  } catch (error) {
    logger.error('Erro no middleware de autenticação:', undefined, error as Error);
    
    return {
      success: false,
      response: createErrorResponse('Erro interno de autenticação', 500)
    };
  }
}

/**
 * HOC para endpoints que requerem autenticação
 */
export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = { required: true }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticate(req, options);
    
    if (!authResult.success) {
      return authResult.response!;
    }

    if (!authResult.context) {
      return createErrorResponse('Contexto de autenticação não disponível', 500);
    }

    return await handler(req, authResult.context);
  };
}

/**
 * HOC para endpoints que requerem admin
 */
export function withAdminAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return withAuth(handler, { required: true, adminOnly: true });
}

/**
 * HOC para endpoints que requerem moderador
 */
export function withModeratorAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return withAuth(handler, { required: true, moderatorOnly: true });
}

/**
 * HOC para endpoints com autenticação opcional
 */
export function withOptionalAuth(
  handler: (req: NextRequest, context?: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authResult = await authenticate(req, { required: false });
    
    if (!authResult.success && authResult.response) {
      return authResult.response;
    }

    return await handler(req, authResult.context);
  };
}

/**
 * HOC para endpoints com permissões específicas
 */
export function withPermissions(
  permissions: string[],
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return withAuth(handler, { required: true, permissions });
}

/**
 * HOC para endpoints com roles específicas
 */
export function withRoles(
  roles: string[],
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return withAuth(handler, { required: true, roles });
}

/**
 * Middleware simples para verificar apenas autenticação
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const authResult = await authenticate(req, { required: true });
  
  if (!authResult.success) {
    throw new Error(authResult.response?.statusText || 'Autenticação falhou');
  }

  if (!authResult.context) {
    throw new Error('Contexto de autenticação não disponível');
  }

  return authResult.context;
}

/**
 * Middleware para verificar se é admin
 */
export async function requireAdmin(req: NextRequest): Promise<AuthContext> {
  const authResult = await authenticate(req, { required: true, adminOnly: true });
  
  if (!authResult.success) {
    throw new Error(authResult.response?.statusText || 'Acesso de admin necessário');
  }

  if (!authResult.context) {
    throw new Error('Contexto de autenticação não disponível');
  }

  return authResult.context;
}

/**
 * Middleware para verificar se é moderador
 */
export async function requireModerator(req: NextRequest): Promise<AuthContext> {
  const authResult = await authenticate(req, { required: true, moderatorOnly: true });
  
  if (!authResult.success) {
    throw new Error(authResult.response?.statusText || 'Acesso de moderador necessário');
  }

  if (!authResult.context) {
    throw new Error('Contexto de autenticação não disponível');
  }

  return authResult.context;
}

/**
 * Utilitário para criar respostas de erro
 */
function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString(),
      status 
    },
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Error': 'true'
      }
    }
  );
}

/**
 * Utilitário para extrair informações do usuário
 */
export function getUserInfo(context: AuthContext): AuthenticatedUser {
  return context.user;
}

/**
 * Utilitário para verificar se está autenticado
 */
export function isAuthenticated(context?: AuthContext): context is AuthContext {
  return context !== undefined && context.isAuthenticated;
}

// Exportar tudo como default
const authMiddleware = {
  authenticate,
  withAuth,
  withAdminAuth,
  withModeratorAuth,
  withOptionalAuth,
  withPermissions,
  withRoles,
  requireAuth,
  requireAdmin,
  requireModerator,
  getUserInfo,
  isAuthenticated
};

export default authMiddleware;