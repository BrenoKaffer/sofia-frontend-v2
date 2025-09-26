import { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { supabase } from './supabase';

// Tipos para autenticação
export interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  user_id: string;
  permissions: string[];
  expires_at?: string;
  last_used_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  permissions?: string[];
  error?: string;
  method?: 'jwt' | 'api_key' | 'supabase';
}

// Classe para gerenciar autenticação
export class ApiAuthManager {
  private static instance: ApiAuthManager;
  
  public static getInstance(): ApiAuthManager {
    if (!ApiAuthManager.instance) {
      ApiAuthManager.instance = new ApiAuthManager();
    }
    return ApiAuthManager.instance;
  }

  // Gerar nova API Key
  async generateApiKey(userId: string, name: string, permissions: string[] = [], expiresInDays?: number): Promise<{ key: string; keyData: Partial<ApiKey> }> {
    const key = `sofia_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(key).digest('hex');
    
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const keyData: Partial<ApiKey> = {
      id: randomBytes(16).toString('hex'),
      name,
      key_hash: keyHash,
      user_id: userId,
      permissions,
      expires_at: expiresAt || undefined,
      is_active: true,
      created_at: new Date().toISOString()
    };

    // Salvar no Supabase
    const { error } = await supabase
      .from('api_keys')
      .insert(keyData);

    if (error) {
      throw new Error(`Erro ao criar API Key: ${error.message}`);
    }

    return { key, keyData };
  }

  // Validar API Key
  async validateApiKey(apiKey: string): Promise<AuthResult> {
    try {
      if (!apiKey.startsWith('sofia_')) {
        return { success: false, error: 'Formato de API Key inválido' };
      }

      const keyHash = createHash('sha256').update(apiKey).digest('hex');

      const { data, error } = await supabase
        .from('api_keys')
        .select(`
          *,
          users!inner(id, email, role)
        `)
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { success: false, error: 'API Key inválida' };
      }

      // Verificar expiração
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { success: false, error: 'API Key expirada' };
      }

      // Atualizar último uso
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id);

      return {
        success: true,
        userId: data.user_id,
        email: data.users.email,
        permissions: data.permissions || [],
        method: 'api_key'
      };

    } catch (error: any) {
      return { success: false, error: `Erro na validação: ${error.message}` };
    }
  }

  // Validar JWT Token (usando Supabase)
  async validateJWT(token: string): Promise<AuthResult> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return { success: false, error: 'JWT Token inválido' };
      }

      // Buscar dados adicionais do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, permissions')
        .eq('id', user.id)
        .single();

      return {
        success: true,
        userId: user.id,
        email: user.email,
        permissions: userData?.permissions || [],
        method: 'jwt'
      };

    } catch (error: any) {
      return { success: false, error: `Erro na validação JWT: ${error.message}` };
    }
  }

  // Autenticar requisição
  async authenticateRequest(request: NextRequest): Promise<AuthResult> {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return { success: false, error: 'Header de autorização ausente' };
    }

    // Verificar se é Bearer token (JWT)
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return await this.validateJWT(token);
    }

    // Verificar se é API Key
    if (authHeader.startsWith('ApiKey ')) {
      const apiKey = authHeader.substring(7);
      return await this.validateApiKey(apiKey);
    }

    return { success: false, error: 'Formato de autorização inválido' };
  }

  // Verificar permissões
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes('admin') || userPermissions.includes(requiredPermission);
  }

  // Revogar API Key
  async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('user_id', userId);

      return !error;
    } catch {
      return false;
    }
  }

  // Listar API Keys do usuário
  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      return data || [];
    } catch {
      return [];
    }
  }
}

// Instância singleton
export const apiAuth = ApiAuthManager.getInstance();

// Middleware helper para autenticação
export async function requireAuth(request: NextRequest, requiredPermission?: string): Promise<AuthResult> {
  const authResult = await apiAuth.authenticateRequest(request);
  
  if (!authResult.success) {
    return authResult;
  }

  // Verificar permissão específica se necessário
  if (requiredPermission && !apiAuth.hasPermission(authResult.permissions || [], requiredPermission)) {
    return { success: false, error: 'Permissão insuficiente' };
  }

  return authResult;
}

// Decorator para rotas protegidas
export function withAuth(requiredPermission?: string) {
  return function(handler: (request: NextRequest, auth: AuthResult) => Promise<Response>) {
    return async function(request: NextRequest): Promise<Response> {
      const authResult = await requireAuth(request, requiredPermission);
      
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return handler(request, authResult);
    };
  };
}