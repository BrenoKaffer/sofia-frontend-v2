/**
 * Hook personalizado para gerenciar dados em tempo real
 * Implementa polling via API middleware para maior segurança
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Função de debounce para otimizar chamadas
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface UseRealTimeDataOptions {
  dataType?: 'signals' | 'kpis' | 'tables' | 'all';
  pollingInterval?: number;
  limit?: number;
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
  cacheAge?: number;
}

export function useRealTimeData<T = any>(options: UseRealTimeDataOptions = {}) {
  const {
    dataType = 'all',
    pollingInterval = 15000, // 15 segundos
    limit = 10,
    onData,
    onError,
    autoStart = true
  } = options;

  const [state, setState] = useState<RealTimeDataState<T>>({
    data: null,
    isConnected: false,
    isLoading: false,
    error: null,
    lastUpdate: null,
    cacheAge: 0
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);
  const retryCountRef = useRef(0);
  const API_ENDPOINT = '/api/realtime-data';
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 segundos

  // Função para atualizar dados
  const updateData = useCallback((newData: T, cacheAge?: number) => {
    setState(prev => ({
      ...prev,
      data: newData,
      lastUpdate: new Date(),
      error: null,
      isConnected: true,
      cacheAge: cacheAge || 0
    }));
    onData?.(newData);
  }, [onData]);

  // Função para definir erro
  const setError = useCallback((error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error;
    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
      isConnected: false
    }));
    onError?.(error instanceof Error ? error : new Error(errorMessage));
  }, [onError]);

  // Função para buscar dados via API middleware
  const fetchRealtimeData = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Construir URL com parâmetros
      const params = new URLSearchParams({
        type: dataType,
        limit: limit.toString()
      });
      
      const response = await fetch(`${API_ENDPOINT}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      });
      
      if (response.status === 429) {
        // Rate limit - aguardar mais tempo antes da próxima tentativa
        throw new Error('Rate limit excedido. Aguardando...');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Reset retry count em caso de sucesso
      retryCountRef.current = 0;
      updateData(result as T, result.cacheAge);
      
    } catch (error) {
      // Ignorar aborts/timeout silenciosamente para evitar ruído em navegação/re-render
      if (error && (error as any).name === 'AbortError') {
        setState(prev => ({ ...prev, isLoading: false }));
        // Reagendar polling normalmente
        if (isActiveRef.current && retryCountRef.current === 0) {
          pollingRef.current = setTimeout(fetchRealtimeData, pollingInterval);
        }
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Implementar retry logic
      if (retryCountRef.current < MAX_RETRIES && isActiveRef.current) {
        retryCountRef.current++;
        console.warn(`Tentativa ${retryCountRef.current}/${MAX_RETRIES} falhou: ${errorMessage}`);
        
        // Aguardar antes de tentar novamente
        setTimeout(() => {
          if (isActiveRef.current) {
            fetchRealtimeData();
          }
        }, RETRY_DELAY * retryCountRef.current); // Backoff exponencial
        
        return; // Não definir erro ainda, aguardar retry
      }
      
      // Após esgotar tentativas, definir erro
      setError(error as Error);
      retryCountRef.current = 0;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Agendar próximo polling apenas se não houve erro crítico
      if (isActiveRef.current && retryCountRef.current === 0) {
        pollingRef.current = setTimeout(fetchRealtimeData, pollingInterval);
      }
    }
  }, [dataType, limit, pollingInterval, updateData, setError]);
  
  // Versão com debounce da função fetch
  const debouncedFetchRealtimeData = useCallback(
    debounce(fetchRealtimeData, 500), // 500ms debounce
    [fetchRealtimeData]
  );

  // Função para iniciar polling
  const startPolling = useCallback(() => {
    if (!isActiveRef.current) return;
    
    // Iniciando polling de dados em tempo real
    
    // Buscar dados imediatamente (com debounce)
    debouncedFetchRealtimeData();
  }, [debouncedFetchRealtimeData]);

  // Função para iniciar conexão
  const start = useCallback(() => {
    if (isActiveRef.current) return;
    
    isActiveRef.current = true;
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Iniciar polling via API middleware
    startPolling();
  }, [startPolling]);

  // Função para parar conexão
  const stop = useCallback(() => {
    isActiveRef.current = false;
    
    // Parar polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isLoading: false
    }));
    
    // Polling de dados em tempo real parado
  }, []);

  // Função para forçar atualização
  const refresh = useCallback(async () => {
    if (!isActiveRef.current) return;
    
    // Parar polling atual
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    
    // Reset retry count para refresh manual
    retryCountRef.current = 0;
    
    // Buscar dados imediatamente (sem debounce para refresh manual)
    await fetchRealtimeData();
  }, [fetchRealtimeData]);

  // Efeito para auto-iniciar
  useEffect(() => {
    if (autoStart) {
      isActiveRef.current = true;
      setState(prev => ({ ...prev, isLoading: true }));
      startPolling();
    }
    
    return () => {
      isActiveRef.current = false;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false
      }));
    };
  }, [autoStart, startPolling]);

  return {
    ...state,
    start,
    stop,
    refresh,
    isActive: isActiveRef.current
  };
}

// Hook específico para sinais em tempo real
export function useRealTimeSignals(options: Omit<UseRealTimeDataOptions, 'dataType'> = {}) {
  return useRealTimeData({
    ...options,
    dataType: 'signals',
    pollingInterval: 15000
  });
}

// Hook específico para status das mesas
export function useRealTimeTableStatus(options: Omit<UseRealTimeDataOptions, 'dataType'> = {}) {
  return useRealTimeData({
    ...options,
    dataType: 'tables',
    pollingInterval: 20000
  });
}

// Hook específico para KPIs
export function useRealTimeKPIs(options: Omit<UseRealTimeDataOptions, 'dataType'> = {}) {
  return useRealTimeData({
    ...options,
    dataType: 'kpis',
    pollingInterval: 30000 // KPIs podem ser atualizados menos frequentemente
  });
}

// Hook para todos os dados em tempo real
export function useRealTimeAll(options: Omit<UseRealTimeDataOptions, 'dataType'> = {}) {
  return useRealTimeData({
    ...options,
    dataType: 'all',
    pollingInterval: 15000
  });
}