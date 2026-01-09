import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Verificar existência no Supabase (UX)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Variáveis de ambiente do Supabase não configuradas');
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, email_verified')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('Erro ao verificar usuário:', userError);
      return NextResponse.json(
        { error: 'Erro ao verificar cadastro' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { message: 'Email já verificado', success: true },
        { status: 200 }
      );
    }

    // 2. Chamar Backend Externo para envio
    const backendUrl =
      process.env.SOFIA_BACKEND_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'https://api.v1sofia.com';

    const normalizedBase = backendUrl.replace(/\/+$/, '');
    if (!normalizedBase) {
      console.error('Backend URL não configurada');
      return NextResponse.json(
        { error: 'Erro de configuração de backend' },
        { status: 500 }
      );
    }

    const endpoint = normalizedBase.endsWith('/api')
      ? `${normalizedBase}/auth/resend-confirmation`
      : `${normalizedBase}/api/auth/resend-confirmation`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const rawText = await response.text();
      console.error('Falha no backend ao reenviar confirmação:', {
        status: response.status,
        body: rawText,
      });
      return NextResponse.json(
        { error: 'Erro ao enviar email pelo servidor' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { 
        message: 'Email de confirmação reenviado com sucesso.',
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro interno no endpoint resend-confirmation:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar solicitação' },
      { status: 500 }
    );
  }
}
