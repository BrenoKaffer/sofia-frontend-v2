import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/lib/auth-service';
import { logger } from '@/lib/logger';

// POST - Login do usuário
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, remember_me = false } = body;

    // Validar dados obrigatórios
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Tentar fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      logger.warn('Tentativa de login falhada', {
        metadata: {
          email,
          error: authError.message,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        }
      });

      // Mapear erros específicos
      let errorMessage = 'Credenciais inválidas';
      if (authError.message.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
      } else if (authError.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos';
      } else if (authError.message.includes('Too many requests')) {
        errorMessage = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Erro na autenticação' },
        { status: 401 }
      );
    }

    // Buscar dados do usuário com role
    const user = await AuthService.getUserWithRole(authData.user.id);

    if (!user) {
      logger.error('Usuário autenticado não encontrado no banco', {
        metadata: { userId: authData.user.id }
      });
      
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se usuário está ativo
    if (!user.is_active) {
      logger.warn('Tentativa de login de usuário inativo', {
        metadata: {
          userId: user.id,
          email: user.email
        }
      });

      return NextResponse.json(
        { error: 'Conta desativada. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // Atualizar último login
    await AuthService.updateLastLogin(user.id);

    // Preparar dados da resposta
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: {
        id: user.role.id,
        name: user.role.name,
        level: user.role.level
      },
      last_login: new Date().toISOString(),
      is_active: user.is_active
    };

    // Configurar cookie de sessão
    const response = NextResponse.json({
      success: true,
      data: {
        user: userData,
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
          expires_in: authData.session.expires_in
        }
      },
      message: 'Login realizado com sucesso'
    });

    // Configurar cookies
    const maxAge = remember_me ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 dias ou 1 dia
    
    response.cookies.set('sb-access-token', authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/'
    });

    response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/'
    });

    logger.info('Login realizado com sucesso', {
      metadata: {
        userId: user.id,
        email: user.email,
        role: user.role.id,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    return response;

  } catch (error) {
    logger.error(`Erro no endpoint de login: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Documentação da API
// Auth Login API - Endpoint para autenticação de usuários
// POST /api/auth/login - Realizar login do usuário
