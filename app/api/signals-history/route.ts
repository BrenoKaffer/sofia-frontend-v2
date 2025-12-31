import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { retryConfigs } from '@/lib/api-retry';

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
  result?: string;
  confidence_min?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  offset?: number;
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
  filters?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  const BACKEND_BASE =
    process.env.BACKEND_URL ||
    process.env.SOFIA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:3001';

  const { searchParams } = new URL(request.url);
  const filters: SignalsHistoryFilters = {
    table_id: searchParams.get('table_id') || undefined,
    strategy: searchParams.get('strategy') || undefined,
    result: searchParams.get('result') || undefined,
    confidence_min: searchParams.get('confidence_min')
      ? Number(searchParams.get('confidence_min'))
      : undefined,
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined,
    page: (() => {
      const raw = searchParams.get('page');
      const parsed = raw ? parseInt(raw) : 1;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    })(),
    limit: (() => {
      const raw = searchParams.get('limit');
      const parsed = raw ? parseInt(raw) : 20;
      const valid = Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
      return Math.min(valid, 100);
    })()
  };

  try {
    // Verificar autenticação
    const authContext = await auth();
    const userId =
      (authContext as any)?.userId || (authContext as any)?.user?.id || null;
    if (!userId || (authContext as any)?.isAuthenticated === false) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    filters.offset = ((filters.page || 1) - 1) * (filters.limit || 20);

    try {
      const backendParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          backendParams.append(key, value.toString());
        }
      });

      const backendUrl = `${BACKEND_BASE}/api/signals/history${
        backendParams.toString() ? `?${backendParams.toString()}` : ''
      }`;

      const response = await fetch(
        backendUrl,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'SOFIA-Frontend/1.0'
          },
          timeout: 30000 as any,
          retryOptions: retryConfigs.config as any
        } as any
      );

      if (!response.ok) {
        const mockParams = new URLSearchParams(searchParams.toString());
        mockParams.set('limit', String(filters.limit || 20));
        mockParams.set('offset', String(filters.offset || 0));
        const mockHistory = generateMockSignalsHistory(mockParams);
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
          message: 'Dados simulados (backend indisponível)',
          filters
        };
        return NextResponse.json(mockResponse);
      }

      const data = await response.json();

      if (data?.pagination) {
        const responseData: ApiResponse = {
          data: Array.isArray(data.data) ? data.data : [],
          pagination: {
            current_page: data.pagination.current_page || filters.page || 1,
            total_pages: data.pagination.total_pages || 1,
            total_items: data.pagination.total_items || 0,
            returned_count:
              data.pagination.returned_count ||
              (Array.isArray(data.data) ? data.data.length : 0),
            items_per_page: data.pagination.items_per_page || filters.limit || 20
          },
          success: data.success !== false,
          message: data.message,
          filters
        };

        return NextResponse.json(responseData);
      }

      const dataArray = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const responseData: ApiResponse = {
        data: dataArray,
        pagination: {
          current_page: filters.page || 1,
          total_pages: 1,
          total_items: dataArray.length,
          returned_count: dataArray.length,
          items_per_page: filters.limit || 20
        },
        success: true,
        message: 'Dados recuperados com sucesso',
        filters
      };

      return NextResponse.json(responseData);
    } catch (backendError: any) {
      const mockParams = new URLSearchParams(searchParams.toString());
      mockParams.set('limit', String(filters.limit || 20));
      mockParams.set('offset', String(filters.offset || 0));
      const mockHistory = generateMockSignalsHistory(mockParams);

      const mockResponse: ApiResponse = {
        data: mockHistory,
        pagination: {
          current_page: filters.page || 1,
          total_pages: Math.ceil(500 / (filters.limit || 20)),
          total_items: 500,
          returned_count: mockHistory.length,
          items_per_page: filters.limit || 20
        },
        success: false,
        message:
          backendError?.name === 'AbortError'
            ? 'Timeout na requisição - usando dados simulados'
            : backendError?.message || 'Erro de rede - usando dados simulados',
        filters
      };
      return NextResponse.json(mockResponse, { status: 500 });
    }

  } catch (error) {
    const mockParams = new URLSearchParams(searchParams.toString());
    mockParams.set('limit', String(filters.limit || 20));
    mockParams.set('offset', String(filters.offset || 0));
    const mockHistory = generateMockSignalsHistory(mockParams);
    const mockResponse: ApiResponse = {
      data: mockHistory,
      pagination: {
        current_page: filters.page || 1,
        total_pages: Math.ceil(500 / (filters.limit || 20)),
        total_items: 500,
        returned_count: mockHistory.length,
        items_per_page: filters.limit || 20
      },
      success: false,
      message: error instanceof Error 
        ? error.message
        : 'Erro interno do servidor - usando dados simulados'
      ,
      filters
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
      result: 'string - Resultado para filtrar (WIN/LOSS)',
      confidence_min: 'number - Confiança mínima (0-100)',
      date_from: 'string - Data inicial (YYYY-MM-DD)',
      date_to: 'string - Data final (YYYY-MM-DD)',
      page: 'number - Página atual (padrão: 1)',
      limit: 'number - Itens por página (padrão: 20, máximo: 100)',
      offset: 'number - Calculado automaticamente baseado na página'
    },
    response_format: {
      data: 'array - Lista de sinais',
      pagination: 'object - Informações de paginação',
      success: 'boolean - Status da operação',
      message: 'string - Mensagem opcional',
      filters: 'object - Filtros aplicados na consulta'
    },
    pagination_info: {
      current_page: 'Página atual',
      total_pages: 'Total de páginas disponíveis',
      total_items: 'Total de itens',
      returned_count: 'Itens retornados na página',
      items_per_page: 'Itens por página'
    }
  });
}
