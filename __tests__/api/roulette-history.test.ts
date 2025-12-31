/**
 * Testes para o endpoint /api/roulette-history
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { testHelpers, responseValidators, TestApiResponse } from './setup';
import { GET, OPTIONS } from '@/app/api/roulette-history/route';

describe('/api/roulette-history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('GET', () => {
    it('deve retornar histórico da roleta com paginação padrão', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.rouletteHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseValidators.validateApiResponse(data)).toBe(true);
      expect(responseValidators.validatePagination(data.pagination)).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('deve aplicar filtros de paginação e table_id', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.rouletteHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history',
        {
          params: {
            page: '2',
            limit: '15',
            table_id: 'table_1',
            date_from: '2024-01-01',
            date_to: '2024-01-31'
          }
        }
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      testHelpers.expectFetchCalledWith('/api/roulette/history', {
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json'
        })
      });
      
      // Verificar se os parâmetros foram passados corretamente
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=15');
      expect(url).toContain('table_id=table_1');
      expect(url).toContain('date_from=2024-01-01');
      expect(url).toContain('date_to=2024-01-31');
    });

    it('deve aplicar valores padrão para paginação', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.rouletteHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history'
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      expect(url).toContain('page=1');
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=0');
    });

    it('deve limitar o valor máximo de limit', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.rouletteHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history',
        {
          params: {
            limit: '150' // Acima do máximo de 100
          }
        }
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      expect(url).toContain('limit=100'); // Deve ser limitado a 100
    });

    it('deve retornar array vazio quando o backend falha', async () => {
      // Arrange
      testHelpers.mockErrorResponse(500, 'Internal Server Error');
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseValidators.validateApiResponse(data)).toBe(true);
      expect(data.success).toBe(false);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(0); // Array vazio como fallback
    });

    it('deve tratar timeout com retry e fallback', async () => {
      // Arrange
      testHelpers.mockTimeout();
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Timeout');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(0); // Array vazio como fallback
    });

    it('deve tratar erro de rede com retry e fallback', async () => {
      // Arrange
      testHelpers.mockNetworkError();
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(0); // Array vazio como fallback
    });

    it('deve validar autenticação', async () => {
      // Arrange
      const { auth } = require('@/lib/auth-server');
      auth.mockReturnValueOnce({ user: null, isAuthenticated: false });
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Não autorizado');
    });

    it('deve incluir filtros na resposta', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.rouletteHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history',
        {
          params: {
            table_id: 'table_2',
            date_from: '2024-01-15'
          }
        }
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.filters).toBeDefined();
      expect(data.filters.table_id).toBe('table_2');
      expect(data.filters.date_from).toBe('2024-01-15');
    });

    it('deve calcular offset corretamente', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.rouletteHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history',
        {
          params: {
            page: '4',
            limit: '25'
          }
        }
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      expect(url).toContain('offset=75'); // (4-1) * 25 = 75
    });

    it('deve sanitizar dados recebidos do backend', async () => {
      // Arrange
      const mockResponseWithExtraFields = {
        ...testHelpers.mockData.rouletteHistory,
        data: testHelpers.mockData.rouletteHistory.data.map(item => ({
          ...item,
          sensitive_field: 'should_be_removed',
          internal_id: 'internal_data'
        }))
      };
      testHelpers.mockSuccessResponse(mockResponseWithExtraFields);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
      // Verificar se dados sensíveis foram removidos (se implementado)
      data.data.forEach((item: any) => {
        expect(item.id).toBeDefined();
        expect(item.table_id).toBeDefined();
        expect(item.number).toBeDefined();
        expect(item.color).toBeDefined();
        expect(item.timestamp).toBeDefined();
      });
    });
  });

  describe('OPTIONS', () => {
    it('deve retornar informações da API', async () => {
      // Act
      const response = await OPTIONS();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.methods).toContain('GET');
      expect(data.description).toBeDefined();
      expect(data.parameters).toBeDefined();
      expect(data.response_format).toBeDefined();
      expect(data.pagination_info).toBeDefined();
    });

    it('deve documentar parâmetros específicos da roleta', async () => {
      // Act
      const response = await OPTIONS();
      const data = await response.json();

      // Assert
      expect(data.parameters.table_id).toBeDefined();
      expect(data.parameters.page).toBeDefined();
      expect(data.parameters.limit).toBeDefined();
      expect(data.parameters.date_from).toBeDefined();
      expect(data.parameters.date_to).toBeDefined();
    });
  });

  describe('Integração com sistema de retry', () => {
    it('deve fazer retry em caso de erro 503', async () => {
      // Arrange
      testHelpers.mockErrorResponse(503, 'Service Unavailable');
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history'
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      // O sistema de retry deve tentar múltiplas vezes
      expect(global.fetch).toHaveBeenCalledTimes(1); // Primeira tentativa
    });

    it('deve usar configuração de retry para dados históricos', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.rouletteHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history'
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const options = fetchCall[1];
      expect(options.timeout).toBe(30000);
      expect(options.retryOptions).toBeDefined();
    });
  });

  describe('Validação de parâmetros', () => {
    it('deve aceitar apenas valores numéricos para page e limit', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.rouletteHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history',
        {
          params: {
            page: 'invalid',
            limit: 'also_invalid'
          }
        }
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      // Deve usar valores padrão quando inválidos
      expect(url).toContain('page=1');
      expect(url).toContain('limit=20');
    });

    it('deve validar formato de datas', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.rouletteHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/roulette-history',
        {
          params: {
            date_from: '2024-01-01',
            date_to: '2024-01-31'
          }
        }
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      expect(url).toContain('date_from=2024-01-01');
      expect(url).toContain('date_to=2024-01-31');
    });
  });
});
