/**
 * Hook React para comunicação com o Backend SOFIA
 * Facilita o uso do cliente SOFIA nos componentes React
 */

import { useState, useEffect, useCallback } from 'react';
import { sofiaBackendClient } from '@/lib/sofia-backend-client';

interface UseSofiaBackendOptions {
  autoHealthCheck?: boolean;
  healthCheckInterval?: number;
}

interface SofiaBackendState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastHealthCheck: Date | null;
}

export function useSofiaBackend(options: UseSofiaBackendOptions = {}) {
  const { autoHealthCheck = true, healthCheckInterval = 30000 } = options;
  
  const [state, setState] = useState<SofiaBackendState>({
    isConnected: false,
    isLoading: false,
    error: null,
    lastHealthCheck: null
  });

  // Health Check
  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sofiaBackendClient.healthCheck();
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isLoading: false,
          error: null,
          lastHealthCheck: new Date()
        }));
        return response.data;
      } else {
        throw new Error(response.error || 'Health check falhou');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: errorMessage,
        lastHealthCheck: new Date()
      }));
      throw error;
    }
  }, []);

  // Auto health check
  useEffect(() => {
    if (!autoHealthCheck) return;

    // Health check inicial
    checkHealth().catch(console.error);

    // Health check periódico
    const interval = setInterval(() => {
      checkHealth().catch(console.error);
    }, healthCheckInterval);

    return () => clearInterval(interval);
  }, [autoHealthCheck, healthCheckInterval, checkHealth]);

  // KPIs das Estratégias
  const getKpisEstrategias = useCallback(async (params?: {
    strategy_name?: string;
    table_id?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sofiaBackendClient.getKpisEstrategias(params);
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar KPIs');
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Histórico da Roleta
  const getRouletteHistory = useCallback(async (params?: {
    table_id?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sofiaBackendClient.getRouletteHistory(params);
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar histórico');
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Histórico de Sinais
  const getSignalsHistory = useCallback(async (params?: {
    strategy_name?: string;
    table_id?: string;
    confidence_level?: string;
    is_validated?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sofiaBackendClient.getSignalsHistory(params);
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar sinais');
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Estratégias
  const getAllStrategies = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sofiaBackendClient.getAllStrategies();
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar estratégias');
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Preferências do Usuário
  const getUserPreferences = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sofiaBackendClient.getUserPreferences();
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar preferências');
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const saveUserPreferences = useCallback(async (preferences: Record<string, any>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sofiaBackendClient.saveUserPreferences(preferences);
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao salvar preferências');
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Enviar Spin Event
  const sendSpinEvent = useCallback(async (spinData: {
    number: number;
    table_id: string;
    timestamp?: string;
    color?: string;
    is_even?: boolean;
    is_high?: boolean;
    dozen?: string;
    column_type?: string;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await sofiaBackendClient.sendSpinEvent(spinData);
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao enviar spin');
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Machine Learning
  const mlOperations = {
    initialize: useCallback(async () => {
      const response = await sofiaBackendClient.initializeML();
      if (!response.success) {
        throw new Error(response.error || 'Erro ao inicializar ML');
      }
      return response.data;
    }, []),

    getPredictions: useCallback(async (tableId: string, limit?: number) => {
      const response = await sofiaBackendClient.getMLPredictions(tableId, limit);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar predições');
      }
      return response.data;
    }, []),

    getStatus: useCallback(async () => {
      const response = await sofiaBackendClient.getMLStatus();
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar status ML');
      }
      return response.data;
    }, []),

    retrain: useCallback(async () => {
      const response = await sofiaBackendClient.retrainML();
      if (!response.success) {
        throw new Error(response.error || 'Erro ao retreinar ML');
      }
      return response.data;
    }, [])
  };

  // WebSocket
  const createWebSocketConnection = useCallback((
    onMessage?: (data: any) => void,
    onError?: (error: Event) => void
  ) => {
    return sofiaBackendClient.createWebSocketConnection(onMessage, onError);
  }, []);

  return {
    // Estado
    ...state,
    
    // Métodos
    checkHealth,
    getKpisEstrategias,
    getRouletteHistory,
    getSignalsHistory,
    getAllStrategies,
    getUserPreferences,
    saveUserPreferences,
    sendSpinEvent,
    createWebSocketConnection,
    
    // Machine Learning
    ml: mlOperations,
    
    // Cliente direto (para casos avançados)
    client: sofiaBackendClient
  };
}

export default useSofiaBackend;