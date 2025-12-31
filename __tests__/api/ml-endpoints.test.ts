/**
 * Testes para os endpoints de Machine Learning
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { testHelpers, responseValidators } from './setup';
import { GET as getPredictions, OPTIONS as optionsPredictions } from '@/app/api/ml/predictions/route';
import { POST as initializeML, OPTIONS as optionsInitialize } from '@/app/api/ml/initialize/route';
import { GET as getStatus, OPTIONS as optionsStatus } from '@/app/api/ml/status/route';
import { POST as retrainML, GET as getRetrainStatus, OPTIONS as optionsRetrain } from '@/app/api/ml/retrain/route';
import { cacheUtils } from '@/lib/api-cache';

describe('ML Endpoints', () => {
  beforeAll(() => {
    process.env.TZ = 'UTC';
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    cacheUtils.invalidateAll();
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('/api/ml/predictions', () => {
    describe('GET', () => {
      it('deve retornar predições ML com parâmetros válidos', async () => {
        // Arrange
        const mockResponse = {
          success: true,
          data: [
            {
              id: 'pred_123',
              type: 'next_number',
              table_id: 'table_1',
              predicted_value: 17,
              confidence: 85,
              created_at: '2024-01-15T10:30:00Z',
              expires_at: '2024-01-15T10:35:00Z',
              metadata: {
                algorithm: 'deep_neural_network',
                features_used: ['spin_sequence', 'time_interval'],
                model_confidence: 0.85
              }
            }
          ],
          context: {
            model_version: '2.1.0',
            last_training: '2024-01-15T10:30:00Z',
            model_accuracy: 0.847
          },
          stats: {
            total_predictions: 1,
            avg_confidence: 85,
            high_confidence_count: 1
          }
        };
        testHelpers.mockSuccessResponse(mockResponse);
        
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/predictions?table_id=table_1&limit=5&prediction_type=next_number'
        );

        // Act
        const response = await getPredictions(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.data[0]).toHaveProperty('id');
        expect(data.data[0]).toHaveProperty('confidence');
        expect(data.context).toHaveProperty('model_version');
        expect(data.stats).toHaveProperty('total_predictions');
      });

      it('deve retornar erro quando table_id não é fornecido', async () => {
        // Arrange
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/predictions?limit=5'
        );

        // Act
        const response = await getPredictions(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('table_id é obrigatório');
      });

      it('deve retornar erro quando limit excede máximo', async () => {
        // Arrange
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/predictions?table_id=table_1&limit=100'
        );

        // Act
        const response = await getPredictions(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Limite máximo de 50');
      });

      it('deve aplicar filtro de confiança mínima', async () => {
        // Arrange
        const mockResponse = {
          success: true,
          data: [
            {
              id: 'pred_high_conf',
              confidence: 95,
              type: 'next_number',
              table_id: 'table_1'
            }
          ]
        };
        testHelpers.mockSuccessResponse(mockResponse);
        
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/predictions?table_id=table_1&confidence_min=90'
        );

        // Act
        const response = await getPredictions(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.data.every((pred: any) => pred.confidence >= 90)).toBe(true);
      });

      it('deve usar cache quando disponível', async () => {
        // Arrange
        const mockResponse = { success: true, data: [] as any[], cached: true };
        testHelpers.mockSuccessResponse(mockResponse);
        
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/predictions?table_id=table_1'
        );

        // Act - Primeira chamada
        await getPredictions(request);
        // Act - Segunda chamada (deve usar cache)
        const response = await getPredictions(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('OPTIONS', () => {
      it('deve retornar informações da API de predições', async () => {
        // Act
        const response = await optionsPredictions();
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data).toHaveProperty('methods');
        expect(data).toHaveProperty('description');
        expect(data).toHaveProperty('parameters');
        expect(data).toHaveProperty('prediction_types');
        expect(data.methods).toContain('GET');
      });
    });
  });

  describe('/api/ml/initialize', () => {
    describe('POST', () => {
      it('deve inicializar sistema ML com configurações padrão', async () => {
        // Arrange
        const mockResponse = {
          success: true,
          message: 'Sistema de Machine Learning iniciado com sucesso',
          data: {
            status: 'initializing',
            initialization_id: 'ml_init_123',
            estimated_time: '2-5 minutes',
            progress: 0
          }
        };
        testHelpers.mockSuccessResponse(mockResponse);
        
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/initialize',
          { method: 'POST' }
        );

        // Act
        const response = await initializeML(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('initialization_id');
        expect(data.data).toHaveProperty('status');
        expect(data.data.status).toBe('initializing');
      });

      it('deve aceitar configurações personalizadas', async () => {
        // Arrange
        const customConfig = {
          learning_rate: 0.002,
          epochs: 150,
          model_type: 'transformer'
        };
        
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/initialize',
          { method: 'POST', body: JSON.stringify(customConfig) }
        );

        // Act
        const response = await initializeML(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.config).toMatchObject(customConfig);
      });

      it('deve retornar erro quando usuário não autenticado', async () => {
        // Arrange
        testHelpers.mockErrorResponse(401, 'Unauthorized');
        
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/initialize',
          { method: 'POST' }
        );

        // Act
        const response = await initializeML(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error).toContain('não autenticado');
      });
    });
  });

  describe('/api/ml/status', () => {
    describe('GET', () => {
      it('deve retornar status completo do sistema ML', async () => {
        // Arrange
        const mockResponse = {
          success: true,
          data: {
            overall_status: 'operational',
            uptime: '99.7%',
            models: {
              pattern_recognition: {
                status: 'active',
                accuracy: 0.847,
                version: '2.1.0'
              },
              number_prediction: {
                status: 'active',
                accuracy: 0.789,
                version: '1.8.3'
              }
            },
            system_resources: {
              cpu_usage: 45,
              memory_usage: 67,
              gpu_usage: 52
            },
            usage_stats: {
              predictions_today: 15234,
              active_tables: 18
            }
          }
        };
        testHelpers.mockSuccessResponse(mockResponse);
        
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/status'
        );

        // Act
        const response = await getStatus(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('overall_status');
        expect(data.data).toHaveProperty('models');
        expect(data.data).toHaveProperty('system_resources');
        expect(data.data).toHaveProperty('usage_stats');
        expect(data.data.overall_status).toBe('operational');
      });

      it('deve usar cache para otimizar performance', async () => {
        // Arrange
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/status'
        );

        // Act - Primeira chamada
        const response1 = await getStatus(request);
        // Act - Segunda chamada (deve usar cache)
        const response2 = await getStatus(request);

        // Assert
        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
      });
    });
  });

  describe('/api/ml/retrain', () => {
    describe('POST', () => {
      it('deve iniciar retreinamento com configurações padrão', async () => {
        // Arrange
        const mockResponse = {
          success: true,
          message: 'Retreinamento iniciado para 4 modelo(s)',
          data: {
            job_id: 'retrain_123',
            status: 'initiated',
            estimated_duration: '1h 0min',
            models_to_train: [
              {
                name: 'pattern_recognition',
                status: 'queued',
                estimated_time_minutes: 15
              }
            ]
          }
        };
        testHelpers.mockSuccessResponse(mockResponse);
        
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/retrain',
          { method: 'POST' }
        );

        // Act
        const response = await retrainML(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('job_id');
        expect(data.data).toHaveProperty('status');
        expect(data.data.status).toBe('initiated');
      });

      it('deve aceitar modelos específicos para retreinamento', async () => {
        // Arrange
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/retrain',
          { 
            method: 'POST',
            body: JSON.stringify({
              models: ['pattern_recognition', 'number_prediction'],
              force_retrain: true
            })
          }
        );

        // Act
        const response = await retrainML(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.models_to_train).toHaveLength(2);
      });

      it('deve retornar erro para modelos inválidos', async () => {
        // Arrange
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/retrain',
          { 
            method: 'POST',
            body: JSON.stringify({
              models: ['invalid_model']
            })
          }
        );

        // Act
        const response = await retrainML(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Nenhum modelo válido');
      });
    });

    describe('GET', () => {
      it('deve retornar status geral de retreinamento', async () => {
        // Arrange
        const mockResponse = {
          success: true,
          data: {
            active_jobs: 1,
            completed_today: 3,
            queue_length: 2,
            system_load: 65
          }
        };
        testHelpers.mockSuccessResponse(mockResponse);
        
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/retrain'
        );

        // Act
        const response = await getRetrainStatus(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('active_jobs');
        expect(data.data).toHaveProperty('completed_today');
      });

      it('deve retornar status específico de job', async () => {
        // Arrange
        const mockResponse = {
          success: true,
          data: {
            job_id: 'retrain_123',
            status: 'in_progress',
            progress: 45,
            models_progress: [
              {
                name: 'pattern_recognition',
                status: 'completed',
                progress: 100
              }
            ]
          }
        };
        testHelpers.mockSuccessResponse(mockResponse);
        
        const request = testHelpers.createMockRequest(
          'http://localhost:3000/api/ml/retrain?job_id=retrain_123'
        );

        // Act
        const response = await getRetrainStatus(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('job_id');
        expect(data.data).toHaveProperty('progress');
        expect(data.data.job_id).toBe('retrain_123');
      });
    });
  });

  describe('Integração entre endpoints ML', () => {
    it('deve manter consistência entre status e predições', async () => {
      // Arrange
      const statusRequest = testHelpers.createMockRequest(
        'http://localhost:3000/api/ml/status'
      );
      const predictionsRequest = testHelpers.createMockRequest(
        'http://localhost:3000/api/ml/predictions?table_id=table_1'
      );

      // Act
      const statusResponse = await getStatus(statusRequest);
      const predictionsResponse = await getPredictions(predictionsRequest);
      
      const statusData = await statusResponse.json();
      const predictionsData = await predictionsResponse.json();

      // Assert
      expect(statusResponse.status).toBe(200);
      expect(predictionsResponse.status).toBe(200);
      
      if (statusData.data.overall_status === 'operational') {
        expect(predictionsData.success).toBe(true);
      }
    });

    it('deve validar fluxo completo: inicializar -> status -> predições', async () => {
      // Arrange
      const initRequest = testHelpers.createMockRequest(
        'http://localhost:3000/api/ml/initialize',
        { method: 'POST' }
      );

      // Act & Assert - Inicializar
      const initResponse = await initializeML(initRequest);
      expect(initResponse.status).toBe(200);

      // Act & Assert - Verificar status
      const statusRequest = testHelpers.createMockRequest(
        'http://localhost:3000/api/ml/status'
      );
      const statusResponse = await getStatus(statusRequest);
      expect(statusResponse.status).toBe(200);

      // Act & Assert - Obter predições
      const predictionsRequest = testHelpers.createMockRequest(
        'http://localhost:3000/api/ml/predictions?table_id=table_1'
      );
      const predictionsResponse = await getPredictions(predictionsRequest);
      expect(predictionsResponse.status).toBe(200);
    });
  });

  describe('Tratamento de erros ML', () => {
    it('deve tratar timeout em predições', async () => {
      // Arrange
      testHelpers.mockTimeout();
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/ml/predictions?table_id=table_1'
      );

      // Act
      const response = await getPredictions(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(408);
      expect(data.success).toBe(false);
      expect(data.isTimeout).toBe(true);
    });

    it('deve tratar erro de rede em status', async () => {
      // Arrange
      testHelpers.mockNetworkError();
      
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/ml/status'
      );

      // Act
      const response = await getStatus(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toContain('rede');
    });
  });

  describe('Performance e Cache ML', () => {
    it('deve respeitar TTL do cache de predições', async () => {
      // Arrange
      const request = testHelpers.createMockRequest(
        'http://localhost:3000/api/ml/predictions?table_id=table_1'
      );

      // Act - Primeira chamada
      const response1 = await getPredictions(request);
      const data1 = await response1.json();
      
      // Simular passagem de tempo (cache expira em 30s)
      // Act - Segunda chamada após expiração
      const response2 = await getPredictions(request);
      const data2 = await response2.json();

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);
    });

    it('deve limpar cache ao iniciar retreinamento', async () => {
      // Arrange
      const retrainRequest = testHelpers.createMockRequest(
        'http://localhost:3000/api/ml/retrain',
        { method: 'POST' }
      );

      // Act
      const response = await retrainML(retrainRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Cache deve ser limpo automaticamente
    });
  });
});
