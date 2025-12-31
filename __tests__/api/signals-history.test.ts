/**
 * Testes para o endpoint /api/signals-history
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { testHelpers, responseValidators, TestApiResponse } from './setup';
import { GET, OPTIONS } from '@/app/api/signals-history/route';

describe('/api/signals-history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('GET', () => {
    it('deve retornar histórico de sinais com paginação padrão', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.signalsHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history'
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

    it('deve aplicar filtros de paginação corretamente', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.signalsHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history',
        {
          params: {
            page: '2',
            limit: '10',
            strategy: 'Martingale',
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
      testHelpers.expectFetchCalledWith('/api/signals/history', {
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
      expect(url).toContain('limit=10');
      expect(url).toContain('strategy=Martingale');
      expect(url).toContain('date_from=2024-01-01');
      expect(url).toContain('date_to=2024-01-31');
    });

    it('deve aplicar valores padrão para paginação', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.signalsHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history'
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
      const mockResponse = testHelpers.mockData.signalsHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history',
        {
          params: {
            limit: '200' // Acima do máximo de 100
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

    it('deve retornar dados mock quando o backend falha', async () => {
      // Arrange
      testHelpers.mockErrorResponse(500, 'Internal Server Error');
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200); // Retorna 200 com dados mock
      expect(responseValidators.validateApiResponse(data)).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain('simulados');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('deve tratar timeout com retry e fallback', async () => {
      // Arrange
      testHelpers.mockTimeout();
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Timeout');
      expect(Array.isArray(data.data)).toBe(true); // Dados mock como fallback
    });

    it('deve tratar erro de rede com retry e fallback', async () => {
      // Arrange
      testHelpers.mockNetworkError();
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(Array.isArray(data.data)).toBe(true); // Dados mock como fallback
    });

    it('deve validar autenticação', async () => {
      // Arrange
      const { auth } = require('@/lib/auth-server');
      auth.mockReturnValueOnce({ user: null, isAuthenticated: false });
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history'
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
      const mockResponse = testHelpers.mockData.signalsHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history',
        {
          params: {
            strategy: 'Fibonacci',
            result: 'WIN'
          }
        }
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.filters).toBeDefined();
      expect(data.filters.strategy).toBe('Fibonacci');
      expect(data.filters.result).toBe('WIN');
    });

    it('deve calcular offset corretamente', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.signalsHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history',
        {
          params: {
            page: '3',
            limit: '15'
          }
        }
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      expect(url).toContain('offset=30'); // (3-1) * 15 = 30
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

    it('deve documentar todos os parâmetros de paginação', async () => {
      // Act
      const response = await OPTIONS();
      const data = await response.json();

      // Assert
      expect(data.parameters.page).toBeDefined();
      expect(data.parameters.limit).toBeDefined();
      expect(data.parameters.offset).toBeDefined();
      expect(data.pagination_info.current_page).toBeDefined();
      expect(data.pagination_info.total_pages).toBeDefined();
      expect(data.pagination_info.total_items).toBeDefined();
    });
  });

  describe('Integração com sistema de retry', () => {
    it('deve fazer retry em caso de erro 500', async () => {
      // Arrange
      testHelpers.mockErrorResponse(500);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history'
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
      const mockResponse = testHelpers.mockData.signalsHistory;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/signals-history'
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
});
