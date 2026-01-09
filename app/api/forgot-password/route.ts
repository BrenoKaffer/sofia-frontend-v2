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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/reset-password`,
    });

    if (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao enviar email' },
        { status: 400 }
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
