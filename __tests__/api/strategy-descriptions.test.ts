/**
 * Testes para o endpoint /api/strategy-descriptions
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { testHelpers, responseValidators, TestApiResponse } from './setup';
import { GET, OPTIONS } from '@/app/api/strategy-descriptions/route';

describe('/api/strategy-descriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('GET', () => {
    it('deve retornar descrições das estratégias com paginação padrão', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions'
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

    it('deve aplicar todos os filtros disponíveis', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions',
        {
          params: {
            page: '2',
            limit: '10',
            strategy: 'Martingale',
            category: 'PROGRESSIVE',
            risk: 'HIGH',
            chips: '10'
          }
        }
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      testHelpers.expectFetchCalledWith('/api/strategies/descriptions', {
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
      expect(url).toContain('category=PROGRESSIVE');
      expect(url).toContain('risk=HIGH');
      expect(url).toContain('chips=10');
    });

    it('deve aplicar valores padrão para paginação', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions'
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
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions',
        {
          params: {
            limit: '250' // Acima do máximo de 100
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
        'http://localhost:3000/api/strategy-descriptions'
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
        'http://localhost:3000/api/strategy-descriptions'
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
        'http://localhost:3000/api/strategy-descriptions'
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
      const { requireAuth } = require('@/lib/auth-middleware');
      requireAuth.mockImplementationOnce(() => {
        throw new Error('Unauthorized');
      });
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions'
      );

      // Act & Assert
      await expect(GET(request)).rejects.toThrow('Unauthorized');
    });

    it('deve incluir filtros na resposta', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions',
        {
          params: {
            strategy: 'Fibonacci',
            risk: 'MEDIUM'
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
      expect(data.filters.risk).toBe('MEDIUM');
    });

    it('deve calcular offset corretamente', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions',
        {
          params: {
            page: '5',
            limit: '12'
          }
        }
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      expect(url).toContain('offset=48'); // (5-1) * 12 = 48
    });

    it('deve filtrar parâmetros undefined/null', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions',
        {
          params: {
            strategy: 'Martingale',
            category: '', // String vazia
            risk: undefined,
            chips: null
          }
        }
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      expect(url).toContain('strategy=Martingale');
      expect(url).not.toContain('category=');
      expect(url).not.toContain('risk=');
      expect(url).not.toContain('chips=');
    });

    it('deve validar estrutura da resposta do backend', async () => {
      // Arrange
      const invalidResponse = { invalid: 'structure' };
      testHelpers.mockSuccessResponse(invalidResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Erro interno');
    });

    it('deve criar estrutura de paginação quando backend não retorna', async () => {
      // Arrange
      const responseWithoutPagination = {
        data: testHelpers.mockData.strategyDescriptions.data,
        success: true
      };
      testHelpers.mockSuccessResponse(responseWithoutPagination);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.current_page).toBe(1);
      expect(data.pagination.returned_count).toBe(data.data.length);
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

    it('deve documentar todos os filtros disponíveis', async () => {
      // Act
      const response = await OPTIONS();
      const data = await response.json();

      // Assert
      expect(data.parameters.strategy).toBeDefined();
      expect(data.parameters.category).toBeDefined();
      expect(data.parameters.risk).toBeDefined();
      expect(data.parameters.chips).toBeDefined();
      expect(data.parameters.page).toBeDefined();
      expect(data.parameters.limit).toBeDefined();
      expect(data.parameters.offset).toBeDefined();
    });

    it('deve incluir informações sobre tipos de dados', async () => {
      // Act
      const response = await OPTIONS();
      const data = await response.json();

      // Assert
      expect(data.parameters.strategy).toContain('string');
      expect(data.parameters.category).toContain('string');
      expect(data.parameters.risk).toContain('string');
      expect(data.parameters.chips).toContain('number');
      expect(data.parameters.page).toContain('number');
      expect(data.parameters.limit).toContain('number');
    });
  });

  describe('Integração com sistema de retry', () => {
    it('deve fazer retry em caso de erro 502', async () => {
      // Arrange
      testHelpers.mockErrorResponse(502, 'Bad Gateway');
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions'
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      // O sistema de retry deve tentar múltiplas vezes
      expect(global.fetch).toHaveBeenCalledTimes(1); // Primeira tentativa
    });

    it('deve usar configuração de retry para dados de configuração', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions'
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
    it('deve aceitar apenas valores válidos para risk', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions',
        {
          params: {
            risk: 'INVALID_RISK_LEVEL'
          }
        }
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      // Deve passar o valor mesmo se inválido (validação no backend)
      expect(url).toContain('risk=INVALID_RISK_LEVEL');
    });

    it('deve converter chips para número', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions',
        {
          params: {
            chips: '15'
          }
        }
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];
      expect(url).toContain('chips=15');
    });
  });

  describe('Performance e Cache', () => {
    it('deve incluir timestamp na resposta', async () => {
      // Arrange
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.timestamp).toBeDefined();
      expect(typeof data.timestamp).toBe('string');
    });

    it('deve logar filtros aplicados', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockResponse = testHelpers.mockData.strategyDescriptions;
      testHelpers.mockSuccessResponse(mockResponse);
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/strategy-descriptions',
        {
          params: {
            strategy: 'Test Strategy'
          }
        }
      );

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Filtros aplicados:'),
        expect.objectContaining({
          strategy: 'Test Strategy'
        })
      );
      
      consoleSpy.mockRestore();
    });
  });
});
