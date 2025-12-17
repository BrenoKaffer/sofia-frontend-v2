/**
 * Índice de componentes lazy loading
 * Centraliza todas as exportações de componentes com lazy loading
 */

// Dashboards
export { LazyMonitoringDashboard } from './lazy-monitoring-dashboard';
export { LazyAnalyticsDashboard } from './lazy-analytics-dashboard';
export { LazyRateLimitDashboard } from './lazy-rate-limit-dashboard';

// UI Components
export {
  LazyWrapper,
  LazyDashboard,
  LazyTable,
  LazyForm,
  withLazyLoading,
  DashboardSkeleton,
  TableSkeleton,
  FormSkeleton
} from '../ui/lazy-wrapper';

// Tipos para TypeScript
export type LazyComponentProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
};

export type LazyLoadingOptions = {
  title?: string;
  description?: string;
  className?: string;
};

export type FallbackType = 'default' | 'dashboard' | 'table' | 'form';