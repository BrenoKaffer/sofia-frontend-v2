import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase ausente no servidor' },
        { status: 500 }
      );
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: serviceRoleKey,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text().catch(() => '');
      return NextResponse.json(
        { error: 'Token de recuperação inválido ou expirado', details: errorText || undefined },
        { status: 401 }
      );
    }

    const userData = (await userResponse.json()) as { id?: string } | null;
    const userId = userData?.id;

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

    return NextResponse.json(
      { success: true, message: 'Senha atualizada com sucesso' },
      { status: 200 }
    );
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

