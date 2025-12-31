'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Settings, 
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  BarChart3,
  Users,
  Activity
} from 'lucide-react';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { Session, Strategy } from '@/types/session-management';
import { formatCurrency, formatPercentage, formatDuration } from '@/lib/utils';

interface SessionManagementPanelProps {
  className?: string;
}

export function SessionManagementPanel({ className }: SessionManagementPanelProps) {
  const {
    sessions,
    strategies,
    metrics,
    loading,
    error,
    startSession,
    pauseSession,
    stopSession,
    createSession
  } = useSessionManagement();

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const activeSession = sessions.find(s => s.status === 'active');
  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'paused');

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Session['status']) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'stopped': return 'Parada';
      case 'completed': return 'Concluída';
      default: return 'Desconhecido';
    }
  };

  const handleSessionAction = async (sessionId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      switch (action) {
        case 'start':
          await startSession(sessionId);
          break;
        case 'pause':
          await pauseSession(sessionId);
          break;
        case 'stop':
          await stopSession(sessionId);
          break;
      }
    } catch (err) {
      console.error('Erro ao executar ação na sessão:', err);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Carregando sessões...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Resumo das Sessões */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Sessões Ativas</p>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total de Sessões</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Lucro Total</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.totalProfit || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Duração Média</p>
                <p className="text-2xl font-bold">{formatDuration(metrics?.averageSessionDuration || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessão Ativa */}
      {activeSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span>Sessão Ativa: {activeSession.name}</span>
              </span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSessionAction(activeSession.id, 'pause')}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pausar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleSessionAction(activeSession.id, 'stop')}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Parar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Estratégia</p>
                <p className="font-semibold">{activeSession.strategy.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Apostas</p>
                <p className="font-semibold">{activeSession.currentStats.totalBets}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lucro Atual</p>
                <p className={`font-semibold ${activeSession.currentStats.currentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(activeSession.currentStats.currentProfit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Taxa de Vitória</p>
                <p className="font-semibold">
                  {formatPercentage(activeSession.currentStats.winningBets / Math.max(activeSession.currentStats.totalBets, 1))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="strategies">Estratégias</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Todas as Sessões</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
          </div>

          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(session.status)}`} />
                      <div>
                        <h4 className="font-semibold">{session.name}</h4>
                        <p className="text-sm text-gray-600">{session.strategy.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Lucro</p>
                        <p className={`font-semibold ${session.currentStats.currentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(session.currentStats.currentProfit)}
                        </p>
                      </div>
                      
                      <Badge variant="outline">
                        {getStatusText(session.status)}
                      </Badge>
                      
                      <div className="flex space-x-1">
                        {session.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSessionAction(session.id, 'start')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {session.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSessionAction(session.id, 'pause')}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {(session.status === 'active' || session.status === 'paused') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSessionAction(session.id, 'stop')}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Estratégias Disponíveis</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Estratégia
            </Button>
          </div>

          <div className="grid gap-4">
            {strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{strategy.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{strategy.description}</p>
                      <div className="flex space-x-4 text-sm">
                        <span>Tipo: <Badge variant="outline">{strategy.type}</Badge></span>
                        <span>Risco: {formatPercentage(strategy.parameters.riskPercentage / 100)}</span>
                        <span>Stop Loss: {formatPercentage(strategy.parameters.stopLoss / 100)}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Performance</p>
                        <p className="font-semibold">Taxa: {formatPercentage(strategy.performance.winRate / 100)}</p>
                        <p className={`text-sm ${strategy.performance.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(strategy.performance.totalProfit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <h3 className="text-lg font-semibold">Análises de Performance</h3>
          
          {metrics && (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Melhor Estratégia</p>
                      <p className="font-semibold">{metrics.bestPerformingStrategy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pior Estratégia</p>
                      <p className="font-semibold">{metrics.worstPerformingStrategy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duração Média</p>
                      <p className="font-semibold">{formatDuration(metrics.averageSessionDuration)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Lucro Total</p>
                      <p className={`font-semibold ${metrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(metrics.totalProfit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}