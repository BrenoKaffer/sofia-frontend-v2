'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IframeBettingProvider } from '@/components/betting/iframe-betting-provider';
import RealBettingAutomation from './real-betting-automation';
import { 
  Bot, 
  Globe, 
  Zap, 
  Shield, 
  Play, 
  Pause, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Activity,
  Eye,
  EyeOff,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Monitor,
  Chrome
} from 'lucide-react';

// Tipos para automação
interface BettingCredentials {
  email: string;
  password: string;
  site: string;
}

interface AutomationConfig {
  provider: 'iframe' | 'puppeteer' | 'extension';
  autoLogin: boolean;
  maxBetAmount: number;
  stopLossLimit: number;
  takeProfitLimit: number;
  maxConsecutiveLosses: number;
  betDelay: number;
}

interface AutomationStatus {
  isConnected: boolean;
  isRunning: boolean;
  currentProvider: string;
  lastBet?: {
    amount: number;
    numbers: number[];
    result: 'win' | 'loss' | 'pending';
    timestamp: string;
  };
  session: {
    totalBets: number;
    wins: number;
    losses: number;
    profit: number;
    startTime: string;
  };
}

interface BettingAutomationPanelProps {
  tableId: string;
  suggestedBets: (string | number)[];
  strategyName: string;
  onAutomationToggle?: (enabled: boolean) => void;
}

export function BettingAutomationPanel({
  tableId,
  suggestedBets,
  strategyName,
  onAutomationToggle
}: BettingAutomationPanelProps) {
  // Estados
  const [activeTab, setActiveTab] = useState<'simulation' | 'real'>('simulation');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<BettingCredentials>({
    email: '',
    password: '',
    site: 'bet365'
  });
  
  const [config, setConfig] = useState<AutomationConfig>({
    provider: 'puppeteer', // Mudando para puppeteer como padrão
    autoLogin: true,
    maxBetAmount: 10,
    stopLossLimit: 50,
    takeProfitLimit: 100,
    maxConsecutiveLosses: 3,
    betDelay: 2000
  });
  
  const [status, setStatus] = useState<AutomationStatus>({
    isConnected: false,
    isRunning: false,
    currentProvider: 'BetGorillas',
    session: {
      totalBets: 0,
      wins: 0,
      losses: 0,
      profit: 0,
      startTime: new Date().toISOString()
    }
  });

  // Estados específicos do BetGorillas
  const [betGorillasConfig, setBetGorillasConfig] = useState({
    gameUrl: 'https://betgorillas.bet.br/games/imaginelive/roleta-brasileira',
    betAmount: 1,
    betType: 'number' as 'number' | 'color' | 'even_odd' | 'high_low',
    targetNumbers: [] as number[],
    targetColor: 'red' as 'red' | 'black',
    riskManagement: {
      maxLossStreak: 3,
      stopLoss: 50,
      takeProfit: 100,
      martingaleEnabled: false,
      martingaleMultiplier: 2
    }
  });

  const [connectionProgress, setConnectionProgress] = useState(0);
  const [automationLogs, setAutomationLogs] = useState<string[]>([]);

  // Função para adicionar logs
  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setAutomationLogs(prev => [...prev.slice(-19), logMessage]); // Manter apenas os últimos 20 logs
  }, []);

  // Conectar ao BetGorillas
  const connectToBetGorillas = useCallback(async () => {
    try {
      addLog('Iniciando conexão com BetGorillas...', 'info');
      setConnectionProgress(10);

      // Simular processo de conexão
      const response = await fetch('/api/betting/betgorillas/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameUrl: betGorillasConfig.gameUrl,
          config: {
            headless: false,
            devtools: true
          }
        })
      });

      setConnectionProgress(50);
      
      if (!response.ok) {
        throw new Error('Falha na conexão');
      }

      const result = await response.json();
      setConnectionProgress(100);

      if (result.success) {
        setStatus(prev => ({ ...prev, isConnected: true }));
        addLog('✅ Conectado ao BetGorillas com sucesso!', 'success');
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }

    } catch (error) {
      addLog(`❌ Erro na conexão: ${error}`, 'error');
      setConnectionProgress(0);
    }
  }, [betGorillasConfig.gameUrl, addLog]);

  // Iniciar automação
  const startAutomation = useCallback(async () => {
    if (!status.isConnected) {
      addLog('❌ Conecte-se primeiro ao BetGorillas', 'error');
      return;
    }

    try {
      addLog('🚀 Iniciando automação de apostas...', 'info');

      const response = await fetch('/api/betting/betgorillas/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: betGorillasConfig,
          suggestedBets: suggestedBets.map(bet => ({
            type: betGorillasConfig.betType,
            value: bet,
            amount: betGorillasConfig.betAmount
          }))
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus(prev => ({ 
          ...prev, 
          isRunning: true,
          session: { ...prev.session, startTime: new Date().toISOString() }
        }));
        addLog('✅ Automação iniciada com sucesso!', 'success');
        onAutomationToggle?.(true);
      } else {
        throw new Error(result.error || 'Falha ao iniciar automação');
      }

    } catch (error) {
      addLog(`❌ Erro ao iniciar automação: ${error}`, 'error');
    }
  }, [status.isConnected, betGorillasConfig, suggestedBets, addLog, onAutomationToggle]);

  // Parar automação
  const stopAutomation = useCallback(async () => {
    try {
      addLog('🛑 Parando automação...', 'info');

      const response = await fetch('/api/betting/betgorillas/stop', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        setStatus(prev => ({ ...prev, isRunning: false }));
        addLog('✅ Automação parada com sucesso!', 'success');
        onAutomationToggle?.(false);
      } else {
        throw new Error(result.error || 'Falha ao parar automação');
      }

    } catch (error) {
      addLog(`❌ Erro ao parar automação: ${error}`, 'error');
    }
  }, [addLog, onAutomationToggle]);

  const [logs, setLogs] = useState<string[]>([]);

  // Funções de automação (simuladas - serão conectadas ao backend)
  const connectToSite = useCallback(async () => {
    setConnectionProgress(0);
    addLog('Iniciando conexão...');
    
    // Simular progresso de conexão
    const steps = [
      'Inicializando provedor...',
      'Conectando ao site...',
      'Fazendo login...',
      'Navegando para a roleta...',
      'Conexão estabelecida!'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConnectionProgress((i + 1) * 20);
      addLog(steps[i]);
    }

    setStatus(prev => ({ ...prev, isConnected: true }));
    addLog('✅ Pronto para automação');
  }, [addLog]);

  // Simular execução de aposta quando há sinais
  useEffect(() => {
    if (status.isRunning && suggestedBets.length > 0) {
      const timer = setTimeout(() => {
        const betAmount = Math.min(config.maxBetAmount, 5);
        const numbers = suggestedBets.slice(0, 6).map(bet => 
          typeof bet === 'string' ? parseInt(bet) : bet
        ).filter(num => num >= 0 && num <= 36);

        if (numbers.length > 0) {
          addLog(`💰 Executando aposta: ${numbers.join(', ')} - R$ ${betAmount}`);
          
          // Simular resultado após delay
          setTimeout(() => {
            const isWin = Math.random() > 0.6; // 40% chance de vitória
            const profit = isWin ? betAmount * 2 : -betAmount;
            
            setStatus(prev => ({
              ...prev,
              lastBet: {
                amount: betAmount,
                numbers,
                result: isWin ? 'win' : 'loss',
                timestamp: new Date().toISOString()
              },
              session: {
                ...prev.session,
                totalBets: prev.session.totalBets + 1,
                wins: prev.session.wins + (isWin ? 1 : 0),
                losses: prev.session.losses + (isWin ? 0 : 1),
                profit: prev.session.profit + profit
              }
            }));

            addLog(isWin ? 
              `✅ Vitória! +R$ ${betAmount * 2}` : 
              `❌ Derrota! -R$ ${betAmount}`
            );
          }, 3000);
        }
      }, config.betDelay * 1000);

      return () => clearTimeout(timer);
    }
  }, [status.isRunning, suggestedBets, config.maxBetAmount, config.betDelay, addLog]);

  const winRate = status.session.totalBets > 0 ? 
    (status.session.wins / status.session.totalBets) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-lg">Automação de Apostas</CardTitle>
            <Badge variant={status.isRunning ? "default" : "secondary"} className="text-xs">
              {status.isRunning ? 'Ativo' : status.isConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        <CardDescription>
          Mesa: {tableId} | Estratégia: {strategyName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Abas de Navegação */}
        <div className="flex space-x-1 bg-black/20 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'simulation'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Simulação
          </button>
          <button
            onClick={() => setActiveTab('real')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'real'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Automação Real
          </button>
        </div>

        {/* Conteúdo da Aba Simulação */}
        {activeTab === 'simulation' && (
          <>
            {/* Status e Controles Principais */}
            <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                status.isConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-sm">
                {status.isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {config.provider.toUpperCase()}
            </Badge>
          </div>

          <div className="flex gap-2">
            {!status.isRunning ? (
              <Button
                size="sm"
                onClick={startAutomation}
                disabled={!suggestedBets.length}
                className="bg-green-600 hover:bg-green-500"
              >
                <Play className="w-4 h-4 mr-1" />
                Iniciar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={stopAutomation}
              >
                <Pause className="w-4 h-4 mr-1" />
                Pausar
              </Button>
            )}
          </div>
        </div>

        {/* Progresso de Conexão */}
        {connectionProgress > 0 && connectionProgress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Conectando...</span>
              <span>{connectionProgress}%</span>
            </div>
            <Progress value={connectionProgress} className="h-2" />
          </div>
        )}

        {/* Métricas da Sessão */}
        {status.session.totalBets > 0 && (
          <div className="grid grid-cols-4 gap-3 p-3 bg-black/20 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold">{status.session.totalBets}</div>
              <div className="text-xs text-muted-foreground">Apostas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{status.session.wins}</div>
              <div className="text-xs text-muted-foreground">Vitórias</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{winRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Taxa</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                status.session.profit >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                R$ {status.session.profit.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Lucro</div>
            </div>
          </div>
        )}

        {/* Configurações Expandidas */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            {/* Configurações específicas do BetGorillas */}
            {config.provider === 'puppeteer' && (
              <div className="space-y-4 p-4 bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-orange-400" />
                  <Label className="text-sm font-medium text-orange-200">Configurações BetGorillas</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Valor da Aposta (R$)</Label>
                    <Input
                      type="number"
                      value={betGorillasConfig.betAmount}
                      onChange={(e) => setBetGorillasConfig(prev => ({ 
                        ...prev, 
                        betAmount: Number(e.target.value) 
                      }))}
                      min="1"
                      max="100"
                      className="bg-black/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Tipo de Aposta</Label>
                    <Select
                      value={betGorillasConfig.betType}
                      onValueChange={(value: 'number' | 'color' | 'even_odd' | 'high_low') =>
                        setBetGorillasConfig(prev => ({ ...prev, betType: value }))
                      }
                    >
                      <SelectTrigger className="bg-black/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Números Específicos</SelectItem>
                        <SelectItem value="color">Cor (Vermelho/Preto)</SelectItem>
                        <SelectItem value="even_odd">Par/Ímpar</SelectItem>
                        <SelectItem value="high_low">Alto/Baixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {betGorillasConfig.betType === 'color' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Cor Alvo</Label>
                    <Select
                      value={betGorillasConfig.targetColor}
                      onValueChange={(value: 'red' | 'black') =>
                        setBetGorillasConfig(prev => ({ ...prev, targetColor: value }))
                      }
                    >
                      <SelectTrigger className="bg-black/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="red">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            Vermelho
                          </div>
                        </SelectItem>
                        <SelectItem value="black">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-800 rounded-full border border-gray-600" />
                            Preto
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator className="bg-orange-500/20" />

                {/* Gerenciamento de Risco */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-400" />
                    <Label className="text-sm font-medium text-orange-200">Gerenciamento de Risco</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Stop Loss (R$)</Label>
                      <Input
                        type="number"
                        value={betGorillasConfig.riskManagement.stopLoss}
                        onChange={(e) => setBetGorillasConfig(prev => ({ 
                          ...prev, 
                          riskManagement: {
                            ...prev.riskManagement,
                            stopLoss: Number(e.target.value)
                          }
                        }))}
                        min="10"
                        max="1000"
                        className="bg-black/20"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Take Profit (R$)</Label>
                      <Input
                        type="number"
                        value={betGorillasConfig.riskManagement.takeProfit}
                        onChange={(e) => setBetGorillasConfig(prev => ({ 
                          ...prev, 
                          riskManagement: {
                            ...prev.riskManagement,
                            takeProfit: Number(e.target.value)
                          }
                        }))}
                        min="20"
                        max="2000"
                        className="bg-black/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Máximo de Derrotas Consecutivas</Label>
                    <Input
                      type="number"
                      value={betGorillasConfig.riskManagement.maxLossStreak}
                      onChange={(e) => setBetGorillasConfig(prev => ({ 
                        ...prev, 
                        riskManagement: {
                          ...prev.riskManagement,
                          maxLossStreak: Number(e.target.value)
                        }
                      }))}
                      min="1"
                      max="10"
                      className="bg-black/20"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm">Martingale</Label>
                      <p className="text-xs text-muted-foreground">Dobrar aposta após derrota</p>
                    </div>
                    <Switch
                      checked={betGorillasConfig.riskManagement.martingaleEnabled}
                      onCheckedChange={(checked) => setBetGorillasConfig(prev => ({ 
                        ...prev, 
                        riskManagement: {
                          ...prev.riskManagement,
                          martingaleEnabled: checked
                        }
                      }))}
                    />
                  </div>

                  {betGorillasConfig.riskManagement.martingaleEnabled && (
                    <div className="space-y-2">
                      <Label className="text-sm">Multiplicador Martingale</Label>
                      <Input
                        type="number"
                        value={betGorillasConfig.riskManagement.martingaleMultiplier}
                        onChange={(e) => setBetGorillasConfig(prev => ({ 
                          ...prev, 
                          riskManagement: {
                            ...prev.riskManagement,
                            martingaleMultiplier: Number(e.target.value)
                          }
                        }))}
                        min="1.5"
                        max="5"
                        step="0.1"
                        className="bg-black/20"
                      />
                    </div>
                  )}
                </div>

                {/* Botão de Conexão BetGorillas */}
                <div className="flex gap-2">
                  <Button
                    onClick={connectToBetGorillas}
                    disabled={status.isConnected}
                    className="flex-1 bg-orange-600 hover:bg-orange-500"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    {status.isConnected ? 'Conectado ao BetGorillas' : 'Conectar ao BetGorillas'}
                  </Button>
                </div>
              </div>
            )}

            {/* Provedor */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Provedor de Automação</Label>
                <Select
                  value={config.provider}
                  onValueChange={(value: 'iframe' | 'puppeteer' | 'extension') =>
                    setConfig(prev => ({ ...prev, provider: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iframe">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Iframe (Recomendado)
                      </div>
                    </SelectItem>
                    <SelectItem value="puppeteer">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        Puppeteer - BetGorillas
                      </div>
                    </SelectItem>
                    <SelectItem value="extension">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Extensão (Beta)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

            {/* Configurações de Risco */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Aposta Máxima (R$)</Label>
                <Input
                  type="number"
                  value={config.maxBetAmount}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    maxBetAmount: Number(e.target.value) 
                  }))}
                  min="1"
                  max="1000"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Delay entre Apostas (s)</Label>
                <Input
                  type="number"
                  value={config.betDelay}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    betDelay: Number(e.target.value) 
                  }))}
                  min="1"
                  max="60"
                />
              </div>
            </div>

            {/* Credenciais */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Credenciais da Casa de Apostas</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCredentials(!showCredentials)}
                >
                  {showCredentials ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              {showCredentials && (
                <div className="space-y-3 p-3 bg-black/20 rounded-lg">
                  <Select
                    value={credentials.site}
                    onValueChange={(value) => setCredentials(prev => ({ ...prev, site: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bet365">Bet365</SelectItem>
                      <SelectItem value="betfair">Betfair</SelectItem>
                      <SelectItem value="betano">Betano</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="email"
                    placeholder="Email/CPF"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  />
                  
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Logs */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Log de Atividades</Label>
              <div className="bg-black/40 rounded-lg p-3 h-32 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma atividade ainda
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div key={index} className="text-xs font-mono text-gray-300">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Alertas */}
        {!status.isConnected && suggestedBets.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Há sinais disponíveis! Conecte-se para iniciar a automação.
            </AlertDescription>
          </Alert>
        )}

        {/* Iframe Betting Provider */}
        {config.provider === 'iframe' && (
          <IframeBettingProvider
            suggestedBets={suggestedBets}
            autoExecute={status.isRunning}
            onBetExecuted={(result) => {
              // Atualizar estatísticas da sessão
              const isWin = result.bets.some((bet: any) => bet.status === 'placed');
              const profit = isWin ? result.totalAmount : -result.totalAmount;
              
              setStatus(prev => ({
                ...prev,
                lastBet: {
                  amount: result.totalAmount,
                  numbers: result.bets.map((bet: any) => bet.number),
                  result: isWin ? 'win' : 'loss',
                  timestamp: result.timestamp
                },
                session: {
                  ...prev.session,
                  totalBets: prev.session.totalBets + 1,
                  wins: prev.session.wins + (isWin ? 1 : 0),
                  losses: prev.session.losses + (isWin ? 0 : 1),
                  profit: prev.session.profit + profit
                }
              }));

              addLog(isWin ? 
                `✅ Aposta executada via iframe: ${result.bets.length} números` : 
                `❌ Erro na execução via iframe`
              );
            }}
            onConnectionChange={(connectionStatus) => {
              setStatus(prev => ({
                ...prev,
                isConnected: connectionStatus.isConnected && connectionStatus.tableReady,
                currentProvider: 'iframe'
              }));

              if (connectionStatus.isConnected) {
                addLog(`🔗 Conectado via iframe: ${connectionStatus.currentSite}`);
              }
              if (connectionStatus.tableReady) {
                addLog('🎰 Mesa de roleta pronta para apostas');
              }
            }}
            onError={(error) => {
              addLog(`❌ Erro iframe: ${error}`);
              setStatus(prev => ({
                ...prev,
                isConnected: false,
                isRunning: false
              }));
            }}
          />
        )}
          </>
        )}

        {/* Conteúdo da Aba Automação Real */}
        {activeTab === 'real' && (
          <RealBettingAutomation
            tableId={tableId}
            suggestedBets={suggestedBets}
            strategyName={strategyName}
            onAutomationToggle={onAutomationToggle}
          />
        )}
      </CardContent>
    </Card>
  );
}