'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Activity, Download, MoreVertical, Plus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { toast } from 'sonner';

type ProfitPoint = { date: string; profit: number; sessions: number; winRate: number };

type StrategyKpi = {
  name: string;
  profit: number;
  sessions: number;
  winRate: number;
  color: string;
};

type ProfitSession = {
  id: string;
  createdAt: string;
  strategy: string;
  profit: number;
  durationMinutes?: number;
};

const profitDataFallback: ProfitPoint[] = [
  { date: '01/01', profit: 150, sessions: 3, winRate: 65 },
  { date: '02/01', profit: -80, sessions: 2, winRate: 40 },
  { date: '03/01', profit: 220, sessions: 4, winRate: 75 },
  { date: '04/01', profit: 180, sessions: 3, winRate: 70 },
  { date: '05/01', profit: -120, sessions: 2, winRate: 30 },
  { date: '06/01', profit: 300, sessions: 5, winRate: 80 },
  { date: '07/01', profit: 250, sessions: 4, winRate: 72 },
];

const strategyProfitsFallback: StrategyKpi[] = [
  { name: 'As Dúzias (Atrasadas)', profit: 450, sessions: 12, winRate: 75, color: '#10b981' },
  { name: 'Irmãos de Cores', profit: 280, sessions: 8, winRate: 68, color: '#3b82f6' },
  { name: 'Terminais que se Puxam', profit: -150, sessions: 6, winRate: 45, color: '#ef4444' },
  { name: 'Fibonacci Avançado', profit: 320, sessions: 10, winRate: 70, color: '#8b5cf6' },
];

function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDayMonth(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function computeStability(profitSeries: ProfitPoint[]) {
  const last = profitSeries.slice(-7);

  const profits = last.map(p => p.profit);
  const mean = profits.length ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
  const variance =
    profits.length > 1
      ? profits.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / (profits.length - 1)
      : 0;
  const std = Math.sqrt(variance);

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const p of profitSeries) {
    equity += p.profit;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  }

  const volatilityScore = clampNumber(std / Math.max(1, Math.abs(mean)), 0, 10);
  const drawdownScore = clampNumber(maxDrawdown / Math.max(1, Math.abs(peak)), 0, 10);
  const isVolatile = volatilityScore > 1.25 || drawdownScore > 0.35;

  return {
    label: isVolatile ? 'Volátil' : 'Estável',
    className: isVolatile ? 'bg-amber-500 text-black border-transparent' : 'bg-secondary text-secondary-foreground',
    icon: <Activity className="h-3.5 w-3.5" />
  };
}

function computeTrend(profitSeries: ProfitPoint[]) {
  if (!profitSeries.length) {
    return {
      label: 'Lateral',
      className: 'bg-secondary text-secondary-foreground border-transparent',
      icon: <Activity className="h-3.5 w-3.5" />
    };
  }

  let equity = 0;
  const equitySeries = profitSeries.map((p) => {
    equity += p.profit;
    return equity;
  });

  const n = equitySeries.length;
  const meanX = (n - 1) / 2;
  const meanY = equitySeries.reduce((acc, v) => acc + v, 0) / n;

  let cov = 0;
  let varX = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = i - meanX;
    cov += dx * (equitySeries[i] - meanY);
    varX += dx * dx;
  }

  const slope = varX ? cov / varX : 0;
  const avgAbsDaily =
    profitSeries.reduce((acc, p) => acc + Math.abs(p.profit), 0) / Math.max(1, profitSeries.length);
  const threshold = Math.max(1, avgAbsDaily * 0.15);

  if (slope > threshold) {
    return {
      label: 'Alta',
      className: 'bg-green-600 text-white border-transparent',
      icon: <TrendingUp className="h-3.5 w-3.5" />
    };
  }

  if (slope < -threshold) {
    return {
      label: 'Queda',
      className: 'bg-red-600 text-white border-transparent',
      icon: <TrendingDown className="h-3.5 w-3.5" />
    };
  }

  return {
    label: 'Lateral',
    className: 'bg-secondary text-secondary-foreground border-transparent',
    icon: <Activity className="h-3.5 w-3.5" />
  };
}

function exportProfitCsv(params: {
  profitData: ProfitPoint[];
  strategies: StrategyKpi[];
  sessions: ProfitSession[];
  selectedPeriod: string;
}) {
  const now = new Date();
  const fileName = `meu-lucro_${params.selectedPeriod}_${now.toISOString().slice(0, 10)}.csv`;

  const sections: { title: string; rows: string[][] }[] = [
    {
      title: 'Evolucao do lucro',
      rows: [
        ['data', 'lucro', 'sessoes', 'taxa_acerto_percent'],
        ...params.profitData.map((p) => [p.date, String(p.profit), String(p.sessions), String(p.winRate)])
      ]
    },
    {
      title: 'Performance por estrategia',
      rows: [
        ['estrategia', 'lucro', 'sessoes', 'taxa_acerto_percent'],
        ...params.strategies.map((s) => [s.name, String(s.profit), String(s.sessions), String(s.winRate)])
      ]
    },
    {
      title: 'Sessoes registradas',
      rows: [
        ['criado_em', 'estrategia', 'lucro', 'duracao_min'],
        ...params.sessions.map((s) => [
          s.createdAt,
          s.strategy,
          String(s.profit),
          s.durationMinutes === undefined ? '' : String(s.durationMinutes)
        ])
      ]
    }
  ];

  const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

  const csv = sections
    .flatMap((section) => {
      const lines = [escapeCell(section.title)];
      lines.push(...section.rows.map((row) => row.map((cell) => escapeCell(cell)).join(',')));
      return [...lines, ''];
    })
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ProfitPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [profitDataState, setProfitDataState] = useState<ProfitPoint[]>(profitDataFallback);
  const [strategyProfitsState, setStrategyProfitsState] = useState<StrategyKpi[]>(strategyProfitsFallback);
  const [initialBankroll, setInitialBankroll] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sessions, setSessions] = useState<ProfitSession[]>([]);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerStrategy, setRegisterStrategy] = useState<string>('');
  const [registerProfit, setRegisterProfit] = useState<string>('');
  const [registerDurationMinutes, setRegisterDurationMinutes] = useState<string>('');

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/user-preferences');
        if (!res.ok) return;
        const prefs = await res.json();
        const v = Number(prefs?.initial_bankroll ?? prefs?.initialBankroll ?? null);
        if (Number.isFinite(v) && v > 0) setInitialBankroll(v);
      } catch {
        // noop
      }
    };

    fetchPreferences();
  }, []);

  useEffect(() => {
    const fetchKpis = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/kpis-estrategias');
        const raw = await res.json();
        const dataArray = Array.isArray(raw) ? raw : (raw?.data || []);

        const strategies: StrategyKpi[] = dataArray.map((item: any) => ({
          name: item.strategy_id || item.strategy_name || 'Estratégia Desconhecida',
          profit: Number(item.total_net_profit_loss ?? item.total_net_payout ?? 0) || 0,
          sessions: Number(item.total_signals_generated ?? item.total_activations ?? 0) || 0,
          winRate: Number(item.assertiveness_rate_percent ?? item.hit_rate ?? 0) || 0,
          color: '#10b981'
        }));
        setStrategyProfitsState(strategies.length ? strategies : strategyProfitsFallback);

        const seriesLength = Math.max(
          ...dataArray.map((item: any) => (Array.isArray(item.recentPerformance) ? item.recentPerformance.length : 0)),
          0
        ) || 7;
        const profitsPerDay = Array.from({ length: seriesLength }, (_, i) =>
          dataArray.reduce((sum: number, item: any) => {
            const v = Array.isArray(item.recentPerformance) ? item.recentPerformance[i] : 0;
            return sum + (typeof v === 'number' ? v : 0);
          }, 0)
        );
        const sessionsPerDay = strategies.reduce((acc: number, st: StrategyKpi) => acc + Math.max(1, Math.round(st.sessions / seriesLength)), 0);
        const avgWinRate = strategies.length
          ? Math.round(strategies.reduce((acc: number, st: StrategyKpi) => acc + st.winRate, 0) / strategies.length)
          : 0;
        const computed: ProfitPoint[] = profitsPerDay.map((p, idx) => ({
          date: `${String(idx + 1).padStart(2, '0')}/01`,
          profit: Number(p) || 0,
          sessions: sessionsPerDay,
          winRate: avgWinRate
        }));

        setProfitDataState(computed.length ? computed : profitDataFallback);
      } catch {
        setStrategyProfitsState(strategyProfitsFallback);
        setProfitDataState(profitDataFallback);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKpis();
  }, [selectedPeriod, refreshKey]);

  const totalProfit = profitDataState.reduce((sum, day) => sum + day.profit, 0);
  const percentOfBankroll = initialBankroll ? (totalProfit / initialBankroll) * 100 : null;
  const stability = useMemo(() => computeStability(profitDataState), [profitDataState]);
  const trend = useMemo(() => computeTrend(profitDataState), [profitDataState]);

  const { topStrategies, worstStrategy } = useMemo(() => {
    const sorted = [...strategyProfitsState].sort((a, b) => b.profit - a.profit);
    const top = sorted.slice(0, 3);
    const worst = [...strategyProfitsState].sort((a, b) => a.profit - b.profit)[0] || null;
    return { topStrategies: top, worstStrategy: worst };
  }, [strategyProfitsState]);

  const smartSummary = useMemo(() => {
    const positives = strategyProfitsState.filter(s => s.profit > 0).sort((a, b) => b.profit - a.profit);
    const totalPositive = positives.reduce((acc, s) => acc + s.profit, 0);
    const top1 = positives[0] || null;
    const top2 = positives[1] || null;
    const topShare =
      totalPositive > 0 && top1
        ? ((top1.profit + (top2?.profit ?? 0)) / totalPositive) * 100
        : 0;
    const lastSession = sessions[0] || null;

    const parts: string[] = [];

    if (top1) {
      const shareText = `${Math.round(topShare)}% do seu lucro veio de ${top1.name}${top2 ? ` e ${top2.name}` : ''}.`;
      parts.push(shareText);
    }

    if (worstStrategy) {
      if (worstStrategy.profit < 0) {
        parts.push(`${worstStrategy.name} está negativo em ${formatCurrencyBRL(worstStrategy.profit)}.`);
      } else {
        parts.push(`${worstStrategy.name} é a menor contribuição no período.`);
      }
    }

    if (lastSession) {
      parts.push(
        `Última sessão: ${lastSession.profit >= 0 ? '+' : ''}${formatCurrencyBRL(lastSession.profit)} (${lastSession.strategy}).`
      );
    }

    return parts.join(' ');
  }, [sessions, strategyProfitsState, worstStrategy]);

  const microInsight = useMemo(() => {
    const positives = strategyProfitsState.filter(s => s.profit > 0).sort((a, b) => b.profit - a.profit);
    const totalPositive = positives.reduce((acc, s) => acc + s.profit, 0);
    const top1 = positives[0] || null;
    const top2 = positives[1] || null;
    const topShare =
      totalPositive > 0 && top1
        ? ((top1.profit + (top2?.profit ?? 0)) / totalPositive) * 100
        : 0;

    if (worstStrategy?.profit !== undefined && worstStrategy.profit < 0) {
      return `1 estratégia está puxando o resultado para baixo: ${worstStrategy.name}.`;
    }

    if (top1 && topShare > 0) {
      const strategiesCount = top2 ? 2 : 1;
      return `${strategiesCount} ${strategiesCount === 1 ? 'estratégia gerou' : 'estratégias geraram'} ${Math.round(topShare)}% do lucro.`;
    }

    return '';
  }, [strategyProfitsState, worstStrategy]);

  const handleRefresh = () => setRefreshKey(v => v + 1);

  const handleOpenRegister = () => {
    if (!registerStrategy) {
      const defaultStrategy = strategyProfitsState[0]?.name || '';
      setRegisterStrategy(defaultStrategy);
    }
    setRegisterOpen(true);
  };

  const handleRegisterSession = () => {
    const profitValue = Number(registerProfit);
    const durationValue = registerDurationMinutes ? Number(registerDurationMinutes) : undefined;

    if (!registerStrategy) {
      toast.error('Selecione uma estratégia');
      return;
    }

    if (!Number.isFinite(profitValue) || profitValue === 0) {
      toast.error('Informe um ganho/perda válido');
      return;
    }

    if (registerDurationMinutes && (!Number.isFinite(durationValue) || (durationValue ?? 0) <= 0)) {
      toast.error('Duração inválida');
      return;
    }

    const now = new Date();
    const session: ProfitSession = {
      id: `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
      createdAt: now.toISOString(),
      strategy: registerStrategy,
      profit: profitValue,
      durationMinutes: durationValue
    };

    const dayLabel = formatDayMonth(now);

    setSessions(prev => [session, ...prev].slice(0, 5));

    setProfitDataState(prev => {
      const next = [...prev];
      const idx = next.findIndex(p => p.date === dayLabel);
      if (idx >= 0) {
        const current = next[idx];
        next[idx] = {
          ...current,
          profit: current.profit + profitValue,
          sessions: current.sessions + 1
        };
        return next;
      }
      const baseline = next[next.length - 1];
      return [
        ...next,
        {
          date: dayLabel,
          profit: profitValue,
          sessions: (baseline?.sessions ?? 0) + 1,
          winRate: baseline?.winRate ?? 0
        }
      ].slice(-14);
    });

    setStrategyProfitsState(prev => {
      const next = [...prev];
      const idx = next.findIndex(s => s.name === registerStrategy);
      if (idx >= 0) {
        const current = next[idx];
        next[idx] = { ...current, profit: current.profit + profitValue, sessions: current.sessions + 1 };
        return next;
      }
      return [
        ...next,
        { name: registerStrategy, profit: profitValue, sessions: 1, winRate: 0, color: '#10b981' }
      ];
    });

    setRegisterProfit('');
    setRegisterDurationMinutes('');
    setRegisterOpen(false);
    toast.success('Sessão registrada');
  };

  const handleExport = () => {
    try {
      exportProfitCsv({
        profitData: profitDataState,
        strategies: strategyProfitsState,
        sessions,
        selectedPeriod
      });
      toast.success('Exportação gerada');
    } catch {
      toast.error('Falha ao exportar');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Lucro</h1>
            <p className="text-muted-foreground">
              Placar do jogo: lucro, consistência e origem do resultado
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="1y">1 ano</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} aria-label="Atualizar">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Button variant="outline" size="sm" onClick={handleOpenRegister}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar sessão
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Mais ações">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/bankroll">Configurar banca</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-sm text-muted-foreground">Lucro Total</CardTitle>
                <div className={`text-4xl font-extrabold tracking-tight ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfit >= 0 ? '+' : ''}{formatCurrencyBRL(totalProfit)}
                </div>
                <CardDescription className="mt-1">
                  {percentOfBankroll !== null ? (
                    `${percentOfBankroll >= 0 ? '+' : ''}${percentOfBankroll.toFixed(1)}% da banca inicial`
                  ) : (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span>Banca não configurada</span>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/bankroll">Configurar banca</Link>
                      </Button>
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={stability.className}>
                  <span className="mr-1 inline-flex">{stability.icon}</span>
                  Consistência: {stability.label}
                </Badge>
                <Badge className={trend.className}>
                  <span className="mr-1 inline-flex">{trend.icon}</span>
                  Tendência: {trend.label}
                </Badge>
              </div>
            </div>
            {microInsight ? (
              <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {microInsight}
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Resumo inteligente</CardTitle>
                  <CardDescription>O que explica o seu resultado no período</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{smartSummary || 'Carregando...'} </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Evolução do Lucro</CardTitle>
                  <CardDescription>Linha simples, sem ruído</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={profitDataState}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(value: any) => formatCurrencyBRL(Number(value) || 0)}
                        labelFormatter={(label: any) => `Dia ${label}`}
                      />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Performance por Estratégia</CardTitle>
              <CardDescription>Top 3 + ponto de atenção</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = '/strategies')}>
              Ver análise completa
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {topStrategies.map((s) => (
                <Card key={s.name} className="border border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{s.name}</CardTitle>
                    <CardDescription className="text-xs">{s.sessions} ativações • {s.winRate.toFixed(0)}%</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={`text-lg font-bold ${s.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.profit >= 0 ? '+' : ''}{formatCurrencyBRL(s.profit)}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {worstStrategy && (
                <Card className="border border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Ponto de atenção</CardTitle>
                    <CardDescription className="text-xs">{worstStrategy.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={`text-lg font-bold ${worstStrategy.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {worstStrategy.profit >= 0 ? '+' : ''}{formatCurrencyBRL(worstStrategy.profit)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
          <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar sessão</DialogTitle>
              <DialogDescription>Registre rápido, sem poluir o placar</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Estratégia</Label>
                <Select value={registerStrategy} onValueChange={setRegisterStrategy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {strategyProfitsState.map(s => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ganho / Perda</Label>
                <Input
                  inputMode="decimal"
                  placeholder="Ex: 150 ou -80"
                  value={registerProfit}
                  onChange={(e) => setRegisterProfit(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Duração (min)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="Opcional"
                  value={registerDurationMinutes}
                  onChange={(e) => setRegisterDurationMinutes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancelar</Button>
              <Button onClick={handleRegisterSession}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
