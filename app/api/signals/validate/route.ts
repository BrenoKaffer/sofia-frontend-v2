import { NextRequest, NextResponse } from 'next/server';

// Configuração do Backend SOFIA
const SOFIA_BACKEND_URL = 'http://localhost:3001/api';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando validação de sinal...');
    
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 Dados recebidos para validação:', body);

    // Validar sinal no backend SOFIA
    console.log('🔍 Enviando validação para o backend SOFIA...');
    
    const response = await fetch(`${SOFIA_BACKEND_URL}/signals/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('❌ Erro ao validar sinal no backend:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const validationData = await response.json();
    console.log('✅ Sinal validado no backend SOFIA:', validationData);
    
    return NextResponse.json(validationData);
  } catch (error) {
    console.error('Erro na API de validação de sinais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST para validar um sinal',
    endpoint: '/api/signals/validate',
    method: 'POST',
    description: 'Valida um sinal como hit ou miss e calcula o expected_return real',
    parameters: {
      signal_id: 'ID do sinal a ser validado',
      result: 'hit ou miss',
      winning_number: 'Número que saiu na roleta',
      net_payout: 'Lucro líquido real (opcional, será calculado se não fornecido)'
    }
  });
}