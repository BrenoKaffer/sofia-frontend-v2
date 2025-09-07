import { NextRequest, NextResponse } from 'next/server';

// Configuração do Backend SOFIA
const SOFIA_BACKEND_URL = 'http://localhost:3001/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Iniciando API de histórico de roletas...');
    
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    // Extrair parâmetros da query
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const tableId = searchParams.get('table_id');

    // Buscar histórico de roletas do backend SOFIA
    console.log('🔍 Buscando histórico de roletas do backend SOFIA...');
    
    const historyUrl = new URL(`${SOFIA_BACKEND_URL}/roulette-history`);
    if (limit) {
      historyUrl.searchParams.set('limit', limit.toString());
    }
    if (tableId) {
      historyUrl.searchParams.set('table_id', tableId);
    }

    const response = await fetch(historyUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      console.warn('⚠️ Erro ao buscar histórico do backend:', response.status, response.statusText);
      // Retornar array vazio em caso de erro
      return NextResponse.json([]);
    }

    const historyData = await response.json();
    console.log('✅ Histórico de roletas recebido do backend SOFIA:', historyData?.length || 0);

    // Garantir que os dados sejam um array
    const sanitizedData = Array.isArray(historyData) ? historyData : [];

    return NextResponse.json(sanitizedData);
  } catch (error) {
    console.error('Erro na API de histórico da roleta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}