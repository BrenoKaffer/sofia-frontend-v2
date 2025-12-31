/**
 * Sistema de monitoramento e métricas para o SOFIA
 * Coleta métricas de performance, erros e uso da aplicação
 */

import { logger } from './logger';
import React from 'react';

// Interfaces para tipagem
interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: string;
  context?: Record<string, any>;
}
export interface ErrorMetric {
  type: string;
  message: string;
  stack?: string;
  timestamp: string;
  context?: Record<string, any>;
}

export interface UsageMetric {
  event: string;
  component: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private performanceMetrics: PerformanceMetric[] = [];
  private errorMetrics: ErrorMetric[] = [];
  private usageMetrics: UsageMetric[] = [];
  private maxMetrics = 500;
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = process.env.NEXT_PUBLIC_ENV === 'development' || 
                    process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true';
    
    if (typeof window !== 'undefined') {
      this.setupPerformanceObserver();
      this.setupErrorHandling();
      this.setupWebVitals();
      this.setupPeriodicFlush();
    }
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformance(
            entry.name,
            entry.duration,
            'ms',
            { type: entry.entryType }
          );
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
    }
  }

  private setupErrorHandling(): void {
    if (!this.isEnabled) return;

    window.addEventListener('error', (event) => {
      this.recordError('javascript', event.message, event.error?.stack, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('promise', event.reason?.message || 'Unhandled promise rejection', 
        event.reason?.stack, {
          reason: event.reason
        });
    });
  }

  private setupWebVitals(): void {
    if (!this.isEnabled) return;

    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordPerformance('web_vitals_fcp', entry.startTime, 'ms');
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordPerformance('web_vitals_lcp', lastEntry.startTime, 'ms');
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        this.recordPerformance('web_vitals_fid', fid, 'ms');
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.recordPerformance('web_vitals_cls', clsValue, 'count');
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private setupPeriodicFlush(): void {
    if (!this.isEnabled) return;

    // Flush métricas a cada 30 segundos
    setInterval(() => {
      this.flushMetrics();
    }, 30000);

    // Flush ao sair da página
    window.addEventListener('beforeunload', () => {
      this.flushMetrics(true);
    });
  }

  private async flushMetrics(isBeforeUnload = false): Promise<void> {
    if (!this.isEnabled) return;

    const payload = {
      performance: this.performanceMetrics,
      errors: this.errorMetrics,
      usage: this.usageMetrics,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    try {
      if (isBeforeUnload && 'sendBeacon' in navigator) {
        navigator.sendBeacon('/api/metrics', JSON.stringify(payload));
      } else {
        await fetch('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      
      // Limpar métricas após envio
      this.clearMetrics();
    } catch (error) {
      logger.error('Erro ao enviar métricas:', undefined, error as Error);
    }
  }

  public recordPerformance(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' | 'percentage',
    context?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context
    };

    this.performanceMetrics.push(metric);
    this.trimMetrics(this.performanceMetrics);

    logger.performance(`Performance: ${name} = ${value}${unit}`, 'Monitoring', value, context);
  }

  public recordError(
    type: string,
    message: string,
    stack?: string,
    context?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const metric: ErrorMetric = {
      type,
      message,
      stack,
      timestamp: new Date().toISOString(),
      context
    };

    this.errorMetrics.push(metric);
    this.trimMetrics(this.errorMetrics);

    logger.error(`Error: ${type} - ${message}`, {
      component: 'Monitoring',
      action: 'ERROR_RECORDED',
      metadata: context
    }, new Error(message));
  }

  public recordUsage(
    event: string,
    component: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;

    const metric: UsageMetric = {
      event,
      component,
      timestamp: new Date().toISOString(),
      userId,
      metadata
    };

    this.usageMetrics.push(metric);
    this.trimMetrics(this.usageMetrics);

    logger.userAction(`Usage: ${event}`, event, userId, { component, ...metadata });
  }

  private trimMetrics(metrics: any[]): void {
    if (metrics.length > this.maxMetrics) {
      metrics.splice(0, metrics.length - this.maxMetrics);
    }
  }

  // Métodos de conveniência para métricas específicas
  public recordApiCall(endpoint: string, duration: number, success: boolean): void {
    this.recordPerformance(
      `API Call: ${endpoint}`,
      duration,
      'ms',
      { endpoint, success }
    );
  }

  public recordPageLoad(page: string, duration: number): void {
    this.recordPerformance(
      `Page Load: ${page}`,
      duration,
      'ms',
      { page }
    );
  }

  public recordComponentRender(component: string, duration: number): void {
    this.recordPerformance(
      `Component Render: ${component}`,
      duration,
      'ms',
      { component }
    );
  }

  public recordUserInteraction(action: string, component: string, userId?: string): void {
    this.recordUsage(action, component, userId);
  }

  // Métodos para obter métricas
  public getPerformanceMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.performanceMetrics.filter(m => m.name.includes(name));
    }
    return [...this.performanceMetrics];
  }

  public getErrorMetrics(type?: string): ErrorMetric[] {
    if (type) {
      return this.errorMetrics.filter(m => m.type === type);
    }
    return [...this.errorMetrics];
  }

  public getUsageMetrics(component?: string): UsageMetric[] {
    if (component) {
      return this.usageMetrics.filter(m => m.component === component);
    }
    return [...this.usageMetrics];
  }

  // Análise de métricas
  public getAveragePerformance(name: string): number {
    const metrics = this.getPerformanceMetrics(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  public getErrorRate(timeWindow: number = 3600000): number { // 1 hora por padrão
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    const recentErrors = this.errorMetrics.filter(
      m => new Date(m.timestamp).getTime() >= windowStart
    );
    
    const recentUsage = this.usageMetrics.filter(
      m => new Date(m.timestamp).getTime() >= windowStart
    );
    
    if (recentUsage.length === 0) return 0;
    return (recentErrors.length / recentUsage.length) * 100;
  }

  public clearMetrics(): void {
    this.performanceMetrics = [];
    this.errorMetrics = [];
    this.usageMetrics = [];
  }

  public exportMetrics(): {
    performance: PerformanceMetric[];
    errors: ErrorMetric[];
    usage: UsageMetric[];
  } {
    return {
      performance: this.getPerformanceMetrics(),
      errors: this.getErrorMetrics(),
      usage: this.getUsageMetrics()
    };
  }
}

// Hook para medir performance de componentes React
export function usePerformanceMonitoring(componentName: string) {
  const monitoring = getMonitoringService();
  
  const measureRender = () => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      monitoring.recordComponentRender(componentName, duration);
    };
  };
  
  const recordInteraction = (action: string, userId?: string) => {
    monitoring.recordUserInteraction(action, componentName, userId);
  };
  
  return { measureRender, recordInteraction };
}

// Hook para usar o monitoramento em componentes React
export function useMonitoring() {
  return {
    trackEvent: (event: string, component: string, metadata?: Record<string, any>) => {
      getMonitoringService().recordUsage(event, component, undefined, metadata);
    },
    trackError: (error: Error, context?: Record<string, any>) => {
      getMonitoringService().recordError('javascript', error.message, error.stack, context);
    },
    trackPerformance: (name: string, value: number, unit: 'ms' | 'bytes' | 'count' | 'percentage' = 'ms', context?: Record<string, any>) => {
      getMonitoringService().recordPerformance(name, value, unit, context);
    },
    startTimer: (name: string) => {
      const start = performance.now();
      return () => {
        const duration = performance.now() - start;
        getMonitoringService().recordPerformance(name, duration, 'ms');
      };
    },
  };
}

// Função para obter a instância singleton do serviço de monitoramento
export function getMonitoringService(): MonitoringService {
  return MonitoringService.getInstance();
}