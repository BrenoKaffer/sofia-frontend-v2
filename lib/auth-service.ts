import { NextRequest } from 'next/server';
import { supabase } from './supabase';
import { logger } from './logger';
import { UserAccessProfile } from './user-status';

// Tipos para o sistema de autenticação
export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  level: number; // 1 = user, 50 = moderator, 100 = admin
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  permissions: string[];
  session_id: string;
  created_at: string;
  last_login: string;
  is_active: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  method: 'jwt' | 'api_key' | 'session';
}

// Definição de roles padrão
export const DEFAULT_ROLES: Record<string, UserRole> = {
  user: {
    id: 'user',
    name: 'Usuário',
    permissions: [
      'read:own_data',
      'read:roulette_history',
      'read:ai_signals',
      'write:own_preferences',
      'read:available_options'
    ],
    level: 1
  },
  moderator: {
    id: 'moderator',
    name: 'Moderador',
    permissions: [
      'read:own_data',
      'read:roulette_history',
      'read:ai_signals',
      'write:own_preferences',
      'read:available_options',
      'read:all_users',
      'moderate:content',
      'read:system_logs'
    ],
    level: 50
  },
  admin: {
    id: 'admin',
    name: 'Administrador',
    permissions: [
      'read:*',
      'write:*',
      'delete:*',
      'admin:system',
      'admin:users',
      'admin:roles',
      'admin:monitoring',
      'admin:ml_models'
    ],
    level: 100
  }
};

// Definição de permissões por endpoint
export const ENDPOINT_PERMISSIONS: Record<string, string[]> = {
  // Endpoints públicos (sem autenticação)
  'GET:/api/public/*': [],
  
  // Endpoints de usuário
  'GET:/api/roulette-history': ['read:roulette_history'],
  'GET:/api/ai-signals': ['read:ai_signals'],
  'GET:/api/user/preferences': ['read:own_data'],
  'PUT:/api/user/preferences': ['write:own_preferences'],
  'GET:/api/available-options': ['read:available_options'],
  'POST:/api/process-spin': ['write:own_data'],
  
  // Endpoints de sistema (admin)
  'GET:/api/system/status': ['admin:system'],
  'GET:/api/system/health': ['admin:system'],
  'GET:/api/logs': ['read:system_logs'],
  'GET:/api/metrics': ['admin:monitoring'],
  'GET:/api/analytics': ['admin:monitoring'],
  
  // Endpoints de ML (admin)
  'GET:/api/ml/*': ['admin:ml_models'],
  'POST:/api/ml/*': ['admin:ml_models'],
  'PUT:/api/ml/*': ['admin:ml_models'],
  'DELETE:/api/ml/*': ['admin:ml_models'],
  
  // Endpoints de usuários (admin)
  'GET:/api/admin/users': ['admin:users'],
  'POST:/api/admin/users': ['admin:users'],
  'PUT:/api/admin/users': ['admin:users'],
  'DELETE:/api/admin/users': ['admin:users']
};

export class AuthService {
  /**
   * Extrair token de autorização do request
   */
  static extractToken(req: NextRequest): string | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Validar token JWT e obter dados do usuário
   */
  static async validateToken(token: string): Promise<AuthResult> {
    try {
      // Validar token com Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return {
          success: false,
          error: 'Token inválido ou expirado',
          method: 'jwt'
        };
      }

      // Buscar dados completos do usuário incluindo role
      const userData = await AuthService.getUserWithRole(user.id);
      
      if (!userData) {
        return {
          success: false,
          error: 'Usuário não encontrado no sistema',
          method: 'jwt'
        };
      }

      // Atualizar último login
      await AuthService.updateLastLogin(user.id);

      return {
        success: true,
        user: userData,
        method: 'jwt'
      };

    } catch (error) {
      logger.error('Erro na validação do token:', undefined, error as Error);
      return {
        success: false,
        error: 'Erro interno na validação',
        method: 'jwt'
      };
    }
  }

  /**
   * Buscar perfil de acesso completo do usuário (user_profiles)
   */
  static async getUserProfileFull(userId: string): Promise<UserAccessProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('status, plan, role')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Se não encontrar, pode ser um usuário novo sem perfil.
        // Retorna null e deixa o chamador decidir (fallback ou erro).
        return null;
      }
      return data;
    } catch (error) {
      logger.error('Erro ao buscar perfil do usuário:', undefined, error as Error);
      return null;
    }
  }

  /**
   * Buscar dados do usuário com role do banco de dados
   */
  static async getUserWithRole(userId: string): Promise<AuthenticatedUser | null> {
    try {
      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role_id,
          created_at,
          last_login,
          is_active,
          user_roles (
            id,
            name,
            permissions,
            level
          )
        `)
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        logger.warn(`Usuário ${userId} não encontrado no banco de dados`);
        
        // Criar usuário com role padrão se não existir
        const newUser = await this.createDefaultUser(userId);
        return newUser;
      }

      // Determinar role do usuário
      let userRole: UserRole;
      
      if (userData.user_roles && userData.user_roles.length > 0) {
        userRole = userData.user_roles[0];
      } else {
        // Usar role padrão se não tiver role específica
        userRole = DEFAULT_ROLES[userData.role_id] || DEFAULT_ROLES.user;
      }

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userRole,
        permissions: userRole.permissions,
        session_id: `session_${Date.now()}`,
        created_at: userData.created_at,
        last_login: userData.last_login || new Date().toISOString(),
        is_active: userData.is_active !== false // Default para true se não especificado
      };

    } catch (error) {
      logger.error('Erro ao buscar dados do usuário:', undefined, error as Error);
      return null;
    }
  }

  /**
   * Criar usuário com role padrão
   */
  static async createDefaultUser(userId: string): Promise<AuthenticatedUser | null> {
    try {
      // Buscar dados básicos do Supabase Auth
      const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
      
      if (error || !user) {
        return null;
      }

      // Inserir usuário na tabela users com role padrão
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role_id: 'user',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Erro ao criar usuário padrão:', undefined, insertError as Error);
        return null;
      }

      return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: DEFAULT_ROLES.user,
        permissions: DEFAULT_ROLES.user.permissions,
        session_id: `session_${Date.now()}`,
        created_at: newUser.created_at,
        last_login: newUser.last_login,
        is_active: true // Usuários novos são ativos por padrão
      };

    } catch (error) {
      logger.error('Erro ao criar usuário padrão:', undefined, error as Error);
      return null;
    }
  }

  /**
   * Verificar se usuário tem permissão específica
   */
  static hasPermission(user: AuthenticatedUser, permission: string): boolean {
    // Admin tem todas as permissões
    if (user.permissions.includes('admin:*') || user.permissions.includes('*')) {
      return true;
    }

    // Verificar permissão específica
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Verificar permissões wildcard
    const permissionParts = permission.split(':');
    if (permissionParts.length === 2) {
      const [action, resource] = permissionParts;
      
      // Verificar se tem permissão para todas as ações no recurso
      if (user.permissions.includes(`*:${resource}`)) {
        return true;
      }
      
      // Verificar se tem permissão para a ação em todos os recursos
      if (user.permissions.includes(`${action}:*`)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verificar permissões para endpoint específico
   */
  static hasEndpointPermission(user: AuthenticatedUser, method: string, path: string): boolean {
    const endpointKey = `${method}:${path}`;
    
    // Buscar permissões exatas
    let requiredPermissions = ENDPOINT_PERMISSIONS[endpointKey];
    
    // Se não encontrar, buscar por padrões wildcard
    if (!requiredPermissions) {
      for (const [pattern, permissions] of Object.entries(ENDPOINT_PERMISSIONS)) {
        if (this.matchesPattern(endpointKey, pattern)) {
          requiredPermissions = permissions;
          break;
        }
      }
    }

    // Se não há permissões definidas, negar acesso por segurança
    if (!requiredPermissions) {
      return false;
    }

    // Se endpoint é público (sem permissões), permitir
    if (requiredPermissions.length === 0) {
      return true;
    }

    // Verificar se usuário tem pelo menos uma das permissões necessárias
    return requiredPermissions.some(permission => 
      AuthService.hasPermission(user, permission)
    );
  }

  /**
   * Verificar se endpoint corresponde ao padrão
   */
  static matchesPattern(endpoint: string, pattern: string): boolean {
    // Converter padrão para regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(endpoint);
  }

  /**
   * Atualizar último login do usuário
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      logger.error('Erro ao atualizar último login:', undefined, error as Error);
    }
  }

  /**
   * Verificar se usuário é admin
   */
  static isAdmin(user: AuthenticatedUser): boolean {
    return user.role.level >= 100 || user.permissions.includes('admin:*');
  }

  /**
   * Verificar se usuário é moderador ou superior
   */
  static isModerator(user: AuthenticatedUser): boolean {
    return user.role.level >= 50;
  }

  /**
   * Obter informações de debug do usuário (apenas para admins)
   */
  static getUserDebugInfo(user: AuthenticatedUser): any {
    if (!AuthService.isAdmin(user)) {
      return { error: 'Acesso negado' };
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      session_id: user.session_id,
      created_at: user.created_at,
      last_login: user.last_login
    };
  }
}

export default AuthService;