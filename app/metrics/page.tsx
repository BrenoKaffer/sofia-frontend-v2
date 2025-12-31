'use client';

import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  Eye, 
  RefreshCw, 
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useSmartCache } from '@/lib/cache';
import { useMonitoring } from '@/hooks/use-monitoring';
import { usePerformanceMonitoring } from '@/hooks/use-performance';

// Interfaces para dados de métricas
interface PerformanceMetric {
  name: string;
  avg: number;
  p95: number;
  count: number;
  unit?: string;
}

interface ErrorMetric {
  type: string;
  count: number;
  last_24h: number;
}

interface UsageMetric {
  event: string;
  count: number;
  unique_users: number;
}

interface MetricsData {
  performance: Record<string, PerformanceMetric>;
  errors: Record<string, ErrorMetric>;
  usage: Record<string, UsageMetric>;
  timestamp: string;
}

// Componente para métricas de performance
const PerformanceMetrics = memo(({ data }: { data: Record<string, PerformanceMetric> }) => {
  const getStatusColor = (metricName: string, value: number) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      web_vitals_fcp: { good: 1800, poor: 3000 },
      web_vitals_lcp: { good: 2500, poor: 4000 },
      web_vitals_fid: { good: 100, poor: 300 },
      web_vitals_cls: { good: 0.1, poor: 0.25 },
    };

    const threshold = thresholds[metricName];
    if (!threshold) return 'default';

    if (value <= threshold.good) return 'success';
    if (value <= threshold.poor) return 'warning';
    return 'destructive';
  };

  const formatValue = (value: number, unit?: string) => {
    if (unit === 'ms') return `${Math.round(value)}ms`;
    if (unit === 's') return `${(value / 1000).toFixed(2)}s`;
    if (value < 1) return value.toFixed(3);
    return Math.round(value).toString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(data).map(([key, metric]) => (
        <Card key={key} className="relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {key.replace(/_/g, ' ').toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatValue(metric.avg, metric.unit)}
                </span>
                <Badge variant={getStatusColor(key, metric.avg) as any}>
                  Média
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                P95: {formatValue(metric.p95, metric.unit)}
              </div>
              <div className="text-xs text-muted-foreground">
                {metric.count} amostras
              </div>
              {key.includes('web_vitals') && (
                <Progress 
                  value={Math.min((metric.avg / (metric.avg * 2)) * 100, 100)} 
                  className="h-2"
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
PerformanceMetrics.displayName = 'PerformanceMetrics';

// Componente para métricas de erro
const ErrorMetrics = memo(({ data }: { data: Record<string, ErrorMetric> }) => {
  const totalErrors = Object.values(data).reduce((sum, error) => sum + error.count, 0);
  const recentErrors = Object.values(data).reduce((sum, error) => sum + error.last_24h, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Total de Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalErrors}</div>
            <div className="text-xs text-muted-foreground">Todos os tipos</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Últimas 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{recentErrors}</div>
            <div className="text-xs text-muted-foreground">Erros recentes</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalErrors > 0 ? ((recentErrors / totalErrors) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Últimas 24h</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(data).map(([type, error]) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                Erros de {type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{error.count}</span>
                  <Badge variant={error.last_24h > 0 ? 'destructive' : 'secondary'}>
                    {error.last_24h} recentes
                  </Badge>
                </div>
                <Progress 
                  value={totalErrors > 0 ? (error.count / totalErrors) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});
ErrorMetrics.displayName = 'ErrorMetrics';

// Componente para métricas de uso
const UsageMetrics = memo(({ data }: { data: Record<string, UsageMetric> }) => {
  const totalEvents = Object.values(data).reduce((sum, usage) => sum + usage.count, 0);
  const totalUsers = Math.max(...Object.values(data).map(usage => usage.unique_users));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Todas as interações</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários Únicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-xs text-muted-foreground">Usuários ativos</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data).map(([event, usage]) => (
          <Card key={event}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {event.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-lg font-semibold">{usage.count.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  {usage.unique_users} usuários únicos
                </div>
                <Progress 
                  value={totalEvents > 0 ? (usage.count / totalEvents) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});
UsageMetrics.displayName = 'UsageMetrics';

// Componente principal do dashboard de métricas
function MetricsDashboard() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const cache = useSmartCache('metrics_data');
  const { track } = useMonitoring({ componentName: 'MetricsDashboard' });

  const fetchMetrics = React.useCallback(async () => {
    try {
      setLoading(true);
      track.userAction('metrics_fetch_start');

      // Tentar buscar do cache primeiro
      const cachedData = cache.get() as { data: any; timestamp: number } | null;
      if (cachedData && Date.now() - cachedData.timestamp < 30000) { // 30 segundos
        setMetricsData(cachedData.data);
        setLastUpdate(new Date(cachedData.timestamp));
        setLoading(false);
        return;
      }

      const response = await fetch('/api/metrics');
      if (!response.ok) {
        throw new Error('Falha ao buscar métricas');
      }

      const data = await response.json();
      setMetricsData(data);
      setLastUpdate(new Date());

      // Armazenar no cache
      cache.set({ data, timestamp: Date.now() });

      track.userAction('metrics_fetch_success');
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      track.userAction('metrics_fetch_error', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  }, [cache, track]);

  useEffect(() => {
    fetchMetrics();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading && !metricsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Carregando métricas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">Métricas Indisponíveis</h3>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar os dados de métricas.
            </p>
            <Button onClick={fetchMetrics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
          <p className="text-muted-foreground">
            Monitoramento de performance, erros e uso da aplicação
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <div className="text-sm text-muted-foreground">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <Button onClick={fetchMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs para diferentes tipos de métricas */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Erros
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Uso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMetrics data={metricsData.performance} />
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <ErrorMetrics data={metricsData.errors} />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsageMetrics data={metricsData.usage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default memo(MetricsDashboard);