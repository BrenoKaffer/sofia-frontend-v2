/**
 * Cliente API específico para endpoints de Machine Learning
 * Fornece interface tipada e simplificada para consumir APIs ML
 */

import { apiClient } from './api-client';
import type { ApiClient, ApiResponse } from './api-client';

// Tipos específicos para ML
export interface MLPrediction {
  id: string;
  type: 'next_number' | 'color_sequence' | 'pattern_analysis' | 'hot_cold_numbers';
  table_id: string;
  predicted_value: any;
  confidence: number;
  created_at: string;
  expires_at: string;
  metadata: {
    algorithm: string;
    features_used?: string[];
    model_confidence?: number;
  };
}

export interface MLModel {
  status: 'active' | 'training' | 'inactive' | 'error';
  accuracy: number;
  last_trained: string;
  training_samples: number;
  version: string;
  performance_metrics: {
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc: number;
  };
  training_progress?: number;
  estimated_completion?: string;
}

export interface MLSystemStatus {
  overall_status: 'operational' | 'degraded' | 'maintenance' | 'error';
  uptime: string;
  last_update: string;
  models: {
    pattern_recognition: MLModel;
    number_prediction: MLModel;
    strategy_optimization: MLModel;
    anomaly_detection: MLModel;
  };
  system_resources: {
    cpu_usage: number;
    memory_usage: number;
    gpu_usage: number;
    disk_usage: number;
    network_latency: number;
    active_connections: number;
  };
  usage_stats: {
    predictions_today: number;
    predictions_this_hour: number;
    active_tables: number;
    total_models_deployed: number;
    avg_prediction_time_ms: number;
    success_rate: number;
  };
  features: {
    [key: string]: {
      enabled: boolean;
      status: string;
      [key: string]: any;
    };
  };
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface MLInitializationConfig {
  learning_rate?: number;
  epochs?: number;
  batch_size?: number;
  validation_split?: number;
  early_stopping?: boolean;
  model_type?: string;
  features?: string[];
  target?: string;
}

export interface MLRetrainConfig {
  models?: string[];
  force_retrain?: boolean;
  training_config?: {
    learning_rate?: number;
    epochs?: number;
    batch_size?: number;
    validation_split?: number;
    early_stopping?: boolean;
    patience?: number;
    min_delta?: number;
    use_gpu?: boolean;
    parallel_training?: boolean;
  };
  data_range?: {
    days_back?: number;
    min_samples?: number;
    include_weekends?: boolean;
    exclude_anomalies?: boolean;
    data_quality_threshold?: number;
  };
}

export interface MLRetrainJob {
  job_id: string;
  status: 'initiated' | 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  estimated_duration: string;
  progress: number;
  models_to_train: Array<{
    name: string;
    status: string;
    current_accuracy: number;
    target_improvement: number;
    estimated_time_minutes: number;
    data_samples: number;
    progress: number;
  }>;
}

export interface MLPredictionFilters {
  table_id: string;
  limit?: number;
  prediction_type?: 'next_number' | 'color_sequence' | 'pattern_analysis' | 'hot_cold_numbers';
  confidence_min?: number;
}

/**
 * Cliente API para Machine Learning
 */
export class MLApiClient {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = apiClient;
  }

  /**
   * Inicializar sistema de Machine Learning
   */
  async initializeML(config?: MLInitializationConfig) {
    try {
      const response = await this.apiClient.post('/api/ml/initialize', config || {});
      return response;
    } catch (error) {
      console.error('Erro ao inicializar sistema ML:', error);
      throw error;
    }
  }

  /**
   * Obter predições do sistema ML
   */
  async getPredictions(filters: MLPredictionFilters): Promise<ApiResponse<{
    predictions: MLPrediction[];
    context: any;
    filters: MLPredictionFilters;
    stats: {
      total_predictions: number;
      avg_confidence: number;
      high_confidence_count: number;
    };
  }>> {
    try {
      const params = new URLSearchParams();
      params.append('table_id', filters.table_id);
      
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.prediction_type) params.append('prediction_type', filters.prediction_type);
      if (filters.confidence_min) params.append('confidence_min', filters.confidence_min.toString());

      const response = await this.apiClient.get<{
        predictions: MLPrediction[];
        context: any;
        filters: MLPredictionFilters;
        stats: {
          total_predictions: number;
          avg_confidence: number;
          high_confidence_count: number;
        };
      }>(`/api/ml/predictions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Erro ao obter predições ML:', error);
      throw error;
    }
  }

  /**
   * Verificar status do sistema ML
   */
  async getSystemStatus(): Promise<ApiResponse<MLSystemStatus>> {
    try {
      const response = await this.apiClient.get<MLSystemStatus>('/api/ml/status');
      return response;
    } catch (error) {
      console.error('Erro ao obter status do sistema ML:', error);
      throw error;
    }
  }

  /**
   * Iniciar retreinamento de modelos
   */
  async retrainModels(config?: MLRetrainConfig): Promise<ApiResponse<{
    job: MLRetrainJob;
    message: string;
    next_steps: string[];
  }>> {
    try {
      const response = await this.apiClient.post<{
        job: MLRetrainJob;
        message: string;
        next_steps: string[];
      }>('/api/ml/retrain', config || {});
      return response;
    } catch (error) {
      console.error('Erro ao iniciar retreinamento:', error);
      throw error;
    }
  }

  /**
   * Verificar status de retreinamento
   */
  async getRetrainStatus(jobId?: string): Promise<ApiResponse<any>> {
    try {
      const url = jobId 
        ? `/api/ml/retrain?job_id=${jobId}`
        : '/api/ml/retrain';
      
      const response = await this.apiClient.get<any>(url);
        return response;
    } catch (error) {
      console.error('Erro ao obter status de retreinamento:', error);
      throw error;
    }
  }

  /**
   * Obter predições por tipo específico
   */
  async getNumberPredictions(tableId: string, limit = 5, confidenceMin = 70) {
    return this.getPredictions({
      table_id: tableId,
      limit,
      prediction_type: 'next_number',
      confidence_min: confidenceMin
    });
  }

  async getColorPredictions(tableId: string, limit = 5, confidenceMin = 75) {
    return this.getPredictions({
      table_id: tableId,
      limit,
      prediction_type: 'color_sequence',
      confidence_min: confidenceMin
    });
  }

  async getPatternAnalysis(tableId: string, limit = 3, confidenceMin = 80) {
    return this.getPredictions({
      table_id: tableId,
      limit,
      prediction_type: 'pattern_analysis',
      confidence_min: confidenceMin
    });
  }

  async getHotColdNumbers(tableId: string, confidenceMin = 85) {
    return this.getPredictions({
      table_id: tableId,
      limit: 1,
      prediction_type: 'hot_cold_numbers',
      confidence_min: confidenceMin
    });
  }

  /**
   * Verificar se o sistema ML está operacional
   */
  async isMLOperational(): Promise<boolean> {
    try {
      const status = await this.getSystemStatus();
      return status.success && status.data.overall_status === 'operational';
    } catch (error) {
      console.error('Erro ao verificar status operacional do ML:', error);
      return false;
    }
  }

  /**
   * Obter métricas resumidas do sistema
   */
  async getMLSummary(): Promise<{
    isOperational: boolean;
    totalPredictionsToday: number;
    averageAccuracy: number;
    activeModels: number;
    systemLoad: number;
  }> {
    try {
      const status = await this.getSystemStatus();
      
      if (!status.success) {
        throw new Error('Falha ao obter status do sistema');
      }

      const { data } = status;
      const models = Object.values(data.models);
      const activeModels = models.filter(model => model.status === 'active').length;
      const averageAccuracy = models.reduce((sum, model) => sum + model.accuracy, 0) / models.length;
      const systemLoad = (data.system_resources.cpu_usage + data.system_resources.memory_usage) / 2;

      return {
        isOperational: data.overall_status === 'operational',
        totalPredictionsToday: data.usage_stats.predictions_today,
        averageAccuracy: Math.round(averageAccuracy * 1000) / 10, // Converter para porcentagem
        activeModels,
        systemLoad: Math.round(systemLoad)
      };
    } catch (error) {
      console.error('Erro ao obter resumo do ML:', error);
      return {
        isOperational: false,
        totalPredictionsToday: 0,
        averageAccuracy: 0,
        activeModels: 0,
        systemLoad: 0
      };
    }
  }
}

// Instância global do cliente ML
export const mlApiClient = new MLApiClient();

// Hooks personalizados para React (opcional)
export const useMLPredictions = (tableId: string, predictionType?: string) => {
  // Este hook pode ser implementado usando React Query ou SWR
  // para gerenciar estado e cache das predições ML
};

export const useMLStatus = () => {
  // Hook para monitorar status do sistema ML em tempo real
};

// Utilitários
export const MLUtils = {
  /**
   * Formatar confiança como porcentagem
   */
  formatConfidence: (confidence: number): string => {
    return `${Math.round(confidence)}%`;
  },

  /**
   * Determinar cor baseada na confiança
   */
  getConfidenceColor: (confidence: number): string => {
    if (confidence >= 90) return 'green';
    if (confidence >= 80) return 'blue';
    if (confidence >= 70) return 'yellow';
    return 'red';
  },

  /**
   * Verificar se predição ainda é válida
   */
  isPredictionValid: (prediction: MLPrediction): boolean => {
    return new Date(prediction.expires_at) > new Date();
  },

  /**
   * Calcular tempo restante da predição
   */
  getTimeRemaining: (prediction: MLPrediction): number => {
    const now = new Date().getTime();
    const expires = new Date(prediction.expires_at).getTime();
    return Math.max(0, expires - now);
  },

  /**
   * Agrupar predições por tipo
   */
  groupPredictionsByType: (predictions: MLPrediction[]) => {
    return predictions.reduce((groups, prediction) => {
      const type = prediction.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(prediction);
      return groups;
    }, {} as Record<string, MLPrediction[]>);
  }
};

export default MLApiClient;