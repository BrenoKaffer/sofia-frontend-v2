import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type ResetBody = {
  access_token?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ResetBody;
    const accessToken = body.access_token;
    const password = body.password;

    if (!accessToken || !password) {
      return NextResponse.json(
        { error: 'Token de recuperação e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase ausente no servidor' },
        { status: 500 }
      );
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text().catch(() => '');
      return NextResponse.json(
        { error: 'Token de recuperação inválido ou expirado', details: errorText || undefined },
        { status: 401 }
      );
    }

    const userData = (await userResponse.json()) as any;
    const userId = userData?.id;
    let userEmail: string | undefined = userData?.email;

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não encontrado para este token de recuperação' },
        { status: 404 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let passwordUpdated = false;
    {
      const authClient = createClient(supabaseUrl, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      const { data: updData, error: updErr } = await authClient.auth.updateUser({ password });
      if (!updErr && updData?.user?.id === userId) {
        passwordUpdated = true;
      }
    }

    if (!passwordUpdated) {
      const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
        password,
      });
      if (error) {
        return NextResponse.json(
          { error: 'Falha ao atualizar senha', details: error.message },
          { status: 500 }
        );
      }
      if (!data.user) {
        return NextResponse.json(
          { error: 'Resposta inválida ao atualizar senha' },
          { status: 500 }
        );
      }
      passwordUpdated = true;
    }

    if (!userEmail) {
      const { data: adminUser } = await adminClient.auth.admin.getUserById(userId);
      userEmail = adminUser?.user?.email?.toLowerCase() || undefined;
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: true, message: 'Senha atualizada com sucesso. Faça login novamente.' },
        { status: 200 }
      );
    }

    let responseCookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

    const supabase = createServerClient(
      supabaseUrl,
      anonKey,
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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password
    });

    if (authError) {
      return NextResponse.json(
        { success: true, message: 'Senha atualizada com sucesso. Não foi possível criar sessão automaticamente.', details: authError.message },
        { status: 200 }
      );
    }

    if (!authData.session) {
      return NextResponse.json(
        { success: true, message: 'Senha atualizada com sucesso. Sessão não criada.' },
        { status: 200 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Senha atualizada e sessão criada com sucesso',
      data: {
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at,
          expires_in: authData.session.expires_in
        }
      }
    });

    responseCookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60,
      path: '/'
    };

    response.cookies.set('sb-access-token', authData.session.access_token, cookieOptions);
    response.cookies.set('sb-refresh-token', authData.session.refresh_token, cookieOptions);

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Erro interno ao processar reset de senha', details: message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
