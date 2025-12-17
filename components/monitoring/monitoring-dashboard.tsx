/**
 * Dashboard de monitoramento para visualizar logs e métricas
 * Componente administrativo para debugging e análise
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription } from '../ui/alert';
import { logger, LogEntry, LogLevel } from '../../lib/logger';
import { getMonitoringService, ErrorMetric, UsageMetric } from '../../lib/monitoring';
import { useMonitoring } from '../../hooks/use-monitoring';
import { Download, Trash2, RefreshCw, AlertTriangle, Info, Bug, Zap } from 'lucide-react';

interface MonitoringDashboardProps {
  className?: string;
}

export function MonitoringDashboard({ className }: MonitoringDashboardProps) {
  const { log, track } = useMonitoring({ componentName: 'MonitoringDashboard' });
  const monitoring = getMonitoringService();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [errorMetrics, setErrorMetrics] = useState<ErrorMetric[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetric[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const refreshData = React.useCallback(() => {
    setLogs(logger.getLogs());
    setPerformanceMetrics(monitoring.getPerformanceMetrics());
    setErrorMetrics(monitoring.getErrorMetrics());
    setUsageMetrics(monitoring.getUsageMetrics());
    log.debug('Monitoring data refreshed');
  }, [log, monitoring]);

  useEffect(() => {
    refreshData();
    track.userAction('dashboard_opened');
  }, [refreshData, track]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshData]);

  const clearAllData = () => {
    logger.clearLogs();
    monitoring.clearMetrics();
    refreshData();
    track.userAction('data_cleared');
    log.info('All monitoring data cleared');
  };

  const exportData = () => {
    const data = {
      logs,
      metrics: {
        performance: performanceMetrics,
        errors: errorMetrics,
        usage: usageMetrics
      },
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sofia-monitoring-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    track.userAction('data_exported');
    log.info('Monitoring data exported');
  };

  const getLogLevelBadge = (level: LogLevel) => {
    const configs = {
      [LogLevel.ERROR]: { variant: 'destructive' as const, icon: AlertTriangle, label: 'ERROR' },
      [LogLevel.WARN]: { variant: 'secondary' as const, icon: AlertTriangle, label: 'WARN' },
      [LogLevel.INFO]: { variant: 'default' as const, icon: Info, label: 'INFO' },
      [LogLevel.DEBUG]: { variant: 'outline' as const, icon: Bug, label: 'DEBUG' }
    };
    
    const config = configs[level];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getAveragePerformance = () => {
    if (performanceMetrics.length === 0) return 0;
    const sum = performanceMetrics.reduce((acc, m) => acc + m.value, 0);
    return Math.round(sum / performanceMetrics.length);
  };

  const getErrorRate = () => {
    if (usageMetrics.length === 0) return 0;
    return Math.round((errorMetrics.length / usageMetrics.length) * 100);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Monitoramento</h2>
          <p className="text-muted-foreground">Logs, métricas e análise de performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button variant="destructive" size="sm" onClick={clearAllData}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorMetrics.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAveragePerformance()}ms</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getErrorRate()}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="performance">Performance ({performanceMetrics.length})</TabsTrigger>
          <TabsTrigger value="errors">Erros ({errorMetrics.length})</TabsTrigger>
          <TabsTrigger value="usage">Uso ({usageMetrics.length})</TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>Histórico de eventos e debug</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>Nenhum log disponível</AlertDescription>
                    </Alert>
                  ) : (
                    logs.slice().reverse().map((log, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          {getLogLevelBadge(log.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatTimestamp(log.timestamp)}</span>
                            {log.context?.component && (
                              <Badge variant="outline" className="text-xs">
                                {log.context.component}
                              </Badge>
                            )}
                            {log.context?.action && (
                              <Badge variant="outline" className="text-xs">
                                {log.context.action}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm">{log.message}</p>
                          {log.error && (
                            <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-x-auto">
                              {log.error.stack || log.error.message}
                            </pre>
                          )}
                          {log.context?.metadata && (
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.context.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
              <CardDescription>Tempos de resposta e performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {performanceMetrics.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>Nenhuma métrica de performance disponível</AlertDescription>
                    </Alert>
                  ) : (
                    performanceMetrics.slice().reverse().map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{metric.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTimestamp(metric.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {metric.value}{metric.unit}
                          </p>
                          {metric.context?.component && (
                            <Badge variant="outline" className="text-xs">
                              {metric.context.component}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Erros do Sistema</CardTitle>
              <CardDescription>Erros e exceções capturadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {errorMetrics.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>Nenhum erro registrado</AlertDescription>
                    </Alert>
                  ) : (
                    errorMetrics.slice().reverse().map((error, index) => (
                      <div key={index} className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive">{error.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(error.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-2">{error.message}</p>
                        {error.stack && (
                          <pre className="text-xs bg-white p-2 rounded overflow-x-auto border">
                            {error.stack}
                          </pre>
                        )}
                        {error.context && (
                          <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto border">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Uso</CardTitle>
              <CardDescription>Interações e eventos do usuário</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {usageMetrics.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>Nenhuma métrica de uso disponível</AlertDescription>
                    </Alert>
                  ) : (
                    usageMetrics.slice().reverse().map((usage, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{usage.event}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTimestamp(usage.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{usage.component}</Badge>
                          {usage.userId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              User: {usage.userId.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MonitoringDashboard;