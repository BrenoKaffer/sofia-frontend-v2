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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, Download, Info, List, MoreVertical, Plus, RefreshCw, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { sofiaToast } from '@/components/ui/sonner';

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
  table?: string;
  chips?: number;
};

const PROFIT_SESSIONS_STORAGE_KEY = 'sofia:profit:sessions:v1';

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
    className: isVolatile ? 'bg-amber-500 text-black border-transparent' : 'bg-green-600 text-white border-transparent',
    icon: <Activity className="h-3.5 w-3.5" />
  };
}

function computeTrend(profitSeries: ProfitPoint[]) {
  if (!profitSeries.length) {
    return {
      label: 'Lateral',
      className: 'bg-slate-600 text-white border-transparent',
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
    className: 'bg-slate-600 text-white border-transparent',
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
        ['criado_em', 'estrategia', 'lucro', 'duracao_min', 'mesa_jogada', 'fichas'],
        ...params.sessions.map((s) => [
          s.createdAt,
          s.strategy,
          String(s.profit),
          s.durationMinutes === undefined ? '' : String(s.durationMinutes),
          s.table ?? '',
          s.chips === undefined ? '' : String(s.chips)
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
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sessions, setSessions] = useState<ProfitSession[]>([]);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerStrategy, setRegisterStrategy] = useState<string>('');
  const [registerProfit, setRegisterProfit] = useState<string>('');
  const [registerDurationMinutes, setRegisterDurationMinutes] = useState<string>('');
  const [registerTable, setRegisterTable] = useState<string>('');
  const [registerChips, setRegisterChips] = useState<string>('');

  const [entriesOpen, setEntriesOpen] = useState(false);
  const [entriesResultByDay, setEntriesResultByDay] = useState<Record<string, string>>({});
  const [entriesMesaByDay, setEntriesMesaByDay] = useState<Record<string, string>>({});
  const [entriesSearch, setEntriesSearch] = useState('');
  const [entriesStatusFilter, setEntriesStatusFilter] = useState<'all' | 'goal' | 'no-goal'>('all');
  const [entriesPage, setEntriesPage] = useState(1);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/user-preferences');
        if (!res.ok) return;
        const prefs = await res.json();
        const v = Number(prefs?.initial_bankroll ?? prefs?.initialBankroll ?? null);
        if (Number.isFinite(v) && v > 0) setInitialBankroll(v);
        const daily = Number(prefs?.daily_goal ?? prefs?.dailyGoal ?? prefs?.risk_management?.target_profit ?? null);
        if (Number.isFinite(daily) && daily > 0) setDailyGoal(daily);
      } catch {
        // noop
      }
    };

    fetchPreferences();
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
      setSessions(normalized.slice(0, 500));
    } catch {
      // noop
    }
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

    return parts;
  }, [sessions, strategyProfitsState, worstStrategy]);

  const microAlert = useMemo(() => {
    const positives = strategyProfitsState.filter(s => s.profit > 0).sort((a, b) => b.profit - a.profit);
    const totalPositive = positives.reduce((acc, s) => acc + s.profit, 0);
    const top1 = positives[0] || null;
    const top2 = positives[1] || null;
    const topShare =
      totalPositive > 0 && top1
        ? ((top1.profit + (top2?.profit ?? 0)) / totalPositive) * 100
        : 0;

    if (worstStrategy?.profit !== undefined && worstStrategy.profit < 0) {
      return { tone: 'warning' as const, label: '1 estratégia impactando negativamente' };
    }

    if (top1 && topShare >= 80) {
      return { tone: 'default' as const, label: 'Concentração alta em poucas estratégias' };
    }

    return null;
  }, [strategyProfitsState, worstStrategy]);

  const handleRefresh = () => setRefreshKey(v => v + 1);

  const handleOpenRegister = () => {
    const hasBankroll = initialBankroll !== null && Number.isFinite(initialBankroll) && initialBankroll > 0;
    if (!hasBankroll) {
      sofiaToast({
        title: 'Banca não configurada',
        message: 'Para registrar sessões, configure sua banca primeiro.',
        variant: 'warning',
        duration: 6000,
        action: {
          label: 'Configurar agora',
          onClick: () => {
            window.location.href = '/bankroll';
          },
          variant: 'default',
        },
        secondaryAction: {
          label: 'Depois',
          onClick: () => {},
          variant: 'ghost',
        },
      });
      return;
    }
    if (!registerStrategy) {
      const defaultStrategy = strategyProfitsState[0]?.name || '';
      setRegisterStrategy(defaultStrategy);
    }
    setRegisterOpen(true);
  };

  const handleOpenEntries = () => {
    const nextResults: Record<string, string> = {};
    profitDataState.forEach((p) => {
      nextResults[p.date] = String(p.profit);
    });
    setEntriesResultByDay(nextResults);
    setEntriesPage(1);
    setEntriesOpen(true);
  };

  const updateProfitForDay = (day: string, profit: number) => {
    setProfitDataState((prev) => prev.map((p) => (p.date === day ? { ...p, profit } : p)));
  };

  const filteredProfitData = useMemo(() => {
    const q = entriesSearch.trim().toLowerCase();
    return profitDataState.filter((p) => {
      const mesa = (entriesMesaByDay[p.date] ?? '').toLowerCase();
      const matchesText = !q || p.date.toLowerCase().includes(q) || mesa.includes(q);

      const bateuMeta = dailyGoal ? p.profit >= dailyGoal : p.profit > 0;
      const matchesStatus =
        entriesStatusFilter === 'all' ||
        (entriesStatusFilter === 'goal' && bateuMeta) ||
        (entriesStatusFilter === 'no-goal' && !bateuMeta);

      return matchesText && matchesStatus;
    });
  }, [dailyGoal, entriesMesaByDay, entriesSearch, entriesStatusFilter, profitDataState]);

  useEffect(() => {
    if (!entriesOpen) return;
    setEntriesPage(1);
  }, [entriesOpen, entriesSearch, entriesStatusFilter]);

  const entriesHasBankroll = initialBankroll !== null && Number.isFinite(initialBankroll) && initialBankroll > 0;
  const entriesBankrollByDay = useMemo(() => {
    if (!entriesHasBankroll) return null;
    const map: Record<string, { start: number; end: number }> = {};
    let rolling = initialBankroll as number;
    for (const p of profitDataState) {
      const start = rolling;
      const end = rolling + p.profit;
      map[p.date] = { start, end };
      rolling = end;
    }
    return map;
  }, [entriesHasBankroll, initialBankroll, profitDataState]);

  const entriesPageSize = 10;
  const entriesTotalPages = Math.max(1, Math.ceil(filteredProfitData.length / entriesPageSize));
  const entriesPageSafe = Math.min(entriesPage, entriesTotalPages);
  const entriesStartIndex = (entriesPageSafe - 1) * entriesPageSize;
  const entriesEndIndex = Math.min(entriesStartIndex + entriesPageSize, filteredProfitData.length);
  const paginatedProfitData = filteredProfitData.slice(entriesStartIndex, entriesEndIndex);

  const handleDeleteEntry = (day: string) => {
    if (!window.confirm('Excluir este registro?')) return;

    setProfitDataState((prev) => prev.filter((p) => p.date !== day));
    setEntriesResultByDay((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
    setEntriesMesaByDay((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
    sofiaToast({ title: 'Registro excluído', message: `Dia ${day} removido.`, variant: 'success' });
  };

  const handleRegisterSession = () => {
    const profitValue = Number(registerProfit);
    const durationValue = registerDurationMinutes ? Number(registerDurationMinutes) : undefined;
    const chipsValue = registerChips ? Number(registerChips) : undefined;
    const tableValue = registerTable.trim() || undefined;

    if (!registerStrategy) {
      sofiaToast({ title: 'Atenção', message: 'Selecione uma estratégia', variant: 'warning' });
      return;
    }

    if (!Number.isFinite(profitValue) || profitValue === 0) {
      sofiaToast({ title: 'Erro', message: 'Informe um ganho/perda válido', variant: 'error' });
      return;
    }

    if (registerDurationMinutes && (!Number.isFinite(durationValue) || (durationValue ?? 0) <= 0)) {
      sofiaToast({ title: 'Erro', message: 'Duração inválida', variant: 'error' });
      return;
    }

    if (registerChips && (!Number.isFinite(chipsValue) || (chipsValue ?? 0) <= 0)) {
      sofiaToast({ title: 'Erro', message: 'Fichas inválidas', variant: 'error' });
      return;
    }

    const now = new Date();
    const session: ProfitSession = {
      id: `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
      createdAt: now.toISOString(),
      strategy: registerStrategy,
      profit: profitValue,
      durationMinutes: durationValue,
      table: tableValue,
      chips: chipsValue,
    };

    const dayLabel = formatDayMonth(now);

    setSessions((prev) => {
      const next = [session, ...prev].slice(0, 500);
      try {
        localStorage.setItem(PROFIT_SESSIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // noop
      }
      return next;
    });

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
    setRegisterTable('');
    setRegisterChips('');
    setRegisterOpen(false);
    sofiaToast({
      title: 'Sessão registrada',
      message: `${registerStrategy} • ${profitValue >= 0 ? '+' : ''}${formatCurrencyBRL(profitValue)}${tableValue ? ` • Mesa: ${tableValue}` : ''}${chipsValue ? ` • Fichas: ${chipsValue}` : ''}`,
      variant: 'success',
    });
  };

  const handleExport = () => {
    try {
      exportProfitCsv({
        profitData: profitDataState,
        strategies: strategyProfitsState,
        sessions,
        selectedPeriod
      });
      sofiaToast({ title: 'Exportação gerada', message: 'O CSV foi baixado no seu dispositivo.', variant: 'success' });
    } catch {
      sofiaToast({ title: 'Erro', message: 'Falha ao exportar', variant: 'error' });
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
              Registrar entrada
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
                <DropdownMenuItem onClick={handleOpenEntries}>
                  <List className="mr-2 h-4 w-4" />
                  Registros
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
                <CardTitle className="text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    Lucro Total
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Mais informações"
                            className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground/70 hover:text-muted-foreground"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          Este valor considera apenas resultados de jogo. Depósitos e saques ficam na Gestão de Banca.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </CardTitle>
                <div className={`text-4xl font-extrabold tracking-tight ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfit >= 0 ? '+' : ''}{formatCurrencyBRL(totalProfit)}
                </div>
                {microAlert ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-950/40 text-blue-200 border-blue-500/30"
                    >
                      <span
                        className="mr-1 h-2 w-2 rounded-full animate-pulse bg-blue-400"
                      />
                      Ao vivo
                    </Badge>
                    <span className="text-xs text-muted-foreground">{microAlert.label}</span>
                  </div>
                ) : null}
                {percentOfBankroll !== null ? (
                  <CardDescription className="mt-1">
                    {percentOfBankroll >= 0 ? '+' : ''}{percentOfBankroll.toFixed(1)}% da banca inicial
                  </CardDescription>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={stability.className}>
                  <span className="mr-1 inline-flex">{stability.icon}</span>
                  Consistência: {stability.label}
                </Badge>
                <Badge variant="outline" className={trend.className}>
                  <span className="mr-1 inline-flex">{trend.icon}</span>
                  Tendência: {trend.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Resumo inteligente</CardTitle>
                  <CardDescription>O que explica o seu resultado no período</CardDescription>
                </CardHeader>
                <CardContent>
                  {smartSummary.length ? (
                    <ul className="text-sm leading-relaxed list-disc pl-4 space-y-1">
                      {smartSummary.map((item, idx) => (
                        <li key={`${idx}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">Carregando...</p>
                  )}
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
                      <RechartsTooltip
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
          <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-md bg-background/50 backdrop-blur-xl border-border/40 shadow-xl">
            <DialogHeader>
              <DialogTitle>Registrar entrada</DialogTitle>
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

              <div className="space-y-2">
                <Label>Mesa jogada</Label>
                <Input
                  placeholder="Opcional"
                  value={registerTable}
                  onChange={(e) => setRegisterTable(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fichas</Label>
                <Input
                  inputMode="numeric"
                  placeholder="Opcional"
                  value={registerChips}
                  onChange={(e) => setRegisterChips(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancelar</Button>
              <Button onClick={handleRegisterSession}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={entriesOpen} onOpenChange={setEntriesOpen}>
          <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-5xl bg-background/50 backdrop-blur-xl border-border/40 shadow-xl">
            <DialogHeader>
              <DialogTitle>Registros</DialogTitle>
              <DialogDescription>Cada linha representa 1 dia. Edite o resultado e veja o sistema reagir.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Input
                value={entriesSearch}
                onChange={(e) => setEntriesSearch(e.target.value)}
                placeholder="Filtrar por dia ou mesa"
                className="sm:max-w-xs"
              />
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={entriesStatusFilter} onValueChange={(v) => setEntriesStatusFilter(v as typeof entriesStatusFilter)}>
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="goal">Bateu meta</SelectItem>
                    <SelectItem value="no-goal">Não bateu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-md border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Dia</TableHead>
                    <TableHead className="w-[160px]">Banca inicial</TableHead>
                    <TableHead className="w-[170px]">Resultado do dia</TableHead>
                    <TableHead className="w-[160px]">Banca final</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead>Mesa</TableHead>
                    <TableHead className="w-[90px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    if (!paginatedProfitData.length) return null;
                    return paginatedProfitData.map((p) => {
                      const bancaInicialDia = entriesHasBankroll ? (entriesBankrollByDay?.[p.date]?.start ?? null) : null;
                      const profit = p.profit;
                      const bancaFinalDia = entriesHasBankroll ? (entriesBankrollByDay?.[p.date]?.end ?? null) : null;

                      const mesa = entriesMesaByDay[p.date] ?? '';
                      const resultText = entriesResultByDay[p.date] ?? String(p.profit);
                      const bateuMeta = dailyGoal ? profit >= dailyGoal : profit > 0;

                      return (
                        <TableRow key={p.date}>
                          <TableCell className="font-medium">{p.date}</TableCell>
                          <TableCell>{bancaInicialDia === null ? '—' : formatCurrencyBRL(bancaInicialDia)}</TableCell>
                          <TableCell>
                            <Input
                              inputMode="decimal"
                              value={resultText}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setEntriesResultByDay((prev) => ({ ...prev, [p.date]: raw }));

                                const normalized = raw.trim().replace(',', '.');
                                if (normalized === '' || normalized === '+' || normalized === '-') return;

                                const parsed = Number(normalized);
                                if (Number.isFinite(parsed)) updateProfitForDay(p.date, parsed);
                              }}
                              onBlur={() => {
                                const raw = entriesResultByDay[p.date] ?? String(p.profit);
                                const normalized = raw.trim().replace(',', '.');
                                if (normalized === '') {
                                  updateProfitForDay(p.date, 0);
                                  setEntriesResultByDay((prev) => ({ ...prev, [p.date]: '0' }));
                                  return;
                                }
                                const parsed = Number(normalized);
                                if (!Number.isFinite(parsed)) {
                                  setEntriesResultByDay((prev) => ({ ...prev, [p.date]: String(p.profit) }));
                                }
                              }}
                              placeholder="Ex: 150 ou -80"
                            />
                          </TableCell>
                          <TableCell>{bancaFinalDia === null ? '—' : formatCurrencyBRL(bancaFinalDia)}</TableCell>
                          <TableCell>
                            <Badge className={bateuMeta ? 'bg-green-600 text-white border-transparent' : 'bg-secondary text-secondary-foreground border-transparent'}>
                              {bateuMeta ? 'Bateu meta' : 'Não'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={mesa}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEntriesMesaByDay((prev) => ({ ...prev, [p.date]: value }));
                              }}
                              placeholder="Opcional"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEntry(p.date)}
                              aria-label={`Excluir ${p.date}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Mostrando {filteredProfitData.length ? entriesStartIndex + 1 : 0}–{entriesEndIndex} de {filteredProfitData.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEntriesPage((p) => Math.max(1, p - 1))}
                  disabled={entriesPageSafe <= 1}
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  Página {entriesPageSafe} de {entriesTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEntriesPage((p) => Math.min(entriesTotalPages, p + 1))}
                  disabled={entriesPageSafe >= entriesTotalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEntriesOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
