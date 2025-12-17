'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Bot, 
  Settings, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

import IframeIntegration from '@/components/betting/iframe-integration';
import { useBettingApi, BettingConfig } from '@/lib/api/betting-api';

export default function BettingPage() {
  const {
    currentSession,
    isLoading,
    error,
    createSession,
    terminateSession,
    startAutomation,
    stopAutomation,
    pauseAutomation,
    placeBet,
    clearError
  } = useBettingApi();

  const [config, setConfig] = useState<BettingConfig>({
    strategy: 'conservative',
    maxBetAmount: 5.00,
    minBetAmount: 0.50,
    maxDailyLoss: 100.00,
    maxSessionLoss: 50.00,
    maxConsecutiveLosses: 5,
    sessionDuration: 60 * 60 * 1000, // 1 hora
  });

  const [manualBet, setManualBet] = useState({
    numbers: '',
    amount: 1.00
  });

  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalBets: 0,
    totalProfit: 0,
    winRate: 0
  });

  // Inicializar sessão automaticamente
  useEffect(() => {
    if (!currentSession && !isLoading) {
      handleCreateSession();
    }
  }, []);

  /**
   * Criar nova sessão
   */
  const handleCreateSession = async () => {
    try {
      await createSession(config);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
    }
  };

  /**
   * Iniciar automação
   */
  const handleStartAutomation = async () => {
    try {
      await startAutomation(config);
    } catch (error) {
      console.error('Erro ao iniciar automação:', error);
    }
  };

  /**
   * Parar automação
   */
  const handleStopAutomation = async () => {
    try {
      await stopAutomation('user_request');
    } catch (error) {
      console.error('Erro ao parar automação:', error);
    }
  };

  /**
   * Pausar automação
   */
  const handlePauseAutomation = async () => {
    try {
      await pauseAutomation();
    } catch (error) {
      console.error('Erro ao pausar automação:', error);
    }
  };

  /**
   * Fazer aposta manual
   */
  const handleManualBet = async () => {
    try {
      const numbers = manualBet.numbers
        .split(',')
        .map(n => parseInt(n.trim()))
        .filter(n => !isNaN(n) && n >= 0 && n <= 36);

      if (numbers.length === 0) {
        throw new Error('Números inválidos');
      }

      await placeBet({
        numbers,
        amount: manualBet.amount
      });

      // Limpar formulário
      setManualBet({ numbers: '', amount: 1.00 });
    } catch (error) {
      console.error('Erro ao fazer aposta manual:', error);
    }
  };

  /**
   * Atualizar configuração
   */
  const handleConfigChange = (key: keyof BettingConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Sistema de Apostas Automáticas
          </h1>
          <p className="text-muted-foreground mt-1">
            Automação inteligente para apostas na roleta
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={currentSession ? "default" : "secondary"}>
            {currentSession ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> Sessão Ativa</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> Sem Sessão</>
            )}
          </Badge>
          
          {currentSession && (
            <Button
              size="sm"
              variant="outline"
              onClick={terminateSession}
              disabled={isLoading}
            >
              <Square className="h-4 w-4 mr-1" />
              Encerrar Sessão
            </Button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button size="sm" variant="ghost" onClick={clearError}>
              Fechar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                <p className="text-2xl font-bold">{stats.activeSessions}</p>
              </div>
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Apostas</p>
                <p className="text-2xl font-bold">{stats.totalBets}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Total</p>
                <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {stats.totalProfit.toFixed(2)}
                </p>
              </div>
              {stats.totalProfit >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Vitória</p>
                <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="automation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="manual">Aposta Manual</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba de Automação */}
        <TabsContent value="automation" className="space-y-6">
          <IframeIntegration />
        </TabsContent>

        {/* Aba de Aposta Manual */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Aposta Manual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numbers">Números (separados por vírgula)</Label>
                  <Input
                    id="numbers"
                    placeholder="Ex: 1, 5, 12, 23"
                    value={manualBet.numbers}
                    onChange={(e) => setManualBet(prev => ({ ...prev, numbers: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite os números de 0 a 36 separados por vírgula
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor da Aposta (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.50"
                    max="100"
                    step="0.50"
                    value={manualBet.amount}
                    onChange={(e) => setManualBet(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <Button
                onClick={handleManualBet}
                disabled={!currentSession || isLoading || !manualBet.numbers.trim()}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Fazer Aposta
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Configurações */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Automação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estratégia */}
              <div className="space-y-2">
                <Label>Estratégia de Apostas</Label>
                <div className="flex gap-2">
                  {['conservative', 'balanced', 'aggressive'].map((strategy) => (
                    <Button
                      key={strategy}
                      size="sm"
                      variant={config.strategy === strategy ? "default" : "outline"}
                      onClick={() => handleConfigChange('strategy', strategy)}
                    >
                      {strategy === 'conservative' ? 'Conservadora' :
                       strategy === 'balanced' ? 'Equilibrada' : 'Agressiva'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Limites de Aposta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aposta Mínima (R$)</Label>
                  <Input
                    type="number"
                    min="0.50"
                    step="0.50"
                    value={config.minBetAmount}
                    onChange={(e) => handleConfigChange('minBetAmount', parseFloat(e.target.value) || 0.50)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Aposta Máxima (R$)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={config.maxBetAmount}
                    onChange={(e) => handleConfigChange('maxBetAmount', parseFloat(e.target.value) || 5)}
                  />
                </div>
              </div>

              {/* Limites de Perda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Perda Máxima por Sessão (R$)</Label>
                  <Input
                    type="number"
                    min="10"
                    step="10"
                    value={config.maxSessionLoss}
                    onChange={(e) => handleConfigChange('maxSessionLoss', parseFloat(e.target.value) || 50)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Perda Máxima Diária (R$)</Label>
                  <Input
                    type="number"
                    min="50"
                    step="50"
                    value={config.maxDailyLoss}
                    onChange={(e) => handleConfigChange('maxDailyLoss', parseFloat(e.target.value) || 100)}
                  />
                </div>
              </div>

              {/* Perdas Consecutivas */}
              <div className="space-y-2">
                <Label>Máximo de Perdas Consecutivas: {config.maxConsecutiveLosses}</Label>
                <Slider
                  value={[config.maxConsecutiveLosses || 5]}
                  onValueChange={([value]) => handleConfigChange('maxConsecutiveLosses', value)}
                  min={3}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleCreateSession}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Aplicar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Estatísticas */}
        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas Detalhadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Estatísticas detalhadas serão exibidas aqui quando houver dados disponíveis.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}