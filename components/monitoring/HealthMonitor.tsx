'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  Server, 
  Shield, 
  Zap,
  RefreshCw
} from 'lucide-react';

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: any;
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    backend: ServiceStatus;
    cache: ServiceStatus;
    auth: ServiceStatus;
  };
  metrics: {
    responseTime: number;
    memoryUsage?: NodeJS.MemoryUsage;
    cpuUsage?: number;
  };
}

const HealthMonitor: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system/health');
      const data = await response.json();
      setHealthData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar dados de saúde:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchHealthData, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatMemoryUsage = (memory?: NodeJS.MemoryUsage) => {
    if (!memory) return 'N/A';
    const used = Math.round(memory.heapUsed / 1024 / 1024);
    const total = Math.round(memory.heapTotal / 1024 / 1024);
    return `${used}MB / ${total}MB`;
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'backend':
        return <Server className="h-4 w-4" />;
      case 'cache':
        return <Zap className="h-4 w-4" />;
      case 'auth':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading && !healthData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitoramento de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando dados de saúde...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Status do Sistema</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealthData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                Auto-refresh
              </Button>
            </div>
          </div>
          <CardDescription>
            Última atualização: {lastUpdate?.toLocaleTimeString() || 'Nunca'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(healthData.status)}
                  <Badge variant={healthData.status === 'healthy' ? 'default' : 'destructive'}>
                    {healthData.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Versão: {healthData.version}
                </div>
                <div className="text-sm text-muted-foreground">
                  Uptime: {formatUptime(healthData.uptime)}
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tempo de Resposta</div>
                  <div className="text-2xl font-bold">
                    {healthData.metrics.responseTime}ms
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Uso de Memória</div>
                  <div className="text-2xl font-bold">
                    {formatMemoryUsage(healthData.metrics.memoryUsage)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">CPU</div>
                  <div className="text-2xl font-bold">
                    {healthData.metrics.cpuUsage ? 
                      `${healthData.metrics.cpuUsage.toFixed(2)}%` : 
                      'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status dos Serviços */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Serviços</CardTitle>
          <CardDescription>
            Monitoramento individual de cada componente do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthData && (
            <div className="space-y-4">
              {Object.entries(healthData.services).map(([serviceName, service]) => (
                <div key={serviceName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getServiceIcon(serviceName)}
                    <div>
                      <div className="font-medium capitalize">{serviceName}</div>
                      {service.error && (
                        <div className="text-sm text-red-500">{service.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {service.responseTime && (
                      <div className="text-sm text-muted-foreground">
                        {service.responseTime}ms
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <Badge 
                        variant={service.status === 'healthy' ? 'default' : 'destructive'}
                        className="capitalize"
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthMonitor;