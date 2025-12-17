'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Users, 
  Clock,
  RefreshCw,
  FileText,
  Zap,
  Target
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface LogMetrics {
  overview: {
    total_logs: number;
    error_count: number;
    warn_count: number;
    info_count: number;
    debug_count: number;
    error_rate: number;
    warn_rate: number;
  };
  hourly_stats: Array<{
    hour: string;
    count: number;
  }>;
  top_errors: Array<{
    message: string;
    count: number;
    last_occurrence: string;
  }>;
  user_activity: Array<{
    user_id: string;
    log_count: number;
    error_count: number;
    last_activity: string;
  }>;
  context_breakdown: Array<{
    context: string;
    count: number;
    error_count: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function LogMetricsPage() {
  const [metrics, setMetrics] = useState<LogMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('24h');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/logs/metrics?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Falha ao buscar métricas');
      }

      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
        setLastUpdate(new Date());
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const formatHourlyData = (hourlyStats: LogMetrics['hourly_stats']) => {
    return hourlyStats.map(stat => ({
      ...stat,
      hour: new Date(stat.hour).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'destructive';
      case 'warn': return 'warning';
      case 'info': return 'default';
      case 'debug': return 'secondary';
      default: return 'default';
    }
  };

  if (loading && !metrics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Carregando métricas de logs...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!metrics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">Métricas Indisponíveis</h3>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar as métricas de logs.
            </p>
            <Button onClick={fetchMetrics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Métricas de Logs</h1>
            <p className="text-muted-foreground">
              Dashboard de análise e estatísticas dos logs do sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hora</SelectItem>
                <SelectItem value="24h">24 Horas</SelectItem>
                <SelectItem value="7d">7 Dias</SelectItem>
                <SelectItem value="30d">30 Dias</SelectItem>
              </SelectContent>
            </Select>
            {lastUpdate && (
              <div className="text-sm text-muted-foreground">
                Atualizado: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <Button onClick={fetchMetrics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Cards de Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overview.total_logs.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.overview.error_rate.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.overview.error_count} erros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Aviso</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.overview.warn_rate.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.overview.warn_count} avisos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.user_activity.length}</div>
              <p className="text-xs text-muted-foreground">
                com atividade de logs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico de Logs por Hora */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Logs por Hora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatHourlyData(metrics.hourly_stats)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição por Nível */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Distribuição por Nível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">ERROR</Badge>
                    <span className="text-sm">{metrics.overview.error_count}</span>
                  </div>
                  <Progress 
                    value={(metrics.overview.error_count / metrics.overview.total_logs) * 100} 
                    className="w-24" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">WARN</Badge>
                    <span className="text-sm">{metrics.overview.warn_count}</span>
                  </div>
                  <Progress 
                    value={(metrics.overview.warn_count / metrics.overview.total_logs) * 100} 
                    className="w-24" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">INFO</Badge>
                    <span className="text-sm">{metrics.overview.info_count}</span>
                  </div>
                  <Progress 
                    value={(metrics.overview.info_count / metrics.overview.total_logs) * 100} 
                    className="w-24" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">DEBUG</Badge>
                    <span className="text-sm">{metrics.overview.debug_count}</span>
                  </div>
                  <Progress 
                    value={(metrics.overview.debug_count / metrics.overview.total_logs) * 100} 
                    className="w-24" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabelas de Detalhes */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Erros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Principais Erros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.top_errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{error.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Última ocorrência: {new Date(error.last_occurrence).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="destructive">{error.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Breakdown por Contexto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Logs por Contexto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.context_breakdown.slice(0, 5).map((context, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{context.context}</p>
                      <p className="text-xs text-muted-foreground">
                        {context.error_count} erros de {context.count} total
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{context.count}</Badge>
                      {context.error_count > 0 && (
                        <Badge variant="destructive" className="ml-1">
                          {context.error_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}