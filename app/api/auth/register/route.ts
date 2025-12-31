import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/lib/auth-service';
import { logger } from '@/lib/logger';

// POST - Registro de novo usuário
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, confirm_password } = body;

    // Validar dados obrigatórios
    if (!email || !password || !confirm_password) {
      return NextResponse.json(
        { error: 'Email, senha e confirmação de senha são obrigatórios' },
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

    // Validar confirmação de senha
    if (password !== confirm_password) {
      return NextResponse.json(
        { error: 'Senhas não coincidem' },
        { status: 400 }
      );
    }

    // Validar força da senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se já existe usuário com este email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este email' },
        { status: 409 }
      );
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0]
        }
      }
    });

    if (authError) {
      logger.error(`Erro ao criar usuário no Auth: ${authError.message || String(authError)}`);
      
      // Mapear erros específicos
      let errorMessage = 'Erro ao criar conta';
      if (authError.message.includes('User already registered')) {
        errorMessage = 'Usuário já registrado';
      } else if (authError.message.includes('Password should be')) {
        errorMessage = 'Senha não atende aos critérios de segurança';
      } else if (authError.message.includes('Invalid email')) {
        errorMessage = 'Email inválido';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // Criar registro na tabela users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        role_id: 'user', // Role padrão
        created_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      logger.error(`Erro ao criar registro do usuário: ${userError.message || String(userError)}`, undefined, userError as Error);
      
      // Tentar deletar usuário do Auth se falhou na criação do registro
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        logger.error(`Erro ao deletar usuário do Auth após falha: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`, undefined, deleteError as Error);
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar registro do usuário' },
        { status: 500 }
      );
    }

    // Log de registro bem-sucedido
    logger.info('Usuário registrado com sucesso', {
      metadata: {
        userId: user.id,
        email: user.email,
        name: user.name,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    // Preparar resposta
    const responseData = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role_id: user.role_id,
          created_at: user.created_at
        },
        requires_confirmation: !authData.session // Se não há sessão, precisa confirmar email
      },
      message: authData.session 
        ? 'Conta criada e login realizado com sucesso'
        : 'Conta criada com sucesso. Verifique seu email para confirmar a conta.'
    };

    // Se há sessão (confirmação automática), configurar cookies
    if (authData.session) {
      const response = NextResponse.json(responseData);
      
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 1 dia
        path: '/'
      });

      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 1 dia
        path: '/'
      });

      return response;
    }

    return NextResponse.json(responseData);

  } catch (error) {
    logger.error(`Erro no endpoint de registro: ${error instanceof Error ? error.message : String(error)}`);
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
// API Documentation removed for Next.js compatibility
// Auth Register API - Endpoint para registro de novos usuários
// POST /api/auth/register - Registrar novo usuário
