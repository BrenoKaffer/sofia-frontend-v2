import { NextRequest } from 'next/server';
import { createServerClient } from './supabase';

// Tipos para autenticação (sem dependências do Node.js)
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
  role?: string;
  permissions?: string[];
  error?: string;
  method?: 'jwt' | 'api_key' | 'supabase';
}

// Versão simplificada para Edge Runtime
export class EdgeApiAuthManager {
  private static instance: EdgeApiAuthManager;
  // Cliente Supabase seguro para Edge/Server
  private supabase = createServerClient();

  public static getInstance(): EdgeApiAuthManager {
    if (!EdgeApiAuthManager.instance) {
      EdgeApiAuthManager.instance = new EdgeApiAuthManager();
    }
    return EdgeApiAuthManager.instance;
  }

  // Função simples de hash usando Web Crypto API (compatível com Edge Runtime)
  private async simpleHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async validateApiKey(apiKey: string): Promise<AuthResult> {
    try {
      if (!apiKey) {
        return { success: false, error: 'API key não fornecida' };
      }

      const keyHash = await this.simpleHash(apiKey);

      const { data: keyData, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single();

      if (error || !keyData) {
        return { success: false, error: 'API key inválida' };
      }

      // Verificar expiração
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        return { success: false, error: 'API key expirada' };
      }

      // Atualizar último uso
      await this.supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyData.id);

      return {
        success: true,
        userId: keyData.user_id,
        permissions: keyData.permissions,
        method: 'api_key'
      };
    } catch (error) {
      return { success: false, error: 'Erro interno de autenticação' };
    }
  }

  async validateJWT(token: string): Promise<AuthResult> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      
      if (error || !user) {
        return { success: false, error: 'Token JWT inválido' };
      }

      return {
        success: true,
        userId: user.id,
        email: user.email,
        method: 'jwt'
      };
    } catch (error) {
      return { success: false, error: 'Erro ao validar JWT' };
    }
  }

  async authenticateRequest(request: NextRequest): Promise<AuthResult> {
    // Tentar autenticação via Bearer token
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return await this.validateJWT(token);
    }

    // Tentar autenticação via API key
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      return await this.validateApiKey(apiKey);
    }

    return { success: false, error: 'Nenhum método de autenticação fornecido' };
  }

  async generateApiKey(userId: string, name: string, permissions: string[] = [], expiresInDays?: number): Promise<{ key: string; keyData: Partial<ApiKey> }> {
    try {
      // Gerar chave aleatória usando Web Crypto API
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const key = Array.from(keyBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      
      const keyHash = await this.simpleHash(key);
      
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const keyData = {
        name,
        key_hash: keyHash,
        user_id: userId,
        permissions,
        expires_at: expiresAt,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('api_keys')
        .insert([keyData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { key, keyData: data };
    } catch (error) {
      throw new Error('Erro ao gerar API key');
    }
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    try {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw new Error('Erro ao buscar API keys');
    }
  }

  async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      return false;
    }
  }

  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes('admin') || userPermissions.includes(requiredPermission);
  }
}

export const edgeApiAuth = EdgeApiAuthManager.getInstance();

export async function requireAuth(request: NextRequest, requiredPermission?: string): Promise<AuthResult> {
  const authResult = await edgeApiAuth.authenticateRequest(request);
  
  if (!authResult.success) {
    return authResult;
  }

  if (requiredPermission && authResult.permissions) {
    if (!edgeApiAuth.hasPermission(authResult.permissions, requiredPermission)) {
      return { success: false, error: 'Permissão insuficiente' };
    }
  }

  return authResult;
}