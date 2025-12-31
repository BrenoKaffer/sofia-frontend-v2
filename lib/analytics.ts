/**
 * Sistema de Analytics e Métricas Avançado
 * Coleta, processa e analisa dados de uso da aplicação
 */

import { logger } from './logger';
import { RedisCache } from './redis';

// Tipos de eventos de analytics
export type AnalyticsEventType = 
  | 'page_view'
  | 'user_action'
  | 'api_call'
  | 'error'
  | 'performance'
  | 'business_metric'
  | 'user_engagement'
  | 'conversion';

// Interface para eventos de analytics
export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  name: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  metadata: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    url?: string;
    device?: string;
    browser?: string;
    os?: string;
  };
}

// Métricas de performance
export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  memoryUsage?: number;
  connectionType?: string;
}

// Métricas de negócio
export interface BusinessMetrics {
  signalAccuracy: number;
  profitLoss: number;
  winRate: number;
  totalBets: number;
  averageBetAmount: number;
  sessionDuration: number;
  strategiesUsed: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// Métricas de engajamento
export interface EngagementMetrics {
  timeOnPage: number;
  scrollDepth: number;
  clicksPerSession: number;
  pagesPerSession: number;
  bounceRate: number;
  returnVisitor: boolean;
  featureUsage: Record<string, number>;
}

// Configuração de analytics
export interface AnalyticsConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, porcentagem de eventos para coletar
  batchSize: number;
  flushInterval: number; // ms
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableUserTracking: boolean;
  enableBusinessMetrics: boolean;
}

// Classe principal de Analytics
export class AnalyticsService {
  private config: AnalyticsConfig;
  private cache: RedisCache;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  
  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      batchSize: 50,
      flushInterval: 30000, // 30 segundos
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableUserTracking: true,
      enableBusinessMetrics: true,
      ...config,
    };
    
    this.cache = new RedisCache();
    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }
  
  // Gera ID único para sessão
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Verifica se deve coletar o evento (sampling)
  private shouldCollect(): boolean {
    return Math.random() <= this.config.sampleRate;
  }
  
  // Detecta informações do dispositivo/browser
  private getDeviceInfo(): Partial<AnalyticsEvent['metadata']> {
    if (typeof window === 'undefined') return {};
    
    const userAgent = navigator.userAgent;
    
    return {
      userAgent,
      url: window.location.href,
      referrer: document.referrer,
      device: this.detectDevice(userAgent),
      browser: this.detectBrowser(userAgent),
      os: this.detectOS(userAgent),
    };
  }
  
  private detectDevice(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
    if (/Tablet/.test(userAgent)) return 'tablet';
    return 'desktop';
  }
  
  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    return 'unknown';
  }
  
  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'windows';
    if (userAgent.includes('Mac')) return 'macos';
    if (userAgent.includes('Linux')) return 'linux';
    if (userAgent.includes('Android')) return 'android';
    if (userAgent.includes('iOS')) return 'ios';
    return 'unknown';
  }
  
  // Registra um evento de analytics
  track(type: AnalyticsEventType, name: string, properties: Record<string, any> = {}, userId?: string): void {
    if (!this.config.enabled || !this.shouldCollect()) return;
    
    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name,
      timestamp: Date.now(),
      userId,
      sessionId: this.sessionId,
      properties,
      metadata: this.getDeviceInfo(),
    };
    
    this.eventQueue.push(event);
    
    // Log do evento
    logger.info('Analytics event tracked', {
      userId,
      sessionId: this.sessionId,
      metadata: {
        type,
        name,
        properties,
      },
    });
    
    // Flush se atingiu o tamanho do batch
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }
  
  // Registra visualização de página
  trackPageView(page: string, userId?: string, additionalProps: Record<string, any> = {}): void {
    this.track('page_view', 'page_viewed', {
      page,
      timestamp: Date.now(),
      ...additionalProps,
    }, userId);
  }
  
  // Registra ação do usuário
  trackUserAction(action: string, target: string, userId?: string, additionalProps: Record<string, any> = {}): void {
    this.track('user_action', action, {
      target,
      timestamp: Date.now(),
      ...additionalProps,
    }, userId);
  }
  
  // Registra chamada de API
  trackApiCall(endpoint: string, method: string, statusCode: number, duration: number, userId?: string): void {
    this.track('api_call', 'api_request', {
      endpoint,
      method,
      statusCode,
      duration,
      success: statusCode >= 200 && statusCode < 300,
      timestamp: Date.now(),
    }, userId);
  }
  
  // Registra erro
  trackError(error: Error, context: string, userId?: string, additionalProps: Record<string, any> = {}): void {
    this.track('error', 'error_occurred', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      ...additionalProps,
    }, userId);
  }
  
  // Registra métricas de performance
  trackPerformance(metrics: PerformanceMetrics, userId?: string): void {
    if (!this.config.enablePerformanceTracking) return;
    
    this.track('performance', 'performance_metrics', {
      ...metrics,
      timestamp: Date.now(),
    }, userId);
  }
  
  // Registra métricas de negócio
  trackBusinessMetrics(metrics: BusinessMetrics, userId?: string): void {
    if (!this.config.enableBusinessMetrics) return;
    
    this.track('business_metric', 'business_metrics', {
      ...metrics,
      timestamp: Date.now(),
    }, userId);
  }
  
  // Registra métricas de engajamento
  trackEngagement(metrics: EngagementMetrics, userId?: string): void {
    this.track('user_engagement', 'engagement_metrics', {
      ...metrics,
      timestamp: Date.now(),
    }, userId);
  }
  
  // Registra conversão
  trackConversion(type: string, value: number, currency: string = 'BRL', userId?: string, additionalProps: Record<string, any> = {}): void {
    this.track('conversion', 'conversion_completed', {
      conversionType: type,
      value,
      currency,
      timestamp: Date.now(),
      ...additionalProps,
    }, userId);
  }
  
  // Flush eventos para armazenamento
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      // Salva eventos no Redis
      const key = `analytics:events:${Date.now()}`;
      await this.cache.set(key, JSON.stringify(events), 86400); // 24 horas
      
      // Atualiza métricas agregadas
      await this.updateAggregatedMetrics(events);
      
      logger.info('Analytics events flushed', {
        metadata: {
          eventCount: events.length,
          key,
        },
      });
      
    } catch (error) {
      logger.error('Failed to flush analytics events', {
        metadata: {
          eventCount: events.length,
        },
      }, error as Error);
      
      // Recoloca eventos na fila em caso de erro
      this.eventQueue.unshift(...events);
    }
  }
  
  // Atualiza métricas agregadas
  private async updateAggregatedMetrics(events: AnalyticsEvent[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    for (const event of events) {
      const metricKey = `analytics:metrics:${today}:${event.type}`;
      
      try {
        // Incrementa contador do tipo de evento
        const currentCount = await this.cache.get(metricKey) || '0';
        await this.cache.set(metricKey, (parseInt(currentCount) + 1).toString(), 86400);
        
        // Atualiza métricas específicas por tipo
        await this.updateSpecificMetrics(event, today);
        
      } catch (error) {
        logger.error('Failed to update aggregated metrics', {
          metadata: {
            eventType: event.type,
          },
        }, error as Error);
      }
    }
  }
  
  // Atualiza métricas específicas por tipo de evento
  private async updateSpecificMetrics(event: AnalyticsEvent, date: string): Promise<void> {
    switch (event.type) {
      case 'page_view':
        await this.updatePageViewMetrics(event, date);
        break;
      case 'api_call':
        await this.updateApiMetrics(event, date);
        break;
      case 'business_metric':
        await this.updateBusinessMetricsAggregation(event, date);
        break;
      case 'performance':
        await this.updatePerformanceMetrics(event, date);
        break;
    }
  }
  
  private async updatePageViewMetrics(event: AnalyticsEvent, date: string): Promise<void> {
    const pageKey = `analytics:pages:${date}:${event.properties.page}`;
    const currentViews = await this.cache.get(pageKey) || '0';
    await this.cache.set(pageKey, (parseInt(currentViews) + 1).toString(), 86400);
  }
  
  private async updateApiMetrics(event: AnalyticsEvent, date: string): Promise<void> {
    const endpointKey = `analytics:api:${date}:${event.properties.endpoint}`;
    const currentCalls = await this.cache.get(endpointKey) || '0';
    await this.cache.set(endpointKey, (parseInt(currentCalls) + 1).toString(), 86400);
    
    // Atualiza métricas de erro se aplicável
    if (!event.properties.success) {
      const errorKey = `analytics:api_errors:${date}:${event.properties.endpoint}`;
      const currentErrors = await this.cache.get(errorKey) || '0';
      await this.cache.set(errorKey, (parseInt(currentErrors) + 1).toString(), 86400);
    }
  }
  
  private async updateBusinessMetricsAggregation(event: AnalyticsEvent, date: string): Promise<void> {
    const metricsKey = `analytics:business:${date}`;
    const existingMetrics = await this.cache.get(metricsKey);
    
    let aggregated = {
      totalProfit: 0,
      totalBets: 0,
      totalWins: 0,
      count: 0,
    };
    
    if (existingMetrics) {
      aggregated = JSON.parse(existingMetrics);
    }
    
    aggregated.totalProfit += event.properties.profitLoss || 0;
    aggregated.totalBets += event.properties.totalBets || 0;
    aggregated.totalWins += (event.properties.winRate || 0) * (event.properties.totalBets || 0) / 100;
    aggregated.count += 1;
    
    await this.cache.set(metricsKey, JSON.stringify(aggregated), 86400);
  }
  
  private async updatePerformanceMetrics(event: AnalyticsEvent, date: string): Promise<void> {
    const perfKey = `analytics:performance:${date}`;
    const existingPerf = await this.cache.get(perfKey);
    
    let aggregated = {
      avgPageLoadTime: 0,
      avgFCP: 0,
      avgLCP: 0,
      count: 0,
    };
    
    if (existingPerf) {
      aggregated = JSON.parse(existingPerf);
    }
    
    const count = aggregated.count + 1;
    aggregated.avgPageLoadTime = (aggregated.avgPageLoadTime * aggregated.count + (event.properties.pageLoadTime || 0)) / count;
    aggregated.avgFCP = (aggregated.avgFCP * aggregated.count + (event.properties.firstContentfulPaint || 0)) / count;
    aggregated.avgLCP = (aggregated.avgLCP * aggregated.count + (event.properties.largestContentfulPaint || 0)) / count;
    aggregated.count = count;
    
    await this.cache.set(perfKey, JSON.stringify(aggregated), 86400);
  }
  
  // Inicia timer para flush automático
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }
  
  // Para o serviço de analytics
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Flush final
    this.flush();
  }
  
  // Obtém métricas agregadas
  async getMetrics(date?: string): Promise<Record<string, any>> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Implementação alternativa já que getKeysByPattern não existe
      const pattern = `analytics:metrics:${targetDate}:*`;
      const keys: string[] = [];
      
      // Para RedisCache, precisamos implementar uma busca manual
      // Como não temos acesso direto ao método keys, vamos tentar buscar métricas conhecidas
      const metricTypes = ['page_views', 'api_calls', 'errors', 'performance', 'business', 'engagement', 'conversions'];
      for (const type of metricTypes) {
        const key = `analytics:metrics:${targetDate}:${type}`;
        const exists = await this.cache.exists(key);
        if (exists) {
          keys.push(key);
        }
      }
      
      const metrics: Record<string, any> = {};
      
      for (const key of keys) {
        const value = await this.cache.get(key);
        const metricType = key.split(':').pop();
        if (metricType && value) {
          metrics[metricType] = parseInt(value);
        }
      }
      
      return metrics;
      
    } catch (error) {
      logger.error('Failed to get analytics metrics', { metadata: { date: targetDate } }, error as Error);
      return {};
    }
  }
  
  // Obtém estatísticas de páginas
  async getPageStats(date?: string): Promise<Record<string, number>> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Implementação alternativa já que getKeysByPattern não existe
      const keys: string[] = [];
      const stats: Record<string, number> = {};
      
      // Buscar páginas conhecidas - você pode expandir esta lista conforme necessário
      const commonPages = ['/', '/dashboard', '/strategies', '/history', '/settings', '/analytics', '/monitoring'];
      for (const page of commonPages) {
        const key = `analytics:pages:${targetDate}:${page.replace('/', 'home')}`;
        const exists = await this.cache.exists(key);
        if (exists) {
          keys.push(key);
        }
      }
      
      for (const key of keys) {
        const value = await this.cache.get(key);
        const page = key.split(':').slice(3).join(':');
        if (page && value) {
          stats[page] = parseInt(value);
        }
      }
      
      return stats;
      
    } catch (error) {
      logger.error('Failed to get page stats', { metadata: { date: targetDate } }, error as Error);
      return {};
    }
  }
}

// Instância global do serviço de analytics
export const analytics = new AnalyticsService({
  enabled: process.env.NODE_ENV === 'production' || process.env.ANALYTICS_ENABLED === 'true',
  sampleRate: parseFloat(process.env.ANALYTICS_SAMPLE_RATE || '1.0'),
  batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '50'),
  flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || '30000'),
});

// Cleanup ao sair da aplicação
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    analytics.stop();
  });
}