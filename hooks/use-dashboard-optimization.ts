'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags';

interface DashboardOptimizationConfig {
  enableLazyLoading: boolean;
  preloadComponents: boolean;
  deferNonCritical: boolean;
  optimizeAnimations: boolean;
}

interface ComponentLoadState {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  loadTime: number;
}

export function useDashboardOptimization() {
  const [config, setConfig] = useState<DashboardOptimizationConfig>({
    enableLazyLoading: true,
    preloadComponents: false,
    deferNonCritical: true,
    optimizeAnimations: true
  });

  const [componentStates, setComponentStates] = useState<Record<string, ComponentLoadState>>({});
  const loadTimesRef = useRef<Record<string, number>>({});
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  // Feature flags
  const dashboardOptimization = useFeatureFlag(FEATURE_FLAGS.DASHBOARD_OPTIMIZATION);
  const lazyLoadingEnabled = useFeatureFlag(FEATURE_FLAGS.LAZY_LOADING);

  // Configurar otimizações baseadas em feature flags
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      enableLazyLoading: lazyLoadingEnabled && dashboardOptimization,
      preloadComponents: dashboardOptimization,
      deferNonCritical: dashboardOptimization,
      optimizeAnimations: dashboardOptimization
    }));
  }, [dashboardOptimization, lazyLoadingEnabled]);

  // Intersection Observer para lazy loading inteligente
  useEffect(() => {
    if (!config.enableLazyLoading) return;

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const componentId = entry.target.getAttribute('data-component-id');
            if (componentId) {
              preloadComponent(componentId);
            }
          }
        });
      },
      {
        rootMargin: '100px', // Preload 100px antes do componente aparecer
        threshold: 0.1
      }
    );

    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, [config.enableLazyLoading]);

  // Registrar componente para observação
  const registerComponent = useCallback((element: HTMLElement, componentId: string) => {
    if (!intersectionObserverRef.current) return;
    
    element.setAttribute('data-component-id', componentId);
    intersectionObserverRef.current.observe(element);
  }, []);

  // Preload de componente
  const preloadComponent = useCallback((componentId: string) => {
    if (componentStates[componentId]?.isLoaded || componentStates[componentId]?.isLoading) {
      return;
    }

    const startTime = performance.now();
    
    setComponentStates(prev => ({
      ...prev,
      [componentId]: {
        isLoaded: false,
        isLoading: true,
        error: null,
        loadTime: 0
      }
    }));

    // Simular carregamento do componente
    // Em uma implementação real, isso seria o import dinâmico
    setTimeout(() => {
      const loadTime = performance.now() - startTime;
      loadTimesRef.current[componentId] = loadTime;

      setComponentStates(prev => ({
        ...prev,
        [componentId]: {
          isLoaded: true,
          isLoading: false,
          error: null,
          loadTime
        }
      }));
    }, Math.random() * 100 + 50); // Simular tempo de carregamento variável
  }, [componentStates]);

  // Otimizar animações baseado na performance
  const shouldReduceAnimations = useCallback(() => {
    if (!config.optimizeAnimations) return false;
    
    // Verificar se o usuário prefere animações reduzidas
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Verificar performance média de carregamento
    const avgLoadTime = Object.values(loadTimesRef.current).reduce((acc, time) => acc + time, 0) / 
                       Object.values(loadTimesRef.current).length;
    
    return prefersReducedMotion || avgLoadTime > 200; // Se carregamento médio > 200ms
  }, [config.optimizeAnimations]);

  // Priorizar componentes críticos
  const getPriorityOrder = useCallback(() => {
    return [
      'stats-cards',      // Métricas principais - alta prioridade
      'live-signals',     // Sinais ao vivo - alta prioridade
      'roulette-status',  // Status da roleta - média prioridade
      'performance-chart', // Gráficos - baixa prioridade
      'recent-activity'   // Atividade recente - baixa prioridade
    ];
  }, []);

  // Verificar se componente deve ser carregado
  const shouldLoadComponent = useCallback((componentId: string) => {
    if (!config.enableLazyLoading) return true;
    
    const priorityOrder = getPriorityOrder();
    const componentPriority = priorityOrder.indexOf(componentId);
    
    // Componentes de alta prioridade (índice 0-1) carregam imediatamente
    if (componentPriority <= 1) return true;
    
    // Outros componentes aguardam interação ou scroll
    return componentStates[componentId]?.isLoaded || false;
  }, [config.enableLazyLoading, componentStates, getPriorityOrder]);

  // Métricas de performance
  const getPerformanceMetrics = useCallback(() => {
    const loadTimes = Object.values(loadTimesRef.current);
    const totalComponents = Object.keys(componentStates).length;
    const loadedComponents = Object.values(componentStates).filter(state => state.isLoaded).length;
    
    return {
      totalComponents,
      loadedComponents,
      loadingProgress: totalComponents > 0 ? (loadedComponents / totalComponents) * 100 : 0,
      averageLoadTime: loadTimes.length > 0 ? loadTimes.reduce((acc, time) => acc + time, 0) / loadTimes.length : 0,
      maxLoadTime: loadTimes.length > 0 ? Math.max(...loadTimes) : 0,
      minLoadTime: loadTimes.length > 0 ? Math.min(...loadTimes) : 0
    };
  }, [componentStates]);

  return {
    config,
    componentStates,
    registerComponent,
    preloadComponent,
    shouldLoadComponent,
    shouldReduceAnimations,
    getPriorityOrder,
    getPerformanceMetrics,
    isOptimizationEnabled: dashboardOptimization
  };
}