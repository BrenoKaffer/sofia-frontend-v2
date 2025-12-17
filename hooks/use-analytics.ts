/**
 * Hooks React para Analytics
 * Facilita o uso do sistema de analytics em componentes React
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useUser } from '@/hooks/use-user';
import type { 
  AnalyticsEventType, 
  PerformanceMetrics, 
  BusinessMetrics, 
  EngagementMetrics 
} from '../lib/analytics';
import { 
  browserAnalytics, 
  capturePerformanceMetrics, 
  captureEngagementMetrics, 
  trackCustomEvent, 
  setupErrorTracking 
} from '../lib/analytics-client';
import { logger } from '../lib/logger';

// Interfaces específicas para substituir tipos 'any'
interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

interface PerformanceMemory {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

interface NavigatorConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface RealTimeMetrics {
  pageViews?: number;
  uniqueUsers?: number;
  bounceRate?: number;
  avgSessionDuration?: number;
  conversionRate?: number;
  pageStats?: Record<string, number>;
}

// Hook principal para analytics
export function useAnalytics() {
  const { user } = useUser();
  const userId = user?.id;
  
  // Função para rastrear eventos
  const track = useCallback((
    type: AnalyticsEventType,
    name: string,
    properties: AnalyticsProperties = {}
  ) => {
    browserAnalytics.track(type, name, properties, userId);
  }, [userId]);
  
  // Função para rastrear page view
  const trackPageView = useCallback((page: string, additionalProps: AnalyticsProperties = {}) => {
    browserAnalytics.trackPageView(page, userId, additionalProps);
  }, [userId]);
  
  // Função para rastrear ação do usuário
  const trackUserAction = useCallback((
    action: string, 
    target: string, 
    additionalProps: AnalyticsProperties = {}
  ) => {
    browserAnalytics.trackUserAction(action, target, userId, additionalProps);
  }, [userId]);
  
  // Função para rastrear erro
  const trackError = useCallback((
    error: Error, 
    context: string, 
    additionalProps: AnalyticsProperties = {}
  ) => {
    browserAnalytics.trackError(error, context, userId, additionalProps);
  }, [userId]);
  
  // Função para rastrear métricas de performance
  const trackPerformance = useCallback((metrics: PerformanceMetrics) => {
    browserAnalytics.trackPerformance(metrics, userId);
  }, [userId]);
  
  // Função para rastrear métricas de negócio
  const trackBusinessMetrics = useCallback((metrics: BusinessMetrics) => {
    browserAnalytics.trackBusinessMetrics(metrics, userId);
  }, [userId]);
  
  // Função para rastrear engajamento
  const trackEngagement = useCallback((metrics: EngagementMetrics) => {
    browserAnalytics.trackEngagement(metrics, userId);
  }, [userId]);
  
  // Função para rastrear conversão
  const trackConversion = useCallback((
    type: string, 
    value: number, 
    currency: string = 'BRL', 
    additionalProps: AnalyticsProperties = {}
  ) => {
    browserAnalytics.trackConversion(type, value, currency, userId, additionalProps);
  }, [userId]);
  
  return {
    track,
    trackPageView,
    trackUserAction,
    trackError,
    trackPerformance,
    trackBusinessMetrics,
    trackEngagement,
    trackConversion,
    userId,
  };
}

// Hook para rastreamento automático de page view
export function usePageTracking(pageName?: string) {
  const { trackPageView } = useAnalytics();
  const hasTracked = useRef(false);
  
  useEffect(() => {
    if (!hasTracked.current) {
      const page = pageName || window.location.pathname;
      trackPageView(page, {
        referrer: document.referrer,
        timestamp: Date.now(),
      });
      hasTracked.current = true;
    }
  }, [trackPageView, pageName]);
}

// Hook para rastreamento de performance
export function usePerformanceTracking() {
  const { trackPerformance, userId } = useAnalytics();
  const hasTracked = useRef(false);
  
  useEffect(() => {
    if (!hasTracked.current && typeof window !== 'undefined') {
      capturePerformanceMetrics(userId);
      hasTracked.current = true;
    }
  }, [userId]);
  
  // Função manual para capturar métricas específicas
  const captureMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics: PerformanceMetrics = {
        pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: 0, // Será preenchido pelo observer
        largestContentfulPaint: 0, // Será preenchido pelo observer
        cumulativeLayoutShift: 0, // Será preenchido pelo observer
        firstInputDelay: 0, // Será preenchido pelo observer
        timeToInteractive: navigation.domInteractive - (navigation.fetchStart || 0),
        memoryUsage: (performance as Performance & { memory?: PerformanceMemory }).memory?.usedJSHeapSize,
        connectionType: (navigator as Navigator & { connection?: NavigatorConnection }).connection?.effectiveType,
      };
      
      trackPerformance(metrics);
    } catch (error) {
      logger.error('Failed to capture performance metrics manually', { metadata: { error } });
    }
  }, [trackPerformance]);
  
  return { captureMetrics };
}

// Hook para rastreamento de engajamento
export function useEngagementTracking() {
  const { trackEngagement, userId } = useAnalytics();
  const startTime = useRef(Date.now());
  const scrollDepth = useRef(0);
  const clickCount = useRef(0);
  const maxScrollDepth = useRef(0);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollDepth.current = Math.round((scrollTop / docHeight) * 100);
      maxScrollDepth.current = Math.max(maxScrollDepth.current, scrollDepth.current);
    };
    
    const handleClick = () => {
      clickCount.current++;
    };
    
    const sendMetrics = () => {
      const timeOnPage = Date.now() - startTime.current;
      
      trackEngagement({
        timeOnPage,
        scrollDepth: maxScrollDepth.current,
        clicksPerSession: clickCount.current,
        pagesPerSession: 1,
        bounceRate: 0,
        returnVisitor: false,
        featureUsage: {},
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleClick);
    window.addEventListener('beforeunload', sendMetrics);
    window.addEventListener('pagehide', sendMetrics);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('beforeunload', sendMetrics);
      window.removeEventListener('pagehide', sendMetrics);
      sendMetrics(); // Envia métricas ao desmontar
    };
  }, [trackEngagement]);
  
  return {
    currentScrollDepth: scrollDepth.current,
    clickCount: clickCount.current,
    timeOnPage: Date.now() - startTime.current,
  };
}

// Hook para rastreamento de erros
export function useErrorTracking() {
  const { trackError, userId } = useAnalytics();
  const hasSetup = useRef(false);
  
  useEffect(() => {
    if (!hasSetup.current && typeof window !== 'undefined') {
      setupErrorTracking(userId);
      hasSetup.current = true;
    }
  }, [userId]);
  
  // Função manual para rastrear erros
  const reportError = useCallback((error: Error, context: string, additionalProps?: Record<string, any>) => {
    trackError(error, context, additionalProps);
  }, [trackError]);
  
  return { reportError };
}

// Hook para rastreamento de eventos customizados
export function useCustomEvents() {
  const { userId } = useAnalytics();
  
  const trackEvent = useCallback((
    category: string,
    action: string,
    label?: string,
    value?: number
  ) => {
    trackCustomEvent(category, action, label, value, userId);
  }, [userId]);
  
  return { trackEvent };
}

// Hook para rastreamento de métricas de negócio
export function useBusinessTracking() {
  const { trackBusinessMetrics, trackConversion } = useAnalytics();
  
  // Rastreia sinal de trading
  const trackTradingSignal = useCallback((signal: {
    accuracy: number;
    profitLoss: number;
    strategy: string;
    riskLevel: 'low' | 'medium' | 'high';
    betAmount: number;
    outcome: 'win' | 'loss';
  }) => {
    trackBusinessMetrics({
      signalAccuracy: signal.accuracy,
      profitLoss: signal.profitLoss,
      winRate: signal.outcome === 'win' ? 100 : 0,
      totalBets: 1,
      averageBetAmount: signal.betAmount,
      sessionDuration: 0, // Será calculado no backend
      strategiesUsed: [signal.strategy],
      riskLevel: signal.riskLevel,
    });
    
    // Rastreia conversão se foi lucro
    if (signal.profitLoss > 0) {
      trackConversion('trading_profit', signal.profitLoss, 'BRL', {
        strategy: signal.strategy,
        accuracy: signal.accuracy,
        riskLevel: signal.riskLevel,
      });
    }
  }, [trackBusinessMetrics, trackConversion]);
  
  // Rastreia uso de estratégia
  const trackStrategyUsage = useCallback((strategy: string, performance: number) => {
    trackBusinessMetrics({
      signalAccuracy: performance,
      profitLoss: 0,
      winRate: 0,
      totalBets: 0,
      averageBetAmount: 0,
      sessionDuration: 0,
      strategiesUsed: [strategy],
      riskLevel: 'medium',
    });
  }, [trackBusinessMetrics]);
  
  return {
    trackTradingSignal,
    trackStrategyUsage,
  };
}

// Hook para métricas em tempo real
export function useRealTimeMetrics() {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchMetrics = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const qs = new URLSearchParams();
      qs.set('action', 'realtime');
      if (date) qs.set('date', date);
      const res = await fetch(`/api/analytics?${qs.toString()}`);
      if (res.ok) {
        const payload = await res.json();
        const incoming = (payload && typeof payload === 'object') ? (payload.data ?? payload) : null;
        setMetrics(incoming || {});
      } else {
        setMetrics({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      logger.error('Failed to fetch real-time metrics', { metadata: { error: err } });
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchPageStats = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const qs = new URLSearchParams();
      qs.set('action', 'overview');
      if (date) qs.set('date', date);
      const res = await fetch(`/api/analytics?${qs.toString()}`);
      if (res.ok) {
        const payload = await res.json();
        const incoming = (payload && typeof payload === 'object') ? (payload.data ?? payload) : null;
        const topPages = incoming?.topPages as Array<{ page: string; views: number }> | undefined;
        const pageStats = topPages?.reduce<Record<string, number>>((acc, cur) => { acc[cur.page] = cur.views; return acc; }, {}) || {};
        setMetrics(prev => ({ ...prev, pageStats }));
      } else {
        setMetrics(prev => ({ ...prev, pageStats: {} }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch page stats');
      logger.error('Failed to fetch page stats', { metadata: { error: err } });
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    metrics,
    loading,
    error,
    fetchMetrics,
    fetchPageStats,
    refresh: () => fetchMetrics(),
  };
}

// Hook para A/B testing (básico)
export function useABTesting(testName: string, variants: string[]) {
  const { track, userId } = useAnalytics();
  const [variant, setVariant] = useState<string>('');
  
  useEffect(() => {
    // Determina variante baseada no userId ou sessionId
    const hash = userId ? hashString(userId) : hashString(Date.now().toString());
    const variantIndex = hash % variants.length;
    const selectedVariant = variants[variantIndex];
    
    setVariant(selectedVariant);
    
    // Rastreia exposição ao teste
    track('user_action', 'ab_test_exposure', {
      testName,
      variant: selectedVariant,
      userId,
    });
  }, [testName, variants, userId, track]);
  
  // Função para rastrear conversão do teste
  const trackConversion = useCallback((conversionType: string, value?: number) => {
    track('conversion', 'ab_test_conversion', {
      testName,
      variant,
      conversionType,
      value,
      userId,
    });
  }, [testName, variant, userId, track]);
  
  return {
    variant,
    trackConversion,
  };
}

// Função auxiliar para hash
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Hook para rastreamento de formulários
export function useFormTracking(formName: string) {
  const { track } = useAnalytics();
  const startTime = useRef<number>(0);
  const fieldInteractions = useRef<Record<string, number>>({});
  
  const trackFormStart = useCallback(() => {
    startTime.current = Date.now();
    track('user_action', 'form_started', {
      formName,
      timestamp: startTime.current,
    });
  }, [formName, track]);
  
  const trackFieldInteraction = useCallback((fieldName: string) => {
    fieldInteractions.current[fieldName] = (fieldInteractions.current[fieldName] || 0) + 1;
    track('user_action', 'form_field_interaction', {
      formName,
      fieldName,
      interactionCount: fieldInteractions.current[fieldName],
    });
  }, [formName, track]);
  
  const trackFormSubmit = useCallback((success: boolean, errors?: string[]) => {
    const duration = Date.now() - startTime.current;
    track('user_action', 'form_submitted', {
      formName,
      success,
      duration,
      errors: errors?.join(', '),
      fieldInteractions: JSON.stringify(fieldInteractions.current),
    });
  }, [formName, track]);
  
  const trackFormAbandonment = useCallback((lastField?: string) => {
    const duration = Date.now() - startTime.current;
    track('user_action', 'form_abandoned', {
      formName,
      duration,
      lastField,
      fieldInteractions: JSON.stringify(fieldInteractions.current),
    });
  }, [formName, track]);
  
  return {
    trackFormStart,
    trackFieldInteraction,
    trackFormSubmit,
    trackFormAbandonment,
  };
}

// Hook para rastreamento de features
export function useFeatureTracking() {
  const { track } = useAnalytics();
  
  const trackFeatureUsage = useCallback((featureName: string, action: string, metadata?: Record<string, any>) => {
    track('user_action', 'feature_used', {
      featureName,
      action,
      ...metadata,
    });
  }, [track]);
  
  const trackFeatureDiscovery = useCallback((featureName: string, discoveryMethod: string) => {
    track('user_action', 'feature_discovered', {
      featureName,
      discoveryMethod,
    });
  }, [track]);
  
  return {
    trackFeatureUsage,
    trackFeatureDiscovery,
  };
}