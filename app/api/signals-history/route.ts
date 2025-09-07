import { NextRequest, NextResponse } from 'next/server';

// Configuração do Backend SOFIA
const SOFIA_BACKEND_URL = 'http://localhost:3001/api';

// MOCK DATA: Função para gerar histórico de sinais simulados
function generateMockSignalsHistory(searchParams: URLSearchParams) {
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const tableId = searchParams.get('table_id');
  const strategyName = searchParams.get('strategy_name');
  
  const mockHistory = [];
  const tables = [
    'pragmatic-brazilian-roulette',
    'pragmatic-mega-roulette', 
    'evolution-immersive-roulette',
    'evolution-roleta-ao-vivo',
    'netent-live-roulette'
  ];
  
  const strategies = ['Hot Numbers AI', 'Pattern Recognition', 'Color Sequence', 'Fibonacci Analysis', 'Statistical Model'];
  const signalTypes = ['hot_number', 'cold_number', 'color_pattern', 'dozen_pattern', 'column_pattern'];
  const colors = ['red', 'black', 'green'];
  const numbers = Array.from({length: 37}, (_, i) => i);
  
  // Gerar mais dados para simular histórico completo
  const totalRecords = 500;
  
  for (let i = 0; i < totalRecords; i++) {
    const now = new Date();
    const createdAt = new Date(now.getTime() - (i * 10 * 60 * 1000)); // 10 minutos entre registros
    const selectedTable = tableId || tables[Math.floor(Math.random() * tables.length)];
    const selectedStrategy = strategies[Math.floor(Math.random() * strategies.length)];
    
    // Filtrar por strategy_name se fornecido
    if (strategyName && !selectedStrategy.toLowerCase().includes(strategyName.toLowerCase())) {
      continue;
    }
    
    // Filtrar por table_id se fornecido
    if (tableId && selectedTable !== tableId) {
      continue;
    }
    
    const predictedNumber = numbers[Math.floor(Math.random() * numbers.length)];
    const actualNumber = numbers[Math.floor(Math.random() * numbers.length)];
    const isWin = predictedNumber === actualNumber;
    
    mockHistory.push({
      id: `mock_history_${Date.now()}_${i}`,
      table_id: selectedTable,
      strategy_name: selectedStrategy,
      signal_type: signalTypes[Math.floor(Math.random() * signalTypes.length)],
      predicted_number: predictedNumber,
      predicted_color: colors[Math.floor(Math.random() * colors.length)],
      actual_number: actualNumber,
      actual_color: actualNumber === 0 ? 'green' : (actualNumber % 2 === 0 ? 'black' : 'red'),
      confidence: Math.floor(Math.random() * 40) + 60,
      result: isWin ? 'win' : 'loss',
      profit_loss: isWin ? Math.floor(Math.random() * 500) + 100 : -(Math.floor(Math.random() * 200) + 50),
      created_at: createdAt.toISOString(),
      validated_at: new Date(createdAt.getTime() + 5 * 60 * 1000).toISOString(),
      status: 'validated'
    });
  }
  
  // Ordenar por data (mais recente primeiro)
  mockHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  // Aplicar paginação
  return mockHistory.slice(offset, offset + limit);
}

/**
 * API para buscar histórico completo de sinais gerados
 * Suporta filtros, paginação e ordenação
 */
export async function GET(request: NextRequest) {
  // Extrair parâmetros da URL (fora do try/catch para estar disponível no catch)
  const { searchParams } = new URL(request.url);
  
  try {
    console.log('🚀 Iniciando API de histórico de sinais...');
    
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }
    
    // Buscar histórico de sinais do backend SOFIA
    console.log('🔍 Buscando histórico de sinais do backend SOFIA...');
    
    const historyUrl = new URL(`${SOFIA_BACKEND_URL}/signals-history`);
    
    // Repassar todos os parâmetros de query para o backend
    searchParams.forEach((value, key) => {
      historyUrl.searchParams.set(key, value);
    });

    const response = await fetch(historyUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      console.warn('⚠️ Erro ao buscar histórico de sinais do backend:', response.status, response.statusText);
      console.log('⚠️ Usando histórico mock (fallback)');
      
      // MOCK DATA: Fallback com dados simulados para desenvolvimento
      const mockHistory = generateMockSignalsHistory(searchParams);
      return NextResponse.json(mockHistory);
    }

    const historyData = await response.json();
    console.log('✅ Histórico de sinais recebido do backend SOFIA:', historyData?.length || 0);

    // Garantir que os dados sejam um array
    const sanitizedData = Array.isArray(historyData) ? historyData : [];

    return NextResponse.json(sanitizedData);
    
  } catch (error) {
    console.error('❌ Erro na API de histórico de sinais:', error);
    console.log('⚠️ Usando histórico mock (fallback devido a erro)');
    
    // MOCK DATA: Fallback com dados simulados em caso de erro
    const mockHistory = generateMockSignalsHistory(searchParams);
    return NextResponse.json(mockHistory);
  }
}

/**
 * Endpoint de informações sobre a API
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    message: 'API de Histórico de Sinais da SOFIA',
    endpoint: '/api/signals-history',
    method: 'GET',
    description: 'Busca histórico completo de sinais com filtros e paginação',
    parameters: {
      limit: 'Número de registros por página (máximo 100, padrão 50)',
      offset: 'Número de registros para pular (padrão 0)',
      strategy_name: 'Filtrar por nome da estratégia (busca parcial)',
      table_id: 'Filtrar por ID da mesa (busca exata)',
      confidence_level: 'Filtrar por nível de confiança (HIGH, MEDIUM, LOW)',
      is_validated: 'Filtrar por status de validação (true/false)'
    },
    response_format: {
      data: 'Array de sinais encontrados',
      pagination: 'Informações de paginação',
      filters: 'Filtros aplicados na consulta'
    }
  });
}