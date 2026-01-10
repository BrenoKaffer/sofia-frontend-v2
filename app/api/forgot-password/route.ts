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
      console.log('Service Role Key encontrada. Tentando envio via Zeptomail.');
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.v1sofia.com';
      // CORREÇÃO: Usar a rota correta /reset-password (não /update-password)
      const redirectTo = `${origin}/reset-password`;

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo
        }
      });

      if (linkError) {
        console.error('Erro ao gerar link de recuperação (admin.generateLink):', linkError);
        // Não lançar erro aqui para permitir fallback? 
        // Se falhar a geração do link com admin, o fallback provavelmente também falhará se for problema no Supabase,
        // mas vale a pena tentar ou retornar erro específico.
        // Vamos logar e continuar para o fallback, mas registrando que falhou.
      } else if (linkData?.properties?.action_link) {
        try {
          console.log('Link de recuperação gerado com sucesso. Enviando email...');
          
          // PROTEÇÃO CONTRA EMAIL SCANNERS:
          // Em vez de enviar o link direto (que queima o token se o scanner acessar),
          // enviamos um link para uma página intermediária nossa ("security-check").
          // Codificamos em Base64 para evitar que scanners identifiquem a URL no parâmetro query.
          const realActionLink = linkData.properties.action_link;
          const encodedLink = Buffer.from(realActionLink).toString('base64');
          const safeLink = `${origin}/security-check?target=${encodedLink}`;
          
          await sendRecoveryEmail({
            to: email,
            name: user.full_name,
            recoveryLink: safeLink // Envia o link seguro
          });
          
          console.log('Email enviado com sucesso via Zeptomail (com link seguro).');
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
      } else {
        console.warn('Link de recuperação gerado, mas action_link está vazio.');
      }
    } else {
      console.warn('Service Role Key NÃO encontrada. Pulando envio customizado via Zeptomail.');
    }

    // Fallback: Usar o envio de email padrão do Supabase (resetPasswordForEmail)
    // Isso acontece se não tivermos Service Role Key OU se o envio via Zeptomail falhar
    console.log('Iniciando fallback para envio padrão do Supabase...');
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.v1sofia.com';
    // CORREÇÃO: Usar a rota correta /reset-password (não /update-password)
    const redirectTo = `${origin}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      console.error('Erro ao solicitar reset de senha no Supabase (fallback):', resetError);
      return NextResponse.json(
        { 
          error: 'Erro ao processar recuperação de senha. Contate o suporte.',
          details: resetError.message 
        },
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
