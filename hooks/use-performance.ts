'use client';

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { debounce, throttle, DebouncedFunc, DebouncedFuncLeading } from 'lodash';

// Interface para métricas de performance
interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage?: number;
}

// Hook para memoização inteligente
export function useSmartMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options: {
    maxAge?: number; // Tempo máximo em cache (ms)
    compareFunction?: (prev: T, next: T) => boolean;
  } = {}
): T {
  const { maxAge = 5 * 60 * 1000, compareFunction } = options; // 5 minutos padrão
  const cacheRef = useRef<{ value: T; timestamp: number; deps: React.DependencyList } | null>(null);

  return useMemo(() => {
    const now = Date.now();
    const cache = cacheRef.current;

    // Verifica se o cache é válido
    if (cache && 
        cache.deps.length === deps.length &&
        cache.deps.every((dep, index) => dep === deps[index]) &&
        (now - cache.timestamp) < maxAge) {
      
      const newValue = factory();
      
      // Se há função de comparação personalizada, usa ela
      if (compareFunction && compareFunction(cache.value, newValue)) {
        return cache.value;
      }
      
      // Se não há mudança significativa, retorna o valor em cache
      if (!compareFunction && JSON.stringify(cache.value) === JSON.stringify(newValue)) {
        return cache.value;
      }
    }

    // Calcula novo valor e atualiza cache
    const newValue = factory();
    cacheRef.current = {
      value: newValue,
      timestamp: now,
      deps: [...deps]
    };

    return newValue;
  }, deps);
}

// Hook para debouncing otimizado
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): DebouncedFunc<T> {
  const { leading = false, trailing = true, maxWait } = options;

  return useCallback(
    debounce(callback, delay, {
      leading,
      trailing,
      maxWait,
    }),
    [callback, delay, leading, trailing, maxWait]
  );
}

// Hook para throttling otimizado
export function useOptimizedThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): DebouncedFunc<T> {
  const { leading = true, trailing = true } = options;

  return useCallback(
    throttle(callback, delay, {
      leading,
      trailing,
    }),
    [callback, delay, leading, trailing]
  );
}

// Hook para monitoramento de performance de componente
export function usePerformanceMonitoring(componentName: string): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  });

  const renderTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
  });

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    renderTimesRef.current.push(renderTime);
    
    // Mantém apenas os últimos 10 renders para calcular média
    if (renderTimesRef.current.length > 10) {
      renderTimesRef.current.shift();
    }

    const averageRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;

    setMetrics(prev => ({
      renderCount: prev.renderCount + 1,
      lastRenderTime: renderTime,
      averageRenderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
    }));

    // Log em desenvolvimento
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms (>16ms threshold)`);
    }
  });

  return metrics;
}

// Hook para lazy state (só atualiza quando necessário)
export function useLazyState<T>(
  initialValue: T,
  compareFn?: (prev: T, next: T) => boolean
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialValue);
  const lastValueRef = useRef(initialValue);

  const setLazyState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value;
      
      // Usa função de comparação personalizada ou comparação padrão
      const hasChanged = compareFn 
        ? !compareFn(lastValueRef.current, newValue)
        : lastValueRef.current !== newValue;

      if (hasChanged) {
        lastValueRef.current = newValue;
        return newValue;
      }

      return prevState;
    });
  }, [compareFn]);

  return [state, setLazyState];
}

// Hook para intersection observer otimizado
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement | null>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [options]);

  return [targetRef, isIntersecting];
}

// Hook para preload de recursos
export function useResourcePreloader() {
  const preloadedResources = useRef(new Set<string>());

  const preloadImage = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;

    const img = new Image();
    img.src = src;
    preloadedResources.current.add(src);
  }, []);

  const preloadScript = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
    preloadedResources.current.add(src);
  }, []);

  const preloadStylesheet = useCallback((href: string) => {
    if (preloadedResources.current.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
    preloadedResources.current.add(href);
  }, []);

  return {
    preloadImage,
    preloadScript,
    preloadStylesheet,
  };
}

// Hook para otimização de re-renders
export function useRenderOptimization<T extends Record<string, any>>(
  props: T,
  dependencies: (keyof T)[] = []
): T {
  return useMemo(() => {
    if (dependencies.length === 0) {
      return props;
    }

    // Cria objeto apenas com as propriedades especificadas
    const optimizedProps = {} as T;
    dependencies.forEach(key => {
      optimizedProps[key] = props[key];
    });

    return optimizedProps;
  }, dependencies.map(key => props[key]));
}

// Hook para virtual scrolling simples
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}