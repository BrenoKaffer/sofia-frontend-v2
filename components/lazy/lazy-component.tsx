'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Interface para props do componente lazy
interface LazyComponentProps {
  fallback?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
}

// Componente de loading padrão
const DefaultFallback = ({ className }: { className?: string }) => (
  <Card className={`p-6 ${className || ''}`}>
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
    <div className="space-y-3 mt-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </Card>
);

// Componente de erro padrão
const DefaultError = ({ error }: { error?: Error }) => (
  <Card className="p-6 border-destructive">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-destructive mb-2">
        Erro ao carregar componente
      </h3>
      <p className="text-sm text-muted-foreground">
        {error?.message || 'Ocorreu um erro inesperado'}
      </p>
    </div>
  </Card>
);

// HOC para criar componentes lazy com error boundary
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentProps = {}
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: P & LazyComponentProps) {
    const {
      fallback = <DefaultFallback className={props.className} />,
      error = <DefaultError />,
      className,
      ...componentProps
    } = props;

    return (
      <ErrorBoundary fallback={error}>
        <Suspense fallback={fallback}>
          <LazyComponent {...(componentProps as P)} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

// Error Boundary para componentes lazy
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Hook para lazy loading dinâmico
export function useLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
) {
  const [Component, setComponent] = React.useState<ComponentType<P> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    
    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const loadedModule = await importFn();
        
        if (mounted) {
          setComponent(() => loadedModule.default);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [importFn]);

  return { Component, loading, error };
}

// Componentes lazy pré-configurados para uso comum
export const LazyChart = withLazyLoading(
  () => import('@/components/analytics/analytics-dashboard'),
  { fallback: <Skeleton className="h-96 w-full" /> }
);

export const LazyMonitoring = withLazyLoading(
  () => import('@/components/monitoring/monitoring-dashboard'),
  { fallback: <Skeleton className="h-64 w-full" /> }
);

export const LazyAnalytics = withLazyLoading(
  () => import('@/components/analytics/analytics-dashboard'),
  { fallback: <Skeleton className="h-80 w-full" /> }
);

// Utility para preload de componentes
export const preloadComponent = (importFn: () => Promise<any>) => {
  // Preload apenas em produção e quando idle
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFn().catch(() => {
          // Silently fail preload
        });
      });
    } else {
      // Fallback para browsers sem requestIdleCallback
      setTimeout(() => {
        importFn().catch(() => {
          // Silently fail preload
        });
      }, 2000);
    }
  }
};