'use client';

import { useCallback, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useUser } from '@/hooks/use-user';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface PerformanceMetrics {
  name: string;
  duration: number;
  metadata?: Record<string, any>;
}

export function useErrorMonitoring() {
  const { user } = useUser();

  // Configurar contexto do usuário
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  // Função para capturar erros
  const captureError = useCallback((error: Error, context?: ErrorContext) => {
    Sentry.withScope((scope) => {
      if (context?.component) {
        scope.setTag('component', context.component);
      }
      
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      
      if (context?.metadata) {
        scope.setContext('metadata', context.metadata);
      }
      
      scope.setLevel('error');
      Sentry.captureException(error);
    });
  }, []);

  // Função para capturar mensagens
  const captureMessage = useCallback((message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) => {
    Sentry.withScope((scope) => {
      if (context?.component) {
        scope.setTag('component', context.component);
      }
      
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      
      if (context?.metadata) {
        scope.setContext('metadata', context.metadata);
      }
      
      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  }, []);

  // Função para medir performance
  const measurePerformance = useCallback((metrics: PerformanceMetrics) => {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${metrics.name}: ${metrics.duration}ms`,
      level: 'info',
      data: {
        duration: metrics.duration,
        ...metrics.metadata,
      },
    });
  }, []);

  // Função para adicionar breadcrumb personalizado
  const addBreadcrumb = useCallback((message: string, category: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
    });
  }, []);

  // Função para definir contexto
  const setContext = useCallback((key: string, context: Record<string, any>) => {
    Sentry.setContext(key, context);
  }, []);

  // Função para definir tags
  const setTag = useCallback((key: string, value: string) => {
    Sentry.setTag(key, value);
  }, []);

  return {
    captureError,
    captureMessage,
    measurePerformance,
    addBreadcrumb,
    setContext,
    setTag,
  };
}

// Hook para monitoramento de performance de componentes
export function useComponentPerformance(componentName: string) {
  const { measurePerformance } = useErrorMonitoring();

  const startTime = useCallback(() => {
    return performance.now();
  }, []);

  const endTime = useCallback((start: number, action?: string) => {
    const duration = performance.now() - start;
    measurePerformance({
      name: `${componentName}${action ? `.${action}` : ''}`,
      duration,
      metadata: {
        component: componentName,
        action,
      },
    });
  }, [componentName, measurePerformance]);

  return { startTime, endTime };
}

// Hook para monitoramento de API calls
export function useApiMonitoring() {
  const { captureError, addBreadcrumb, measurePerformance } = useErrorMonitoring();

  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> => {
    const startTime = performance.now();
    
    addBreadcrumb(`API Call: ${method} ${endpoint}`, 'http', {
      method,
      endpoint,
    });

    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      measurePerformance({
        name: `api.${method.toLowerCase()}.${endpoint.replace(/\//g, '.')}`,
        duration,
        metadata: {
          endpoint,
          method,
          success: true,
        },
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      measurePerformance({
        name: `api.${method.toLowerCase()}.${endpoint.replace(/\//g, '.')}`,
        duration,
        metadata: {
          endpoint,
          method,
          success: false,
        },
      });
      
      captureError(error as Error, {
        component: 'ApiClient',
        action: `${method} ${endpoint}`,
        metadata: {
          endpoint,
          method,
          duration,
        },
      });
      
      throw error;
    }
  }, [captureError, addBreadcrumb, measurePerformance]);

  return { trackApiCall };
}