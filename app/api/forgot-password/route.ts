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

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Inicializar Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Preferir Service Role para operações administrativas, fallback para Anon Key
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

    // Verificar se o usuário existe antes de tentar enviar o email
    // Isso é menos seguro (permite enumeração de usuários), mas solicitado pelo requisito de UX
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('Erro ao verificar usuário:', userError);
      return NextResponse.json(
        { error: 'Não foi possível verificar seu cadastro. Tente novamente em alguns instantes.' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Usar o backend externo para envio de email, conforme implementação estável da main
    const backendUrl =
      process.env.SOFIA_BACKEND_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'https://api.v1sofia.com';

    const normalizedBase = backendUrl.replace(/\/+$/, '');
    if (!normalizedBase) {
      console.error('Backend URL não configurada para forgot-password');
      return NextResponse.json(
        { error: 'Erro de configuração de backend' },
        { status: 500 }
      );
    }

    const endpoint = normalizedBase.endsWith('/api')
      ? `${normalizedBase}/auth/forgot-password`
      : `${normalizedBase}/api/auth/forgot-password`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const rawText = await response.text();
      console.error('Falha no backend ao processar forgot-password:', {
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
        message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.',
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro interno no endpoint forgot-password:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar solicitação' },
      { status: 500 }
    );
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Endpoint de recuperação de senha está funcionando',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
