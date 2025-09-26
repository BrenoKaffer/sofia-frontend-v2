import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { backendIntegration } from '@/lib/backend-integration';

// Interface para filtros de histórico de roleta
interface RouletteHistoryFilters {
  table_id?: string;
  limit?: number;
  offset?: number;
  page?: number;
  date_from?: string;
  date_to?: string;
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
  // Extrair parâmetros da query
  const { searchParams } = new URL(request.url);
  const filters: RouletteHistoryFilters = {
    table_id: searchParams.get('table_id') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined
  };
  
  try {
    console.log('🚀 Iniciando API de histórico de roletas...');
    
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Calcular offset baseado na página
    filters.offset = ((filters.page || 1) - 1) * (filters.limit || 50);

    // Buscar histórico usando o serviço de integração
    console.log('🔍 Buscando histórico de roletas...');
    
    const result = await backendIntegration.getRouletteHistory(
      filters.table_id,
      filters.limit || 50,
      filters.offset || 0,
      filters.date_from,
      filters.date_to
    );

    if (!result.success) {
      console.warn('⚠️ Erro ao buscar histórico:', result.message);
      
      const errorResponse: ApiResponse = {
        data: [],
        pagination: {
          current_page: filters.page || 1,
          total_pages: 1,
          total_items: 0,
          returned_count: 0,
          items_per_page: filters.limit || 50
        },
        success: false,
        message: result.message || 'Erro ao buscar histórico'
      };
      
      return NextResponse.json(errorResponse);
    }

    console.log('✅ Histórico de roletas obtido:', Array.isArray(result.data) ? result.data.length : 0, 'registros');

    // Estruturar resposta com paginação
    const responseData: ApiResponse = {
      data: Array.isArray(result.data) ? result.data : [],
      pagination: (result as any).pagination || {
        current_page: filters.page || 1,
        total_pages: 1,
        total_items: Array.isArray(result.data) ? result.data.length : 0,
        returned_count: Array.isArray(result.data) ? result.data.length : 0,
        items_per_page: filters.limit || 50
      },
      success: true,
      message: result.message || 'Histórico obtido com sucesso'
    };
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Erro na API de histórico da roleta:', error);
    
    const errorResponse: ApiResponse = {
      data: [],
      pagination: {
        current_page: filters?.page || 1,
        total_pages: 1,
        total_items: 0,
        returned_count: 0,
        items_per_page: filters?.limit || 50
      },
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Endpoint OPTIONS para informações da API
 */
export async function OPTIONS() {
  return NextResponse.json({
    methods: ['GET'],
    description: 'Endpoint para buscar histórico de giros da roleta com filtros e paginação',
    parameters: {
      table_id: 'string - ID da mesa para filtrar',
      limit: 'number - Itens por página (padrão: 50, máximo: 100)',
      page: 'number - Página atual (padrão: 1)',
      offset: 'number - Calculado automaticamente baseado na página',
      date_from: 'string - Data inicial (YYYY-MM-DD)',
      date_to: 'string - Data final (YYYY-MM-DD)'
    },
    response_format: {
      data: 'array - Lista de giros da roleta',
      pagination: 'object - Informações de paginação',
      success: 'boolean - Status da operação',
      message: 'string - Mensagem opcional'
    },
    pagination_info: {
      current_page: 'Página atual',
      total_pages: 'Total de páginas disponíveis',
      total_items: 'Total de itens encontrados',
      returned_count: 'Quantidade de itens retornados nesta página',
      items_per_page: 'Itens por página'
    }
  });
}
