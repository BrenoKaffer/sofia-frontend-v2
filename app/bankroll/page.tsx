'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Calculator,
  History,
  Settings,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  BarChart3,
  PieChart,
  Plus,
  Minus,
  Save,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

// Dados mock para demonstração
const bankrollData = {
  initialBankroll: 1000,
  currentBankroll: 1350,
  totalProfit: 350,
  totalLoss: 200,
  netProfit: 150,
  winRate: 68,
  totalSessions: 25,
  avgSessionProfit: 14,
  maxDrawdown: 180,
  currentDrawdown: 0,
  riskLevel: 'medium'
};

const bankrollHistory = [
  { date: '01/01', value: 1000, profit: 0, sessions: 0 },
  { date: '02/01', value: 1050, profit: 50, sessions: 2 },
  { date: '03/01', value: 980, profit: -70, sessions: 3 },
  { date: '04/01', value: 1120, profit: 140, sessions: 4 },
  { date: '05/01', value: 1200, profit: 80, sessions: 3 },
  { date: '06/01', value: 1150, profit: -50, sessions: 2 },
  { date: '07/01', value: 1350, profit: 200, sessions: 5 }
];

const transactions = [
  { id: 1, date: '15/01/2024', type: 'profit', amount: 150, description: 'Sessão - Mesa Evolution', balance: 1350 },
  { id: 2, date: '15/01/2024', type: 'loss', amount: -50, description: 'Sessão - Mesa Pragmatic', balance: 1200 },
  { id: 3, date: '14/01/2024', type: 'profit', amount: 200, description: 'Sessão - Mesa Evolution', balance: 1250 },
  { id: 4, date: '14/01/2024', type: 'deposit', amount: 500, description: 'Depósito inicial', balance: 1050 },
  { id: 5, date: '13/01/2024', type: 'loss', amount: -80, description: 'Sessão - Mesa Pragmatic', balance: 550 }
];

const riskDistribution = [
  { name: 'Conservador', value: 30, color: '#10b981' },
  { name: 'Moderado', value: 50, color: '#f59e0b' },
  { name: 'Agressivo', value: 20, color: '#ef4444' }
];

export default function BankrollPage() {
  const [initialBankroll, setInitialBankroll] = useState(bankrollData.initialBankroll);
  const [stopLoss, setStopLoss] = useState(200);
  const [takeProfit, setTakeProfit] = useState(300);
  const [maxBetPercentage, setMaxBetPercentage] = useState(5);
  const [autoStopLoss, setAutoStopLoss] = useState(true);
  const [autoTakeProfit, setAutoTakeProfit] = useState(true);
  const [progressionType, setProgressionType] = useState('martingale');
  const [progressionSteps, setProgressionSteps] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  
  // Novos estados para funcionalidades solicitadas
  const [dailyGoal, setDailyGoal] = useState(100);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [simulatorInitial, setSimulatorInitial] = useState(1000);
  const [simulatorGoal, setSimulatorGoal] = useState(2000);
  const [simulatorDays, setSimulatorDays] = useState(30);
  const [goalReached, setGoalReached] = useState(false);
  const [showGoalAlert, setShowGoalAlert] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/user-preferences');
        if (!res.ok) throw new Error('Prefetch error');
        const prefs = await res.json();
        setInitialBankroll(Number(prefs?.initial_bankroll ?? prefs?.initialBankroll ?? bankrollData.initialBankroll));
        setStopLoss(Number(prefs?.stop_loss ?? prefs?.daily_stop_loss ?? 200));
        setTakeProfit(Number(prefs?.take_profit ?? prefs?.daily_stop_gain ?? 300));
        setMaxBetPercentage(Number(prefs?.max_bet_percentage ?? prefs?.maxBetPercentage ?? 5));
        setDailyGoal(Number(prefs?.daily_goal ?? 100));
      } catch (e) {
        // fallback silencioso
      }
    };
    fetchPreferences();
  }, []);
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_bankroll: initialBankroll,
          stop_loss: stopLoss,
          take_profit: takeProfit,
          max_bet_percentage: maxBetPercentage,
          daily_goal: dailyGoal,
          auto_stop_loss: autoStopLoss,
          auto_take_profit: autoTakeProfit,
          progression_type: progressionType,
          progression_steps: progressionSteps
        })
      });
      console.log('Preferências salvas com sucesso');
    } catch (e) {
      console.error('Erro ao salvar preferências', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetBankroll = () => {
    if (confirm('Tem certeza que deseja resetar a banca? Esta ação não pode ser desfeita.')) {
      console.log('Resetando banca...');
    }
  };

  // Novas funções para funcionalidades solicitadas
  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= bankrollData.currentBankroll) {
      console.log('Processando saque de R$', amount);
      setWithdrawAmount('');
      // Aqui você adicionaria a lógica para atualizar a banca
    } else {
      alert('Valor inválido para saque');
    }
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      console.log('Processando depósito de R$', amount);
      setDepositAmount('');
      // Aqui você adicionaria a lógica para atualizar a banca
    } else {
      alert('Valor inválido para depósito');
    }
  };

  const calculateGrowthProjection = () => {
    const dailyReturn = (simulatorGoal - simulatorInitial) / simulatorDays;
    const projectedDays = Math.ceil((simulatorGoal - simulatorInitial) / dailyReturn);
    return {
      dailyReturn: dailyReturn.toFixed(2),
      projectedDays,
      monthlyReturn: (dailyReturn * 30).toFixed(2),
      successRate: projectedDays <= simulatorDays ? 'Alta' : 'Baixa'
    };
  };

  // Verificar se a meta diária foi atingida
  const dailyProfit = bankrollData.netProfit; // Simplificado para demo
  const dailyGoalProgress = (dailyProfit / dailyGoal) * 100;
  // Derivados calculados usados na UI
  const profitPercentage: number = (bankrollData.netProfit / bankrollData.initialBankroll) * 100;
  const riskPercentage: number = (bankrollData.maxDrawdown / bankrollData.initialBankroll) * 100;
  const maxBetAmount: number = bankrollData.currentBankroll * (maxBetPercentage / 100);
  
  // Simular alerta de meta atingida
  useEffect(() => {
    if (dailyProfit >= dailyGoal && !goalReached) {
      setGoalReached(true);
      setShowGoalAlert(true);
      setTimeout(() => setShowGoalAlert(false), 5000);
    }
  }, [dailyProfit, dailyGoal, goalReached]);

  const calculateProgression = (baseAmount: number, step: number) => {
    switch (progressionType) {
      case 'martingale':
        return baseAmount * Math.pow(2, step);
      case 'fibonacci':
        const fib = [1, 1];
        for (let i = 2; i <= step; i++) {
          fib[i] = fib[i - 1] + fib[i - 2];
        }
        return baseAmount * fib[step];
      case 'dalembert':
        return baseAmount + (step * baseAmount * 0.1);
      default:
        return baseAmount;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Banca</h1>
            <p className="text-muted-foreground">
              Controle e monitore sua banca com ferramentas avançadas de gerenciamento de risco
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={profitPercentage >= 0 ? 'default' : 'destructive'}>
              {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(1)}%
            </Badge>
          </div>
        </div>

        {/* Alertas de Risco */}
        {riskPercentage > 15 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Atenção:</strong> Você está em um drawdown de {riskPercentage.toFixed(1)}%. 
              Considere reduzir o tamanho das apostas ou fazer uma pausa.
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de Meta Atingida */}
        {showGoalAlert && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Parabéns!</strong> Você atingiu sua meta diária de R$ {dailyGoal}! 
              Considere parar por hoje para manter a disciplina.
            </AlertDescription>
          </Alert>
        )}

        {/* Painel de Saldo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Painel de Saldo
            </CardTitle>
            <CardDescription>
              Gerencie depósitos e saques da sua banca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Saldo Atual */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Saldo Atual</Label>
                <div className="text-3xl font-bold text-green-600">
                  R$ {bankrollData.currentBankroll.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Meta Diária: R$ {dailyGoal} ({dailyGoalProgress.toFixed(1)}%)
                </div>
                <Progress value={Math.min(dailyGoalProgress, 100)} className="h-2" />
              </div>

              {/* Novo Saque */}
              <div className="space-y-3">
                <Label htmlFor="withdraw-amount">Novo Saque</Label>
                <div className="flex gap-2">
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Valor"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <Button 
                    onClick={handleWithdraw}
                    variant="outline"
                    disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Máximo disponível: R$ {bankrollData.currentBankroll}
                </p>
              </div>

              {/* Novo Depósito */}
              <div className="space-y-3">
                <Label htmlFor="deposit-amount">Novo Depósito</Label>
                <div className="flex gap-2">
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="Valor"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                  <Button 
                    onClick={handleDeposit}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adicione fundos à sua banca
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banca Atual</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {bankrollData.currentBankroll}</div>
              <p className="text-xs text-muted-foreground">
                Inicial: R$ {bankrollData.initialBankroll}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                bankrollData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {bankrollData.netProfit >= 0 ? '+' : ''}R$ {bankrollData.netProfit}
              </div>
              <p className="text-xs text-muted-foreground">
                {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(1)}% da banca inicial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bankrollData.winRate}%</div>
              <Progress value={bankrollData.winRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {bankrollData.totalSessions} sessões realizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Máx. Aposta</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {maxBetAmount.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">
                {maxBetPercentage}% da banca atual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="simulator">Simulador</TabsTrigger>
            <TabsTrigger value="calculator">Calculadora</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Evolução da Banca */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução da Banca</CardTitle>
                  <CardDescription>
                    Acompanhe o crescimento da sua banca ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={bankrollHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          `R$ ${value}`, 
                          name === 'value' ? 'Banca' : 'Lucro'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribuição de Risco */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Risco</CardTitle>
                  <CardDescription>
                    Como sua banca está distribuída por nível de risco
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas Detalhadas */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Lucro Total</Label>
                    <div className="text-lg font-bold text-green-600">
                      +R$ {bankrollData.totalProfit}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Perda Total</Label>
                    <div className="text-lg font-bold text-red-600">
                      -R$ {bankrollData.totalLoss}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Lucro Médio/Sessão</Label>
                    <div className="text-lg font-bold">
                      R$ {bankrollData.avgSessionProfit}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Máximo Drawdown</Label>
                    <div className="text-lg font-bold text-orange-600">
                      R$ {bankrollData.maxDrawdown}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Drawdown Atual</Label>
                    <div className="text-lg font-bold">
                      R$ {bankrollData.currentDrawdown}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nível de Risco</Label>
                    <Badge variant={bankrollData.riskLevel === 'low' ? 'default' : 
                                   bankrollData.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                      {bankrollData.riskLevel === 'low' ? 'Baixo' :
                       bankrollData.riskLevel === 'medium' ? 'Médio' : 'Alto'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Configurações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Básicas</CardTitle>
                  <CardDescription>
                    Defina os parâmetros fundamentais da sua banca
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial-bankroll">Banca Inicial (R$)</Label>
                    <Input
                      id="initial-bankroll"
                      type="number"
                      value={initialBankroll}
                      onChange={(e) => setInitialBankroll(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-bet-percentage">Máximo por Aposta (%)</Label>
                    <Input
                      id="max-bet-percentage"
                      type="number"
                      min="1"
                      max="20"
                      value={maxBetPercentage}
                      onChange={(e) => setMaxBetPercentage(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Valor máximo: R$ {maxBetAmount.toFixed(0)}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Proteções Automáticas</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Stop Loss Automático</Label>
                        <p className="text-xs text-muted-foreground">
                          Para automaticamente ao atingir perda limite
                        </p>
                      </div>
                      <Switch
                        checked={autoStopLoss}
                        onCheckedChange={setAutoStopLoss}
                      />
                    </div>

                    {autoStopLoss && (
                      <div className="space-y-2">
                        <Label htmlFor="stop-loss">Stop Loss (R$)</Label>
                        <Input
                          id="stop-loss"
                          type="number"
                          value={stopLoss}
                          onChange={(e) => setStopLoss(Number(e.target.value))}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Take Profit Automático</Label>
                        <p className="text-xs text-muted-foreground">
                          Para automaticamente ao atingir lucro alvo
                        </p>
                      </div>
                      <Switch
                        checked={autoTakeProfit}
                        onCheckedChange={setAutoTakeProfit}
                      />
                    </div>

                    {autoTakeProfit && (
                      <div className="space-y-2">
                        <Label htmlFor="take-profit">Take Profit (R$)</Label>
                        <Input
                          id="take-profit"
                          type="number"
                          value={takeProfit}
                          onChange={(e) => setTakeProfit(Number(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ações */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                  <CardDescription>
                    Gerencie sua banca e configurações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleSaveSettings} 
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Zona de Perigo</Label>
                    <Button 
                      variant="destructive" 
                      onClick={handleResetBankroll}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Resetar Banca
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Esta ação irá resetar toda a banca e histórico
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Definição de Metas</CardTitle>
                <CardDescription>
                  Configure suas metas diárias e limites de Stop Loss/Gain
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Meta Diária */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="daily-goal">Meta Diária de Lucro (R$)</Label>
                      <Input
                        id="daily-goal"
                        type="number"
                        value={dailyGoal}
                        onChange={(e) => setDailyGoal(Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                      <h4 className="font-medium text-blue-900 mb-2">Progresso Atual</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Lucro Hoje:</span>
                          <span className="font-medium">R$ {dailyProfit}</span>
                        </div>
                        <Progress value={Math.min(dailyGoalProgress, 100)} className="h-2" />
                        <div className="text-xs text-blue-700">
                          {dailyGoalProgress >= 100 ? '🎉 Meta atingida!' : 
                           `Faltam R$ ${Math.max(0, dailyGoal - dailyProfit)} para a meta`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Limites de Proteção */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Limites de Proteção</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stop-loss-goal">Stop Loss Diário (R$)</Label>
                      <Input
                        id="stop-loss-goal"
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Pare automaticamente ao perder este valor
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stop-gain-goal">Stop Gain Diário (R$)</Label>
                      <Input
                        id="stop-gain-goal"
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Pare automaticamente ao ganhar este valor
                      </p>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                      <h5 className="font-medium text-yellow-900 mb-2">🎯 Jogo Responsável</h5>
                      <p className="text-sm text-yellow-800">
                        Definir limites claros ajuda a manter a disciplina e proteger sua banca.
                        Quando atingir sua meta ou limite, considere parar por hoje.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Metas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Simulador de Crescimento da Banca</CardTitle>
                <CardDescription>
                  Projete o crescimento da sua banca com base em metas e prazos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Parâmetros da Simulação */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Parâmetros da Simulação</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sim-initial">Valor Inicial (R$)</Label>
                      <Input
                        id="sim-initial"
                        type="number"
                        value={simulatorInitial}
                        onChange={(e) => setSimulatorInitial(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sim-goal">Meta Final (R$)</Label>
                      <Input
                        id="sim-goal"
                        type="number"
                        value={simulatorGoal}
                        onChange={(e) => setSimulatorGoal(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sim-days">Prazo (dias)</Label>
                      <Input
                        id="sim-days"
                        type="number"
                        value={simulatorDays}
                        onChange={(e) => setSimulatorDays(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Resultados da Projeção */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Projeção de Crescimento</h4>
                    
                    {(() => {
                      const projection = calculateGrowthProjection();
                      return (
                        <div className="space-y-3">
                          <div className="p-4 bg-gray-50 border rounded">
                            <div className="grid gap-3">
                              <div className="flex justify-between">
                                <span className="text-sm">Lucro necessário/dia:</span>
                                <span className="font-medium">R$ {projection.dailyReturn}</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="text-sm">Lucro mensal estimado:</span>
                                <span className="font-medium">R$ {projection.monthlyReturn}</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="text-sm">Crescimento total:</span>
                                <span className="font-medium">
                                  {(((simulatorGoal - simulatorInitial) / simulatorInitial) * 100).toFixed(1)}%
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="text-sm">Probabilidade de sucesso:</span>
                                <Badge variant={projection.successRate === 'Alta' ? 'default' : 'destructive'}>
                                  {projection.successRate}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                            <h5 className="font-medium text-blue-900 mb-2">💡 Dicas da Simulação</h5>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Metas realistas aumentam as chances de sucesso</li>
                              <li>• Considere a volatilidade do mercado</li>
                              <li>• Mantenha sempre uma reserva de emergência</li>
                              <li>• Revise suas metas periodicamente</li>
                            </ul>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <h5 className="font-medium text-green-900 mb-2">📊 Planilha de Banca Virtual</h5>
                  <p className="text-sm text-green-800 mb-3">
                    Esta simulação funciona como uma planilha de gestão de banca, 
                    ajudando você a visualizar metas realistas e planejar seu crescimento.
                  </p>
                  <div className="grid gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Valor inicial:</span>
                      <span>R$ {simulatorInitial.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Meta final:</span>
                      <span>R$ {simulatorGoal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prazo:</span>
                      <span>{simulatorDays} dias</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calculadora de Progressão</CardTitle>
                <CardDescription>
                  Calcule progressões de apostas para diferentes estratégias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de Progressão</Label>
                    <Select value={progressionType} onValueChange={setProgressionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="martingale">Martingale</SelectItem>
                        <SelectItem value="fibonacci">Fibonacci</SelectItem>
                        <SelectItem value="dalembert">D&apos;Alembert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Número de Passos</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={progressionSteps}
                      onChange={(e) => setProgressionSteps(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-4">Sequência de Apostas (Base: R$ 10)</h4>
                  <div className="grid gap-2">
                    {Array.from({ length: progressionSteps }, (_, i) => {
                      const amount = calculateProgression(10, i);
                      const isRisky = amount > maxBetAmount;
                      
                      return (
                        <div 
                          key={i} 
                          className={`flex justify-between items-center p-2 rounded border ${
                            isRisky ? 'border-red-200 bg-red-50' : 'border-gray-200'
                          }`}
                        >
                          <span>Passo {i + 1}:</span>
                          <span className={`font-medium ${
                            isRisky ? 'text-red-600' : ''
                          }`}>
                            R$ {amount.toFixed(2)}
                            {isRisky && ' ⚠️'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Total necessário:</strong> R$ {Array.from({ length: progressionSteps }, (_, i) => 
                        calculateProgression(10, i)
                      ).reduce((sum, amount) => sum + amount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>
                  Acompanhe todas as movimentações da sua banca
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>
                          <Badge variant={
                            transaction.type === 'profit' ? 'default' :
                            transaction.type === 'loss' ? 'destructive' :
                            transaction.type === 'deposit' ? 'secondary' : 'outline'
                          }>
                            {transaction.type === 'profit' ? 'Lucro' :
                             transaction.type === 'loss' ? 'Perda' :
                             transaction.type === 'deposit' ? 'Depósito' : 'Saque'}
                          </Badge>
                        </TableCell>
                        <TableCell className={
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }>
                          {transaction.amount >= 0 ? '+' : ''}R$ {Math.abs(transaction.amount)}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="font-medium">
                          R$ {transaction.balance}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}