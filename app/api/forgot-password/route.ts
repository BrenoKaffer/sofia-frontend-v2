import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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

    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const rawText = await response.text();
        let data: any = null;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch {
          data = { message: rawText };
        }

        if (!response.ok) {
          console.error('Erro no backend ao processar forgot-password:', data);
          if (response.status < 500) {
            return NextResponse.json(
              { error: data?.message || 'Erro ao processar solicitação' },
              { status: response.status }
            );
          }
        } else {
          return NextResponse.json(
            {
              message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.',
              success: true,
            },
            { status: 200 }
          );
        }
      } catch (error) {
        console.error('Falha ao chamar backend no forgot-password:', error);
      }
    }

    const url = new URL(request.url);
    const origin = request.headers.get('origin') || url.origin;
    const redirectTo = `${origin}/reset-password`;

    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      console.error('Erro no Supabase ao processar forgot-password:', error);
      return NextResponse.json(
        { error: 'Erro ao processar solicitação' },
        { status: 500 }
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
      { error: 'Erro interno do servidor' },
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
