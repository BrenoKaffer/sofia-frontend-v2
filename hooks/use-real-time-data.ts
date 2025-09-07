/**
 * Hook personalizado para gerenciar dados em tempo real
 * Implementa WebSocket com fallback para polling
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface UseRealTimeDataOptions {
  endpoint: string;
  pollingInterval?: number;
  enableWebSocket?: boolean;
  enablePolling?: boolean;
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
  autoStart?: boolean;
}

interface RealTimeDataState<T> {
  data: T | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export function useRealTimeData<T = any>(options: UseRealTimeDataOptions) {
  const {
    endpoint,
    pollingInterval = 5000,
    enableWebSocket = true,
    enablePolling = true,
    onData,
    onError,
    autoStart = false // Desabilitado por padrão para evitar loops
  } = options;

  const [state, setState] = useState<RealTimeDataState<T>>({
    data: null,
    isConnected: false,
    isLoading: false,
    error: null,
    lastUpdate: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);

  // Função para atualizar dados
  const updateData = useCallback((newData: T) => {
    setState(prev => ({
      ...prev,
      data: newData,
      lastUpdate: new Date(),
      error: null
    }));
    onData?.(newData);
  }, []); // Removida dependência onData para evitar loop

  // Função para definir erro
  const setError = useCallback((error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error;
    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false
    }));
    onError?.(error instanceof Error ? error : new Error(errorMessage));
  }, []); // Removida dependência onError para evitar loop

  // Função de polling
  const startPolling = useCallback(async () => {
    if (!enablePolling || !isActiveRef.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Fazer chamada para o endpoint
      const response = await apiClient.getRecentSignals();
      
      if (response.success && response.data) {
        updateData(response.data as T);
      } else {
        setError(response.error || 'Erro ao buscar dados');
      }
    } catch (error) {
      setError(error as Error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Agendar próximo polling
      if (isActiveRef.current) {
        pollingRef.current = setTimeout(startPolling, pollingInterval);
      }
    }
  }, [enablePolling, pollingInterval, updateData, setError]);

  // Função para conectar WebSocket
  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket || !isActiveRef.current) return;

    try {
      // URL do WebSocket (ajustar conforme necessário)
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket conectado');
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          error: null 
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          updateData(data);
        } catch (error) {
          console.error('Erro ao parsear dados do WebSocket:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket desconectado');
        setState(prev => ({ ...prev, isConnected: false }));
        
        // Tentar reconectar após 3 segundos
        if (isActiveRef.current) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        setError('Erro na conexão WebSocket');
      };
    } catch (error) {
      setError(error as Error);
    }
  }, [enableWebSocket]); // Removidas dependências updateData e setError para evitar loop

  // Função para iniciar conexão
  const start = useCallback(() => {
    if (isActiveRef.current) return;
    
    isActiveRef.current = true;
    setState(prev => ({ ...prev, isLoading: true }));

    // Tentar WebSocket primeiro, depois polling como fallback
    if (enableWebSocket) {
      connectWebSocket();
      
      // Se WebSocket não conectar em 5 segundos, usar polling
      setTimeout(() => {
        if (!state.isConnected && enablePolling) {
          console.log('WebSocket não conectou, usando polling como fallback');
          startPolling();
        }
      }, 5000);
    } else if (enablePolling) {
      startPolling();
    }
  }, [enableWebSocket, enablePolling, connectWebSocket, startPolling, state.isConnected]);

  // Função para parar conexão
  const stop = useCallback(() => {
    isActiveRef.current = false;
    
    // Fechar WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Parar polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    
    // Parar tentativas de reconexão
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isLoading: false
    }));
  }, []);

  // Função para forçar atualização
  const refresh = useCallback(async () => {
    if (!isActiveRef.current) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await apiClient.getRecentSignals();
      
      if (response.success && response.data) {
        updateData(response.data as T);
      } else {
        setError(response.error || 'Erro ao atualizar dados');
      }
    } catch (error) {
      setError(error as Error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []); // Removidas dependências updateData e setError para evitar loop

  // Efeito para auto-iniciar
  useEffect(() => {
    if (autoStart) {
      start();
    }
    
    return () => {
      stop();
    };
  }, [autoStart]); // Removidas dependências start e stop para evitar loop infinito

  return {
    ...state,
    start,
    stop,
    refresh,
    isActive: isActiveRef.current
  };
}

// Hook específico para sinais em tempo real
export function useRealTimeSignals(options: Omit<UseRealTimeDataOptions, 'endpoint'> = {}) {
  return useRealTimeData({
    ...options,
    endpoint: '/signals/recent'
  });
}

// Hook específico para status das mesas
export function useRealTimeTableStatus(tableId?: string, options: Omit<UseRealTimeDataOptions, 'endpoint'> = {}) {
  return useRealTimeData({
    ...options,
    endpoint: tableId ? `/tables/${tableId}/status` : '/tables'
  });
}

// Hook específico para KPIs
export function useRealTimeKPIs(options: Omit<UseRealTimeDataOptions, 'endpoint'> = {}) {
  return useRealTimeData({
    ...options,
    endpoint: '/kpis-estrategias',
    pollingInterval: 10000 // KPIs podem ser atualizados menos frequentemente
  });
}