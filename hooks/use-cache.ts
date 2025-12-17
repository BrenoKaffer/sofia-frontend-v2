/**
 * Hook personalizado para integração com sistema de cache Redis
 * Facilita o uso de cache em componentes React com estado reativo
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { redisCache, cacheUtils, CACHE_TTL, CACHE_KEYS } from '../lib/redis';
import { useMonitoring } from './use-monitoring';

interface UseCacheOptions {
  ttl?: number;
  refreshInterval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

interface CacheState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  fromCache: boolean;
}

/**
 * Hook principal para cache com estado reativo
 */
export function useCache<T = any>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const {
    ttl = CACHE_TTL.MEDIUM,
    refreshInterval,
    enabled = true,
    onError,
    onSuccess
  } = options;

  const { log, track } = useMonitoring({ componentName: 'Cache' });
  const [state, setState] = useState<CacheState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    fromCache: false
  });

  const fetchFnRef = useRef(fetchFn);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Atualiza a referência da função de fetch
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const startTime = performance.now();
    
    try {
      let data: T | null = null;
      let fromCache = false;

      // Tenta buscar do cache primeiro, a menos que seja refresh forçado
      if (!forceRefresh) {
        data = await redisCache.get<T>(key);
        fromCache = data !== null;
      }

      // Se não encontrou no cache ou é refresh forçado, busca dados frescos
      if (data === null) {
        log.info('Cache miss, fetching fresh data', { metadata: { key } });
        data = await fetchFnRef.current();
        
        // Salva no cache
        await redisCache.set(key, data, ttl);
        fromCache = false;
      } else {
        log.debug('Cache hit', { metadata: { key } });
      }

      const endTime = performance.now();
      track.performance('cache_fetch', endTime - startTime, 'ms', {
        key,
        fromCache,
        cacheHit: fromCache
      });

      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        fromCache
      });

      onSuccess?.(data);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown cache error');
      
      log.error('Cache fetch failed', err, { 
        metadata: { key } 
      });
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: err
      }));
      
      onError?.(err);
    }
  }, [key, enabled, ttl, log, track, onError, onSuccess]);

  // Função para invalidar cache
  const invalidate = useCallback(async () => {
    log.info('Invalidating cache', { metadata: { key } });
    await redisCache.del(key);
    await fetchData(true);
  }, [key, fetchData, log]);

  // Função para atualizar dados sem invalidar cache
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Função para definir dados manualmente
  const setData = useCallback(async (newData: T) => {
    await redisCache.set(key, newData, ttl);
    setState(prev => ({
      ...prev,
      data: newData,
      lastUpdated: new Date(),
      fromCache: false
    }));
  }, [key, ttl]);

  // Efeito para buscar dados iniciais
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  // Efeito para refresh automático
  useEffect(() => {
    if (refreshInterval && enabled) {
      refreshTimeoutRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [refreshInterval, enabled, fetchData]);

  return {
    ...state,
    invalidate,
    refresh,
    setData,
    isStale: state.lastUpdated ? 
      (Date.now() - state.lastUpdated.getTime()) > (ttl * 1000) : false
  };
}

/**
 * Hook para cache de lista com paginação
 */
export function usePaginatedCache<T = any>(
  baseKey: string,
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  options: UseCacheOptions & { limit?: number } = {}
) {
  const { limit = 10, ...cacheOptions } = options;
  const [currentPage, setCurrentPage] = useState(1);
  
  const key = cacheUtils.key(baseKey, 'page', currentPage, 'limit', limit);
  
  const cacheResult = useCache(
    key,
    () => fetchFn(currentPage, limit),
    cacheOptions
  );

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (cacheResult.data && currentPage * limit < cacheResult.data.total) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, limit, cacheResult.data]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const invalidateAll = useCallback(async () => {
    await redisCache.delPattern(`${baseKey}:page:*`);
    await cacheResult.refresh();
  }, [baseKey, cacheResult]);

  return {
    ...cacheResult,
    currentPage,
    totalPages: cacheResult.data ? Math.ceil(cacheResult.data.total / limit) : 0,
    hasNextPage: cacheResult.data ? currentPage * limit < cacheResult.data.total : false,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    invalidateAll
  };
}

/**
 * Hook para cache de dados do usuário
 */
export function useUserCache<T = any>(
  userId: string,
  dataKey: string,
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const key = cacheUtils.key(CACHE_KEYS.USER, userId, dataKey);
  return useCache(key, fetchFn, { ttl: CACHE_TTL.LONG, ...options });
}

/**
 * Hook para cache de dados de API
 */
export function useApiCache<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const key = cacheUtils.key(CACHE_KEYS.API, endpoint, paramString);
  
  return useCache(key, fetchFn, { ttl: CACHE_TTL.MEDIUM, ...options });
}

/**
 * Hook para cache de sessão
 */
export function useSessionCache<T = any>(
  sessionId: string,
  dataKey: string,
  fetchFn: () => Promise<T>,
  options: UseCacheOptions = {}
) {
  const key = cacheUtils.key(CACHE_KEYS.SESSION, sessionId, dataKey);
  return useCache(key, fetchFn, { ttl: CACHE_TTL.SHORT, ...options });
}

/**
 * Hook para estatísticas do cache
 */
export function useCacheStats() {
  const { log } = useMonitoring({ componentName: 'CacheStats' });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const info = await redisCache.getInfo();
      setStats(info);
      log.debug('Cache stats fetched', { metadata: { stats: info } });
    } catch (error) {
      log.error('Failed to fetch cache stats', error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [log]);

  const clearCache = useCallback(async () => {
    try {
      await redisCache.flush();
      log.info('Cache cleared');
      await fetchStats(); // Atualiza stats após limpar
    } catch (error) {
      log.error('Failed to clear cache', error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [log, fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refresh: fetchStats,
    clearCache
  };
}

/**
 * Hook para invalidação de cache por tags
 */
export function useCacheInvalidation() {
  const { log } = useMonitoring({ componentName: 'CacheInvalidation' });

  const invalidateByTag = useCallback(async (tag: string) => {
    try {
      const count = await cacheUtils.invalidateByTag(tag);
      log.info('Cache invalidated by tag', { metadata: { tag, count } });
      return count;
    } catch (error) {
      log.error('Failed to invalidate cache by tag', error instanceof Error ? error : new Error('Unknown error'), { metadata: { tag } });
      return 0;
    }
  }, [log]);

  const invalidateByPattern = useCallback(async (pattern: string) => {
    try {
      const count = await redisCache.delPattern(pattern);
      log.info('Cache invalidated by pattern', { metadata: { pattern, count } });
      return count;
    } catch (error) {
      log.error('Failed to invalidate cache by pattern', error instanceof Error ? error : new Error('Unknown error'), { metadata: { pattern } });
      return 0;
    }
  }, [log]);

  return {
    invalidateByTag,
    invalidateByPattern
  };
}