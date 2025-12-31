/**
 * Lazy loading wrapper para o Analytics Dashboard
 * Melhora a performance inicial carregando o dashboard sob demanda
 */

'use client';

import { lazy } from 'react';
import { withLazyLoading } from '../ui/lazy-wrapper';

// Lazy load do componente AnalyticsDashboard
const AnalyticsDashboard = lazy(() => 
  import('../analytics/analytics-dashboard').then(module => ({
    default: module.AnalyticsDashboard
  }))
);

// Wrapper com lazy loading e skeleton específico para dashboard
export const LazyAnalyticsDashboard = withLazyLoading(
  AnalyticsDashboard,
  'dashboard',
  {
    title: 'Carregando Dashboard de Analytics',
    description: 'Preparando análises e relatórios de dados...',
    className: 'w-full'
  }
);

export default LazyAnalyticsDashboard;