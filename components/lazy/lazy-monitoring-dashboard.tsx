/**
 * Lazy loading wrapper para o Monitoring Dashboard
 * Melhora a performance inicial carregando o dashboard sob demanda
 */

'use client';

import { lazy } from 'react';
import { withLazyLoading } from '../ui/lazy-wrapper';

// Lazy load do componente MonitoringDashboard
const MonitoringDashboard = lazy(() =>
  import('../monitoring/monitoring-dashboard').then(module => ({
    default: module.MonitoringDashboard
  }))
);

// Wrapper com lazy loading e skeleton específico para dashboard
export const LazyMonitoringDashboard = withLazyLoading(
  MonitoringDashboard,
  'dashboard',
  {
    title: 'Carregando Dashboard de Monitoramento',
    description: 'Preparando métricas e gráficos em tempo real...',
    className: 'w-full'
  }
);

export default LazyMonitoringDashboard;