/**
 * Hook para monitoramento e gerenciamento de Rate Limiting
 * Fornece informações sobre limites de taxa e status das requisições
 */

import { useState, useEffect, useCallback } from 'react';
import { useMonitoring } from './use-monitoring';

// Configuração de dados mock baseada na variável de ambiente
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

// Tipos para rate limiting
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitStatus {
  isLimited: boolean;
  info: RateLimitInfo | null;
  lastChecked: Date | null;
}

export interface RateLimitStats {
  totalRequests: number;
  limitedRequests: number;
  successRate: number;
  averageRetryAfter: number;
}

// Hook principal para rate limiting
export function useRateLimit(endpoint?: string) {
  const [status, setStatus] = useState<RateLimitStatus>({
    isLimited: false,
    info: null,
    lastChecked: null,
  });
  
  const [stats, setStats] = useState<RateLimitStats>({
    totalRequests: 0,
    limitedRequests: 0,
    successRate: 100,
    averageRetryAfter: 0,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { log } = useMonitoring({ componentName: 'RateLimit' });
  
  // Verifica status do rate limiting
  const checkRateLimit = useCallback(async (targetEndpoint?: string) => {
    const checkEndpoint = targetEndpoint || endpoint || '/api/rate-limit-example';
    setIsLoading(true);
    
    try {
      const response = await fetch(`${checkEndpoint}?action=status`);
      const data = await response.json();
      
      if (response.ok && data.rateLimitStatus) {
        const rateLimitInfo: RateLimitInfo = {
          limit: data.rateLimitStatus.totalHits + data.rateLimitStatus.remaining,
          remaining: data.rateLimitStatus.remaining,
          resetTime: data.rateLimitStatus.resetTime,
        };
        
        setStatus({
          isLimited: !data.rateLimitStatus.allowed,
          info: rateLimitInfo,
          lastChecked: new Date(),
        });
        
        log.info('Rate limit checked', {
          metadata: {
            endpoint: checkEndpoint,
            allowed: data.rateLimitStatus.allowed,
            remaining: data.rateLimitStatus.remaining,
          }
        });
      }
    } catch (error) {
      console.error('Error checking rate limit:', error);
      log.error('Rate limit check error', error instanceof Error ? error : new Error(String(error)), {
        metadata: { endpoint: checkEndpoint }
      });
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, log]);
  
  // Processa headers de rate limiting de uma resposta
  const processRateLimitHeaders = useCallback((headers: Headers) => {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    const retryAfter = headers.get('Retry-After');
    
    if (limit && remaining && reset) {
      const rateLimitInfo: RateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        resetTime: parseInt(reset),
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined,
      };
      
      setStatus({
        isLimited: parseInt(remaining) === 0,
        info: rateLimitInfo,
        lastChecked: new Date(),
      });
      
      // Atualiza estatísticas
      setStats(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        limitedRequests: parseInt(remaining) === 0 ? prev.limitedRequests + 1 : prev.limitedRequests,
        successRate: ((prev.totalRequests - prev.limitedRequests) / (prev.totalRequests + 1)) * 100,
        averageRetryAfter: retryAfter ? 
          (prev.averageRetryAfter + parseInt(retryAfter)) / 2 : 
          prev.averageRetryAfter,
      }));
    }
  }, []);
  
  // Calcula tempo restante até reset
  const getTimeUntilReset = useCallback(() => {
    if (!status.info?.resetTime) return 0;
    return Math.max(0, status.info.resetTime - Date.now());
  }, [status.info?.resetTime]);
  
  // Formata tempo restante
  const formatTimeUntilReset = useCallback(() => {
    const ms = getTimeUntilReset();
    const seconds = Math.ceil(ms / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.ceil(seconds / 60)}m`;
    } else {
      return `${Math.ceil(seconds / 3600)}h`;
    }
  }, [getTimeUntilReset]);
  
  // Reset estatísticas
  const resetStats = useCallback(() => {
    setStats({
      totalRequests: 0,
      limitedRequests: 0,
      successRate: 100,
      averageRetryAfter: 0,
    });
    log.info('Rate limit stats reset');
  }, [log]);
  
  return {
    status,
    stats,
    isLoading,
    checkRateLimit,
    processRateLimitHeaders,
    getTimeUntilReset,
    formatTimeUntilReset,
    resetStats,
  };
}

// Hook para fazer requisições com rate limiting automático
export function useRateLimitedFetch() {
  const { processRateLimitHeaders } = useRateLimit();
  const { log } = useMonitoring({ componentName: 'RateLimitedFetch' });
  
  const fetchWithRateLimit = useCallback(async (
    url: string,
    options?: RequestInit
  ): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      
      // Processa headers de rate limiting
      processRateLimitHeaders(response.headers);
      
      // Se rate limited, loga o evento
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        log.warn('Rate limit exceeded', {
          metadata: {
            url,
            retryAfter: retryAfter ? parseInt(retryAfter) : null,
          }
        });
      }
      
      return response;
      
    } catch (error) {
      log.error('Rate limited fetch error', error instanceof Error ? error : new Error(String(error)), {
        metadata: { url }
      });
      throw error;
    }
  }, [processRateLimitHeaders, log]);
  
  return { fetchWithRateLimit };
}

// Hook para retry automático com rate limiting
export function useRateLimitedRetry() {
  const { fetchWithRateLimit } = useRateLimitedFetch();
  const { log } = useMonitoring({ componentName: 'RateLimitedRetry' });
  
  const fetchWithRetry = useCallback(async (
    url: string,
    options?: RequestInit,
    maxRetries: number = 3
  ): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetchWithRateLimit(url, options);
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          
          if (attempt < maxRetries) {
            log.info('Rate limit retry waiting', {
              metadata: {
                url,
                attempt: attempt + 1,
                waitTime,
                retryAfter,
              }
            });
            
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        if (attempt > 0) {
          log.info('Rate limit retry success', {
            metadata: {
              url,
              attempts: attempt + 1,
            }
          });
        }
        
        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          log.error('Rate limit retry error', error instanceof Error ? error : new Error(String(error)), {
            metadata: {
              url,
              attempt: attempt + 1,
              waitTime,
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    log.error('Rate limit retry failed', lastError || new Error('Max retries exceeded'), {
      metadata: {
        url,
        maxRetries,
      }
    });
    
    throw lastError || new Error('Max retries exceeded');
  }, [fetchWithRateLimit, log]);
  
  return { fetchWithRetry };
}

// Hook para monitoramento global de rate limiting
export function useGlobalRateLimit() {
  const [globalStats, setGlobalStats] = useState({
    activeEndpoints: 0,
    totalLimitedRequests: 0,
    averageSuccessRate: 100,
  });
  
  const { log } = useMonitoring({ componentName: 'GlobalRateLimit' });
  
  // Busca estatísticas globais
  const fetchGlobalStats = useCallback(async () => {
    try {
      let statsData;
      
      if (USE_MOCK_DATA) {
        // Usando dados mock conforme configuração USE_MOCK_DATA
        statsData = {
          activeEndpoints: Math.floor(Math.random() * 10) + 5,
          totalLimitedRequests: Math.floor(Math.random() * 100),
          averageSuccessRate: 95 + Math.random() * 5,
        };
        log.info('Using mock global rate limit stats', { metadata: statsData });
      } else {
        // Busca dados reais da API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rate-limit/global-stats`);
        
        if (response.ok) {
          statsData = await response.json();
          log.info('Real global rate limit stats fetched', { metadata: statsData });
        } else {
          // Fallback para dados mock em caso de erro na API
          statsData = {
            activeEndpoints: 0,
            totalLimitedRequests: 0,
            averageSuccessRate: 100,
          };
          log.warn('API unavailable, using fallback stats', { metadata: { status: response.status } });
        }
      }
      
      setGlobalStats(statsData);
      
    } catch (error) {
      // Fallback para dados mock em caso de erro
      const fallbackStats = {
        activeEndpoints: 0,
        totalLimitedRequests: 0,
        averageSuccessRate: 100,
      };
      
      setGlobalStats(fallbackStats);
      log.error('Global rate limit stats error, using fallback', error instanceof Error ? error : new Error(String(error)));
    }
  }, [log]);
  
  // Atualiza estatísticas periodicamente
  useEffect(() => {
    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [fetchGlobalStats]);
  
  return {
    globalStats,
    fetchGlobalStats,
  };
}