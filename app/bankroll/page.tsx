'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Minus, Plus, RotateCcw, Save, Shield, Wallet, XCircle } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const bankrollData = {
  initialBankroll: 1000,
  currentBankroll: 1350,
};

const bankrollHistory = [
  { date: '01/01', value: 1000 },
  { date: '02/01', value: 1050 },
  { date: '03/01', value: 980 },
  { date: '04/01', value: 1120 },
  { date: '05/01', value: 1200 },
  { date: '06/01', value: 1150 },
  { date: '07/01', value: 1350 },
];

const transactions = [
  { id: 1, date: '15/01/2024', type: 'profit', amount: 150, description: 'Sessão - Mesa Evolution', balance: 1350 },
  { id: 2, date: '15/01/2024', type: 'loss', amount: -50, description: 'Sessão - Mesa Pragmatic', balance: 1200 },
  { id: 3, date: '14/01/2024', type: 'profit', amount: 200, description: 'Sessão - Mesa Evolution', balance: 1250 },
  { id: 4, date: '14/01/2024', type: 'deposit', amount: 500, description: 'Depósito inicial', balance: 1050 },
  { id: 5, date: '13/01/2024', type: 'loss', amount: -80, description: 'Sessão - Mesa Pragmatic', balance: 550 },
];

type RiskStatus = 'ok' | 'risk' | 'pause';

export default function BankrollPage() {
  const [initialBankroll, setInitialBankroll] = useState(bankrollData.initialBankroll);
  const [stopLoss, setStopLoss] = useState(200);
  const [takeProfit, setTakeProfit] = useState(300);
  const [maxBetPercentage, setMaxBetPercentage] = useState(5);
  const [autoStopLoss, setAutoStopLoss] = useState(true);
  const [autoTakeProfit, setAutoTakeProfit] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

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
        setAutoStopLoss(Boolean(prefs?.auto_stop_loss ?? true));
        setAutoTakeProfit(Boolean(prefs?.auto_take_profit ?? true));
      } catch {
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
          auto_stop_loss: autoStopLoss,
          auto_take_profit: autoTakeProfit,
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetBankroll = () => {
    if (confirm('Tem certeza que deseja resetar a banca? Esta ação não pode ser desfeita.')) {
      // Implementação real depende do backend
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= bankrollData.currentBankroll) {
      setWithdrawAmount('');
      return;
    }
    alert('Valor inválido para saque');
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      setDepositAmount('');
      return;
    }
    alert('Valor inválido para depósito');
  };

  const currentPnl = bankrollData.currentBankroll - initialBankroll;
  const pnlPercentage = initialBankroll > 0 ? (currentPnl / initialBankroll) * 100 : 0;
  const maxBetAmount = bankrollData.currentBankroll * (maxBetPercentage / 100);

  const stopLossUsage = autoStopLoss && stopLoss > 0 ? Math.min((Math.max(0, -currentPnl) / stopLoss) * 100, 100) : 0;
  const takeProfitUsage = autoTakeProfit && takeProfit > 0 ? Math.min((Math.max(0, currentPnl) / takeProfit) * 100, 100) : 0;

  const riskStatus: RiskStatus = (() => {
    if (!autoStopLoss || stopLoss <= 0) return 'ok';
    const loss = Math.max(0, -currentPnl);
    if (loss >= stopLoss) return 'pause';
    if (loss >= stopLoss * 0.75) return 'risk';
    return 'ok';
  })();

  const riskUi = (() => {
    if (riskStatus === 'pause') {
      return {
        className: 'border-red-200 bg-red-50',
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        textClassName: 'text-red-800',
        title: 'Pausa recomendada:',
        message: 'você atingiu seu stop loss. Pare por hoje e volte amanhã.',
      };
    }
    if (riskStatus === 'risk') {
      return {
        className: 'border-yellow-200 bg-yellow-50',
        icon: <AlertTriangle className="h-4 w-4 text-yellow-700" />,
        textClassName: 'text-yellow-900',
        title: 'Risco:',
        message: 'você está se aproximando do stop loss. Reduza o tamanho das apostas.',
      };
    }
    return {
      className: 'border-green-200 bg-green-50',
      icon: <CheckCircle className="h-4 w-4 text-green-700" />,
      textClassName: 'text-green-900',
      title: 'Dentro do plano:',
      message: 'você está respeitando os limites definidos.',
    };
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Banca</h1>
            <p className="text-muted-foreground">Defina limites, acompanhe se está respeitando e saiba quando parar</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={pnlPercentage >= 0 ? 'default' : 'destructive'}>
              {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
            </Badge>
          </div>
        </div>

        <Alert className={riskUi.className}>
          {riskUi.icon}
          <AlertDescription className={riskUi.textClassName}>
            <strong>{riskUi.title}</strong> {riskUi.message}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Estado Atual
            </CardTitle>
            <CardDescription>Saldo e execução das regras de proteção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div>
                  <Label className="text-sm font-medium">Saldo atual</Label>
                  <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
                    <div className="text-3xl font-bold">R$ {bankrollData.currentBankroll.toLocaleString()}</div>
                    <div className={`text-sm font-medium ${currentPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currentPnl >= 0 ? '+' : '-'}R$ {Math.abs(currentPnl).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Banca inicial configurada: R$ {initialBankroll.toLocaleString()}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Stop loss</span>
                      <span className="font-medium">R$ {stopLoss.toLocaleString()}</span>
                    </div>
                    <Progress value={stopLossUsage} className="h-2" />
                    <div className="text-xs text-muted-foreground">Uso atual: {stopLossUsage.toFixed(0)}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Take profit</span>
                      <span className="font-medium">R$ {takeProfit.toLocaleString()}</span>
                    </div>
                    <Progress value={takeProfitUsage} className="h-2" />
                    <div className="text-xs text-muted-foreground">Progresso atual: {takeProfitUsage.toFixed(0)}%</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Movimentar banca</Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount" className="text-xs text-muted-foreground">Depósito</Label>
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
                          variant="outline"
                          disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount" className="text-xs text-muted-foreground">Saque</Label>
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
                      <p className="text-xs text-muted-foreground">Disponível: R$ {bankrollData.currentBankroll.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Regras Ativas
            </CardTitle>
            <CardDescription>Limites que protegem sua banca contra excesso de risco</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Por aposta</div>
                <div className="text-lg font-semibold">
                  {maxBetPercentage}% (R$ {maxBetAmount.toFixed(0)})
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Stop loss</div>
                <div className="text-lg font-semibold">R$ {stopLoss.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Take profit</div>
                <div className="text-lg font-semibold">R$ {takeProfit.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evolução da banca</CardTitle>
                <CardDescription>Acompanhamento simples para ver se está subindo ou caindo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={bankrollHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, 'Banca']} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>Defina limites e proteções automáticas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="initial-bankroll">Banca inicial (R$)</Label>
                    <Input
                      id="initial-bankroll"
                      type="number"
                      value={initialBankroll}
                      onChange={(e) => setInitialBankroll(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-bet-percentage">Por aposta (%)</Label>
                    <Input
                      id="max-bet-percentage"
                      type="number"
                      min="1"
                      max="20"
                      value={maxBetPercentage}
                      onChange={(e) => setMaxBetPercentage(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">Máximo calculado: R$ {maxBetAmount.toFixed(0)}</p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Stop loss automático</Label>
                        <p className="text-xs text-muted-foreground">Pausa ao atingir perda limite</p>
                      </div>
                      <Switch checked={autoStopLoss} onCheckedChange={setAutoStopLoss} />
                    </div>

                    {autoStopLoss ? (
                      <div className="space-y-2">
                        <Label htmlFor="stop-loss">Stop loss (R$)</Label>
                        <Input
                          id="stop-loss"
                          type="number"
                          value={stopLoss}
                          onChange={(e) => setStopLoss(Number(e.target.value))}
                        />
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Take profit automático</Label>
                        <p className="text-xs text-muted-foreground">Pausa ao atingir lucro alvo</p>
                      </div>
                      <Switch checked={autoTakeProfit} onCheckedChange={setAutoTakeProfit} />
                    </div>

                    {autoTakeProfit ? (
                      <div className="space-y-2">
                        <Label htmlFor="take-profit">Take profit (R$)</Label>
                        <Input
                          id="take-profit"
                          type="number"
                          value={takeProfit}
                          onChange={(e) => setTakeProfit(Number(e.target.value))}
                        />
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                  <CardDescription>Salvar configurações e gerenciar banca</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleSaveSettings} className="w-full" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Salvando...' : 'Salvar configurações'}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Zona de perigo</Label>
                    <Button variant="destructive" onClick={handleResetBankroll} className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Resetar banca
                    </Button>
                    <p className="text-xs text-muted-foreground">Esta ação depende do backend</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Auditoria</CardTitle>
                <CardDescription>Depósitos, saques e resultados consolidados</CardDescription>
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
                        <TableCell className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount >= 0 ? '+' : ''}R$ {Math.abs(transaction.amount)}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="font-medium">R$ {transaction.balance}</TableCell>
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
