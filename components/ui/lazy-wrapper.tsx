/**
 * Componente wrapper para lazy loading de componentes pesados
 * Melhora a performance inicial da aplicação
 */

'use client';

import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Skeleton } from './skeleton';
import { Loader2 } from 'lucide-react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

// Componente de loading padrão
const DefaultFallback = ({ title, description }: { title?: string; description?: string }) => (
  <Card className="w-full">
    {(title || description) && (
      <CardHeader>
        {title && (
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {title}
          </CardTitle>
        )}
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </CardHeader>
    )}
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton específico para dashboards
const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <div className="mt-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

// Skeleton específico para tabelas
const TableSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {/* Table header */}
        <div className="flex space-x-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Skeleton específico para formulários
const FormSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end space-x-2 pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </CardContent>
  </Card>
);

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  className,
  title,
  description
}) => {
  const defaultFallback = fallback || <DefaultFallback title={title} description={description} />;
  
  return (
    <div className={className}>
      <Suspense fallback={defaultFallback}>
        {children}
      </Suspense>
    </div>
  );
};

// HOC para criar componentes lazy
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  fallbackType: 'default' | 'dashboard' | 'table' | 'form' = 'default',
  options?: {
    title?: string;
    description?: string;
    className?: string;
  }
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return function LazyLoadedComponent(props: P) {
    const getFallback = () => {
      switch (fallbackType) {
        case 'dashboard':
          return <DashboardSkeleton />;
        case 'table':
          return <TableSkeleton />;
        case 'form':
          return <FormSkeleton />;
        default:
          return <DefaultFallback title={options?.title} description={options?.description} />;
      }
    };
    
    return (
      <div className={options?.className}>
        <Suspense fallback={getFallback()}>
          <LazyComponent {...props} />
        </Suspense>
      </div>
    );
  };
}

// Utilitários para lazy loading específicos
export const LazyDashboard = ({ children, title, description, className }: LazyWrapperProps) => (
  <LazyWrapper 
    fallback={<DashboardSkeleton />} 
    title={title} 
    description={description}
    className={className}
  >
    {children}
  </LazyWrapper>
);

export const LazyTable = ({ children, title, description, className }: LazyWrapperProps) => (
  <LazyWrapper 
    fallback={<TableSkeleton />} 
    title={title} 
    description={description}
    className={className}
  >
    {children}
  </LazyWrapper>
);

export const LazyForm = ({ children, title, description, className }: LazyWrapperProps) => (
  <LazyWrapper 
    fallback={<FormSkeleton />} 
    title={title} 
    description={description}
    className={className}
  >
    {children}
  </LazyWrapper>
);

export { DashboardSkeleton, TableSkeleton, FormSkeleton };