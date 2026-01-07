import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/lib/auth-service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'

// POST - Logout do usuário
export async function POST(req: NextRequest) {
  try {
    const authService = new AuthService();
    
    // Extrair token do header ou cookie
    let token = AuthService.extractToken(req);
    
    if (!token) {
      // Se não há token, considerar como logout bem-sucedido
      const response = NextResponse.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

      // Limpar cookies mesmo sem token
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');

      return response;
    }

    // Validar token e obter usuário
    const { user, error: tokenError } = await AuthService.validateToken(token);
    
    if (tokenError || !user) {
      logger.warn('Tentativa de logout com token inválido', {
        metadata: {
          error: tokenError,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        }
      });
    }

    // Fazer logout no Supabase (invalidar sessão)
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      logger.warn(`Erro ao fazer logout no Supabase: ${signOutError.message || String(signOutError)}`);
      // Continuar mesmo com erro, pois vamos limpar os cookies
    }

    // Preparar resposta
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

    // Limpar cookies de autenticação
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');

    // Adicionar headers para limpar cache
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // Log de logout bem-sucedido
    if (user) {
      logger.info('Logout realizado com sucesso', {
        metadata: {
          userId: user.id,
          email: user.email,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown'
        }
      });
    } else {
      logger.info('Logout realizado (sem usuário identificado)', {
        metadata: {
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        }
      });
    }

    return response;

  } catch (error) {
    logger.error(`Erro no endpoint de logout: ${error instanceof Error ? error.message : String(error)}`);
    
    // Mesmo com erro, tentar limpar cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    response.cookies.delete('sofia_status');
    response.cookies.delete('sofia_plan');
    response.cookies.delete('sofia_role');
    response.cookies.delete('sofia_account_status');

    return response;
  }
}

// GET - Verificar status da sessão
export async function GET(req: NextRequest) {
  try {
    const authService = new AuthService();
    
    // Extrair token
    const token = AuthService.extractToken(req);
    
    if (!token) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Nenhum token encontrado'
      });
    }

    // Validar token
    const { user, error } = await AuthService.validateToken(token);
    
    if (error || !user) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Buscar dados completos do usuário
    const fullUser = await AuthService.getUserWithRole(user.id);
    
    if (!fullUser || !fullUser.is_active) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: {
        user: {
          id: fullUser.id,
          email: fullUser.email,
          name: fullUser.name,
          role: {
            id: fullUser.role.id,
            name: fullUser.role.name || 'user',
            level: fullUser.role.level || 1
          },
          last_login: fullUser.last_login,
          is_active: fullUser.is_active
        }
      }
    });

  } catch (error) {
    logger.error(`Erro ao verificar status da sessão: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Documentação da API
// API Documentation removed for Next.js compatibility
// Auth Logout API - Endpoints para logout e verificação de sessão
// POST /api/auth/logout - Realizar logout do usuário
// GET /api/auth/logout - Verificar status da sessão atual
