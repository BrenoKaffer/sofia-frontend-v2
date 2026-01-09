import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
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

    // Preparar cliente Supabase com SSR
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Armazenar cookies temporariamente para aplicar na resposta final
    let responseCookiesToSet: { name: string, value: string, options: CookieOptions }[] = [];

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            responseCookiesToSet = cookiesToSet;
          },
        },
      }
    );

    // Tentar fazer login
    console.log('[Login API] Tentando autenticar com Supabase...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('[Login API] Erro no signInWithPassword:', authError.message);
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
    const user = await AuthService.getUserWithRole(authData.user.id, authData.user, supabase);

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
    await AuthService.updateLastLogin(user.id, supabase);

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

    // Configurar resposta JSON
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

    // 1. Aplicar cookies do Supabase SSR (sb-access-token chunked)
    responseCookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    // 2. Configurar cookies legados (manuais) para middleware
    const maxAge = remember_me ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 dias ou 1 dia
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge,
      path: '/'
    };

    response.cookies.set('sb-access-token', authData.session.access_token, cookieOptions);
    response.cookies.set('sb-refresh-token', authData.session.refresh_token, cookieOptions);

    // Definir cookies de performance (Edge Middleware)
    // Usamos os dados já carregados em getUserWithRole para evitar chamada redundante
    if (user) {
      // Cookies acessíveis via JS para que o MonitoringProvider possa atualizá-los via Realtime
      const publicCookieOptions = { ...cookieOptions, httpOnly: false };

      if (user.status) response.cookies.set('sofia_status', user.status, publicCookieOptions);
      if (user.plan) response.cookies.set('sofia_plan', user.plan, publicCookieOptions);
      // user.role.id já está disponível
      if (user.role?.id) response.cookies.set('sofia_role', user.role.id, publicCookieOptions);
    }

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
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[Login API] Critical Error:', errorMsg, errorStack);
    
    // Tenta usar o logger, mas protege contra falhas nele
    try {
      logger.error(`Erro no endpoint de login: ${errorMsg}`);
    } catch (e) {
      console.error('[Login API] Falha ao registrar log:', e);
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        debug_error: process.env.NODE_ENV === 'development' ? errorMsg : undefined
      },
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
