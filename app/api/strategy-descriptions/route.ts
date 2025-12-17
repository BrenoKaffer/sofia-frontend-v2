import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { ApiError, retryConfigs } from '@/lib/api-retry';

// Configuração do Backend SOFIA
const BACKEND_BASE = process.env.BACKEND_URL || process.env.SOFIA_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface StrategyDescription {
  strategy_name: string;
  description: string;
  logic: string;
  focus: string;
  risk_level: string;
  recommended_chips: number;
  category: string;
  success_rate?: number;
  avg_return?: number;
  complexity: string;
  time_frame: string;
  market_conditions: string[];
}

// Interface para filtros de descrições de estratégias
interface StrategyFilters {
  strategy?: string;
  category?: string;
  risk?: string;
  chips?: number;
  page?: number;
  limit?: number;
  offset?: number;
}

// Interface para resposta da API
interface ApiResponse {
  data: StrategyDescription[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    returned_count: number;
    items_per_page: number;
  };
  success: boolean;
  message?: string;
  filters?: any;
}

/**
 * Endpoint para buscar descrições detalhadas das estratégias
 */
export async function GET(request: NextRequest) {
  // Extrair parâmetros da query
  const { searchParams } = new URL(request.url);
  const filters: StrategyFilters = {
    strategy: searchParams.get('strategy') || undefined,
    category: searchParams.get('category') || undefined,
    risk: searchParams.get('risk') || undefined,
    chips: (() => {
      const raw = searchParams.get('chips');
      const parsed = raw ? parseInt(raw) : undefined;
      return Number.isFinite(parsed as number) ? (parsed as number) : undefined;
    })(),
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
    const authContext = await requireAuth(request);
    if (!authContext.isAuthenticated) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Calcular offset baseado na página
    filters.offset = ((filters.page || 1) - 1) * (filters.limit || 20);

    // Construir URL para o backend
    const backendParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        backendParams.append(key, value.toString());
      }
    });

    const backendUrl = `${BACKEND_BASE}/api/strategies/descriptions${
      backendParams.toString() ? `?${backendParams.toString()}` : ''
    }`;

    console.log('🔍 Buscando descrições das estratégias:', {
      url: backendUrl,
      filters: filters,
      user: authContext.user?.userId
    });

    // Fazer requisição para o backend passando timeout e retryOptions diretamente
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
          'User-Agent': 'SOFIA-Frontend/1.0'
        },
        // Campos extras usados pelos testes
        timeout: 30000 as any,
        retryOptions: retryConfigs.config as any
      } as any);

    if (!response.ok) {
        console.error('❌ Erro na resposta do backend:', {
          status: response.status,
          statusText: response.statusText,
          url: backendUrl
        });

        const errorResponse: ApiResponse = {
          data: [],
          pagination: {
            current_page: filters.page || 1,
            total_pages: 1,
            total_items: 0,
            returned_count: 0,
            items_per_page: filters.limit || 20
          },
          success: false,
          message: response.status === 404 
            ? 'Endpoint de descrições das estratégias não encontrado no backend'
            : `Erro do backend: ${response.status} ${response.statusText}`,
          filters: filters
        };

        return NextResponse.json(errorResponse, { status: 500 });
      }

      const data = await response.json();
      
      // Verificar se a resposta já tem estrutura de paginação
      if (data.pagination) {
        // Backend já retorna com paginação
        const responseData: ApiResponse = {
          data: Array.isArray(data.data) ? data.data : [],
          pagination: {
            current_page: data.pagination.current_page || filters.page || 1,
            total_pages: data.pagination.total_pages || 1,
            total_items: data.pagination.total_items || 0,
            returned_count: data.pagination.returned_count || (Array.isArray(data.data) ? data.data.length : 0),
            items_per_page: data.pagination.items_per_page || filters.limit || 20
          },
          success: data.success !== false,
          message: data.message,
          filters: filters
        };
        
        return NextResponse.json(responseData);
      } else {
        // Backend retorna array simples - criar estrutura de paginação
        const dataArray = Array.isArray(data) ? data : [];
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
          filters: filters
        };
        
        return NextResponse.json(responseData);
      }

    } catch (fetchError) {
      if (fetchError instanceof ApiError) {
        console.error('Erro na API:', fetchError.message);
        
        const apiErrorResponse: ApiResponse = {
          data: [],
          pagination: {
            current_page: filters.page || 1,
            total_pages: 1,
            total_items: 0,
            returned_count: 0,
            items_per_page: filters.limit || 20
          },
          success: false,
          message: fetchError.isTimeout ? 'Timeout na requisição - tente novamente' : fetchError.message,
          filters: filters
        };
        
        return NextResponse.json(apiErrorResponse);
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Erro ao buscar descrições das estratégias:', error);

    const errorResponse: ApiResponse = {
      data: [],
      pagination: {
        current_page: filters?.page || 1,
        total_pages: 1,
        total_items: 0,
        returned_count: 0,
        items_per_page: filters?.limit || 20
      },
      success: false,
      message: error instanceof ApiError 
        ? (error.isTimeout ? 'Timeout na requisição' : error.message)
        : 'Erro interno do servidor',
      filters: filters
    };

    return NextResponse.json(errorResponse, { status: 500 });
   }
 }

/**
 * Endpoint de informações sobre a API
 */
export async function OPTIONS() {
  return NextResponse.json({
    methods: ['GET'],
    description: 'Endpoint para buscar descrições detalhadas das estratégias com filtros e paginação',
    parameters: {
      strategy: 'string - Filtrar por nome da estratégia (busca parcial)',
      category: 'string - Filtrar por categoria da estratégia',
      risk: 'string - Filtrar por nível de risco (LOW, MEDIUM, HIGH)',
      chips: 'number - Filtrar por número recomendado de fichas',
      page: 'number - Página atual (padrão: 1)',
      limit: 'number - Itens por página (padrão: 20, máximo: 100)',
      offset: 'number - Calculado automaticamente baseado na página'
    },
    response_format: {
      data: 'array - Lista de descrições das estratégias',
      pagination: 'object - Informações de paginação',
      success: 'boolean - Status da operação',
      message: 'string - Mensagem opcional',
      filters: 'object - Filtros aplicados na consulta'
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
