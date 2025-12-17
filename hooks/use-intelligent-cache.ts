'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiCache, cacheConfigs, CacheOptions } from '@/lib/api-cache';

interface IntelligentCacheOptions extends CacheOptions {
  refreshInterval?: number;
  backgroundRefresh?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

interface CacheState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  lastUpdated: number | null;
}

/**
 * Hook inteligente para cache que otimiza requisições da API
 * com funcionalidades avançadas como refresh automático e retry
 */
export function useIntelligentCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: IntelligentCacheOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutos padrão
    refreshInterval,
    backgroundRefresh = true,
    retryOnError = true,
    maxRetries = 3,
    tags = [],
    staleWhileRevalidate = true,
    onError,
    onSuccess
  } = options;

  const [state, setState] = useState<CacheState<T>>({
    data: null,
    loading: true,
    error: null,
    isStale: false,
    lastUpdated: null
  });

  const retryCountRef = useRef(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Função para buscar dados com retry automático
  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      // Verificar cache primeiro
      const cached = apiCache.get<T>(key);
      if (cached && !cached.isStale && !isBackground) {
        setState({
          data: cached.data,
          loading: false,
          error: null,
          isStale: false,
          lastUpdated: Date.now()
        });
        onSuccess?.(cached.data);
        return cached.data;
      }

      // Se há dados stale, usar enquanto revalida
      if (cached && cached.isStale && staleWhileRevalidate && !isBackground) {
        setState(prev => ({
          ...prev,
          data: cached.data,
          loading: false,
          isStale: true
        }));
      }

      // Buscar dados frescos
      const freshData = await fetcher();
      
      if (!isMountedRef.current) return freshData;

      // Salvar no cache
      apiCache.set(key, freshData, { ttl, tags, staleWhileRevalidate });
      
      setState({
        data: freshData,
        loading: false,
        error: null,
        isStale: false,
        lastUpdated: Date.now()
      });

      retryCountRef.current = 0;
      onSuccess?.(freshData);
      return freshData;

    } catch (error) {
      if (!isMountedRef.current) return;

      const err = error as Error;
      
      // Retry logic
      if (retryOnError && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.warn(`Cache fetch retry ${retryCountRef.current}/${maxRetries} for key: ${key}`);
        
        // Exponential backoff
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        setTimeout(() => fetchData(isBackground), delay);
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: err
      }));
      
      onError?.(err);
      throw err;
    }
  }, [key, fetcher, ttl, tags, staleWhileRevalidate, retryOnError, maxRetries, onError, onSuccess]);

  // Função para refresh manual
  const refresh = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  // Função para invalidar cache
  const invalidate = useCallback(() => {
    apiCache.delete(key);
    fetchData(false);
  }, [key, fetchData]);

  // Setup do refresh automático
  useEffect(() => {
    if (refreshInterval && backgroundRefresh) {
      const setupRefresh = () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        refreshTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchData(true).then(() => {
              if (isMountedRef.current) {
                setupRefresh();
              }
            });
          }
        }, refreshInterval);
      };

      setupRefresh();

      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [refreshInterval, backgroundRefresh, fetchData]);

  // Fetch inicial
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    refresh,
    invalidate,
    isRefreshing: state.loading && state.data !== null
  };
}

/**
 * Hook para múltiplas requisições com cache inteligente
 */
export function useMultipleIntelligentCache<T extends Record<string, any>>(
  requests: Array<{
    key: string;
    fetcher: () => Promise<any>;
    options?: IntelligentCacheOptions;
  }>
) {
  const [state, setState] = useState({
    loading: true,
    error: null as Error | null,
    data: {} as T
  });

  // Use hooks for each request at the top level
  // Always call hooks unconditionally, but use dummy values for unused slots
  const result0 = useIntelligentCache(
    requests[0]?.key || 'dummy-0', 
    requests[0]?.fetcher || (() => Promise.resolve(null)), 
    requests[0]?.options || {}
  );
  const result1 = useIntelligentCache(
    requests[1]?.key || 'dummy-1', 
    requests[1]?.fetcher || (() => Promise.resolve(null)), 
    requests[1]?.options || {}
  );
  const result2 = useIntelligentCache(
    requests[2]?.key || 'dummy-2', 
    requests[2]?.fetcher || (() => Promise.resolve(null)), 
    requests[2]?.options || {}
  );
  const result3 = useIntelligentCache(
    requests[3]?.key || 'dummy-3', 
    requests[3]?.fetcher || (() => Promise.resolve(null)), 
    requests[3]?.options || {}
  );
  const result4 = useIntelligentCache(
    requests[4]?.key || 'dummy-4', 
    requests[4]?.fetcher || (() => Promise.resolve(null)), 
    requests[4]?.options || {}
  );

  const allResults = [result0, result1, result2, result3, result4];
  const results = allResults.slice(0, requests.length);

  useEffect(() => {
    const loading = results.some(result => result?.loading || false);
    const error = results.find(result => result?.error)?.error || null;
    const data = results.reduce((acc, result, index) => {
      const key = requests[index].key;
      if (result) {
        acc[key as keyof T] = result.data;
      }
      return acc;
    }, {} as T);

    setState({ loading, error, data });
  }, [results, requests]);

  const refreshAll = useCallback(async () => {
    return Promise.all(results.filter(Boolean).map(result => result!.refresh()));
  }, [results]);

  const invalidateAll = useCallback(() => {
    results.filter(Boolean).forEach(result => result!.invalidate());
  }, [results]);

  return {
    ...state,
    refreshAll,
    invalidateAll
  };
}

/**
 * Hook para cache com configurações pré-definidas
 */
export function usePresetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  preset: keyof typeof cacheConfigs,
  additionalOptions: Partial<IntelligentCacheOptions> = {}
) {
  const presetConfig = cacheConfigs[preset];
  const options = { ...presetConfig, ...additionalOptions };
  
  return useIntelligentCache(key, fetcher, options);
}

/**
 * Utilitários para gerenciamento de cache
 */
export const cacheHookUtils = {
  // Pré-aquecer cache com dados
  preload: <T>(key: string, data: T, options: CacheOptions = {}) => {
    apiCache.set(key, data, options);
  },
  
  // Verificar se dados estão em cache
  has: (key: string) => {
    const cached = apiCache.get(key);
    return cached !== null && !cached.isStale;
  },
  
  // Obter estatísticas do cache
  getStats: () => apiCache.getStats(),
  
  // Limpar cache por padrão de chave
  clearByPattern: (pattern: RegExp) => {
    const stats = apiCache.getStats();
    // Implementação simplificada - em produção seria mais eficiente
    apiCache.clear();
    return stats.size;
  }
};