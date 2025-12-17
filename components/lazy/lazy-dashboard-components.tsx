'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading wrapper com skeleton específico
export function withDashboardLazyLoading<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyDashboardComponent(props: T) {
    return (
      <Suspense fallback={fallback || <DashboardComponentSkeleton />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Skeleton específico para componentes do dashboard
function DashboardComponentSkeleton() {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
      </CardContent>
    </Card>
  );
}

// Lazy components otimizados para o dashboard
export const LazyLiveSignals = withDashboardLazyLoading(
  () => import('@/components/dashboard/live-signals'),
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export const LazyStatsCards = withDashboardLazyLoading(
  () => import('@/components/dashboard/stats-cards'),
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const LazyPerformanceChart = withDashboardLazyLoading(
  () => import('@/components/dashboard/performance-chart'),
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <Skeleton className="h-6 w-40" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

export const LazyRouletteStatus = withDashboardLazyLoading(
  () => import('@/components/dashboard/roulette-status'),
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="text-center space-y-2">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-4 w-20 mx-auto" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const LazyRecentActivity = withDashboardLazyLoading(
  () => import('@/components/dashboard/recent-activity'),
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <Skeleton className="h-6 w-36" />
    </CardHeader>
    <CardContent className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      ))}
    </CardContent>
  </Card>
);

export const LazyRealTimeMetrics = withDashboardLazyLoading(
  () => import('@/components/dashboard/real-time-metrics')
);

export const LazyRouletteModal = withDashboardLazyLoading(
  () => import('@/components/dashboard/roulette-modal')
);

// Hook para controle de lazy loading
export function useDashboardLazyLoading() {
  return {
    LazyLiveSignals,
    LazyStatsCards,
    LazyPerformanceChart,
    LazyRouletteStatus,
    LazyRecentActivity,
    LazyRealTimeMetrics,
    LazyRouletteModal
  };
}