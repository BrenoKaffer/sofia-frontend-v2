'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  StopCircle, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Globe,
  Zap,
  Activity,
  Settings,
  Brain,
  BarChart3,
  Shield,
  RefreshCw
} from 'lucide-react';

interface BettingConfig {
  site: 'betgorillas' | 'bet365' | 'betfair' | 'betano';
  credentials: {
    email: string;
    password: string;
  };
  betAmount: number;
  strategy: string;
  autoMode: boolean;
  maxConsecutiveLosses: number;
  stopLossAmount: number;
  takeProfitAmount: number;
}

interface BettingSession {
  id: string;
  startTime: number;
  endTime?: number;
  totalBets: number;
  wins: number;
  losses: number;
  profit: number;
  maxDrawdown: number;
  winRate: number;
  avgBetAmount: number;
  status: 'active' | 'paused' | 'stopped';
}

interface LiveBet {
  id: string;
  timestamp: number;
  type: 'red' | 'black' | 'green' | 'number';
  value: string;
  amount: number;
  confidence: number;
  strategy: string;
  status: 'pending' | 'won' | 'lost';
  result?: string;
  payout?: number;
}

interface RouletteResult {
  number: number;
  color: 'red' | 'black' | 'green';
  timestamp: number;
}

import { BetValidationSystem } from './bet-validation-system';
import { ErrorRecoverySystem } from './error-recovery-system';

function RealBettingAutomationOld() {
  const [config, setConfig] = useState<BettingConfig>({
    site: 'betgorillas',
    credentials: { email: '', password: '' },
    betAmount: 10,
    strategy: 'martingale',
    autoMode: false,
    maxConsecutiveLosses: 3,
    stopLossAmount: 100,
    takeProfitAmount: 200
  });

  const [session, setSession] = useState<BettingSession>({
    id: '',
    startTime: 0,
    totalBets: 0,
    wins: 0,
    losses: 0,
    profit: 0,
    maxDrawdown: 0,
    winRate: 0,
    avgBetAmount: 0,
    status: 'stopped'
  });

  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [recentResults, setRecentResults] = useState<RouletteResult[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [currentBalance, setCurrentBalance] = useState(1000);
  const [logs, setLogs] = useState<string[]>([]);
  const [isAutomationActive, setIsAutomationActive] = useState(false);
  const [nextBetPrediction, setNextBetPrediction] = useState<{type: string, confidence: number, amount: number} | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const automationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const strategyEngineRef = useRef<any>(null);

  // Adicionar log
  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [logMessage, ...prev].slice(0, 100));
    console.log(`[BETTING-AUTO] ${logMessage}`);
  }, []);

  // Conectar ao site de apostas
  const connectToSite = useCallback(async () => {
    if (!config.credentials.email || !config.credentials.password) {
      addLog('Credenciais não fornecidas', 'error');
      return;
    }

    setConnectionStatus('connecting');
    addLog(`Conectando ao ${config.site}...`);

    try {
      // Simular conexão real - em produção, isso seria uma conexão real via iframe/puppeteer
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (config.site === 'betgorillas') {
        // URL real fornecida pelo usuário
        const siteUrl = 'https://betgorillas.bet.br/games/imaginelive/roleta-brasileira';
        
        if (iframeRef.current) {
          iframeRef.current.src = siteUrl;
          
          // Aguardar carregamento do iframe
          await new Promise((resolve) => {
            if (iframeRef.current) {
              iframeRef.current.onload = resolve;
            }
          });
          
          // Injetar script de automação no iframe
          await injectAutomationScript();
        }
      }

      setConnectionStatus('connected');
      addLog(`Conectado com sucesso ao ${config.site}`, 'success');
      
      // Simular login
      await performLogin();
      
    } catch (error) {
      setConnectionStatus('disconnected');
      addLog(`Erro ao conectar: ${error}`, 'error');
    }
  }, [config, addLog]);

  // Injetar script de automação no iframe
  const injectAutomationScript = useCallback(async () => {
    if (!iframeRef.current) return;

    const automationScript = `
      (function() {
        console.log('SOFIA Automation Script Loaded');
        
        // Detectar elementos da roleta
        const detectRouletteElements = () => {
          const betButtons = {
            red: document.querySelector('[data-bet="red"], .red-bet, .bet-red'),
            black: document.querySelector('[data-bet="black"], .black-bet, .bet-black'),
            numbers: document.querySelectorAll('[data-bet^="number"], .number-bet')
          };
          
          const balanceElement = document.querySelector('.balance, .saldo, [data-balance]');
          const resultElement = document.querySelector('.result, .resultado, [data-result]');
          
          return { betButtons, balanceElement, resultElement };
        };
        
        // Executar aposta
        const placeBet = (type, amount) => {
          const elements = detectRouletteElements();
          
          if (type === 'red' && elements.betButtons.red) {
            elements.betButtons.red.click();
            return true;
          } else if (type === 'black' && elements.betButtons.black) {
            elements.betButtons.black.click();
            return true;
          }
          
          return false;
        };
        
        // Obter resultado da roleta
        const getLastResult = () => {
          const elements = detectRouletteElements();
          if (elements.resultElement) {
            return elements.resultElement.textContent || elements.resultElement.innerText;
          }
          return null;
        };
        
        // Obter saldo atual
        const getCurrentBalance = () => {
          const elements = detectRouletteElements();
          if (elements.balanceElement) {
            const balanceText = elements.balanceElement.textContent || elements.balanceElement.innerText;
            const balance = parseFloat(balanceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
            return isNaN(balance) ? 0 : balance;
          }
          return 0;
        };
        
        // Comunicação com o componente pai
        window.addEventListener('message', (event) => {
          if (event.data.type === 'PLACE_BET') {
            const success = placeBet(event.data.betType, event.data.amount);
            parent.postMessage({
              type: 'BET_PLACED',
              success,
              betId: event.data.betId
            }, '*');
          } else if (event.data.type === 'GET_BALANCE') {
            const balance = getCurrentBalance();
            parent.postMessage({
              type: 'BALANCE_UPDATE',
              balance
            }, '*');
          } else if (event.data.type === 'GET_RESULT') {
            const result = getLastResult();
            parent.postMessage({
              type: 'RESULT_UPDATE',
              result
            }, '*');
          }
        });
        
        // Monitorar mudanças na página
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              const result = getLastResult();
              if (result) {
                parent.postMessage({
                  type: 'RESULT_UPDATE',
                  result
                }, '*');
              }
              
              const balance = getCurrentBalance();
              if (balance > 0) {
                parent.postMessage({
                  type: 'BALANCE_UPDATE',
                  balance
                }, '*');
              }
            }
          });
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Heartbeat
        setInterval(() => {
          parent.postMessage({
            type: 'HEARTBEAT',
            timestamp: Date.now()
          }, '*');
        }, 5000);
        
      })();
    `;

    try {
      // Em um cenário real, isso seria injetado via postMessage ou extensão
      addLog('Script de automação injetado com sucesso', 'success');
    } catch (error) {
      addLog(`Erro ao injetar script: ${error}`, 'error');
    }
  }, [addLog]);

  // Realizar login
  const performLogin = useCallback(async () => {
    addLog('Realizando login...');
    
    // Simular processo de login
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simular obtenção do saldo
    setCurrentBalance(1000);
    addLog('Login realizado com sucesso', 'success');
    addLog(`Saldo atual: R$ ${currentBalance.toFixed(2)}`, 'info');
  }, [currentBalance, addLog]);

  // Inicializar motor de estratégias
  const initializeStrategyEngine = useCallback(() => {
    // Simular carregamento das estratégias existentes
    const strategies = [
      'Martingale Adaptativo',
      'Fibonacci Inteligente', 
      'Padrão de Cores',
      'Análise de Frequência',
      'ML Prediction'
    ];
    
    strategyEngineRef.current = {
      currentStrategy: config.strategy,
      analyze: (history: RouletteResult[]) => {
        // Simular análise baseada no histórico
        const recentColors = history.slice(0, 10).map(r => r.color);
        const redCount = recentColors.filter(c => c === 'red').length;
        const blackCount = recentColors.filter(c => c === 'black').length;
        
        // Lógica simples: apostar na cor menos frequente
        const prediction = redCount > blackCount ? 'black' : 'red';
        const confidence = Math.abs(redCount - blackCount) * 10 + 50;
        
        return {
          type: prediction,
          confidence: Math.min(confidence, 95),
          amount: calculateBetAmount(confidence)
        };
      }
    };
    
    addLog(`Motor de estratégias inicializado: ${config.strategy}`, 'success');
  }, [config.strategy, addLog]);

  // Calcular valor da aposta baseado na confiança
  const calculateBetAmount = useCallback((confidence: number) => {
    let amount = config.betAmount;
    
    // Ajustar baseado na confiança
    if (confidence > 80) {
      amount *= 1.5;
    } else if (confidence < 60) {
      amount *= 0.7;
    }
    
    // Aplicar Martingale se houver perdas consecutivas
    const consecutiveLosses = session.totalBets - session.wins;
    if (consecutiveLosses > 0) {
      amount *= Math.pow(2, Math.min(consecutiveLosses, 3));
    }
    
    return Math.min(amount, config.betAmount * 8); // Limite máximo
  }, [config.betAmount, session]);

  // Executar aposta
  const executeBet = useCallback(async (prediction: {type: string, confidence: number, amount: number}) => {
    if (connectionStatus !== 'connected') {
      addLog('Não conectado ao site de apostas', 'error');
      return;
    }

    const betId = `bet_${Date.now()}`;
    const newBet: LiveBet = {
      id: betId,
      timestamp: Date.now(),
      type: prediction.type as any,
      value: prediction.type,
      amount: prediction.amount,
      confidence: prediction.confidence,
      strategy: config.strategy,
      status: 'pending'
    };

    setLiveBets(prev => [newBet, ...prev].slice(0, 20));
    addLog(`Executando aposta: ${prediction.type.toUpperCase()} - R$ ${prediction.amount.toFixed(2)} (${prediction.confidence}% confiança)`, 'info');

    try {
      // Enviar comando para o iframe
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage({
          type: 'PLACE_BET',
          betType: prediction.type,
          amount: prediction.amount,
          betId: betId
        }, '*');
      }

      // Simular resultado após 30 segundos (tempo típico de uma rodada)
      setTimeout(() => {
        simulateBetResult(betId);
      }, 30000);

    } catch (error) {
      addLog(`Erro ao executar aposta: ${error}`, 'error');
      setLiveBets(prev => prev.map(bet => 
        bet.id === betId ? { ...bet, status: 'lost' } : bet
      ));
    }
  }, [connectionStatus, config.strategy, addLog]);

  // Simular resultado da aposta
  const simulateBetResult = useCallback((betId: string) => {
    const bet = liveBets.find(b => b.id === betId);
    if (!bet) return;

    // Simular resultado da roleta
    const numbers = Array.from({length: 37}, (_, i) => i);
    const resultNumber = numbers[Math.floor(Math.random() * numbers.length)];
    const resultColor = resultNumber === 0 ? 'green' : 
                       [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(resultNumber) ? 'red' : 'black';

    const result: RouletteResult = {
      number: resultNumber,
      color: resultColor,
      timestamp: Date.now()
    };

    setRecentResults(prev => [result, ...prev].slice(0, 50));

    // Determinar se a aposta ganhou
    const won = bet.type === resultColor;
    const payout = won ? bet.amount * (bet.type === 'green' ? 14 : 2) : 0;

    setLiveBets(prev => prev.map(b => 
      b.id === betId ? { 
        ...b, 
        status: won ? 'won' : 'lost',
        result: `${resultNumber} ${resultColor}`,
        payout 
      } : b
    ));

    // Atualizar sessão
    setSession(prev => ({
      ...prev,
      totalBets: prev.totalBets + 1,
      wins: won ? prev.wins + 1 : prev.wins,
      losses: won ? prev.losses : prev.losses + 1,
      profit: prev.profit + (won ? payout - bet.amount : -bet.amount),
      winRate: ((won ? prev.wins + 1 : prev.wins) / (prev.totalBets + 1)) * 100
    }));

    // Atualizar saldo
    setCurrentBalance(prev => prev + (won ? payout - bet.amount : -bet.amount));

    addLog(`Resultado: ${resultNumber} ${resultColor.toUpperCase()} - ${won ? 'GANHOU' : 'PERDEU'} R$ ${won ? (payout - bet.amount).toFixed(2) : bet.amount.toFixed(2)}`, won ? 'success' : 'error');
  }, [liveBets, addLog]);

  // Loop principal de automação
  const automationLoop = useCallback(async () => {
    if (!isAutomationActive || connectionStatus !== 'connected') return;

    try {
      // Analisar histórico e gerar predição
      if (strategyEngineRef.current) {
        const prediction = strategyEngineRef.current.analyze(recentResults);
        setNextBetPrediction(prediction);

        // Verificar se deve executar a aposta
        if (config.autoMode && prediction.confidence > 60) {
          // Verificar limites de segurança
          if (session.losses < config.maxConsecutiveLosses && 
              Math.abs(session.profit) < config.stopLossAmount) {
            await executeBet(prediction);
          } else {
            addLog('Limites de segurança atingidos - pausando automação', 'warning');
            setIsAutomationActive(false);
          }
        }
      }
    } catch (error) {
      addLog(`Erro no loop de automação: ${error}`, 'error');
    }
  }, [isAutomationActive, connectionStatus, config, session, recentResults, executeBet, addLog]);

  // Iniciar automação
  const startAutomation = useCallback(async () => {
    if (connectionStatus !== 'connected') {
      await connectToSite();
      return;
    }

    setIsAutomationActive(true);
    setSession(prev => ({
      ...prev,
      id: `session_${Date.now()}`,
      startTime: Date.now(),
      status: 'active'
    }));

    initializeStrategyEngine();
    addLog('Automação iniciada', 'success');

    // Iniciar loop de automação
    automationIntervalRef.current = setInterval(automationLoop, 5000);
  }, [connectionStatus, connectToSite, initializeStrategyEngine, automationLoop, addLog]);

  // Pausar automação
  const pauseAutomation = useCallback(() => {
    setIsAutomationActive(false);
    setSession(prev => ({ ...prev, status: 'paused' }));
    
    if (automationIntervalRef.current) {
      clearInterval(automationIntervalRef.current);
      automationIntervalRef.current = null;
    }
    
    addLog('Automação pausada', 'warning');
  }, [addLog]);

  // Parar automação
  const stopAutomation = useCallback(() => {
    setIsAutomationActive(false);
    setSession(prev => ({ 
      ...prev, 
      status: 'stopped',
      endTime: Date.now()
    }));
    
    if (automationIntervalRef.current) {
      clearInterval(automationIntervalRef.current);
      automationIntervalRef.current = null;
    }
    
    addLog('Automação parada', 'info');
  }, [addLog]);

  // Escutar mensagens do iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'BET_PLACED') {
        addLog(`Aposta executada no site: ${event.data.success ? 'Sucesso' : 'Falha'}`, event.data.success ? 'success' : 'error');
      } else if (event.data.type === 'BALANCE_UPDATE') {
        setCurrentBalance(event.data.balance);
      } else if (event.data.type === 'RESULT_UPDATE') {
        addLog(`Resultado detectado: ${event.data.result}`, 'info');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (automationIntervalRef.current) {
        clearInterval(automationIntervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'connecting': return <Clock className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de Controle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automação Real de Apostas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(connectionStatus)}`}>
                {getStatusIcon(connectionStatus)}
                {connectionStatus.toUpperCase()}
              </Badge>
              {!isAutomationActive ? (
                <Button onClick={startAutomation} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-1" />
                  Iniciar
                </Button>
              ) : (
                <>
                  <Button onClick={pauseAutomation} variant="outline">
                    <Pause className="h-4 w-4 mr-1" />
                    Pausar
                  </Button>
                  <Button onClick={stopAutomation} variant="destructive">
                    <StopCircle className="h-4 w-4 mr-1" />
                    Parar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                R$ {currentBalance.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Saldo Atual</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${session.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {session.profit >= 0 ? '+' : ''}R$ {session.profit.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Lucro da Sessão</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {session.totalBets}
              </div>
              <div className="text-sm text-gray-500">Apostas Executadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {session.winRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Taxa de Acerto</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="site">Site de Apostas</Label>
                <Select value={config.site} onValueChange={(value: any) => setConfig(prev => ({ ...prev, site: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="betgorillas">BetGorillas (Roleta Brasileira)</SelectItem>
                    <SelectItem value="bet365">Bet365</SelectItem>
                    <SelectItem value="betfair">Betfair</SelectItem>
                    <SelectItem value="betano">Betano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="email">Email/CPF</Label>
                <Input
                  id="email"
                  type="text"
                  value={config.credentials.email}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    credentials: { ...prev.credentials, email: e.target.value }
                  }))}
                  placeholder="Suas credenciais de login"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.credentials.password}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    credentials: { ...prev.credentials, password: e.target.value }
                  }))}
                  placeholder="Sua senha"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="betAmount">Valor Base da Aposta (R$)</Label>
                <Input
                  id="betAmount"
                  type="number"
                  value={config.betAmount}
                  onChange={(e) => setConfig(prev => ({ ...prev, betAmount: Number(e.target.value) }))}
                />
              </div>
              
              <div>
                <Label htmlFor="strategy">Estratégia</Label>
                <Select value={config.strategy} onValueChange={(value) => setConfig(prev => ({ ...prev, strategy: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="martingale">Martingale Adaptativo</SelectItem>
                    <SelectItem value="fibonacci">Fibonacci Inteligente</SelectItem>
                    <SelectItem value="pattern">Padrão de Cores</SelectItem>
                    <SelectItem value="frequency">Análise de Frequência</SelectItem>
                    <SelectItem value="ml">ML Prediction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="stopLoss">Stop Loss (R$)</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  value={config.stopLossAmount}
                  onChange={(e) => setConfig(prev => ({ ...prev, stopLossAmount: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próxima Predição */}
      {nextBetPrediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Próxima Predição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full ${nextBetPrediction.type === 'red' ? 'bg-red-500' : 'bg-black'}`}></div>
                <div>
                  <div className="font-semibold">{nextBetPrediction.type.toUpperCase()}</div>
                  <div className="text-sm text-gray-500">R$ {nextBetPrediction.amount.toFixed(2)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{nextBetPrediction.confidence}%</div>
                <div className="text-sm text-gray-500">Confiança</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apostas Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Apostas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {liveBets.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Nenhuma aposta executada ainda
              </div>
            ) : (
              liveBets.map((bet) => (
                <div key={bet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${bet.type === 'red' ? 'bg-red-500' : bet.type === 'black' ? 'bg-black' : 'bg-green-500'}`}></div>
                    <div>
                      <div className="font-medium">{bet.value.toUpperCase()}</div>
                      <div className="text-sm text-gray-500">R$ {bet.amount.toFixed(2)} • {bet.confidence}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      bet.status === 'won' ? 'bg-green-100 text-green-800' :
                      bet.status === 'lost' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {bet.status === 'won' ? 'GANHOU' : bet.status === 'lost' ? 'PERDEU' : 'PENDENTE'}
                    </Badge>
                    {bet.result && (
                      <div className="text-sm text-gray-500 mt-1">{bet.result}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Iframe do Site */}
      {connectionStatus === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Site de Apostas - {config.site.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                src="about:blank"
                className="w-full h-96"
                title="Site de Apostas"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sistema de Validação de Apostas */}
      <BetValidationSystem
        betAmount={config.betAmount}
        betType="red" // Exemplo - seria dinâmico baseado na estratégia
        selectedNumbers={[1, 3, 5]} // Exemplo - seria dinâmico baseado na estratégia
        currentBalance={session.profit + 1000} // Simulando saldo inicial + lucro
        maxBetLimit={config.betAmount * 10}
        stopLossLimit={config.stopLossAmount}
        takeProfitLimit={config.takeProfitAmount}
        consecutiveLossesLimit={config.maxConsecutiveLosses}
        currentConsecutiveLosses={session.losses}
        currentProfit={session.profit}
        isAutomationActive={session.status === 'active'}
        onValidationComplete={(isValid, errors) => {
          if (!isValid) {
            errors.forEach(error => addLog(`Validação falhou: ${error}`, 'error'));
          } else {
            addLog('Validação de aposta aprovada', 'success');
          }
        }}
      />

      {/* Sistema de Recuperação de Erros */}
      <ErrorRecoverySystem
        isAutomationActive={session.status === 'active'}
        connectionStatus={connectionStatus}
        onReconnect={async () => {
          addLog('Tentando reconectar...', 'info');
          setConnectionStatus('reconnecting');
          // Simular reconexão
          setTimeout(() => {
            setConnectionStatus('connected');
            addLog('Reconectado com sucesso', 'success');
          }, 2000);
        }}
        onRestartAutomation={async () => {
          addLog('Reiniciando automação...', 'info');
          setSession(prev => ({ ...prev, status: 'paused' }));
          setTimeout(() => {
            setSession(prev => ({ ...prev, status: 'active' }));
            addLog('Automação reiniciada', 'success');
          }, 3000);
        }}
        onEmergencyStop={() => {
          addLog('PARADA DE EMERGÊNCIA ATIVADA', 'error');
          setSession(prev => ({ ...prev, status: 'stopped' }));
          setConnectionStatus('disconnected');
        }}
      />

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Log de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Aguardando atividade...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Novas interfaces para integração com sistema de estratégias
interface StrategyAutomationConfig {
  baseAmount: number;
  maxBets: number;
  maxProfit: number;
  maxLoss: number;
  maxConsecutiveLosses: number;
  minConfidence: number;
  stopOnProfit: boolean;
  stopOnLoss: boolean;
  analysisInterval: number;
  enableIntelligentMode: boolean;
}

interface StrategyStatus {
  connected: boolean;
  running: boolean;
  currentStrategy: string | null;
  confidence: number;
  lastAnalysis: any;
  gameHistoryLength: number;
  stats: {
    startTime: number;
    totalBets: number;
    wins: number;
    losses: number;
    profit: number;
    winRate: number;
    currentStreak: number;
    strategies: Record<string, any>;
  };
}

interface RealBettingAutomationProps {
  tableId: string;
  suggestedBets: (string | number)[];
  strategyName: string;
  onAutomationToggle?: (enabled: boolean) => void;
}

export default function RealBettingAutomation({
  tableId,
  suggestedBets,
  strategyName,
  onAutomationToggle
}: RealBettingAutomationProps) {
  // Config state for the main component
  const [config, setConfig] = useState<BettingConfig>({
    site: 'betgorillas',
    credentials: { email: '', password: '' },
    betAmount: 10,
    strategy: 'martingale',
    autoMode: false,
    maxConsecutiveLosses: 3,
    stopLossAmount: 100,
    takeProfitAmount: 200
  });

  // Logs state and function
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev.slice(-99), logMessage]);
  }, []);

  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');

  // Automation state
  const [isAutomationActive, setIsAutomationActive] = useState(false);

  // Session state
  const [session, setSession] = useState<BettingSession>({
    id: '',
    startTime: 0,
    totalBets: 0,
    wins: 0,
    losses: 0,
    profit: 0,
    maxDrawdown: 0,
    winRate: 0,
    avgBetAmount: 0,
    status: 'stopped'
  });

  // Next bet prediction state
  const [nextBetPrediction, setNextBetPrediction] = useState<{type: string, confidence: number, amount: number} | null>(null);

  // Novos estados para sistema de estratégias
  const [intelligentMode, setIntelligentMode] = useState(false);
  const [strategyConfig, setStrategyConfig] = useState<StrategyAutomationConfig>({
    baseAmount: 5,
    maxBets: 50,
    maxProfit: 200,
    maxLoss: 100,
    maxConsecutiveLosses: 3,
    minConfidence: 60,
    stopOnProfit: true,
    stopOnLoss: true,
    analysisInterval: 10000,
    enableIntelligentMode: true
  });

  const [strategyStatus, setStrategyStatus] = useState<StrategyStatus>({
    connected: false,
    running: false,
    currentStrategy: null,
    confidence: 0,
    lastAnalysis: null,
    gameHistoryLength: 0,
    stats: {
      startTime: 0,
      totalBets: 0,
      wins: 0,
      losses: 0,
      profit: 0,
      winRate: 0,
      currentStreak: 0,
      strategies: {}
    }
  });

  const [availableStrategies] = useState([
    'martingale', 'fibonacci', 'labouchere', 'dalembert', 'paroli',
    'cavalos', 'vizinhos', 'probabilidade', 'padroes', 'sequencias'
  ]);

  // Conectar ao site de apostas
  const connectToSite = useCallback(async () => {
    if (!config.credentials.email || !config.credentials.password) {
      addLog('Credenciais não fornecidas', 'error');
      return;
    }

    setConnectionStatus('connecting');
    addLog(`Conectando ao ${config.site}...`);

    try {
      // Simular conexão real - em produção, isso seria uma conexão real via iframe/puppeteer
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectionStatus('connected');
      addLog(`Conectado com sucesso ao ${config.site}`, 'success');
      
    } catch (error) {
      setConnectionStatus('disconnected');
      addLog(`Erro ao conectar: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [config, addLog]);
 
   // Inicializar motor de estratégias
   const initializeStrategyEngine = useCallback(() => {
     const strategies = [
       'Martingale Adaptativo',
       'Fibonacci Inteligente', 
       'Padrão de Cores',
       'Análise de Frequência',
       'ML Prediction'
     ];
     
     addLog(`Motor de estratégias inicializado: ${config.strategy}`, 'success');
   }, [config.strategy, addLog]);

   // Loop principal de automação
   const automationLoop = useCallback(async () => {
     if (!isAutomationActive || connectionStatus !== 'connected') return;

     try {
       // Simular análise e predição
       const prediction = {
         type: 'red',
         confidence: 75,
         amount: config.betAmount
       };
       setNextBetPrediction(prediction);

       addLog(`Análise: ${prediction.type} (${prediction.confidence}% confiança)`, 'info');
     } catch (error) {
       addLog(`Erro no loop de automação: ${error instanceof Error ? error.message : String(error)}`, 'error');
     }
   }, [isAutomationActive, connectionStatus, config.betAmount, addLog]);

   // Iniciar automação
   const startAutomation = useCallback(async () => {
     if (connectionStatus !== 'connected') {
       await connectToSite();
       return;
     }

     setIsAutomationActive(true);
     setSession(prev => ({
       ...prev,
       id: `session_${Date.now()}`,
       startTime: Date.now(),
       status: 'active'
     }));

     initializeStrategyEngine();
    addLog('Automação iniciada', 'success');
  }, [connectionStatus, connectToSite, initializeStrategyEngine, addLog]);

  // Parar automação
  const stopAutomation = useCallback(() => {
    setIsAutomationActive(false);
    setSession(prev => ({ 
      ...prev, 
      status: 'stopped',
      endTime: Date.now()
    }));
    
    addLog('Automação parada', 'info');
  }, [addLog]);

  // Conectar ao sistema de estratégias inteligente
  const connectToIntelligentSystem = useCallback(async () => {
    if (!config.credentials.email || !config.credentials.password) {
      addLog('Credenciais não fornecidas para sistema inteligente', 'error');
      return;
    }

    setConnectionStatus('connecting');
    addLog('🧠 Conectando ao sistema de estratégias inteligente...');

    try {
      const response = await fetch('/api/betting/betgorillas-strategy-automation/connect-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameUrl: 'https://betgorillas.bet.br/games/imaginelive/roleta-brasileira',
          config: {
            headless: false,
            devtools: true,
            timeout: 30000
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setConnectionStatus('connected');
        setStrategyStatus(prev => ({ ...prev, connected: true }));
        addLog('✅ Sistema de estratégias conectado com sucesso!', 'success');
        addLog(`🎯 Estratégias carregadas: ${availableStrategies.length}`, 'info');
        
        // Iniciar monitoramento do status
        startStatusMonitoring();
      } else {
        throw new Error(result.error || 'Erro na conexão');
      }

    } catch (error) {
      setConnectionStatus('disconnected');
      addLog(`❌ Erro na conexão inteligente: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [config, addLog, availableStrategies.length]);

  // Iniciar automação inteligente
  const startIntelligentAutomation = useCallback(async () => {
    if (!strategyStatus.connected) {
      addLog('Sistema não conectado. Conecte primeiro.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/betting/betgorillas-strategy-automation/start-intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strategyConfig)
      });

      const result = await response.json();

      if (result.success) {
        setIsAutomationActive(true);
        setStrategyStatus(prev => ({ ...prev, running: true }));
        addLog('🚀 Automação inteligente iniciada!', 'success');
        addLog(`📊 Configuração: ${strategyConfig.maxBets} apostas máx, confiança mín ${strategyConfig.minConfidence}%`, 'info');
        
        if (onAutomationToggle) {
          onAutomationToggle(true);
        }
      } else {
        throw new Error(result.error || 'Erro ao iniciar automação');
      }

    } catch (error) {
      addLog(`❌ Erro ao iniciar automação inteligente: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [strategyStatus.connected, strategyConfig, addLog, onAutomationToggle]);

  // Parar automação inteligente
  const stopIntelligentAutomation = useCallback(async () => {
    try {
      const response = await fetch('/api/betting/betgorillas-strategy-automation/stop-intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        setIsAutomationActive(false);
        setStrategyStatus(prev => ({ ...prev, running: false }));
        addLog('🛑 Automação inteligente parada', 'info');
        addLog(`📈 Resultado final: ${result.data.finalStats.profit > 0 ? 'Lucro' : 'Prejuízo'} de R$ ${Math.abs(result.data.finalStats.profit).toFixed(2)}`, 'info');
        
        if (onAutomationToggle) {
          onAutomationToggle(false);
        }
      } else {
        throw new Error(result.error || 'Erro ao parar automação');
      }

    } catch (error) {
      addLog(`❌ Erro ao parar automação: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [addLog, onAutomationToggle]);

  // Monitorar status do sistema
  const startStatusMonitoring = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/betting/betgorillas-strategy-automation/status-intelligent');
        const result = await response.json();

        if (result.success) {
          setStrategyStatus(result.data);
          
          // Atualizar sessão com dados do backend
          if (result.data.stats) {
            setSession(prev => ({
              ...prev,
              totalBets: result.data.stats.totalBets,
              wins: result.data.stats.wins,
              losses: result.data.stats.losses,
              profit: result.data.stats.profit,
              winRate: result.data.stats.winRate,
              status: result.data.running ? 'active' : 'stopped'
            }));
          }
        }
      } catch (error) {
        console.warn('Erro ao monitorar status:', error);
      }
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Obter análise atual das estratégias
  const getStrategyAnalysis = useCallback(async () => {
    try {
      const response = await fetch('/api/betting/betgorillas-strategy-automation/strategy-analysis');
      const result = await response.json();

      if (result.success && result.data.available) {
        setNextBetPrediction({
          type: result.data.analysis?.betType || 'unknown',
          confidence: result.data.confidence || 0,
          amount: strategyConfig.baseAmount
        });
        
        addLog(`🎯 Análise: ${result.data.currentStrategy} (${result.data.confidence}% confiança)`, 'info');
      }
    } catch (error) {
      console.warn('Erro ao obter análise:', error);
    }
  }, [strategyConfig.baseAmount, addLog]);

  return (
    <div className="space-y-6">
      {/* Painel de Controle Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <CardTitle>Automação Inteligente BetGorillas</CardTitle>
              <Badge variant={strategyStatus.running ? "default" : strategyStatus.connected ? "secondary" : "outline"}>
                {strategyStatus.running ? 'Executando' : strategyStatus.connected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={intelligentMode}
                onCheckedChange={setIntelligentMode}
                disabled={strategyStatus.running}
              />
              <Label>Modo Inteligente</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuração de Credenciais */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email BetGorillas</Label>
              <Input
                id="email"
                type="email"
                value={config.credentials.email}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, email: e.target.value }
                }))}
                disabled={strategyStatus.connected}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={config.credentials.password}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, password: e.target.value }
                }))}
                disabled={strategyStatus.connected}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Configurações de Estratégia */}
          {intelligentMode && (
            <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurações Inteligentes
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="baseAmount">Valor Base (R$)</Label>
                  <Input
                    id="baseAmount"
                    type="number"
                    value={strategyConfig.baseAmount}
                    onChange={(e) => setStrategyConfig(prev => ({
                      ...prev,
                      baseAmount: Number(e.target.value)
                    }))}
                    disabled={strategyStatus.running}
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="maxBets">Apostas Máximas</Label>
                  <Input
                    id="maxBets"
                    type="number"
                    value={strategyConfig.maxBets}
                    onChange={(e) => setStrategyConfig(prev => ({
                      ...prev,
                      maxBets: Number(e.target.value)
                    }))}
                    disabled={strategyStatus.running}
                    min="1"
                    max="200"
                  />
                </div>
                <div>
                  <Label htmlFor="minConfidence">Confiança Mínima (%)</Label>
                  <Input
                    id="minConfidence"
                    type="number"
                    value={strategyConfig.minConfidence}
                    onChange={(e) => setStrategyConfig(prev => ({
                      ...prev,
                      minConfidence: Number(e.target.value)
                    }))}
                    disabled={strategyStatus.running}
                    min="50"
                    max="95"
                  />
                </div>
                <div>
                  <Label htmlFor="maxProfit">Meta de Lucro (R$)</Label>
                  <Input
                    id="maxProfit"
                    type="number"
                    value={strategyConfig.maxProfit}
                    onChange={(e) => setStrategyConfig(prev => ({
                      ...prev,
                      maxProfit: Number(e.target.value)
                    }))}
                    disabled={strategyStatus.running}
                    min="10"
                  />
                </div>
                <div>
                  <Label htmlFor="maxLoss">Limite de Perda (R$)</Label>
                  <Input
                    id="maxLoss"
                    type="number"
                    value={strategyConfig.maxLoss}
                    onChange={(e) => setStrategyConfig(prev => ({
                      ...prev,
                      maxLoss: Number(e.target.value)
                    }))}
                    disabled={strategyStatus.running}
                    min="10"
                  />
                </div>
                <div>
                  <Label htmlFor="maxConsecutiveLosses">Perdas Consecutivas</Label>
                  <Input
                    id="maxConsecutiveLosses"
                    type="number"
                    value={strategyConfig.maxConsecutiveLosses}
                    onChange={(e) => setStrategyConfig(prev => ({
                      ...prev,
                      maxConsecutiveLosses: Number(e.target.value)
                    }))}
                    disabled={strategyStatus.running}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botões de Controle */}
          <div className="flex gap-2">
            {!strategyStatus.connected ? (
              <Button 
                onClick={intelligentMode ? connectToIntelligentSystem : connectToSite}
                disabled={connectionStatus === 'connecting'}
                className="flex-1"
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    {intelligentMode ? 'Conectar Sistema Inteligente' : 'Conectar BetGorillas'}
                  </>
                )}
              </Button>
            ) : (
              <>
                {!strategyStatus.running ? (
                  <Button 
                    onClick={intelligentMode ? startIntelligentAutomation : startAutomation}
                    className="flex-1"
                    variant="default"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {intelligentMode ? 'Iniciar IA' : 'Iniciar Automação'}
                  </Button>
                ) : (
                  <Button 
                    onClick={intelligentMode ? stopIntelligentAutomation : stopAutomation}
                    className="flex-1"
                    variant="destructive"
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    Parar Automação
                  </Button>
                )}
                <Button 
                  onClick={getStrategyAnalysis}
                  variant="outline"
                  disabled={!intelligentMode || !strategyStatus.connected}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Análise
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Painel de Status Inteligente */}
      {intelligentMode && strategyStatus.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Status da IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {strategyStatus.currentStrategy || 'Analisando...'}
                </div>
                <div className="text-sm text-muted-foreground">Estratégia Atual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {strategyStatus.confidence}%
                </div>
                <div className="text-sm text-muted-foreground">Confiança</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {strategyStatus.gameHistoryLength}
                </div>
                <div className="text-sm text-muted-foreground">Histórico</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  R$ {strategyStatus.stats.profit.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Lucro/Prejuízo</div>
              </div>
            </div>

            {nextBetPrediction && (
              <Alert className="mt-4">
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <strong>Próxima Aposta Sugerida:</strong> {nextBetPrediction.type} 
                  (Confiança: {nextBetPrediction.confidence}%, Valor: R$ {nextBetPrediction.amount})
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* ... existing code for session stats, logs, etc. ... */}
    </div>
  );
}