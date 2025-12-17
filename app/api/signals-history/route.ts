import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { backendService } from '@/lib/backend-service';

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

// Interface para os filtros de histórico de sinais
interface SignalsHistoryFilters {
  table_id?: string;
  strategy?: string;
  confidence_min?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

// Interface para resposta da API
interface ApiResponse {
  data: any[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    returned_count: number;
    items_per_page: number;
  };
  success: boolean;
  message?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair parâmetros da query string
    const { searchParams } = new URL(request.url);
    const filters: SignalsHistoryFilters = {
      table_id: searchParams.get('table_id') || undefined,
      strategy: searchParams.get('strategy') || undefined,
      confidence_min: searchParams.get('confidence_min') ? Number(searchParams.get('confidence_min')) : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
    };
    
    console.log('🚀 Buscando histórico de sinais do backend...');

    try {
      // Tentar buscar dados do backend real
      const backendResponse = await backendService.getSignalsHistory(filters);

      console.log('✅ Histórico de sinais recebido do backend SOFIA');
      return NextResponse.json(backendResponse);

    } catch (backendError: any) {
      console.warn('⚠️ Backend não disponível, usando dados mock:', backendError.message);
      
      // Fallback para dados mock em caso de erro
      const mockHistory = generateMockSignalsHistory(searchParams);
      const mockResponse: ApiResponse = {
        data: mockHistory,
        pagination: {
          current_page: filters.page || 1,
          total_pages: Math.ceil(500 / (filters.limit || 20)),
          total_items: 500,
          returned_count: mockHistory.length,
          items_per_page: filters.limit || 20
        },
        success: true,
        message: 'Dados simulados (backend indisponível)'
      };
      
      return NextResponse.json(mockResponse);
    }

  } catch (error) {
    console.error('Erro no endpoint signals-history:', error);
    
    // Fallback para dados mock em caso de erro geral
    const { searchParams } = new URL(request.url);
    const mockHistory = generateMockSignalsHistory(searchParams);
    const mockResponse: ApiResponse = {
      data: mockHistory,
      pagination: {
        current_page: 1,
        total_pages: Math.ceil(500 / 20),
        total_items: 500,
        returned_count: mockHistory.length,
        items_per_page: 20
      },
      success: false,
      message: error instanceof Error 
        ? error.message
        : 'Erro interno do servidor - usando dados simulados'
    };
    
    return NextResponse.json(mockResponse, { status: 500 });
  }
}

// Endpoint OPTIONS para informações da API
export async function OPTIONS() {
  return NextResponse.json({
    methods: ['GET'],
    description: 'Endpoint para buscar histórico de sinais com filtros e paginação',
    parameters: {
      table_id: 'string - ID da mesa para filtrar',
      strategy: 'string - Nome da estratégia para filtrar',
      confidence_min: 'number - Confiança mínima (0-100)',
      date_from: 'string - Data inicial (YYYY-MM-DD)',
      date_to: 'string - Data final (YYYY-MM-DD)',
      page: 'number - Página atual (padrão: 1)',
      limit: 'number - Itens por página (padrão: 20)'
    },
    response_format: {
      data: 'array - Lista de sinais',
      pagination: 'object - Informações de paginação',
      success: 'boolean - Status da operação',
      message: 'string - Mensagem opcional'
    }
  });
}
