'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard/layout';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LiveSignals } from '@/components/dashboard/live-signals';
import { apiClient } from '@/lib/api-client';
import { useDashboardPreferences } from '@/hooks/use-dashboard-preferences';

interface GeneratedSignal {
  id: string;
  strategy_name: string;
  strategy_id: string;
  table_id: string;
  suggested_bets: (string | number)[];
  bet_numbers: (string | number)[];
  suggested_units: number;
  confidence_level: number;
  confidence_score?: number;
  confidence_factors?: {
    strategy_performance: number;
    table_performance: number;
    pattern_strength: number;
    data_volume: number;
    time_factor: number;
    consistency: number;
  };
  timestamp_generated: string;
  expires_at: string;
  expected_return: number;
  is_validated: boolean;
  type: string;
  status: string;
  message: string;
}

interface DashboardKpis {
  assertivenessToday: number | null;
  assertiveness7d: number | null;
  netProfit: number | null;
  hitsToday: number | null;
  failsToday: number | null;
}

interface RouletteTableStatus {
  table_id: string;
  name?: string;
  status: 'active' | 'idle' | 'offline' | string;
  latency_ms?: number;
  last_spin_number?: number;
}

function normalizeSignals(raw: unknown): GeneratedSignal[] {
  const base = (raw as any)?.data ?? raw;
  let signalsArray: any[] = [];

  try {
    if (Array.isArray(base)) {
      signalsArray = base;
    } else if (base && Array.isArray((base as any).signals)) {
      signalsArray = (base as any).signals;
    } else if (base && Array.isArray((base as any).items)) {
      signalsArray = (base as any).items;
    } else if (base && typeof base === 'object') {
      const values = Object.values(base as Record<string, unknown>);
      signalsArray = values.flatMap((v: any) => (Array.isArray(v) ? v : []));
    }
  } catch {
    signalsArray = [];
  }

  return signalsArray.map((signal: any) => {
    const strategyName = signal.strategy_name ?? signal.strategy_id ?? '';
    const strategyId = signal.strategy_id ?? signal.strategy_name ?? '';
    const suggestedBets = signal.suggested_bets ?? signal.bet_numbers ?? [];
    const betNumbers = signal.bet_numbers ?? signal.suggested_bets ?? [];
    const suggestedUnits = signal.suggested_units ?? signal.units ?? 0;
    const confidenceLevelRaw = signal.confidence_level;
    let confidenceLevel = 0;

    if (typeof confidenceLevelRaw === 'number') {
      confidenceLevel = confidenceLevelRaw;
    } else if (typeof confidenceLevelRaw === 'string') {
      if (confidenceLevelRaw === 'High') confidenceLevel = 85;
      else if (confidenceLevelRaw === 'Medium') confidenceLevel = 65;
      else confidenceLevel = 45;
    }

    const isValidated = Boolean(signal.is_validated);

    return {
      id: String(signal.id ?? ''),
      strategy_name: strategyName,
      strategy_id: strategyId,
      table_id: String(signal.table_id ?? ''),
      suggested_bets: suggestedBets,
      bet_numbers: betNumbers,
      suggested_units: Number(suggestedUnits) || 0,
      confidence_level: confidenceLevel,
      confidence_score: signal.confidence_score,
      confidence_factors: signal.confidence_factors,
      timestamp_generated: signal.timestamp_generated ?? signal.created_at ?? new Date().toISOString(),
      expires_at: signal.expires_at ?? signal.valid_until ?? new Date(Date.now() + 60000).toISOString(),
      expected_return: Number(signal.expected_return ?? 0),
      is_validated: isValidated,
      type: String(signal.type ?? ''),
      status: isValidated ? 'validated' : 'pending',
      message: String(signal.message ?? '')
    };
  });
}

function normalizeKpis(raw: unknown): DashboardKpis {
  const base = (raw as any)?.data ?? raw;
  const dataArray = Array.isArray(base) ? base : (base?.data || []);

  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return {
      assertivenessToday: null,
      assertiveness7d: null,
      netProfit: null,
      hitsToday: null,
      failsToday: null
    };
  }

  const today = dataArray.find((item: any) => item.scope === 'today') ?? dataArray[0];
  const last7d = dataArray.find((item: any) => item.scope === 'last_7_days') ?? dataArray[0];

  const assertivenessToday = Number(
    today.assertiveness_rate_percent ??
      today.hit_rate ??
      today.success_rate_percent ??
      today.success_rate
  );

  const assertiveness7d = Number(
    last7d.assertiveness_rate_percent ??
      last7d.hit_rate ??
      last7d.success_rate_percent ??
      last7d.success_rate
  );

  const netProfit =
    Number(today.total_net_profit_loss ?? today.total_net_payout ?? today.net_profit ?? 0) || 0;

  const hitsToday =
    Number(today.successful_signals ?? today.total_hits ?? today.hits ?? 0) || 0;
  const failsToday =
    Number(today.failed_signals ?? today.total_misses ?? today.misses ?? 0) || 0;

  return {
    assertivenessToday: Number.isFinite(assertivenessToday) ? assertivenessToday : null,
    assertiveness7d: Number.isFinite(assertiveness7d) ? assertiveness7d : null,
    netProfit: netProfit,
    hitsToday,
    failsToday
  };
}

function normalizeRouletteStatus(raw: unknown): RouletteTableStatus[] {
  const base = (raw as any)?.data ?? raw;

  const toStatus = (item: any): RouletteTableStatus => ({
    table_id: String(item.table_id ?? item.id ?? ''),
    name: item.name,
    status: item.status ?? item.state ?? 'unknown',
    latency_ms: typeof item.latency_ms === 'number' ? item.latency_ms : undefined,
    last_spin_number:
      typeof item.last_spin_number === 'number'
        ? item.last_spin_number
        : typeof item.last_number === 'number'
        ? item.last_number
        : undefined
  });

  if (Array.isArray(base)) {
    return base.map(toStatus);
  }

  if (Array.isArray(base?.tables)) {
    return base.tables.map(toStatus);
  }

  if (base && typeof base === 'object') {
    const values = Object.values(base as Record<string, unknown>);
    const flattened = values.flatMap((v: any) => (Array.isArray(v) ? v : []));
    return flattened.map(toStatus);
  }

  return [];
}

function useDashboardV2Signals() {
  const [signals, setSignals] = useState<GeneratedSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSignals() {
      setLoading(true);
      try {
        const response = await apiClient.getSignalsRecent(undefined, 5);
        if (cancelled) return;
        const normalized = normalizeSignals(response);
        setSignals(normalized);
      } catch {
        if (!cancelled) {
          setSignals([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSignals();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeSignal = useMemo(() => {
    if (!signals.length) return null;
    return signals[0];
  }, [signals]);

  return { signals, activeSignal, loading, setSignals };
}

function useAuthGuard() {
  const { user, isLoading, getToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (isLoading) return;
      if (!user) {
        const token = await getToken();
        if (!token) {
          router.replace('/login');
        }
      }
    };

    checkAndRedirect();
  }, [user, isLoading, getToken, router]);

  return { user, isLoading };
}

function getCountdown(expiresAt: string) {
  if (!expiresAt) return { timeLeft: 0, label: 'Expirado', progress: 0 };

  const now = Date.now();
  const target = new Date(expiresAt).getTime();
  if (Number.isNaN(target)) return { timeLeft: 0, label: 'Expirado', progress: 0 };

  const diffSeconds = Math.max(0, Math.floor((target - now) / 1000));
  if (diffSeconds === 0) return { timeLeft: 0, label: 'Expirado', progress: 0 };

  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const createdAt = Date.now() - diffSeconds * 1000;
  const total = target - createdAt || 60000;
  const remaining = target - now;
  const progress = Math.max(0, Math.min(100, (remaining / total) * 100));

  return { timeLeft: diffSeconds, label, progress };
}

export default function DashboardV2Page() {
  const { user, isLoading } = useAuthGuard();
  const { signals, activeSignal, loading, setSignals } = useDashboardV2Signals();
  const {
    preferences: dashboardPreferences,
    loading: preferencesLoading,
    updatePreferences
  } = useDashboardPreferences();
  const [kpis, setKpis] = useState<DashboardKpis>({
    assertivenessToday: null,
    assertiveness7d: null,
    netProfit: null,
    hitsToday: null,
    failsToday: null
  });
  const [rouletteStatus, setRouletteStatus] = useState<RouletteTableStatus[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingRoulette, setLoadingRoulette] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadKpis() {
      setLoadingKpis(true);
      try {
        const response = await apiClient.get('/kpis');
        if (cancelled) return;
        const normalized = normalizeKpis((response as any)?.data ?? response);
        setKpis(normalized);
      } catch {
        if (!cancelled) {
          setKpis({
            assertivenessToday: null,
            assertiveness7d: null,
            netProfit: null,
            hitsToday: null,
            failsToday: null
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingKpis(false);
        }
      }
    }

    async function loadRouletteStatus() {
      setLoadingRoulette(true);
      try {
        const response = await apiClient.getRouletteStatus();
        if (cancelled) return;
        const normalized = normalizeRouletteStatus((response as any)?.data ?? response);
        setRouletteStatus(normalized);
      } catch {
        if (!cancelled) {
          setRouletteStatus([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRoulette(false);
        }
      }
    }

    loadKpis();
    loadRouletteStatus();

    const interval = setInterval(() => {
      loadKpis();
      loadRouletteStatus();
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const { countdownLabel, countdownProgress } = useMemo(() => {
    if (!activeSignal) {
      return { countdownLabel: 'Sem sinal ativo', countdownProgress: 0 };
    }
    const data = getCountdown(activeSignal.expires_at);
    return { countdownLabel: data.label, countdownProgress: data.progress };
  }, [activeSignal]);

  const stats = useMemo(() => {
    if (!signals.length) {
      return {
        totalSignals: 0,
        avgConfidence: 0,
        validatedCount: 0
      };
    }

    const totalSignals = signals.length;
    const confidenceSum = signals.reduce((sum, s) => sum + (s.confidence_score ?? s.confidence_level ?? 0), 0);
    const avgConfidence = confidenceSum / totalSignals;
    const validatedCount = signals.filter(s => s.is_validated).length;

    return {
      totalSignals,
      avgConfidence,
      validatedCount
    };
  }, [signals]);

  if (isLoading || !user) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const handleEnterSignal = () => {
    if (!activeSignal) return;
    setSignals(prev => {
      return prev.map(signal =>
        signal.id === activeSignal.id ? { ...signal, is_validated: true, status: 'validated' } : signal
      );
    });
  };

  const handleSkipSignal = () => {
    if (!activeSignal) return;
    setSignals(prev => {
      const filtered = prev.filter(signal => signal.id !== activeSignal.id);
      return filtered;
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight font-heading">Dashboard v2</h1>
            <p className="text-sm text-muted-foreground">
              Foco total em qual sinal entrar agora, com ação imediata.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Badge variant="outline">Beta</Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
            <CardHeader>
              <CardTitle>Sinal ativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && !activeSignal && (
                <div className="h-32 flex items-center justify-center">
                  <span className="text-sm text-slate-300">Carregando sinais em tempo real</span>
                </div>
              )}

              {!loading && !activeSignal && (
                <div className="h-32 flex flex-col items-center justify-center gap-2">
                  <span className="text-sm text-slate-300">Nenhum sinal disponível agora.</span>
                  <span className="text-xs text-slate-400">
                    Assim que surgir uma nova oportunidade ela aparece aqui.
                  </span>
                </div>
              )}

              {activeSignal && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {activeSignal.table_id || 'Mesa não informada'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {activeSignal.strategy_name || 'Estratégia'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-3xl font-semibold">
                        {activeSignal.bet_numbers.map((bet, index) => (
                          <span
                            key={`${activeSignal.id}-bet-${index}`}
                            className="px-3 py-1 rounded-md bg-slate-800 border border-slate-700"
                          >
                            {String(bet)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-slate-300">Confiança</span>
                        <span className="text-2xl font-bold">
                          {Math.round(activeSignal.confidence_score ?? activeSignal.confidence_level ?? 0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span>Unidades sugeridas</span>
                        <Badge variant="secondary">{activeSignal.suggested_units || 1}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Tempo restante para entrada</span>
                      <span className="font-mono text-slate-100">{countdownLabel}</span>
                    </div>
                    <Progress value={countdownProgress} className="h-2" />
                  </div>

                  {activeSignal.message && (
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {activeSignal.message}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="gap-2" onClick={handleEnterSignal}>
                      Já entrei
                    </Button>
                    <Button size="lg" variant="outline" className="gap-2" onClick={handleSkipSignal}>
                      Pular sinal
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {dashboardPreferences.showStatsCards && (
              <Card>
                <CardHeader>
                  <CardTitle>Confiança rápida</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Assertividade hoje</span>
                    <span className="text-2xl font-semibold">
                      {loadingKpis
                        ? '...'
                        : kpis.assertivenessToday != null
                        ? `${Math.round(kpis.assertivenessToday)}%`
                        : '–'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Assertividade 7 dias</span>
                    <span className="text-2xl font-semibold">
                      {loadingKpis
                        ? '...'
                        : kpis.assertiveness7d != null
                        ? `${Math.round(kpis.assertiveness7d)}%`
                        : '–'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Lucro líquido</span>
                    <span className="text-2xl font-semibold">
                      {loadingKpis ? '...' : `R$ ${kpis.netProfit?.toFixed(2) ?? '0,00'}`}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                    <span>Hoje</span>
                    <span>
                      {loadingKpis
                        ? '...'
                        : `${kpis.hitsToday ?? 0} acertos · ${kpis.failsToday ?? 0} erros`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Preferências rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {preferencesLoading && (
                  <span className="text-sm text-muted-foreground">
                    Carregando preferências do painel
                  </span>
                )}
                {!preferencesLoading && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Mostrar KPIs</Label>
                        <p className="text-xs text-muted-foreground">
                          Exibe os cards de performance no painel.
                        </p>
                      </div>
                      <Switch
                        checked={dashboardPreferences.showStatsCards}
                        onCheckedChange={checked =>
                          updatePreferences({ showStatsCards: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Sinais ao vivo</Label>
                        <p className="text-xs text-muted-foreground">
                          Controla a exibição do bloco de sinais ao vivo.
                        </p>
                      </div>
                      <Switch
                        checked={dashboardPreferences.showLiveSignals}
                        onCheckedChange={checked =>
                          updatePreferences({ showLiveSignals: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Status das roletas</Label>
                        <p className="text-xs text-muted-foreground">
                          Exibe a lista de mesas monitoradas no painel.
                        </p>
                      </div>
                      <Switch
                        checked={dashboardPreferences.showRouletteStatus}
                        onCheckedChange={checked =>
                          updatePreferences({ showRouletteStatus: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Gráfico de performance</Label>
                        <p className="text-xs text-muted-foreground">
                          Liga ou desliga o gráfico detalhado de performance do dashboard.
                        </p>
                      </div>
                      <Switch
                        checked={dashboardPreferences.showPerformanceChart}
                        onCheckedChange={checked =>
                          updatePreferences({ showPerformanceChart: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Atividade recente</Label>
                        <p className="text-xs text-muted-foreground">
                          Controla a exibição do histórico de sinais e giros recentes.
                        </p>
                      </div>
                      <Switch
                        checked={dashboardPreferences.showRecentActivity}
                        onCheckedChange={checked =>
                          updatePreferences({ showRecentActivity: checked })
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {dashboardPreferences.showRouletteStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Status das roletas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingRoulette && (
                    <span className="text-sm text-muted-foreground">
                      Carregando status das mesas
                    </span>
                  )}
                  {!loadingRoulette && rouletteStatus.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      Nenhuma mesa disponível no momento.
                    </span>
                  )}
                  {!loadingRoulette &&
                    rouletteStatus.slice(0, 5).map(table => {
                      const status =
                        table.status === 'active'
                          ? 'Ativa'
                          : table.status === 'offline'
                          ? 'Offline'
                          : table.status === 'idle'
                          ? 'Ociosa'
                          : table.status;

                      const colorClass =
                        table.status === 'active'
                          ? 'bg-green-500'
                          : table.status === 'offline'
                          ? 'bg-red-500'
                          : 'bg-yellow-500';

                      return (
                        <div
                          key={table.table_id}
                          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${colorClass}`} />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {table.name || table.table_id}
                              </span>
                              <span className="text-xs text-muted-foreground">{status}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {typeof table.last_spin_number === 'number' && (
                              <span className="text-xs text-muted-foreground">
                                Último número: {table.last_spin_number}
                              </span>
                            )}
                            {typeof table.latency_ms === 'number' && (
                              <span className="text-xs text-muted-foreground">
                                Latência: {table.latency_ms} ms
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {dashboardPreferences.showLiveSignals && (
          <Card>
            <CardHeader>
              <CardTitle>Últimos sinais</CardTitle>
            </CardHeader>
            <CardContent>
              <LiveSignals
                signals={signals}
                loading={loading}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
