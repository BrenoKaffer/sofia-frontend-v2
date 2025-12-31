/**
 * Lazy loading wrapper para o Rate Limit Dashboard
 * Melhora a performance inicial carregando o dashboard sob demanda
 */

'use client';

import { lazy } from 'react';
import { withLazyLoading } from '../ui/lazy-wrapper';

// Lazy load do componente RateLimitDashboard
const RateLimitDashboard = lazy(() =>
  import('../monitoring/rate-limit-dashboard').then(module => ({
    default: module.RateLimitDashboard
  }))
);

// Wrapper com lazy loading e skeleton específico para dashboard
export const LazyRateLimitDashboard = withLazyLoading(
  RateLimitDashboard,
  'dashboard',
  {
    title: 'Carregando Dashboard de Rate Limiting',
    description: 'Preparando métricas de controle de taxa...',
    className: 'w-full'
  }
);

export default LazyRateLimitDashboard;