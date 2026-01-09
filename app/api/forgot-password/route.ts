import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendRecoveryEmail } from '@/lib/email';

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
    // Verificar ambas as variações comuns de nome para a chave de serviço
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE || 
                           process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabaseKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
      .select('user_id, full_name')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('Erro ao verificar usuário:', userError);
      return NextResponse.json(
        { error: 'Email não cadastrado ou não verificado.' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Se tivermos a Service Role Key, podemos gerar o link e enviar via Zeptomail (custom)
    if (serviceRoleKey) {
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.v1sofia.com';
      const redirectTo = `${origin}/update-password`;

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo
        }
      });

      if (linkError) {
        console.error('Erro ao gerar link de recuperação:', linkError);
        throw linkError;
      }

      if (linkData?.properties?.action_link) {
        try {
          await sendRecoveryEmail({
            to: email,
            name: user.full_name,
            recoveryLink: linkData.properties.action_link
          });
          
          return NextResponse.json(
            { 
              message: 'Email de recuperação enviado com sucesso via servidor customizado.',
              success: true 
            },
            { status: 200 }
          );
        } catch (emailError) {
          console.error('Erro ao enviar email via Zeptomail:', emailError);
          // Fallback para envio padrão do Supabase se o Zeptomail falhar
        }
      }
    }

    // Fallback: Usar o envio de email padrão do Supabase (resetPasswordForEmail)
    // Isso acontece se não tivermos Service Role Key OU se o envio via Zeptomail falhar
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.v1sofia.com';
    const redirectTo = `${origin}/update-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      console.error('Erro ao solicitar reset de senha no Supabase:', resetError);
      return NextResponse.json(
        { error: 'Erro ao processar recuperação de senha' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação (via Supabase).',
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
      message: 'Endpoint de recuperação de senha está funcionando (Versão Supabase/Zeptomail)',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
