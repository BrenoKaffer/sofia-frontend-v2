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
        {
          message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.',
          success: true,
        },
        { status: 200 }
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
      { 
        message: 'Se o email estiver cadastrado, você receberá as instruções de recuperação.',
        success: true 
      },
      { status: 200 }
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
