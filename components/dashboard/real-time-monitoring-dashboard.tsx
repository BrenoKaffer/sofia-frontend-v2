'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Zap,
  Shield,
  RefreshCw,
  Pause,
  Play,
  Eye
} from 'lucide-react';

interface BetResult {
  id: string;
  timestamp: string;
  numbers: number[];
  amount: number;
  result: 'win' | 'loss' | 'pending';
  profit: number;
  strategy: string;
  confidence: number;
  winningNumber?: number;
}

interface SessionStats {
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  totalProfit: number;
  winRate: number;
  averageBet: number;
  biggestWin: number;
  biggestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  currentStreak: 'win' | 'loss' | 'none';
  streakCount: number;
  startTime: string;
  sessionDuration: string;
}

interface RiskMetrics {
  riskScore: number;
  bankrollUsage: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface RealTimeMonitoringDashboardProps {
  isActive: boolean;
  onToggleMonitoring?: (active: boolean) => void;
}

function RealTimeMonitoringDashboard({ 
  isActive, 
  onToggleMonitoring 
}: RealTimeMonitoringDashboardProps) {
  // Estados principais
  const [recentBets, setRecentBets] = useState<BetResult[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalBets: 0,
    wins: 0,
    losses: 0,
    pending: 0,
    totalProfit: 0,
    winRate: 0,
    averageBet: 0,
    biggestWin: 0,
    biggestLoss: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    currentStreak: 'none',
    streakCount: 0,
    startTime: new Date().toISOString(),
    sessionDuration: '00:00:00'
  });
  
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    riskScore: 0,
    bankrollUsage: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    volatility: 0,
    riskLevel: 'low'
  });
  
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(isActive);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  // Refs para intervalos
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const statsUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Simulação de dados em tempo real
  useEffect(() => {
    if (isMonitoring) {
      // Atualizar estatísticas a cada segundo
      statsUpdateInterval.current = setInterval(() => {
        updateSessionDuration();
        setLastUpdate(new Date().toLocaleTimeString());
      }, 1000);

      // Simular novas apostas a cada 5-15 segundos
      monitoringInterval.current = setInterval(() => {
        if (Math.random() > 0.3) { // 70% chance de nova aposta
          simulateNewBet();
        }
      }, Math.random() * 10000 + 5000);
    }

    return () => {
      if (monitoringInterval.current) clearInterval(monitoringInterval.current);
      if (statsUpdateInterval.current) clearInterval(statsUpdateInterval.current);
    };
  }, [isMonitoring]);

  const updateSessionDuration = () => {
    const start = new Date(sessionStats.startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    setSessionStats(prev => ({
      ...prev,
      sessionDuration: duration
    }));
  };

  const simulateNewBet = () => {
    const strategies = ['Martingale', 'Fibonacci', 'Padrão de Cores', 'ML Prediction', 'Análise de Frequência'];
    const numbers = Array.from({ length: Math.floor(Math.random() * 6) + 1 }, () => Math.floor(Math.random() * 37));
    const amount = Math.floor(Math.random() * 100) + 10;
    const isWin = Math.random() > 0.52; // 48% win rate (realista para roleta)
    const winningNumber = Math.floor(Math.random() * 37);
    
    const newBet: BetResult = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      numbers,
      amount,
      result: isWin ? 'win' : 'loss',
      profit: isWin ? amount * (36 / numbers.length - 1) : -amount,
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      confidence: Math.floor(Math.random() * 40) + 60,
      winningNumber
    };

    setRecentBets(prev => [newBet, ...prev.slice(0, 19)]); // Manter apenas 20 apostas recentes
    updateSessionStats(newBet);
    updateRiskMetrics(newBet);
    checkForAlerts(newBet);
  };

  const updateSessionStats = (newBet: BetResult) => {
    setSessionStats(prev => {
      const newStats = {
        ...prev,
        totalBets: prev.totalBets + 1,
        wins: prev.wins + (newBet.result === 'win' ? 1 : 0),
        losses: prev.losses + (newBet.result === 'loss' ? 1 : 0),
        totalProfit: prev.totalProfit + newBet.profit,
        averageBet: ((prev.averageBet * prev.totalBets) + newBet.amount) / (prev.totalBets + 1),
        biggestWin: Math.max(prev.biggestWin, newBet.result === 'win' ? newBet.profit : 0),
        biggestLoss: Math.min(prev.biggestLoss, newBet.result === 'loss' ? newBet.profit : 0)
      };

      // Calcular win rate
      newStats.winRate = newStats.totalBets > 0 ? (newStats.wins / newStats.totalBets) * 100 : 0;

      // Atualizar streaks
      if (newBet.result === 'win') {
        if (prev.currentStreak === 'win') {
          newStats.streakCount = prev.streakCount + 1;
          newStats.consecutiveWins = Math.max(prev.consecutiveWins, newStats.streakCount);
        } else {
          newStats.currentStreak = 'win';
          newStats.streakCount = 1;
        }
      } else if (newBet.result === 'loss') {
        if (prev.currentStreak === 'loss') {
          newStats.streakCount = prev.streakCount + 1;
          newStats.consecutiveLosses = Math.max(prev.consecutiveLosses, newStats.streakCount);
        } else {
          newStats.currentStreak = 'loss';
          newStats.streakCount = 1;
        }
      }

      return newStats;
    });
  };

  const updateRiskMetrics = (newBet: BetResult) => {
    setRiskMetrics(prev => {
      const bankrollUsage = Math.min(100, (sessionStats.totalBets * sessionStats.averageBet) / 1000 * 100);
      const riskScore = Math.min(100, 
        (sessionStats.consecutiveLosses * 10) + 
        (bankrollUsage * 0.5) + 
        (sessionStats.totalProfit < -500 ? 30 : 0)
      );
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (riskScore > 75) riskLevel = 'critical';
      else if (riskScore > 50) riskLevel = 'high';
      else if (riskScore > 25) riskLevel = 'medium';

      return {
        ...prev,
        riskScore,
        bankrollUsage,
        riskLevel,
        maxDrawdown: Math.min(prev.maxDrawdown, sessionStats.totalProfit),
        volatility: Math.abs(newBet.profit) / newBet.amount * 100
      };
    });
  };

  const checkForAlerts = (newBet: BetResult) => {
    const newAlerts: AlertItem[] = [];

    // Alert para perdas consecutivas
    if (sessionStats.currentStreak === 'loss' && sessionStats.streakCount >= 5) {
      newAlerts.push({
        id: `consecutive_losses_${Date.now()}`,
        type: 'warning',
        message: `${sessionStats.streakCount} perdas consecutivas detectadas`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Alert para lucro negativo alto
    if (sessionStats.totalProfit < -300) {
      newAlerts.push({
        id: `high_loss_${Date.now()}`,
        type: 'error',
        message: `Perda acumulada de R$ ${Math.abs(sessionStats.totalProfit).toFixed(2)}`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Alert para risco crítico
    if (riskMetrics.riskLevel === 'critical') {
      newAlerts.push({
        id: `critical_risk_${Date.now()}`,
        type: 'error',
        message: 'Nível de risco crítico atingido - considere parar',
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]);
    }
  };

  const toggleMonitoring = () => {
    const newState = !isMonitoring;
    setIsMonitoring(newState);
    onToggleMonitoring?.(newState);
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStreakIcon = () => {
    if (sessionStats.currentStreak === 'win') {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else if (sessionStats.currentStreak === 'loss') {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-purple-400" />
              <div>
                <CardTitle className="text-xl">Dashboard de Monitoramento</CardTitle>
                <CardDescription>
                  Acompanhamento em tempo real • Última atualização: {lastUpdate}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isMonitoring ? "default" : "secondary"}>
                {isMonitoring ? 'Ativo' : 'Pausado'}
              </Badge>
              <Button
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                onClick={toggleMonitoring}
              >
                {isMonitoring ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Total</p>
                <p className={`text-2xl font-bold ${
                  sessionStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  R$ {sessionStats.totalProfit.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Vitória</p>
                <p className="text-2xl font-bold text-blue-400">
                  {sessionStats.winRate.toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Apostas</p>
                <p className="text-2xl font-bold text-purple-400">
                  {sessionStats.totalBets}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="text-2xl font-bold text-orange-400">
                  {sessionStats.sessionDuration}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de risco e alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Métricas de Risco */}
        <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              Análise de Risco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Score de Risco</span>
                <span className={`font-bold ${getRiskColor(riskMetrics.riskLevel)}`}>
                  {riskMetrics.riskScore.toFixed(0)}/100
                </span>
              </div>
              <Progress 
                value={riskMetrics.riskScore} 
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Uso do Bankroll</p>
                <p className="font-semibold">{riskMetrics.bankrollUsage.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Maior Queda da Banca (Max Drawdown)</p>
                <p className="font-semibold text-red-400">
                  R$ {Math.abs(riskMetrics.maxDrawdown).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStreakIcon()}
              <span className="text-sm">
                Sequência atual: {sessionStats.streakCount} {
                  sessionStats.currentStreak === 'win' ? 'vitórias' : 
                  sessionStats.currentStreak === 'loss' ? 'derrotas' : 'neutro'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  Nenhum alerta ativo
                </div>
              ) : (
                alerts.map((alert) => (
                  <Alert 
                    key={alert.id} 
                    className={`${alert.acknowledged ? 'opacity-50' : ''} ${
                      alert.type === 'error' ? 'border-red-500/50' : 
                      alert.type === 'warning' ? 'border-yellow-500/50' : 
                      'border-blue-500/50'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apostas recentes */}
      <Card className="bg-gradient-to-br from-gray-900/20 to-slate-900/20 border-gray-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gray-400" />
            Apostas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentBets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2" />
                Aguardando apostas...
              </div>
            ) : (
              recentBets.map((bet) => (
                <div 
                  key={bet.id} 
                  className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {bet.result === 'win' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="font-medium">
                        {bet.numbers.join(', ')} • R$ {bet.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bet.strategy} • {new Date(bet.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      bet.result === 'win' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {bet.result === 'win' ? '+' : ''}R$ {bet.profit.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Confiança: {bet.confidence}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RealTimeMonitoringDashboard;
