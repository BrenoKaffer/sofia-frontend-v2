/**
 * Página do Dashboard de Monitoramento
 * Acesso administrativo para logs e métricas do sistema
 */

'use client';

import React from 'react';
import { MonitoringDashboard } from '../../components/monitoring/monitoring-dashboard';
import HealthMonitor from '../../components/monitoring/HealthMonitor';
import { usePageMonitoring } from '../../hooks/use-monitoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Shield, Activity, BarChart3 } from 'lucide-react';

export default function MonitoringPage() {
  const { log, trackNavigation } = usePageMonitoring('Monitoring');

  React.useEffect(() => {
    log.info('Monitoring page accessed');
  }, [log]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Monitoramento do Sistema</h1>
        <p className="text-muted-foreground">
          Dashboard administrativo para análise de logs, métricas de performance e monitoramento em tempo real.
        </p>
      </div>

      {/* Warning Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Acesso Administrativo:</strong> Esta página contém informações sensíveis do sistema. 
          Use apenas para debugging e análise de performance.
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistema de Logging</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Capturando logs estruturados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoramento</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Coletando métricas de performance
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ambiente</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {process.env.NEXT_PUBLIC_ENV === 'development' ? 'Dev' : 'Prod'}
            </div>
            <p className="text-xs text-muted-foreground">
              Modo {process.env.NEXT_PUBLIC_ENV === 'development' ? 'desenvolvimento' : 'produção'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Monitoring */}
      <HealthMonitor />

      {/* Main Dashboard */}
      <MonitoringDashboard />

      {/* Footer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sobre o Sistema de Monitoramento</CardTitle>
          <CardDescription>
            Informações sobre as funcionalidades implementadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">🔍 Sistema de Logging</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Logs estruturados com contexto</li>
                <li>• Níveis de log configuráveis</li>
                <li>• Captura automática de erros</li>
                <li>• Buffer circular para performance</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">📊 Monitoramento</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Métricas de performance em tempo real</li>
                <li>• Tracking de interações do usuário</li>
                <li>• Monitoramento de APIs</li>
                <li>• Análise de erros e exceções</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🎯 Hooks Personalizados</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• useMonitoring para componentes</li>
                <li>• useFormMonitoring para formulários</li>
                <li>• usePageMonitoring para páginas</li>
                <li>• Integração automática com Clerk</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⚡ Performance</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Observer API para métricas nativas</li>
                <li>• Tracking de render de componentes</li>
                <li>• Medição de tempo de carregamento</li>
                <li>• Análise de bundle e recursos</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> O sistema de monitoramento é otimizado para desenvolvimento e pode ser 
              configurado para produção através das variáveis de ambiente. Os dados são mantidos apenas 
              na sessão atual e não são persistidos no servidor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}