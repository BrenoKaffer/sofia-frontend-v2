'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { GradientAlert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { sofiaToast } from '@/components/ui/sonner';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Minus, Plus, RotateCcw, Save, Shield, Wallet } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const bankrollData = {
  initialBankroll: 1000,
  currentBankroll: 1350,
};

const PROFIT_SESSIONS_STORAGE_KEY = 'sofia:profit:sessions:v1';

const bankrollHistory = [
  { date: '01/01', value: 1000 },
  { date: '02/01', value: 1050 },
  { date: '03/01', value: 980 },
  { date: '04/01', value: 1120 },
  { date: '05/01', value: 1200 },
  { date: '06/01', value: 1150 },
  { date: '07/01', value: 1350 },
];

type TransactionType = 'profit' | 'loss' | 'deposit' | 'withdraw';

type ProfitSession = {
  id: string;
  createdAt: string;
  strategy: string;
  profit: number;
  durationMinutes?: number;
  table?: string;
  chips?: number;
};

type AuditEntry = {
  id: string;
  createdAt: string;
  type: TransactionType;
  amount: number;
  description: string;
  source: 'profit' | 'bankroll';
};

type AuditRow = AuditEntry & {
  dateLabel: string;
  balance: number;
};

type RiskStatus = 'ok' | 'risk' | 'pause';

function parseNumeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function formatAuditDate(createdAt: string) {
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime())) return createdAt;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function BankrollPage() {
  const [initialBankroll, setInitialBankroll] = useState(bankrollData.initialBankroll);
  const [stopLoss, setStopLoss] = useState(200);
  const [takeProfit, setTakeProfit] = useState(300);
  const [maxBetPercentage, setMaxBetPercentage] = useState(5);
  const [autoStopLoss, setAutoStopLoss] = useState(true);
  const [autoTakeProfit, setAutoTakeProfit] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isBankrollSyncing, setIsBankrollSyncing] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  const [bankrollTransactions, setBankrollTransactions] = useState<AuditEntry[]>([]);
  const [profitSessions, setProfitSessions] = useState<ProfitSession[]>([]);

  const [auditQuery, setAuditQuery] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'all' | TransactionType | 'sessions'>('all');
  const [auditPeriodFilter, setAuditPeriodFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [settingsRes, txRes] = await Promise.all([
          fetch('/api/bankroll/settings'),
          fetch('/api/bankroll/transactions?limit=200'),
        ]);

        if (cancelled) return;

        if (settingsRes.ok) {
          const prefs = await settingsRes.json().catch(() => ({}));
          setInitialBankroll(Number(prefs?.initial_bankroll ?? prefs?.initialBankroll ?? bankrollData.initialBankroll));
          setStopLoss(Number(prefs?.stop_loss ?? prefs?.daily_stop_loss ?? 200));
          setTakeProfit(Number(prefs?.take_profit ?? prefs?.daily_stop_gain ?? 300));
          setMaxBetPercentage(Number(prefs?.max_bet_percentage ?? prefs?.maxBetPercentage ?? 5));
          setAutoStopLoss(Boolean(prefs?.auto_stop_loss ?? true));
          setAutoTakeProfit(Boolean(prefs?.auto_take_profit ?? true));
        }

        if (txRes.ok) {
          const payload = await txRes.json().catch(() => ({}));
          const txs = Array.isArray(payload?.transactions) ? payload.transactions : [];
          const normalized = txs
            .map((tx: any) => {
              const id = typeof tx?.id === 'string' ? tx.id : null;
              const createdAt = typeof tx?.created_at === 'string' ? tx.created_at : null;
              const type = typeof tx?.type === 'string' ? tx.type : null;
              const amount = parseNumeric(tx?.amount);
              const description = typeof tx?.description === 'string' && tx.description.trim().length ? tx.description : null;
              if (!id || !createdAt || !type) return null;
              if (type !== 'deposit' && type !== 'withdraw') return null;
              if (!(amount !== null && Number.isFinite(amount) && amount !== 0)) return null;
              return {
                id,
                createdAt,
                type,
                amount,
                description: description ?? (type === 'withdraw' ? 'Saque' : 'Depósito'),
                source: 'bankroll',
              } satisfies AuditEntry;
            })
            .filter(Boolean) as AuditEntry[];
          setBankrollTransactions(normalized.slice(0, 1000));
        }
      } catch {
        // fallback silencioso
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFIT_SESSIONS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const normalized = parsed.filter((item) => {
        if (!item || typeof item !== 'object') return false;
        if (typeof item.id !== 'string') return false;
        if (typeof item.createdAt !== 'string') return false;
        if (typeof item.strategy !== 'string') return false;
        return typeof item.profit === 'number' && Number.isFinite(item.profit) && item.profit !== 0;
      }) as ProfitSession[];
      setProfitSessions(normalized.slice(0, 500));
    } catch {
      // noop
    }
  }, []);

  const profitAuditEntries: AuditEntry[] = useMemo(() => {
    return profitSessions.map((session) => {
      const isLoss = session.profit < 0;
      const amount = session.profit;
      const parts = [`Sessão • ${session.strategy}`];
      if (session.table) parts.push(`Mesa: ${session.table}`);
      if (typeof session.durationMinutes === 'number') parts.push(`${session.durationMinutes} min`);
      if (typeof session.chips === 'number') parts.push(`${session.chips} fichas`);
      return {
        id: session.id,
        createdAt: session.createdAt,
        type: isLoss ? 'loss' : 'profit',
        amount,
        description: parts.join(' • '),
        source: 'profit',
      };
    });
  }, [profitSessions]);

  const auditRows: AuditRow[] = useMemo(() => {
    const combined = [...profitAuditEntries, ...bankrollTransactions];
    const ordered = [...combined].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let running = initialBankroll;
    const computed = ordered.map((entry) => {
      running += entry.amount;
      return {
        ...entry,
        dateLabel: formatAuditDate(entry.createdAt),
        balance: running,
      };
    });
    return computed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bankrollTransactions, initialBankroll, profitAuditEntries]);

  const currentBalance = auditRows[0]?.balance ?? bankrollData.currentBankroll;

  const filteredAuditRows: AuditRow[] = useMemo(() => {
    const q = auditQuery.trim().toLowerCase();
    const now = Date.now();
    const msDay = 24 * 60 * 60 * 1000;
    const cutoff =
      auditPeriodFilter === '7d'
        ? now - 7 * msDay
        : auditPeriodFilter === '30d'
          ? now - 30 * msDay
          : auditPeriodFilter === '90d'
            ? now - 90 * msDay
            : null;

    return auditRows.filter((row) => {
      if (auditTypeFilter !== 'all') {
        const matchesType =
          auditTypeFilter === 'sessions'
            ? row.type === 'profit' || row.type === 'loss'
            : row.type === auditTypeFilter;
        if (!matchesType) return false;
      }

      if (cutoff !== null) {
        const createdAt = new Date(row.createdAt).getTime();
        if (Number.isFinite(createdAt) && createdAt < cutoff) return false;
      }

      if (!q) return true;
      return (
        row.description.toLowerCase().includes(q) ||
        row.dateLabel.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q)
      );
    });
  }, [auditPeriodFilter, auditQuery, auditRows, auditTypeFilter]);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/bankroll/settings', {
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
      setIsBankrollSyncing(true);
      fetch('/api/bankroll/reset', { method: 'POST' })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(typeof err?.error === 'string' ? err.error : 'Erro ao resetar a banca');
          }
          setBankrollTransactions([]);
        })
        .catch((error: any) => {
          alert(error?.message || 'Erro ao resetar a banca');
        })
        .finally(() => {
          setIsBankrollSyncing(false);
        });
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!(amount > 0)) {
      sofiaToast({
        variant: 'warning',
        title: 'Valor inválido',
        message: 'Informe um valor válido para saque.',
      });
      return;
    }
    if (amount > currentBalance) {
      sofiaToast({
        variant: 'warning',
        title: 'Saldo insuficiente',
        message: 'O valor do saque é maior que o saldo disponível.',
      });
      return;
    }
    if (isBankrollSyncing) return;

    setIsBankrollSyncing(true);
    try {
      const res = await fetch('/api/bankroll/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'withdraw', amount, description: 'Saque' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err?.error === 'string' ? err.error : 'Erro ao registrar saque');
      }
      const payload = await res.json().catch(() => ({}));
      const tx = payload?.transaction;
      const entry: AuditEntry = {
        id: typeof tx?.id === 'string' ? tx.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: typeof tx?.created_at === 'string' ? tx.created_at : new Date().toISOString(),
        type: 'withdraw',
        amount: parseNumeric(tx?.amount) ?? -Math.abs(amount),
        description: typeof tx?.description === 'string' && tx.description.trim().length ? tx.description : 'Saque',
        source: 'bankroll',
      };
      setBankrollTransactions((prev) => [entry, ...prev].slice(0, 1000));
      setWithdrawAmount('');
      sofiaToast({
        variant: 'success',
        title: 'Saque registrado',
        message: `${Math.abs(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} retirado com sucesso.`,
      });
    } catch (error: any) {
      sofiaToast({
        variant: 'error',
        title: 'Falha ao registrar saque',
        message: error?.message || 'Erro ao registrar saque',
      });
    } finally {
      setIsBankrollSyncing(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!(amount > 0)) {
      sofiaToast({
        variant: 'warning',
        title: 'Valor inválido',
        message: 'Informe um valor válido para depósito.',
      });
      return;
    }
    if (isBankrollSyncing) return;

    setIsBankrollSyncing(true);
    try {
      const res = await fetch('/api/bankroll/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'deposit', amount, description: 'Depósito' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err?.error === 'string' ? err.error : 'Erro ao registrar depósito');
      }
      const payload = await res.json().catch(() => ({}));
      const tx = payload?.transaction;
      const entry: AuditEntry = {
        id: typeof tx?.id === 'string' ? tx.id : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: typeof tx?.created_at === 'string' ? tx.created_at : new Date().toISOString(),
        type: 'deposit',
        amount: parseNumeric(tx?.amount) ?? Math.abs(amount),
        description: typeof tx?.description === 'string' && tx.description.trim().length ? tx.description : 'Depósito',
        source: 'bankroll',
      };
      setBankrollTransactions((prev) => [entry, ...prev].slice(0, 1000));
      setDepositAmount('');
      sofiaToast({
        variant: 'success',
        title: 'Depósito registrado',
        message: `${Math.abs(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} adicionado com sucesso.`,
      });
    } catch (error: any) {
      sofiaToast({
        variant: 'error',
        title: 'Falha ao registrar depósito',
        message: error?.message || 'Erro ao registrar depósito',
      });
    } finally {
      setIsBankrollSyncing(false);
    }
  };

  const currentPnl = currentBalance - initialBankroll;
  const pnlPercentage = initialBankroll > 0 ? (currentPnl / initialBankroll) * 100 : 0;
  const maxBetAmount = currentBalance * (maxBetPercentage / 100);

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
        variant: 'error' as const,
        title: 'Pausa recomendada:',
        message: 'você atingiu seu stop loss. Pare por hoje e volte amanhã.',
      };
    }
    if (riskStatus === 'risk') {
      return {
        variant: 'warning' as const,
        title: 'Risco:',
        message: 'você está se aproximando do stop loss. Reduza o tamanho das apostas.',
      };
    }
    return {
      variant: 'success' as const,
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

        <GradientAlert variant={riskUi.variant} title={riskUi.title} description={riskUi.message} />

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
                    <div className="text-3xl font-bold">R$ {currentBalance.toLocaleString()}</div>
                    <div className={`text-sm font-medium ${currentPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {currentPnl >= 0 ? '+' : '-'}R$ {Math.abs(currentPnl).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Banca inicial configurada: R$ {initialBankroll.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="w-96 max-w-full">
                      <div className="flex items-center justify-between text-sm">
                        <span>Stop win</span>
                        <span className="font-medium text-white">R$ {takeProfit.toLocaleString()}</span>
                      </div>
                      <Progress value={takeProfitUsage} className="h-2 w-full" indicatorClassName="bg-green-500" />
                    </div>
                    <div className="text-xs text-muted-foreground">Progresso atual: {takeProfitUsage.toFixed(0)}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-96 max-w-full">
                      <div className="flex items-center justify-between text-sm">
                        <span>Stop loss</span>
                        <span className="font-medium text-white">R$ {stopLoss.toLocaleString()}</span>
                      </div>
                      <Progress
                        value={stopLossUsage}
                        className="h-2 w-full"
                        indicatorClassName={riskStatus === 'pause' ? 'bg-red-500' : riskStatus === 'risk' ? 'bg-amber-500' : 'bg-green-500'}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">Uso atual: {stopLossUsage.toFixed(0)}%</div>
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
                          disabled={isBankrollSyncing || !depositAmount || parseFloat(depositAmount) <= 0}
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
                          disabled={isBankrollSyncing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Disponível: R$ {currentBalance.toLocaleString()}</p>
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
                <div className="text-sm text-muted-foreground">Stop win</div>
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
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>Defina limites, proteções automáticas e ações</CardDescription>
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
                      <Label>Stop win automático</Label>
                      <p className="text-xs text-muted-foreground">Pausa ao atingir lucro alvo</p>
                    </div>
                    <Switch checked={autoTakeProfit} onCheckedChange={setAutoTakeProfit} />
                  </div>

                  {autoTakeProfit ? (
                    <div className="space-y-2">
                      <Label htmlFor="take-profit">Stop win (R$)</Label>
                      <Input
                        id="take-profit"
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(Number(e.target.value))}
                      />
                    </div>
                  ) : null}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button onClick={handleSaveSettings} className="flex-1" disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Salvando...' : 'Salvar configurações'}
                    </Button>
                    <Button variant="destructive" onClick={handleResetBankroll} className="flex-1" disabled={isBankrollSyncing}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Resetar banca
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Resetar banca remove depósitos/saques e mantém a banca inicial</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Auditoria</CardTitle>
                <CardDescription>Depósitos, saques e resultados consolidados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="w-full sm:max-w-sm">
                    <Label className="text-xs text-muted-foreground">Buscar</Label>
                    <Input value={auditQuery} onChange={(e) => setAuditQuery(e.target.value)} placeholder="Estratégia, mesa, data..." />
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <div className="w-full sm:w-44">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <Select value={auditTypeFilter} onValueChange={(v) => setAuditTypeFilter(v as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="sessions">Sessões</SelectItem>
                          <SelectItem value="profit">Lucros</SelectItem>
                          <SelectItem value="loss">Perdas</SelectItem>
                          <SelectItem value="deposit">Depósitos</SelectItem>
                          <SelectItem value="withdraw">Saques</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-44">
                      <Label className="text-xs text-muted-foreground">Período</Label>
                      <Select value={auditPeriodFilter} onValueChange={(v) => setAuditPeriodFilter(v as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tudo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tudo</SelectItem>
                          <SelectItem value="7d">7 dias</SelectItem>
                          <SelectItem value="30d">30 dias</SelectItem>
                          <SelectItem value="90d">90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

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
                    {filteredAuditRows.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.dateLabel}</TableCell>
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
                        <TableCell className="font-medium">R$ {transaction.balance.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {!filteredAuditRows.length ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    ) : null}
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
