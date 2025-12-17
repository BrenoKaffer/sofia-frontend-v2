'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useWebSocket, 
  useRouletteData, 
  useAISignals, 
  useLiveMetrics,
  useUserNotifications 
} from '@/hooks/useWebSocket';
import { ConnectionState, WEBSOCKET_CHANNELS } from '@/lib/websocket-client';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Users, 
  TrendingUp, 
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface LiveDataDashboardProps {
  token?: string;
  autoConnect?: boolean;
}

export function LiveDataDashboard({ token, autoConnect = true }: LiveDataDashboardProps) {
  const {
    connectionState,
    isConnected,
    isAuthenticated,
    connect,
    disconnect,
    reconnectAttempts,
    subscriptions
  } = useWebSocket({ token, autoConnect });

  const { currentResult, recentResults } = useRouletteData();
  const { currentSignal, recentSignals } = useAISignals();
  const { metrics } = useLiveMetrics();
  const { notifications, unreadCount, markAsRead, clearAll } = useUserNotifications();

  const [showNotifications, setShowNotifications] = useState(false);

  // Função para obter cor do status da conexão
  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
      case ConnectionState.AUTHENTICATED:
        return 'text-green-500';
      case ConnectionState.CONNECTING:
        return 'text-yellow-500';
      case ConnectionState.ERROR:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Função para obter ícone do status da conexão
  const getConnectionIcon = () => {
    if (isConnected) {
      return <Wifi className="h-4 w-4" />;
    }
    return <WifiOff className="h-4 w-4" />;
  };

  // Função para obter cor da roleta
  const getRouletteColor = (number: number) => {
    if (number === 0) return 'bg-green-500';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(number) ? 'bg-red-500' : 'bg-black';
  };

  // Função para formatar timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com status da conexão */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard em Tempo Real</h1>
        
        <div className="flex items-center space-x-4">
          {/* Status da conexão */}
          <div className={`flex items-center space-x-2 ${getConnectionStatusColor()}`}>
            {getConnectionIcon()}
            <span className="text-sm font-medium">
              {connectionState.charAt(0).toUpperCase() + connectionState.slice(1)}
            </span>
          </div>

          {/* Notificações */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Controles de conexão */}
          <div className="flex space-x-2">
            {!isConnected ? (
              <Button onClick={() => connect(token)} size="sm">
                Conectar
              </Button>
            ) : (
              <Button onClick={disconnect} variant="outline" size="sm">
                Desconectar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Alertas de conexão */}
      {connectionState === ConnectionState.ERROR && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro na conexão WebSocket. Tentativas de reconexão: {reconnectAttempts}
          </AlertDescription>
        </Alert>
      )}

      {!isAuthenticated && isConnected && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Conectado, mas aguardando autenticação...
          </AlertDescription>
        </Alert>
      )}

      {/* Painel de notificações */}
      {showNotifications && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notificações</CardTitle>
            <Button onClick={clearAll} variant="outline" size="sm">
              Limpar Todas
            </Button>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-gray-500">Nenhuma notificação</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((notif, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${notif.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{notif.title}</h4>
                        <p className="text-sm text-gray-600">{notif.message}</p>
                        <span className="text-xs text-gray-400">
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Métricas em tempo real */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Métricas do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Usuários Ativos:</span>
                  <span className="font-medium">{metrics.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total de Apostas:</span>
                  <span className="font-medium">{metrics.totalBets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Taxa de Vitória:</span>
                  <span className="font-medium">{metrics.winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Carga do Sistema:</span>
                  <span className="font-medium">{metrics.systemLoad}%</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Atualizado: {formatTime(metrics.timestamp)}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Aguardando dados...</p>
            )}
          </CardContent>
        </Card>

        {/* Resultados da roleta */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Roleta</CardTitle>
          </CardHeader>
          <CardContent>
            {currentResult ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div 
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-xl font-bold ${getRouletteColor(currentResult.result)}`}
                  >
                    {currentResult.result}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Mesa: {currentResult.tableId}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTime(currentResult.timestamp)}
                  </p>
                </div>
                
                {/* Histórico recente */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Últimos Resultados:</h4>
                  <div className="flex flex-wrap gap-1">
                    {recentResults.slice(0, 10).map((result, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 rounded-full text-white text-xs flex items-center justify-center ${getRouletteColor(result.result)}`}
                      >
                        {result.result}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Aguardando resultados...</p>
            )}
          </CardContent>
        </Card>

        {/* Sinais de IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Sinais de IA</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentSignal ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estratégia:</span>
                  <Badge variant="outline">{currentSignal.strategy}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confiança:</span>
                  <span className="font-medium">{currentSignal.confidence}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recomendação:</span>
                  <Badge 
                    variant={currentSignal.recommendation === 'bet' ? 'default' : 'secondary'}
                  >
                    {currentSignal.recommendation === 'bet' ? 'Apostar' : 'Aguardar'}
                  </Badge>
                </div>
                
                {currentSignal.targetNumbers && (
                  <div>
                    <span className="text-sm text-gray-600">Números Alvo:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentSignal.targetNumbers.map((num: number, index: number) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  Mesa: {currentSignal.tableId} | {formatTime(currentSignal.timestamp)}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Aguardando sinais...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações de debug */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Conexão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <p className="font-medium">{connectionState}</p>
            </div>
            <div>
              <span className="text-gray-600">Tentativas:</span>
              <p className="font-medium">{reconnectAttempts}</p>
            </div>
            <div>
              <span className="text-gray-600">Inscrições:</span>
              <p className="font-medium">{subscriptions.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Canais:</span>
              <p className="font-medium">{subscriptions.join(', ') || 'Nenhum'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}