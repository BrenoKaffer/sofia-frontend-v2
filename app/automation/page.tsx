'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Square, 
  AlertTriangle, 
  Activity, 
  Settings, 
  BarChart3,
  Zap,
  Shield,
  Clock,
  Wifi,
  WifiOff,
  TrendingUp
} from 'lucide-react';

import { AutomationDashboard } from '@/components/dashboard/automation-dashboard';
import { QuickControls } from '@/components/dashboard/quick-controls';
import { BettingAutomationPanel } from '@/components/dashboard/betting-automation-panel';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WEBSOCKET_CHANNELS } from '@/lib/websocket-client';
import { useAutomation } from '@/hooks/useAutomation';
import { MetricsPanel } from '@/components/automation/metrics-panel';
import { EmergencyStop } from '@/components/automation/emergency-stop';
import { AdvancedRiskPanel } from '@/components/automation/advanced-risk-panel';
import { formatTimeHHMMSS } from '@/lib/utils';
import { SessionManagementPanel } from '@/components/automation/session-management-panel';
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags';

interface SystemStatus {
  isInitialized: boolean;
  isRunning: boolean;
  activeSessions: number;
  totalProfit: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  lastUpdate: Date;
  emergencyStop?: boolean;
}

interface AutomationMetrics {
  totalBets: number;
  successRate: number;
  avgResponseTime: number;
  queueSize: number;
  cpuUsage: number;
  memoryUsage: number;
}

export default function AutomationPage() {
  const isMvpMode = useFeatureFlag(FEATURE_FLAGS.MVP_MODE);

  const { user } = useAuth()
  const { userProfile, loading } = useUserStatus(user?.id)
  const { openUpgradeModal } = useUpgrade()

  useEffect(() => {
    if (!loading && userProfile) {
      const isPro = 
        (userProfile.plan === 'pro') || 
        (userProfile.role === 'admin' || userProfile.role === 'superadmin')
        
      if (!isPro) {
        openUpgradeModal('Sistema de Automação')
      }
    }
  }, [loading, userProfile, openUpgradeModal])

  // Gate: mostrar aviso simples em modo MVP
  if (isMvpMode) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Automação – Em breve</CardTitle>
            <CardDescription>
              Para o MVP estamos priorizando Login, Cadastro, Checkout e Dashboard básico. A automação ficará disponível após a liberação inicial.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">
              Você ainda pode configurar estratégias em "Estrategias" e acompanhar status em "Roulette Status".
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <a href="/dashboard">Ir para Dashboard</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/strategies">Abrir Estratégias</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  // WebSocket connection
  const {
    connectionState,
    isConnected,
    connect,
    disconnect,
    subscribe,
    sendAutomationCommand,
    lastMessage,
    channelData
  } = useWebSocket({
    autoConnect: true,
    channels: [
      WEBSOCKET_CHANNELS.AUTOMATION_NOTIFICATIONS,
      WEBSOCKET_CHANNELS.BETTING_UPDATES,
      WEBSOCKET_CHANNELS.SESSION_EVENTS,
      WEBSOCKET_CHANNELS.SYSTEM_STATUS
    ]
  });

  // Get automation data from unified hook
  const { 
    status: systemStatus, 
    metrics, 
    riskMetrics,
    advancedMetrics,
    riskAlerts,
    loading: isLoading,
    error,
    notifications,
    initializeSystem,
    emergencyStop,
    handleWebSocketMessage,
    addNotification,
    clearNotifications
  } = useAutomation();

  // Initial data fetch is handled by the hook

  // Handle WebSocket messages using unified hook
  useEffect(() => {
    if (lastMessage) {
      const { channel, data } = lastMessage;
      handleWebSocketMessage(channel, data);
    }
  }, [lastMessage, handleWebSocketMessage]);

  // System control functions using unified hook
  const handleSystemInitialize = () => {
    initializeSystem(sendAutomationCommand);
  };

  const handleEmergencyStop = () => {
    emergencyStop(sendAutomationCommand);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <Shield className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Carregando sistema de automação...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Automação SOFIA</h1>
          <p className="text-muted-foreground">
            Controle e monitore suas estratégias de apostas automatizadas
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* WebSocket Connection Status */}
          <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
          
          <Badge variant={systemStatus.isRunning ? "default" : "secondary"}>
            {systemStatus.isRunning ? "Ativo" : "Inativo"}
          </Badge>
          
          {systemStatus.emergencyStop && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Parada de Emergência
            </Badge>
          )}
        </div>
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 3).map((notification) => (
            <Alert key={notification.id} variant={notification.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription className="flex items-center justify-between">
                <span>{notification.message}</span>
                <span className="text-xs text-muted-foreground">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sessões Ativas</p>
                <p className="text-2xl font-bold">{systemStatus.activeSessions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lucro Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {Number(systemStatus.totalProfit ?? 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{Number(metrics.successRate ?? 0).toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Resposta</p>
                <p className="text-2xl font-bold">{metrics.avgResponseTime}ms</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {!systemStatus.isInitialized && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Inicialização do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              O sistema de automação precisa ser inicializado antes do uso.
            </p>
            <Button onClick={handleSystemInitialize} className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Inicializar Sistema</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Automation Interface */}
      {systemStatus.isInitialized && (
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="controls">Controles</TabsTrigger>
            <TabsTrigger value="betting">Apostas</TabsTrigger>
            <TabsTrigger value="risk">Análise de Risco</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <AutomationDashboard />
            <MetricsPanel metrics={metrics} />
          </TabsContent>

          <TabsContent value="controls" className="space-y-4">
            <QuickControls />
            
            {/* Parada de Emergência com confirmação */}
            <EmergencyStop />
          </TabsContent>

          <TabsContent value="betting" className="space-y-4">
            <BettingAutomationPanel 
              tableId="roulette-1"
              suggestedBets={[]}
              strategyName="default"
            />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <SessionManagementPanel />
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <AdvancedRiskPanel 
              riskMetrics={riskMetrics}
              advancedMetrics={advancedMetrics}
              riskAlerts={riskAlerts}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Configurações avançadas do sistema de automação em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        Última atualização: <span suppressHydrationWarning>{formatTimeHHMMSS(systemStatus.lastUpdate)}</span>
      </div>
    </div>
  );
}