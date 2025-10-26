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

    const supabase = createRouteHandlerClient({ cookies });

    // Enviar email de recuperação de senha
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      
      // Não revelar se o email existe ou não por questões de segurança
      // Sempre retornar sucesso para evitar enumeração de usuários
      return NextResponse.json(
        { 
          message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.',
          success: true 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Email de recuperação enviado com sucesso!',
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