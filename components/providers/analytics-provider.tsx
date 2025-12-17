/**
 * Provider de Analytics
 * Inicializa e configura o sistema de analytics globalmente
 */

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useUser } from '@/hooks/use-user';
import { 
  capturePerformanceMetrics, 
  captureEngagementMetrics, 
  setupErrorTracking 
} from '@/lib/analytics-client';
// Removed server-only analytics import to avoid bundling ioredis in client
import { logger } from '@/lib/logger';

// Safe client-side stubs for analytics (padronizados com LogContext)
const trackEvent = (type: string, name: string, properties: Record<string, any> = {}, userId?: string) => {
  try {
    logger.info('analytics.track', {
      userId,
      component: 'AnalyticsProvider',
      action: 'track',
      metadata: { type, name, properties }
    });
  } catch {}
};
const trackPageView = (page: string, userId?: string, properties: Record<string, any> = {}) => {
  try {
    logger.info('analytics.page', {
      userId,
      component: 'AnalyticsProvider',
      action: 'page_view',
      metadata: { page, properties }
    });
  } catch {}
};
const trackError = (error: Error, context: string, userId?: string, properties: Record<string, any> = {}) => {
  try {
    logger.error('analytics.error', {
      userId,
      component: 'AnalyticsProvider',
      action: 'error',
      metadata: { context, properties, timestamp: Date.now() }
    }, error);
  } catch {}
};
const flush = () => {};

// Interface do contexto de analytics
interface AnalyticsContextType {
  isInitialized: boolean;
  userId?: string;
}

// Contexto de analytics
const AnalyticsContext = createContext<AnalyticsContextType>({
  isInitialized: false,
});

// Hook para usar o contexto de analytics
export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
}

// Props do provider
interface AnalyticsProviderProps {
  children: ReactNode;
  config?: {
    enablePerformanceTracking?: boolean;
    enableEngagementTracking?: boolean;
    enableErrorTracking?: boolean;
    enableAutoPageTracking?: boolean;
    sampleRate?: number;
  };
}

// Provider de analytics
export function AnalyticsProvider({ 
  children, 
  config = {} 
}: AnalyticsProviderProps) {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  
  const {
    enablePerformanceTracking = true,
    enableEngagementTracking = true,
    enableErrorTracking = true,
    enableAutoPageTracking = true,
    sampleRate = 1.0,
  } = config;
  
  // Inicializa o sistema de analytics
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      // Configura o sistema de analytics
      logger.info('Initializing analytics system', {
        userId,
        component: 'AnalyticsProvider',
        action: 'INITIALIZE',
        metadata: {
          enablePerformanceTracking,
          enableEngagementTracking,
          enableErrorTracking,
          enableAutoPageTracking,
          sampleRate,
        },
      });
      
      // Rastreia inicialização da aplicação
      trackEvent('user_action', 'app_initialized', {
        timestamp: Date.now(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      }, userId);
      
    } catch (error) {
      logger.error('Failed to initialize analytics', {
        component: 'AnalyticsProvider',
        action: 'INITIALIZE_ERROR'
      }, error as Error);
    }
  }, [isLoaded, userId, enablePerformanceTracking, enableEngagementTracking, enableErrorTracking, enableAutoPageTracking, sampleRate]);
  
  // Configura rastreamento de performance
  useEffect(() => {
    if (!enablePerformanceTracking || typeof window === 'undefined') return;
    
    try {
      capturePerformanceMetrics(userId);
      logger.debug('Performance tracking enabled');
    } catch (error) {
      logger.error('Failed to setup performance tracking', {
        component: 'AnalyticsProvider',
        action: 'PERFORMANCE_SETUP_ERROR'
      }, error as Error);
    }
  }, [enablePerformanceTracking, userId]);
  
  // Configura rastreamento de engajamento
  useEffect(() => {
    if (!enableEngagementTracking || typeof window === 'undefined') return;
    
    try {
      const cleanup = captureEngagementMetrics(userId);
      logger.debug('Engagement tracking enabled');
      
      return cleanup;
    } catch (error) {
      logger.error('Failed to setup engagement tracking', {
        component: 'AnalyticsProvider',
        action: 'ENGAGEMENT_SETUP_ERROR'
      }, error as Error);
    }
  }, [enableEngagementTracking, userId]);
  
  // Configura rastreamento de erros
  useEffect(() => {
    if (!enableErrorTracking || typeof window === 'undefined') return;
    
    try {
      setupErrorTracking(userId);
      logger.debug('Error tracking enabled');
    } catch (error) {
      logger.error('Failed to setup error tracking', {
        component: 'AnalyticsProvider',
        action: 'ERROR_TRACKING_SETUP_ERROR'
      }, error as Error);
    }
  }, [enableErrorTracking, userId]);
  
  // Rastreia mudanças de rota automaticamente
  useEffect(() => {
    if (!enableAutoPageTracking || typeof window === 'undefined') return;
    
    const handleRouteChange = () => {
      try {
        trackPageView(window.location.pathname, userId, {
          referrer: document.referrer,
          timestamp: Date.now(),
        });
      } catch (error) {
        logger.error('Failed to track page view', {
          component: 'AnalyticsProvider',
          action: 'PAGE_VIEW_ERROR'
        }, error as Error);
      }
    };
    
    // Rastreia a página inicial
    handleRouteChange();
    
    // Escuta mudanças de URL (para SPAs)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      setTimeout(handleRouteChange, 0);
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      setTimeout(handleRouteChange, 0);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [enableAutoPageTracking, userId]);
  
  // Rastreia sessão do usuário
  useEffect(() => {
    if (!userId) return;
    
    try {
      // Rastreia login/início de sessão
      trackEvent('user_action', 'session_started', {
        userId,
        timestamp: Date.now(),
      }, userId);
      
      // Rastreia fim de sessão ao sair
      const handleBeforeUnload = () => {
        trackEvent('user_action', 'session_ended', {
          userId,
          timestamp: Date.now(),
        }, userId);
        
        // Força flush dos eventos pendentes
        flush();
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
        handleBeforeUnload(); // Chama ao desmontar o componente
      };
    } catch (error) {
      logger.error('Failed to setup session tracking', {
        component: 'AnalyticsProvider',
        action: 'SESSION_TRACKING_ERROR'
      }, error as Error);
    }
  }, [userId]);
  
  // Rastreia mudanças de usuário
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      if (userId) {
        trackEvent('user_action', 'user_identified', {
          userId,
          timestamp: Date.now(),
        }, userId);
      } else {
        trackEvent('user_action', 'user_anonymous', {
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logger.error('Failed to track user change', {
        component: 'AnalyticsProvider',
        action: 'USER_CHANGE_ERROR'
      }, error as Error);
    }
  }, [userId, isLoaded]);
  
  const contextValue: AnalyticsContextType = {
    isInitialized: isLoaded,
    userId,
  };
  
  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// HOC para componentes que precisam de analytics
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  trackingConfig?: {
    componentName?: string;
    trackMount?: boolean;
    trackUnmount?: boolean;
    trackProps?: boolean;
  }
) {
  const {
    componentName = Component.displayName || Component.name || 'UnknownComponent',
    trackMount = true,
    trackUnmount = false,
    trackProps = false,
  } = trackingConfig || {};
  
  return function AnalyticsWrappedComponent(props: P) {
    const { userId } = useAnalyticsContext();
    
    useEffect(() => {
      if (trackMount) {
        trackEvent('user_action', 'component_mounted', {
          componentName,
          props: trackProps ? props : undefined,
          timestamp: Date.now(),
        }, userId);
      }
      
      return () => {
        if (trackUnmount) {
          trackEvent('user_action', 'component_unmounted', {
            componentName,
            timestamp: Date.now(),
          }, userId);
        }
      };
    }, [userId, props]);
    
    return <Component {...props} />;
  };
}

// Hook para rastreamento manual de eventos
export function useTrackEvent() {
  const { userId } = useAnalyticsContext();
  
  return {
    trackEvent: (eventName: string, properties?: Record<string, any>) => {
      trackEvent('user_action', eventName, {
        ...properties,
        timestamp: Date.now(),
      }, userId);
    },
    trackPageView: (page: string, properties?: Record<string, any>) => {
      trackPageView(page, userId, {
        ...properties,
        timestamp: Date.now(),
      });
    },
    trackError: (error: Error, context: string, properties?: Record<string, any>) => {
      trackError(error, context, userId, {
        ...properties,
        timestamp: Date.now(),
      });
    },
    userId,
  };
}