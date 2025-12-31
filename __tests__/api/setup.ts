/**
 * Configuração de testes para APIs
 */

// Mock do sistema de autenticação customizado para testes
jest.mock('@/lib/auth-server', () => ({
  auth: jest.fn(() => ({
    userId: 'test-user-id',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    },
    isAuthenticated: true
  })),
  requireAuth: jest.fn(() => ({
    success: true,
    userId: 'test-user-id'
  }))
}));

jest.mock('@/lib/auth-middleware', () => ({
  requireAuth: jest.fn(() => ({
    user: {
      userId: 'test-user-id',
      sessionId: 'test-session-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    },
    isAuthenticated: true
  }))
}));

// Mock das variáveis de ambiente
process.env.BACKEND_API_KEY = process.env.BACKEND_API_KEY || process.env.TEST_BACKEND_API_KEY || 'test-api-key';
process.env.BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
(process.env as any).NODE_ENV = 'test';

// Mock do fetch global
global.fetch = jest.fn();

// Configuração de setup será feita nos arquivos de teste individuais

/**
 * Helpers para testes
 */
export const testHelpers = {
  // Array para armazenar requisições mock
  mockRequests: [] as any[],
  // Mock de resposta de sucesso
  mockSuccessResponse: (data: any, status = 200) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue(data),
      headers: new Headers({
        'content-type': 'application/json'
      })
    });
  },

  // Mock de resposta de erro
  mockErrorResponse: (status = 500, statusText = 'Internal Server Error') => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status,
      statusText,
      json: jest.fn().mockResolvedValue({ error: statusText }),
      headers: new Headers({
        'content-type': 'application/json'
      })
    });
  },

  // Mock de erro de rede
  mockNetworkError: () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    );
  },

  // Mock de timeout
  mockTimeout: () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new DOMException('The operation was aborted', 'AbortError')
    );
  },

  // Criar request mock
  createMockRequest: (url: string, options: any = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(options.params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const fullUrl = searchParams.toString() 
      ? `${url}?${searchParams.toString()}`
      : url;

    return {
      url: fullUrl,
      method: options.method || 'GET',
      headers: new Headers(options.headers || {}),
      json: async () => {
        if (options.body === undefined || options.body === null || options.body === '') {
          return {};
        }
        if (typeof options.body === 'string') {
          return JSON.parse(options.body);
        }
        return options.body;
      },
      nextUrl: {
        searchParams
      }
    } as any;
  },

  // Verificar se fetch foi chamado com parâmetros corretos
  expectFetchCalledWith: (url: string, options: any = {}) => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(url),
      expect.objectContaining(options)
    );
  },

  // Dados mock para testes
  mockData: {
    signalsHistory: {
      data: [
        {
          id: '1',
          signal_type: 'BUY',
          strategy: 'Martingale',
          timestamp: '2024-01-15T10:30:00Z',
          result: 'WIN',
          profit: 100.50
        },
        {
          id: '2',
          signal_type: 'SELL',
          strategy: 'Fibonacci',
          timestamp: '2024-01-15T11:00:00Z',
          result: 'LOSS',
          profit: -50.25
        }
      ],
      pagination: {
        current_page: 1,
        total_pages: 5,
        total_items: 100,
        returned_count: 2,
        items_per_page: 20
      },
      success: true,
      message: 'Dados recuperados com sucesso'
    },

    rouletteHistory: {
      data: [
        {
          id: '1',
          table_id: 'table_1',
          number: 7,
          color: 'RED',
          timestamp: '2024-01-15T10:30:00Z',
          session_id: 'session_123'
        },
        {
          id: '2',
          table_id: 'table_1',
          number: 0,
          color: 'GREEN',
          timestamp: '2024-01-15T10:31:00Z',
          session_id: 'session_123'
        }
      ],
      pagination: {
        current_page: 1,
        total_pages: 3,
        total_items: 50,
        returned_count: 2,
        items_per_page: 20
      },
      success: true,
      message: 'Histórico da roleta recuperado'
    },

    strategyDescriptions: {
      data: [
        {
          id: '1',
          name: 'Martingale',
          description: 'Estratégia de progressão negativa',
          category: 'PROGRESSIVE',
          risk_level: 'HIGH',
          recommended_chips: 10,
          win_rate: 0.65,
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Fibonacci',
          description: 'Baseada na sequência de Fibonacci',
          category: 'MATHEMATICAL',
          risk_level: 'MEDIUM',
          recommended_chips: 5,
          win_rate: 0.58,
          created_at: '2024-01-01T00:00:00Z'
        }
      ],
      pagination: {
        current_page: 1,
        total_pages: 2,
        total_items: 25,
        returned_count: 2,
        items_per_page: 20
      },
      success: true,
      message: 'Estratégias encontradas'
    }
  }
};

/**
 * Tipos para testes
 */
export interface TestApiResponse<T = any> {
  data: T;
  pagination?: {
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

/**
 * Utilitários para validação de resposta
 */
export const responseValidators = {
  // Validar estrutura básica da resposta
  validateApiResponse: (response: any): response is TestApiResponse => {
    return (
      typeof response === 'object' &&
      response !== null &&
      Array.isArray(response.data) &&
      typeof response.success === 'boolean'
    );
  },

  // Validar estrutura de paginação
  validatePagination: (pagination: any): boolean => {
    return (
      typeof pagination === 'object' &&
      pagination !== null &&
      typeof pagination.current_page === 'number' &&
      typeof pagination.total_pages === 'number' &&
      typeof pagination.total_items === 'number' &&
      typeof pagination.returned_count === 'number' &&
      typeof pagination.items_per_page === 'number'
    );
  },

  // Validar headers de resposta
  validateResponseHeaders: (response: Response): boolean => {
    const contentType = response.headers.get('content-type');
    return contentType?.includes('application/json') || false;
  }
};
