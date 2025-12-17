/**
 * Hook personalizado para integração do sistema de monitoramento e logging
 * Facilita o uso nos componentes React
 */

import { useEffect, useCallback, useRef } from 'react';
import { logger, LogContext } from '../lib/logger';
import { getMonitoringService, usePerformanceMonitoring } from '../lib/monitoring';
import { useUser } from '@/hooks/use-user';

export interface UseMonitoringOptions {
  componentName: string;
  autoTrackRender?: boolean;
  autoTrackMount?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export function useMonitoring(options: UseMonitoringOptions) {
  const { componentName, autoTrackRender = true, autoTrackMount = true } = options;
  const { user } = useUser();
  const monitoring = getMonitoringService();
  const mountTimeRef = useRef<number>(Date.now());
  const { measureRender, recordInteraction } = usePerformanceMonitoring(componentName);

  // Context padrão para logs
  const getLogContext = useCallback((additionalContext?: Partial<LogContext>): LogContext => {
    return {
      component: componentName,
      userId: user?.id,
      sessionId: user?.id ? `session_${user.id}_${Date.now()}` : undefined,
      ...additionalContext
    };
  }, [componentName, user?.id]);

  // Tracking automático de mount/unmount
  useEffect(() => {
    if (autoTrackMount) {
      mountTimeRef.current = performance.now();
      
      logger.debug(`Component mounted: ${componentName}`, getLogContext({
        action: 'COMPONENT_MOUNT'
      }));
      
      monitoring.recordUsage('component_mount', componentName, user?.id);
    }

    return () => {
      if (autoTrackMount && mountTimeRef.current) {
        const mountDuration = performance.now() - mountTimeRef.current;
        
        logger.debug(`Component unmounted: ${componentName}`, getLogContext({
          action: 'COMPONENT_UNMOUNT',
          metadata: { mountDuration }
        }));
        
        monitoring.recordPerformance(
          `Component Lifetime: ${componentName}`,
          mountDuration,
          'ms',
          { component: componentName }
        );
      }
    };
  }, [componentName, autoTrackMount, getLogContext, user?.id]);

  // Métodos de logging com context automático
  const log = {
    debug: useCallback((message: string, additionalContext?: Partial<LogContext>) => {
      logger.debug(message, getLogContext(additionalContext));
    }, [getLogContext]),

    info: useCallback((message: string, additionalContext?: Partial<LogContext>) => {
      logger.info(message, getLogContext(additionalContext));
    }, [getLogContext]),

    warn: useCallback((message: string, additionalContext?: Partial<LogContext>) => {
      logger.warn(message, getLogContext(additionalContext));
    }, [getLogContext]),

    error: useCallback((message: string, error?: Error, additionalContext?: Partial<LogContext>) => {
      logger.error(message, getLogContext(additionalContext), error);
      monitoring.recordError(
        'Component Error',
        message,
        error?.stack,
        { component: componentName, ...additionalContext?.metadata }
      );
    }, [getLogContext, componentName])
  };

  // Métodos de monitoramento
  const track = {
    userAction: useCallback((action: string, metadata?: Record<string, any>) => {
      recordInteraction(action, user?.id);
      log.info(`User action: ${action}`, {
        action,
        metadata
      });
    }, [recordInteraction, user?.id, log]),

    apiCall: useCallback((endpoint: string, method: string = 'GET') => {
      const startTime = performance.now();
      
      log.debug(`API call started: ${method} ${endpoint}`, {
        action: 'API_CALL_START',
        metadata: { endpoint, method }
      });
      
      return {
        success: (data?: any) => {
          const duration = performance.now() - startTime;
          monitoring.recordApiCall(endpoint, duration, true);
          log.info(`API call successful: ${method} ${endpoint}`, {
            action: 'API_CALL_SUCCESS',
            metadata: { endpoint, method, duration, dataSize: JSON.stringify(data || {}).length }
          });
        },
        error: (error: Error) => {
          const duration = performance.now() - startTime;
          monitoring.recordApiCall(endpoint, duration, false);
          log.error(`API call failed: ${method} ${endpoint}`, error, {
            action: 'API_CALL_ERROR',
            metadata: { endpoint, method, duration }
          });
        }
      };
    }, [log]),

    performance: useCallback((name: string, value: number, unit: 'ms' | 'bytes' | 'count' | 'percentage', metadata?: Record<string, any>) => {
      monitoring.recordPerformance(name, value, unit, {
        component: componentName,
        ...metadata
      });
      log.debug(`Performance metric: ${name} = ${value}${unit}`, {
        action: 'PERFORMANCE_METRIC',
        metadata: { name, value, unit, ...metadata }
      });
    }, [componentName, log]),

    render: useCallback(() => {
      if (autoTrackRender) {
        return measureRender();
      }
      return () => {};
    }, [autoTrackRender, measureRender])
  };

  // Utilitários para debugging
  const debug = {
    getMetrics: useCallback(() => {
      return {
        performance: monitoring.getPerformanceMetrics(componentName),
        errors: monitoring.getErrorMetrics(),
        usage: monitoring.getUsageMetrics(componentName)
      };
    }, [componentName]),

    getLogs: useCallback(() => {
      return logger.getLogs();
    }, []),

    exportData: useCallback(() => {
      return {
        metrics: monitoring.exportMetrics(),
        logs: logger.getLogs(),
        component: componentName,
        timestamp: new Date().toISOString()
      };
    }, [componentName])
  };

  return {
    log,
    track,
    debug,
    componentName,
    userId: user?.id
  };
}

// Hook específico para tracking de formulários
export function useFormMonitoring(formName: string) {
  const { log, track } = useMonitoring({ componentName: `Form_${formName}` });
  
  const trackFormEvent = useCallback((event: 'start' | 'submit' | 'error' | 'abandon', metadata?: Record<string, any>) => {
    track.userAction(`form_${event}`, {
      formName,
      ...metadata
    });
  }, [track, formName]);
  
  const trackFieldInteraction = useCallback((fieldName: string, action: 'focus' | 'blur' | 'change') => {
    track.userAction(`field_${action}`, {
      formName,
      fieldName
    });
  }, [track, formName]);
  
  return {
    log,
    trackFormEvent,
    trackFieldInteraction
  };
}

// Hook específico para tracking de páginas
export function usePageMonitoring(pageName: string) {
  const { log, track } = useMonitoring({ 
    componentName: `Page_${pageName}`,
    autoTrackMount: true,
    autoTrackRender: false
  });
  
  useEffect(() => {
    const startTime = performance.now();
    
    // Track page view
    track.userAction('page_view', { pageName });
    
    return () => {
      const duration = performance.now() - startTime;
      track.performance('page_load', duration, 'ms', { pageName });
    };
  }, [pageName, track]);
  
  const trackNavigation = useCallback((destination: string, method: 'click' | 'programmatic' = 'click') => {
    track.userAction('navigation', {
      from: pageName,
      to: destination,
      method
    });
  }, [track, pageName]);
  
  return {
    log,
    track,
    trackNavigation
  };
}