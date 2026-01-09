import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/lib/auth-service';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { sendVerificationEmail } from '@/lib/email';

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
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se já existe usuário com este email
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este email' },
        { status: 409 }
      );
    }

    // Criar usuário no Supabase Auth
    // Se tivermos a chave de serviço, usamos generateLink para enviar nosso próprio email (mais confiável)
    // Caso contrário, fallback para signUp normal (email enviado pelo Supabase)
    let authData: any = {};
    let authError: any = null;
    let customEmailSent = false;
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    logger.info(`Iniciando registro para ${email}. Service Role Key presente: ${hasServiceRole}`);

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.v1sofia.com';
      const redirectTo = `${origin}/auth/callback`;
      
      logger.info(`Gerando link de confirmação. RedirectTo: ${redirectTo}`);

      const { data, error } = await adminClient.auth.admin.generateLink({
        type: 'signup',
        email: email.toLowerCase(),
        password: password,
        options: {
          redirectTo,
          data: {
            full_name: name || email.split('@')[0]
          }
        }
      });

      authData = data;
      authError = error;

      if (error) {
        logger.error(`Erro ao gerar link de confirmação: ${error.message}`);
      } else {
        logger.info('Link gerado com sucesso', { metadata: { hasLink: !!data.properties?.action_link } });
      }

      if (!error && data.properties?.action_link) {
        // Verificar se configurações SMTP estão presentes
        if (!process.env.SMTP_HOST && !process.env.SMTP_USER) {
          logger.warn('Configurações SMTP ausentes (SMTP_HOST/SMTP_USER). O envio de email falhará.');
        }

        try {
          await sendVerificationEmail({
            to: email.toLowerCase(),
            name: name || email.split('@')[0],
            confirmationLink: data.properties.action_link
          });
          customEmailSent = true;
          logger.info(`Email de verificação enviado via SMTP para ${email}`);
        } catch (emailErr) {
          logger.error(`Erro ao enviar email via SMTP: ${emailErr}`, undefined, emailErr as Error);
          // Não falhar o registro, o usuário pode pedir reenvio depois
        }
      } else if (!error) {
        logger.warn('Link de ação não retornado pelo Supabase generateLink');
      }
    } else {
      logger.warn('Usando fallback de registro (Supabase Auth) pois SERVICE_ROLE_KEY está ausente');
      // Fallback para signUp padrão (email do Supabase)
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0]
          }
        }
      });
      authData = data;
      authError = error;
    }

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

    // Criar registro na tabela user_profiles
    // Tentar usar Service Role Key para bypassar RLS se disponível
    let dbClient = supabase;
    
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      dbClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    } else {
      logger.warn('SUPABASE_SERVICE_ROLE_KEY não definida. Usando cliente anônimo para criação de perfil (pode falhar por RLS).');
    }

    const { data: user, error: userError } = await dbClient
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        email: email.toLowerCase(),
        full_name: name || email.split('@')[0],
        role: 'user', // Role padrão
        status: 'active',
        created_at: new Date().toISOString()
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
        userId: user.user_id,
        email: user.email,
        name: user.full_name,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    // Preparar resposta
    const responseData = {
      success: true,
      data: {
        user: {
          id: user.user_id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          created_at: user.created_at
        },
        requires_confirmation: !authData.session // Se não há sessão, precisa confirmar email
      },
      message: authData.session 
        ? 'Conta criada e login realizado com sucesso'
        : (customEmailSent 
            ? 'Conta criada com sucesso. Enviamos um email de confirmação.' 
            : 'Conta criada com sucesso. Verifique seu email para confirmar a conta.')
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
