'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ActiveSignalHero } from '@/components/dashboard/active-signal-hero';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowRight, ArrowUpRight, Clock, Activity, TrendingUp, BarChart3, Target, AlertTriangle, CheckCircle, ChevronRight, Play, Zap, History, Settings, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useDashboardPreferences } from '@/hooks/use-dashboard-preferences';
import { withLazyLoading } from '@/components/lazy/lazy-component';
import { apiClient } from '@/lib/api-client';
import { useRealtimeSignals } from '@/hooks/use-websocket';
import { usePerformanceMonitoring, useSmartMemo, useDebounce } from '@/hooks/use-performance';

// Componentes lazy
const LiveSignals = withLazyLoading(() => import('@/components/dashboard/live-signals'));
const StatsCards = withLazyLoading(() => import('@/components/dashboard/stats-cards'));
const PerformanceChart = withLazyLoading(() => import('@/components/dashboard/performance-chart'));
const RouletteStatus = withLazyLoading(() => import('@/components/dashboard/roulette-status'));
const RecentActivity = withLazyLoading(() => import('@/components/dashboard/recent-activity'));
const RouletteModal = withLazyLoading(() => import('@/components/dashboard/roulette-modal'));

// Definição de Tipos para os dados do Backend
interface GeneratedSignal {
  id: string;
  strategy_name: string;
  table_id: string;
  suggested_bets: (string | number)[];
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
  is_validated: boolean;
  type: string;
  message: string;
  // Campos compatíveis com o componente LiveSignals
  strategy_id: string;
  bet_numbers: (string | number)[];
  expected_return: number;
  status: string;
}

interface RouletteSpin {
  id: string;
  table_id: string;
  spin_number: number;
  spin_timestamp: string;
}

interface KpiData {
  strategy_id: string;
  total_signals_generated: number;
  successful_signals: number;
  failed_signals: number;
  assertiveness_rate_percent: number;
  total_net_profit_loss: number;
  last_updated: string;
}

export default function DashboardPage() {
  const { user, isLoading, getToken } = useAuth();
  const router = useRouter();
  const { preferences: dashboardPreferences, loading: preferencesLoading } = useDashboardPreferences();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [selectedActiveTable, setSelectedActiveTable] = useState<{ tableId: string; strategyName: string; suggestedBets: (string | number)[] } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const lastActivityRef = useRef<number>(Date.now());
  const loadedUserRef = useRef<string | null>(null);
  const redirectingRef = useRef<boolean>(false);
  
  // Assinar sinais em tempo real e filtrar por mesa ativa (se houver)
  const { signals: realtimeSignals, status: realtimeStatus } = useRealtimeSignals({ 
    limit: 50,
    tableId: selectedActiveTable?.tableId,
    batchMs: 500
  });

  // Frases motivacionais
  const motivationalPhrases = [
    "Disciplina e gestão de banca são fundamentais para o sucesso sustentável",
    "Análise de padrões históricos aumenta significativamente suas chances",
    "Nunca aposte mais do que pode perder - preserve seu capital",
    "Estratégias baseadas em dados superam intuição a longo prazo",
    "Mantenha controle emocional - decisões racionais geram melhores resultados",
    "Diversifique suas estratégias para reduzir riscos concentrados",
    "Acompanhe suas estatísticas para identificar padrões de sucesso",
    "Paciência é uma virtude - aguarde os melhores momentos para apostar"
  ];

  const welcomePhrases = [
    "virar a sorte!", "desafiar a roleta!", "girar com ousadia.", "apostar com confiança.",
    "seguir sua intuição.", "mudar seu destino.", "mostrar quem manda na roleta.",
    "sentir a adrenalina do giro.", "vencer com estilo.", "confiar na sua sorte."
  ];

  // Função para obter a frase do dia
  const getDailyWelcomeMessage = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const phraseIndex = dayOfYear % welcomePhrases.length;
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    };
    
    const formattedDate = today.toLocaleDateString('pt-BR', options);
    const userMetadata = user as any;
    const firstName = userMetadata?.user_metadata?.first_name || userMetadata?.user_metadata?.name?.split(' ')[0] || 'Usuário';
    
    return {
      greeting: `Olá, ${firstName}! Hoje é ${formattedDate}, dia de ${welcomePhrases[phraseIndex]}`,
      firstName
    };
  };

  // Estados para dados reais do backend (INICIALIZADOS VAZIOS PARA DADOS REAIS)
  const [liveSignalsData, setLiveSignalsData] = useState<GeneratedSignal[]>([]);
  const [latestRouletteSpin, setLatestRouletteSpin] = useState<RouletteSpin | null>(null);
  const [kpisData, setKpisData] = useState<KpiData[]>([]);
  const [rouletteHistoryData, setRouletteHistoryData] = useState<RouletteSpin[]>([]);
  const [activeSignal, setActiveSignal] = useState<GeneratedSignal | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  const [loading_data, setLoadingData] = useState(true);
  const [loadingSignals, setLoadingSignals] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRouletteStatus, setActiveRouletteStatus] = useState<{table_id: string, status: string} | null>(null);
  const [monitoredTables, setMonitoredTables] = useState<string[]>([]);
  const monitoredTablesRef = useRef<string[]>([]);

  // Helper para headers
  const buildHeaders = (token?: string | null): Record<string, string> => (
    token ? { Authorization: `Bearer ${token}` } : {}
  );

  // Função para buscar preferências do usuário
  const fetchUserPreferences = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await apiClient.get('/user-preferences', {
        headers: buildHeaders(token),
        timeout: 8000,
      });
      const preferences = (response as any)?.data ?? response;
      const tables = Array.isArray(preferences?.tables) ? preferences.tables : (Array.isArray(preferences) ? preferences : []);
      setMonitoredTables(tables);
      return tables;
    } catch (error) {
      console.error('❌ Erro ao buscar preferências:', error);
      return [];
    }
  }, [getToken]);

  // Mesclar sinais em tempo real com os carregados inicialmente
  useEffect(() => {
    try {
      if (Array.isArray(realtimeSignals) && realtimeSignals.length > 0) {
        setLiveSignalsData((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const normalized = realtimeSignals.map((s) => ({
            id: s.id,
            strategy_name: s.strategy_name,
            strategy_id: s.strategy_id,
            table_id: s.table_id,
            suggested_bets: s.suggested_bets ?? s.bet_numbers ?? [],
            bet_numbers: s.bet_numbers ?? s.suggested_bets ?? [],
            suggested_units: typeof s.suggested_units === 'number' ? s.suggested_units : 1,
            confidence_level: s.confidence_level,
            confidence_score: typeof s.confidence_score === 'number' ? s.confidence_score : s.confidence_level,
            confidence_factors: s.confidence_factors,
            timestamp_generated: s.timestamp_generated,
            expires_at: s.expires_at,
            expected_return: s.expected_return,
            is_validated: false,
            type: 'pattern',
            status: s.status ?? 'active',
            message: s.message ?? ''
          }));

          const fresh = normalized.filter((s) => !existingIds.has(s.id));
          const merged = [...fresh, ...prev];
          return merged.slice(0, 100);
        });
      }
      
      // Atualizar status de conexão baseado no websocket
      if (realtimeStatus === 'connected') setConnectionStatus('connected');
      else if (realtimeStatus === 'connecting') setConnectionStatus('reconnecting');
      else setConnectionStatus('disconnected');

    } catch (e) {
      console.warn('Falha ao mesclar sinais realtime:', e);
    }
  }, [realtimeSignals, realtimeStatus]);
 
  // Função para atualizar KPIs
  const updateKPIs = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await apiClient.get('/kpis', {
        headers: buildHeaders(token),
        timeout: 12000,
      });
      const rawData = (response as any)?.data ?? response;
      if (!rawData) return;
      const dataArray = Array.isArray(rawData) ? rawData : (rawData.data || []);
      const transformedData: KpiData[] = dataArray.map((item: any) => ({
        strategy_id: item.strategy_id || 'Estratégia Desconhecida',
        total_signals_generated: Number(item.total_signals_generated ?? item.total_activations ?? 0) || 0,
        successful_signals: Number(item.successful_signals ?? item.total_hits ?? 0) || 0,
        failed_signals: Number(item.failed_signals ?? item.total_misses ?? 0) || 0,
        assertiveness_rate_percent: Number(item.assertiveness_rate_percent ?? item.hit_rate ?? 0) || 0,
        total_net_profit_loss: Number(item.total_net_profit_loss ?? item.total_net_payout ?? 0) || 0,
        last_updated: item.last_updated || new Date().toISOString()
      }));
      setKpisData(transformedData);
    } catch (error) {
      console.error('❌ Erro ao atualizar KPIs:', error);
    }
  }, [getToken]);
 
  // Função para atualizar status da roleta
  const updateRouletteStatus = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await apiClient.get('/roulette-status', {
        headers: buildHeaders(token),
        timeout: 10000,
      });
      const statusData = (response as any)?.data ?? response;
      
      if (Array.isArray(statusData)) {
         const active = statusData.find((t: any) => t.status === 'active') || statusData[0];
         setActiveRouletteStatus(active);
      } else {
         setActiveRouletteStatus(statusData);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status da roleta:', error);
    }
  }, [getToken]);

  // Função para buscar histórico da roleta
  const fetchRouletteHistory = useCallback(async () => {
    try {
      const response = await apiClient.getRouletteHistory(undefined, 100);
      const data: RouletteSpin[] = ((response as any)?.data ?? response) as RouletteSpin[];
      setRouletteHistoryData(data);
      if (data.length > 0) {
        setLatestRouletteSpin(data[0]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar histórico da roleta:', error);
      setRouletteHistoryData([]);
    }
  }, [getToken]);

  // Função para buscar sinais recentes iniciais
  const fetchRecentSignals = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await apiClient.getSignalsRecent(undefined, 20); // Buscar 20 últimos
      const rawDataAny: any = (response as any)?.data ?? response;
      
      let signalsArray: any[] = [];
      if (Array.isArray(rawDataAny)) {
        signalsArray = rawDataAny;
      } else if (rawDataAny?.signals && Array.isArray(rawDataAny.signals)) {
        signalsArray = rawDataAny.signals;
      } else if (rawDataAny?.items && Array.isArray(rawDataAny.items)) {
        signalsArray = rawDataAny.items;
      }
      
      // Mapear dados
      const mappedData = signalsArray.map(signal => ({
        ...signal,
        strategy_id: signal.strategy_name,
        bet_numbers: signal.suggested_bets,
        expected_return: signal.expected_return,
        status: signal.is_validated ? 'validated' : 'pending',
        confidence_level: typeof signal.confidence_level === 'string' ? 
          (signal.confidence_level === 'High' ? 85 : signal.confidence_level === 'Medium' ? 65 : 45) : 
          signal.confidence_level,
        message: signal.message,
        suggested_bets: signal.suggested_bets,
        confidence_score: signal.confidence_score,
        confidence_factors: signal.confidence_factors
      }));
      
      setLiveSignalsData(prev => {
         // Merge com existentes para não perder realtime recebido enquanto carregava
         const existingIds = new Set(prev.map(s => s.id));
         const fresh = mappedData.filter((s: GeneratedSignal) => !existingIds.has(s.id));
         return [...fresh, ...prev].sort((a,b) => new Date(b.timestamp_generated).getTime() - new Date(a.timestamp_generated).getTime()).slice(0, 100);
      });

    } catch (error: any) {
      console.error('❌ Erro ao buscar sinais recentes:', error);
      setError('Não foi possível carregar sinais recentes.');
    }
  }, [getToken]);

  // Sincronizar estado com ref para evitar re-renders no Realtime
  useEffect(() => {
    monitoredTablesRef.current = monitoredTables;
  }, [monitoredTables]);

  // Efeito principal de carregamento de dados
  useEffect(() => {
    if (user && !isLoading) {
      const loadInitialData = async () => {
        setLoadingData(false); // Liberar UI com skeletons
        setLoadingSignals(true);
        setLoadingStats(true);
        setError(null);
        
        try {
          // 1. Preferências
          await fetchUserPreferences();

          // 2. Dados em paralelo
          await Promise.allSettled([
            fetchRecentSignals(),
            updateKPIs(),
            fetchRouletteHistory(),
            updateRouletteStatus()
          ]);
          
        } catch (error) {
          console.error('❌ Erro no carregamento inicial:', error);
          setError('Erro ao carregar dados do painel.');
        } finally {
          setLoadingSignals(false);
          setLoadingStats(false);
        }
      };

      if (loadedUserRef.current !== user.email) {
        loadedUserRef.current = user.email || '';
        loadInitialData();
      }
      
      // Configurar polling para dados menos críticos (sinais vem via WS, mas polling garante consistência)
      const pollingInterval = setInterval(() => {
        updateKPIs();
        updateRouletteStatus();
        fetchRouletteHistory(); // Histórico atualiza a cada rodada
      }, 10000); // 10 segundos

      return () => clearInterval(pollingInterval);
    }
  }, [user, isLoading, fetchUserPreferences, fetchRecentSignals, updateKPIs, fetchRouletteHistory, updateRouletteStatus]);

  // Rotação das frases motivacionais
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % motivationalPhrases.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Lógica do Active Signal e Countdown
  useEffect(() => {
    // Se não houver activeSignal definido manualmente, pegar o mais recente
    if (liveSignalsData.length > 0 && !activeSignal) {
      setActiveSignal(liveSignalsData[0]);
    }
  }, [liveSignalsData, activeSignal]);

  useEffect(() => {
    if (activeSignal && activeSignal.expires_at) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const expiresAt = new Date(activeSignal.expires_at).getTime();
        const createdAt = new Date(activeSignal.timestamp_generated).getTime();
        const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
        
        setCountdown(timeLeft);
        
        const totalDuration = expiresAt - createdAt;
        let progress = 0;
        
        if (totalDuration > 0) {
          const remaining = Math.max(0, expiresAt - now);
          progress = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
        } else {
           // Fallback: 60s
           progress = Math.max(0, Math.min(100, (timeLeft / 60) * 100));
         }
        
        setProgressValue(progress);
        
        if (timeLeft === 0) {
          // Expirou, remover activeSignal se for o atual? 
          // Melhor apenas zerar o contador e deixar o usuário ver que expirou ou esperar o próximo
          setProgressValue(0);
        }
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown(0);
      setProgressValue(0);
    }
  }, [activeSignal]);

  // Redirecionamento se não autenticado
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!isLoading && !user && !redirectingRef.current) {
        const token = await getToken();
        if (token) return;
        redirectingRef.current = true;
        router.replace('/login');
      }
    };
    checkAndRedirect();
  }, [isLoading, user, getToken, router]);

  if (!user && !isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  // Se houver erro crítico de carregamento inicial
  if (error && liveSignalsData.length === 0 && kpisData.length === 0) {
     // Opcional: mostrar tela de erro amigável, mas por enquanto vamos deixar renderizar com skeletons/vazio e toast de erro
  }

  const { greeting } = getDailyWelcomeMessage();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="animate-pulse">
              {connectionStatus === 'connected' ? 'Sistema Online' : 'Reconectando...'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Citação Motivacional */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-center text-center">
            <p className="text-lg font-medium italic text-primary">
              "{motivationalPhrases[currentPhraseIndex]}"
            </p>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Coluna Esquerda: Sinais e Roleta (8 cols) */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Active Signal Hero */}
            <div className="mb-6">
              <ActiveSignalHero 
                signal={activeSignal} 
                onEnterTable={(tableId) => {
                  setSelectedActiveTable({
                    tableId,
                    strategyName: activeSignal?.strategy_name || '',
                    suggestedBets: activeSignal?.bet_numbers || []
                  });
                }} 
              />
            </div>

            {/* Status da Roleta Ativa */}
            {loadingStats ? (
               <Skeleton className="h-[200px] w-full rounded-xl" />
            ) : (
               <RouletteStatus 
                  activeTableId={selectedActiveTable?.tableId || activeRouletteStatus?.table_id} 
                  latestSpin={latestRouletteSpin}
                  rouletteHistoryData={rouletteHistoryData}
               />
            )}

            {/* Sinais em Tempo Real */}
            <LiveSignals 
              signals={liveSignalsData} 
              isLoading={loadingSignals}
              activeSignal={activeSignal}
              onSelectSignal={setActiveSignal}
              countdown={countdown}
              progressValue={progressValue}
            />

          </div>

          {/* Coluna Direita: KPIs e Atividade (4 cols) */}
          <div className="md:col-span-4 space-y-6">
             
             {/* KPIs Cards */}
             <StatsCards 
                kpis={kpisData} 
                isLoading={loadingStats} 
             />

             {/* Gráfico de Performance (Simplificado por enquanto) */}
             <PerformanceChart data={kpisData} isLoading={loadingStats} />

             {/* Histórico Recente */}
             <RecentActivity 
               history={rouletteHistoryData} 
               isLoading={loadingStats} 
             />

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
