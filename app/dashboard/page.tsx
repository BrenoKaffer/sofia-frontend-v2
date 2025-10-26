'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
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
import { redirect } from 'next/navigation';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useDashboardPreferences } from '@/hooks/use-dashboard-preferences';
import { withLazyLoading } from '@/components/lazy/lazy-component';
import { apiClient } from '@/lib/api-client';
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

// Dados dinâmicos baseados no backend

export default function DashboardPage() {
  const { user, isLoading, getToken } = useAuth();
  const { preferences: dashboardPreferences, loading: preferencesLoading } = useDashboardPreferences();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [selectedActiveTable, setSelectedActiveTable] = useState<{ tableId: string; strategyName: string; suggestedBets: (string | number)[] } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const lastActivityRef = useRef<number>(Date.now());

  // Frases motivacionais reais sobre estratégias de roleta
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

  // Frases de boas-vindas diárias
  const welcomePhrases = [
    "virar a sorte!",
    "desafiar a roleta!",
    "girar com ousadia.",
    "apostar com confiança.",
    "seguir sua intuição.",
    "mudar seu destino.",
    "mostrar quem manda na roleta.",
    "sentir a adrenalina do giro.",
    "vencer com estilo.",
    "confiar na sua sorte.",
    "testar sua estratégia.",
    "acertar aquele número premiado.",
    "dar um show na roleta.",
    "surpreender a banca!",
    "girar até ganhar!",
    "fazer história no jogo.",
    "mostrar que você domina o jogo.",
    "buscar aquele giro perfeito.",
    "deixar a sorte falar mais alto.",
    "fazer a roleta sorrir pra você.",
    "dar aquele giro maroto.",
    "mostrar que número quente é com você.",
    "dar o famoso \"giro da virada\".",
    "virar o jogo a seu favor.",
    "jogar com coragem e estratégia.",
    "fazer a sorte acontecer.",
    "transformar giros em vitórias.",
    "mostrar que ninguém segura sua maré de sorte.",
    "reinar absoluto na roleta.",
    "mostrar quem manda na mesa.",
    "girar como um verdadeiro mestre.",
    "fazer a banca tremer!",
    "deixar sua marca no jogo."
  ];

  // Função para obter a frase do dia baseada na data
  const getDailyWelcomeMessage = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const phraseIndex = dayOfYear % welcomePhrases.length;
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    
    const formattedDate = today.toLocaleDateString('pt-BR', options);
    const userMetadata = user as any;
    const firstName = userMetadata?.user_metadata?.first_name || userMetadata?.user_metadata?.name?.split(' ')[0] || 'Usuário';
    
    return {
      greeting: `Olá, ${firstName}! Hoje é ${formattedDate}, dia de ${welcomePhrases[phraseIndex]}`,
      firstName
    };
  };

  // Estados para dados reais do backend
  const [liveSignalsData, setLiveSignalsData] = useState<GeneratedSignal[]>([
    // DADOS MOCK TEMPORÁRIOS PARA TESTE
    {
      id: "1",
      strategy_name: "Estratégia Fibonacci Avançada",
      strategy_id: "fibonacci-advanced",
      table_id: "evolution-double-ball-roulette",
      suggested_bets: [7, 14, 21, 28, "Red", "1st-12"],
      bet_numbers: [7, 14, 21, 28, "Red", "1st-12"],
      suggested_units: 3,
      confidence_level: 85,
      confidence_score: 85,
      confidence_factors: {
        strategy_performance: 0.82,
        table_performance: 0.78,
        pattern_strength: 0.91,
        data_volume: 0.88,
        time_factor: 0.75,
        consistency: 0.83
      },
      timestamp_generated: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60000).toISOString(), // 1 minuto
      expected_return: 125.50,
      is_validated: false,
      type: "pattern",
      status: "active",
      message: "Padrão forte detectado nos últimos 15 giros. Sequência de números pares com alta probabilidade."
    },
    {
      id: "2",
      strategy_name: "Martingale Modificado",
      strategy_id: "martingale-modified",
      table_id: "evolution-lightning-roulette",
      suggested_bets: [0, 32, 15, "Black"],
      bet_numbers: [0, 32, 15, "Black"],
      suggested_units: 2,
      confidence_level: 65,
      confidence_score: 65,
      timestamp_generated: new Date(Date.now() - 30000).toISOString(), // 30 segundos atrás
      expires_at: new Date(Date.now() + 30000).toISOString(), // 30 segundos
      expected_return: 89.25,
      is_validated: false,
      type: "progression",
      status: "active",
      message: "Oportunidade de recuperação identificada. Aposte com cautela."
    }
  ]);
  const [latestRouletteSpin, setLatestRouletteSpin] = useState<RouletteSpin | null>(null);
  const [kpisData, setKpisData] = useState<KpiData[]>([]);
  const [rouletteHistoryData, setRouletteHistoryData] = useState<RouletteSpin[]>([]);
  const [activeSignal, setActiveSignal] = useState<GeneratedSignal | null>({
    id: "1",
    strategy_name: "Estratégia Fibonacci Avançada",
    strategy_id: "fibonacci-advanced",
    table_id: "evolution-double-ball-roulette",
    suggested_bets: [7, 14, 21, 28, "Red", "1st-12"],
    bet_numbers: [7, 14, 21, 28, "Red", "1st-12"],
    suggested_units: 3,
    confidence_level: 85,
    confidence_score: 85,
    confidence_factors: {
      strategy_performance: 0.82,
      table_performance: 0.78,
      pattern_strength: 0.91,
      data_volume: 0.88,
      time_factor: 0.75,
      consistency: 0.83
    },
    timestamp_generated: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60000).toISOString(),
    expected_return: 125.50,
    is_validated: false,
    type: "pattern",
    status: "active",
    message: "Padrão forte detectado nos últimos 15 giros. Sequência de números pares com alta probabilidade."
  });
  const [countdown, setCountdown] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  const [loading_data, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRouletteStatus, setActiveRouletteStatus] = useState<{table_id: string, status: string} | null>(null);
  const [monitoredTables, setMonitoredTables] = useState<string[]>([]); // Roletas monitoradas
  const monitoredTablesRef = useRef<string[]>([]); // Ref para evitar re-renders no Realtime

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  // Helper para headers condicionais ao token
  const buildHeaders = (token?: string) => (token ? { Authorization: `Bearer ${token}` } : {});


  // Função para buscar preferências do usuário (roletas monitoradas)
  const fetchUserPreferences = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await apiClient.get('/user-preferences', {
        headers: buildHeaders(token),
        timeout: 8000,
      });
      const preferences = (response as any)?.data ?? response;
      console.log('✅ Preferências do usuário carregadas:', preferences);
      const tables = Array.isArray(preferences?.tables) ? preferences.tables : (Array.isArray(preferences) ? preferences : []);
      setMonitoredTables(tables);
      return tables;
    } catch (error) {
      console.error('❌ Erro ao buscar preferências:', error);
      return [];
    }
  }, [getToken]);
 
  // Função para atualizar KPIs periodicamente
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
      console.log('🔄 KPIs atualizados');
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
      setActiveRouletteStatus(statusData);
      console.log('🔄 Status da roleta atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar status da roleta:', error);
    }
  }, [getToken]);

  // Função para buscar table_ids do backend
  const fetchTableIds = useCallback(async () => {
    console.log('🎯 Iniciando busca de table_ids...');
    try {
      const token = await getToken();
      console.log('🔑 Token para table_ids obtido:', token ? 'Sim' : 'Não');
      
      const response = await apiClient.get('/roulette-tables', {
        headers: buildHeaders(token),
        timeout: 10000,
      });
      const data = (response as any)?.data ?? response;
      console.log('✅ Roulette tables fetched successfully:', data);
      
      let tableIds: string[] = [];
      if (Array.isArray(data)) {
        if (data.length > 0 && typeof data[0] === 'string') {
          tableIds = data as string[];
        } else {
          tableIds = data.map((t: any) => t.table_id || t.id).filter(Boolean);
        }
      } else if (Array.isArray(data?.data)) {
        const arr = data.data;
        tableIds = arr.map((t: any) => t.table_id || t.id).filter(Boolean);
      }
      
      if (tableIds.length === 0) {
        console.warn('⚠️ Nenhum table_id válido encontrado no retorno, usando padrão');
        tableIds = ['mesa1', 'mesa2', 'mesa3'];
      }
      
      console.log('🎯 Table IDs extraídos:', tableIds);
      setMonitoredTables(tableIds);
      return tableIds;
    } catch (error: any) {
      console.error('❌ Erro ao buscar table_ids:', error);
      
      const defaultTables = ['mesa1', 'mesa2', 'mesa3'];
      setMonitoredTables(defaultTables);
      return defaultTables;
    }
  }, [getToken]);

  // Função para buscar KPIs do backend
  const fetchKpis = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await apiClient.get('/kpis', {
        headers: buildHeaders(token),
        timeout: 12000,
      });
      const rawData = (response as any)?.data ?? response;
      const dataArray = Array.isArray(rawData) ? rawData : (rawData?.data || []);
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
    } catch (error: any) {
      console.error('❌ Erro ao buscar KPIs do backend:', error);
      setKpisData([]);
    }
  }, [getToken]);



  // Função para buscar histórico da roleta do backend
  const fetchRouletteHistory = useCallback(async (table_id: string = 'pragmatic-mega-roulette') => {
    console.log('🔍 Iniciando busca do histórico da roleta...');
    try {
      const token = await getToken();
      console.log('🔑 Token obtido:', token ? 'Sim' : 'Não');
      
      const response = await apiClient.get('/roulette-history?limit=100', {
        headers: buildHeaders(token),
        timeout: 12000,
      });
      const data: RouletteSpin[] = ((response as any)?.data ?? response) as RouletteSpin[];
      console.log('✅ Roulette history fetched successfully:', data);
      console.log('📊 Número de giros recebidos:', data.length);
      setRouletteHistoryData(data);
      
      if (data.length > 0) {
        setLatestRouletteSpin(data[0]);
        console.log('🎯 Último giro definido:', data[0].spin_number);
      } else {
        console.log('❌ Nenhum giro encontrado no histórico');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar histórico da roleta:', error);
      setError('Não foi possível carregar o histórico da roleta. Verifique a conexão com o backend.');
      setRouletteHistoryData([]);
      setLatestRouletteSpin(null);
    }
  }, [getToken]);

  // Função para buscar status da roleta ativa
  const fetchRouletteStatus = useCallback(async () => {
    console.log('🔍 Iniciando busca do status da roleta...');
    try {
      const token = await getToken();
      console.log('🔑 Token obtido:', token ? 'Sim' : 'Não');
      
      const response = await apiClient.get('/roulette-status', {
        headers: buildHeaders(token),
        timeout: 10000,
      });
      const data = (response as any)?.data ?? response;
      console.log('✅ Roulette status fetched successfully:', data);
      console.log('📊 Tipo de dados retornados:', typeof data, Array.isArray(data) ? 'Array' : 'Object');
      
      if (Array.isArray(data) && data.length > 0) {
        const activeTable = data.find((table: any) => table.status === 'active') || data[0];
        console.log('🎯 Mesa ativa selecionada:', activeTable);
        return activeTable;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar status da roleta:', error);
      return null;
    }
  }, [getToken]);

  // Função para buscar padrões recentes
  const fetchRecentSignals = useCallback(async () => {
    console.log('🔍 Iniciando busca de padrões recentes...');
    try {
      const token = await getToken();
      console.log('🔑 Token para padrões obtido:', token ? 'Sim' : 'Não');
      
      const response = await apiClient.get('/signals/recent?limit=5', {
        headers: buildHeaders(token),
        timeout: 15000,
      });
      const rawDataAny: any = (response as any)?.data ?? response;
      console.log('✅ Recent signals fetched successfully:', rawDataAny);
      
      // Padronizar para array, independente do formato retornado
      let signalsArray: any[] = [];
      try {
        if (Array.isArray(rawDataAny)) {
          signalsArray = rawDataAny;
        } else if (rawDataAny && Array.isArray(rawDataAny.signals)) {
          signalsArray = rawDataAny.signals;
        } else if (rawDataAny && Array.isArray(rawDataAny.items)) {
          signalsArray = rawDataAny.items;
        } else if (rawDataAny && typeof rawDataAny === 'object') {
          const values = Object.values(rawDataAny);
          signalsArray = values.flatMap((v: any) => Array.isArray(v) ? v : []);
        } else {
          signalsArray = [];
        }
      } catch (parseErr) {
        console.warn('Falha ao padronizar dados de sinais recentes:', parseErr);
        signalsArray = [];
      }
      console.log('📊 Número de padrões recebidos:', Array.isArray(signalsArray) ? signalsArray.length : 0);
      
      // Buscar as preferências atuais do usuário para filtrar
      let currentMonitoredTables: string[] = [];
      try {
        const prefsResp = await apiClient.get('/user-preferences', {
          headers: buildHeaders(token),
          timeout: 5000,
        });
        const preferences = (prefsResp as any)?.data ?? prefsResp;
        currentMonitoredTables = Array.isArray(preferences?.tables) ? preferences.tables : [];
      } catch (error) {
        console.log('⚠️ Usando todas as mesas devido a erro ao buscar preferências:', error);
      }
      
      // Filtrar apenas sinais das roletas monitoradas
      const filteredData = signalsArray.filter((signal: any) => {
        const isMonitored = currentMonitoredTables.length === 0 || currentMonitoredTables.includes(signal.table_id);
        if (!isMonitored) {
          console.log('🚫 Sinal filtrado (roleta não monitorada):', signal.table_id);
        }
        return isMonitored;
      });
      
      console.log('🎯 Sinais filtrados para roletas monitoradas:', filteredData.length, 'de', Array.isArray(signalsArray) ? signalsArray.length : 0);
      console.log('📋 Roletas monitoradas:', currentMonitoredTables);
      console.log('📊 Dados brutos dos sinais:', rawDataAny);
      console.log('🔍 Sinais filtrados:', filteredData);
      
      // Mapear dados para estrutura compatível com LiveSignals
      const mappedData = filteredData.map(signal => ({
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
      
      console.log('🗂️ Dados mapeados:', mappedData);
      
      mappedData.forEach((signal, index) => {
        console.log(`📋 Sinal ${index + 1}:`);
        console.log('  - ID:', signal.id);
        console.log('  - Estratégia:', signal.strategy_name);
        console.log('  - Apostas sugeridas (suggested_bets):', signal.suggested_bets);
        console.log('  - Apostas mapeadas (bet_numbers):', signal.bet_numbers);
        console.log('  - Mensagem:', signal.message);
        console.log('  - Status:', signal.status);
      });
      
      setLiveSignalsData(mappedData);
      
      if (mappedData.length > 0) {
        const mostRecentSignal = mappedData[0];
        setActiveSignal(mostRecentSignal);
        console.log('🎯 Sinal ativo inicial definido:', mostRecentSignal.strategy_id, 'ID:', mostRecentSignal.id);
        console.log('🔢 Apostas do sinal ativo:', mostRecentSignal.bet_numbers);
        console.log('📝 Estratégia do sinal ativo:', mostRecentSignal.strategy_name);
        
        if (mostRecentSignal.expires_at) {
          const now = new Date().getTime();
          const expiresAt = new Date(mostRecentSignal.expires_at).getTime();
          const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setCountdown(timeLeft);
          console.log('⏰ Countdown inicial definido:', timeLeft, 'segundos');
        } else {
          setCountdown(0);
          console.log('⏰ Nenhum expires_at no sinal inicial, countdown = 0');
        }
      } else {
        setActiveSignal(null);
        setCountdown(0);
        console.log('❌ Nenhum sinal encontrado, activeSignal = null');
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar sinais recentes:', error);
      setError(error?.message?.includes('TIMEOUT') ? 'Timeout na conexão com o servidor' : 'Sistema temporariamente indisponível');
      setLiveSignalsData([]);
      setActiveSignal(null);
      setCountdown(0);
    }
  }, [getToken]);

  // Efeito para sincronizar activeSignal com o primeiro sinal da lista
  useEffect(() => {
    if (liveSignalsData.length > 0 && !activeSignal) {
      const mostRecentSignal = liveSignalsData[0];
      setActiveSignal(mostRecentSignal);
      console.log('🔄 Sincronizando activeSignal com primeiro sinal da lista:', mostRecentSignal.strategy_id);
      
      // Calcular countdown
      if (mostRecentSignal.expires_at) {
        const now = new Date().getTime();
        const expiresAt = new Date(mostRecentSignal.expires_at).getTime();
        const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setCountdown(timeLeft);
      } else {
        setCountdown(0);
      }
    }
  }, [liveSignalsData]); // Removido activeSignal das dependências para evitar loop infinito

  // Sincronizar estado com ref para evitar re-renders no Realtime
  useEffect(() => {
    monitoredTablesRef.current = monitoredTables;
  }, [monitoredTables]);

  // Efeito para carregar dados iniciais do backend
  useEffect(() => {
    console.log('🔄 useEffect executado - carregando dados reais!');
    console.log('👤 User:', user);
    console.log('⏳ isLoading:', isLoading);
    
    if (user && !isLoading) {
      console.log('✅ Condições atendidas - iniciando carregamento de dados reais...');
      const loadInitialData = async () => {
          setLoadingData(true);
          setError(null);
          
          // Timeout geral para evitar travamento
          const timeoutId = setTimeout(() => {
            console.log('⏰ Timeout geral atingido, finalizando carregamento');
            setLoadingData(false);
            setError('Timeout na conexão. Alguns dados podem não estar disponíveis.');
          }, 20000); // 20 segundos
          
          try {
            console.log('🚀 Iniciando carregamento otimizado de dados...');
            console.log('👤 Usuário logado:', user?.email);
            
            const token = await getToken();
            console.log('🔑 Token obtido para carregamento inicial:', token ? 'Sim' : 'Não');
            
            const isMock = (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') || (process.env.USE_MOCK_DATA === 'true');
            if (!token && !isMock) {
              setConnectionStatus('disconnected');
              setError('Sessão não autenticada. Faça login para dados reais.');
              console.log('ℹ️ Prosseguindo sem token, evitando interrupção do carregamento inicial');
            }
            
            // Carregar dados essenciais primeiro (sequencial para melhor UX)
            console.log('📊 Carregando dados essenciais...');
            
            // 1. Preferências do usuário (necessário para filtrar outros dados)
            console.log('📋 Carregando preferências do usuário...');
            try {
              if (!isMock) {
                await fetchUserPreferences();
              }
            } catch (prefError: any) {
              console.warn('⚠️ Erro ao carregar preferências:', prefError);
              setMonitoredTables([]);
            }
            
            // 2. Sinais recentes (dados mais importantes)
            console.log('🎯 Carregando sinais recentes...');
            try {
              if (!isMock) {
                await fetchRecentSignals();
              } else {
                // Em modo mock, já há dados sem necessidade de backend
                setLoadingData(false);
              }
            } catch (signalsError: any) {
              console.warn('⚠️ Erro ao carregar sinais:', signalsError?.message || signalsError);
            }
            
            // 3. Carregar dados secundários em paralelo (não bloqueantes)
            console.log('📊 Carregando dados secundários...');
            const secondaryPromises = [
              !isMock ? updateKPIs() : Promise.resolve(),
              !isMock ? fetchRouletteHistory() : Promise.resolve(),
              !isMock ? updateRouletteStatus() : Promise.resolve()
            ];
            
            // Aguardar dados secundários sem bloquear a interface
            await Promise.allSettled(secondaryPromises);
            
            console.log('✅ Carregamento otimizado concluído!');
          } catch (error) {
            console.error('❌ Erro ao carregar dados do backend:', error);
            setError('Erro ao conectar com o servidor. Verifique sua conexão.');
          } finally {
            clearTimeout(timeoutId); // Limpar timeout geral
            setLoadingData(false);
            console.log('🏁 Carregamento finalizado');
          }
        };

      loadInitialData();

      // Configurar polling para atualizações em tempo real
      console.log('🔄 Configurando polling para atualizações...');
      setConnectionStatus((s) => s);
      
      // Polling para sinais recentes
      const pollSignals = async () => {
        try {
          await fetchRecentSignals();
          setConnectionStatus('connected');
          lastActivityRef.current = Date.now();
        } catch (error) {
          console.error('❌ Erro ao buscar sinais:', error);
        }
      };
      
      // Polling para histórico de roleta
      const pollRouletteHistory = async () => {
        try {
          await fetchRouletteHistory();
        } catch (error) {
          console.error('❌ Erro ao buscar histórico de roleta:', error);
        }
      };
      
      // Executar polling inicial
      pollSignals();
      pollRouletteHistory();
      
      // Configurar intervalos de polling
      const signalsInterval = setInterval(pollSignals, 5000); // A cada 5 segundos
      const rouletteInterval = setInterval(pollRouletteHistory, 10000); // A cada 10 segundos

      // Cleanup function
      return () => {
        console.log('🧹 Cleanup - removing polling intervals...');
        clearInterval(signalsInterval);
        clearInterval(rouletteInterval);
        console.log('🧹 Cleanup completed successfully');
      };
    } else {
      console.log('❌ Condições não atendidas para carregar dados:');
      console.log('   - User existe:', !!user);
      console.log('   - Loading:', isLoading);
    }
  }, [user, isLoading, getToken]);

  // Rotação das frases motivacionais
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) =>
        (prevIndex + 1) % motivationalPhrases.length
      );
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Atualizações periódicas de dados
  useEffect(() => {
    if (user && !isLoading) {
      // Atualizar KPIs a cada 5 minutos
      const kpisInterval = setInterval(() => {
        updateKPIs();
      }, 5 * 60 * 1000);

      // Atualizar status da roleta a cada 60 segundos
      const statusInterval = setInterval(() => {
        updateRouletteStatus();
      }, 60 * 1000);

      return () => {
        clearInterval(kpisInterval);
        clearInterval(statusInterval);
      };
    }
  }, [user, isLoading, updateKPIs, updateRouletteStatus]);

  // Contagem regressiva do sinal ativo baseada em expires_at
  useEffect(() => {
    if (activeSignal && activeSignal.expires_at) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const expiresAt = new Date(activeSignal.expires_at).getTime();
        const createdAt = new Date(activeSignal.timestamp_generated).getTime();
        const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
        
        setCountdown(timeLeft);
        
        // Calcular progresso da barra (começa em 100% e diminui até 0%)
        // Usar uma duração padrão de 5 minutos (300 segundos) se não conseguir calcular a duração total
        const totalDuration = expiresAt - createdAt;
        let progress = 0;
        
        if (totalDuration > 0) {
          const remaining = Math.max(0, expiresAt - now);
          progress = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
        } else {
           // Fallback: assumir duração de 60 segundos (mais realista para roleta) e calcular baseado no countdown
           const assumedDuration = 60; // 60 segundos (1 minuto)
           progress = Math.max(0, Math.min(100, (timeLeft / assumedDuration) * 100));
         }
        
        setProgressValue(progress);
        
        if (timeLeft === 0) {
          setActiveSignal(null);
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

  // Atualização periódica do status da roleta
  useEffect(() => {
    if (user) {
      const updateRouletteStatus = async () => {
        const status = await fetchRouletteStatus();
        if (status) {
          setActiveRouletteStatus(status);
        }
      };
      
      // Atualizar a cada 60 segundos
      const interval = setInterval(updateRouletteStatus, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user, getToken]); // Removida fetchRouletteStatus das dependências

  if (isLoading) {
    return null;
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight font-heading">Dashboard</h1>
            {/* Indicador de Status da Conexão */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`} />
              <span className={`text-sm ${
                connectionStatus === 'connected' ? 'text-green-600' :
                connectionStatus === 'reconnecting' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {connectionStatus === 'connected' ? 'Conectado' :
                 connectionStatus === 'reconnecting' ? 'Reconectando...' :
                 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              Ver Histórico
            </Button>
            <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Play className="h-4 w-4" />
                  Ativar Estratégia
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ativar Nova Estratégia</DialogTitle>
                  <DialogDescription>
                    Selecione a estratégia que deseja ativar e configure os parâmetros.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Estratégia</h4>
                    <Select defaultValue="fibonacci">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma estratégia" />
                      </SelectTrigger>
                      <SelectContent>
                        {kpisData.map((kpi) => (
                          <SelectItem key={kpi.strategy_id} value={kpi.strategy_id}>
                      {kpi.strategy_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setShowActivateDialog(false)}>
                    Ativar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>


        {/* Mostrar skeleton durante carregamento */}
        {loading_data ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Informações Dinâmicas */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    {motivationalPhrases[currentPhraseIndex]}
                  </p>
                </div>
              </CardContent>
            </Card>

        {/* Seção Padrão Ativo */}
        {loading_data ? (
          <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 text-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Estratégia e Números - Skeleton */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-600 text-white border-green-500">
                       <div className="w-2 h-2 bg-green-300 rounded-full mr-1 animate-pulse"></div>
                       Ao Vivo
                     </Badge>
                  </div>
                  <h3 className="text-lg font-semibold">Padrão Ativo</h3>
                  <div className="text-sm text-gray-300">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">Números Indicados</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton key={index} className="w-8 h-8 rounded-full" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Confiança</p>
                    <div className="text-lg font-bold">
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                </div>

                {/* Tempo para Ação - Skeleton */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Tempo para Ação</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      <Skeleton className="h-10 w-16 mx-auto" />
                    </div>
                    <Progress value={0} className="h-2 bg-gray-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Status da Roleta</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm">Online</span>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>

                {/* Histórico da Estratégia - Skeleton */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Histórico da Estratégia</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Assertividade</p>
                      <div className="text-lg font-bold">
                        <Skeleton className="h-6 w-10 mx-auto" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Sinais Hoje</p>
                      <div className="text-lg font-bold">
                        <Skeleton className="h-6 w-8 mx-auto" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão Aplicar Aposta - Skeleton */}
                <div className="flex flex-col justify-center">
                  <Button 
                    size="lg" 
                    disabled
                    className="bg-gray-600 text-gray-400 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Carregando...
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : activeSignal ? (
          <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 text-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Estratégia e Números */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-600 text-white border-green-500">
                       <div className="w-2 h-2 bg-green-300 rounded-full mr-1 animate-pulse"></div>
                       Ao Vivo
                     </Badge>
                  </div>
                  <h3 className="text-lg font-semibold">Padrão Ativo</h3>
                  <p className="text-sm text-gray-300">
                     Estratégia: {activeSignal.strategy_name || activeSignal.strategy_id}
                   </p>
                  <div className="space-y-2">
                     <p className="text-xs text-gray-400">Números Indicados</p>
                     <div className="flex flex-wrap gap-1">
                       {(() => {
                         // Processar bet_numbers para exibir APENAS números válidos (0-36)
                         let numbers: number[] = [];
                         
                         // Usar bet_numbers ou suggested_bets como fallback
                         const betsArray = activeSignal.bet_numbers || activeSignal.suggested_bets;
                         
                         if (Array.isArray(betsArray)) {
                           // Se é array, processar cada item
                           betsArray.forEach(bet => {
                             if (typeof bet === 'string') {
                               // Se é string, pode ser "1,2,3" ou um número individual
                               if (bet.includes(',')) {
                                 // String com números separados por vírgula
                                 const nums = bet.split(',').map(n => n.trim());
                                 nums.forEach(num => {
                                   const parsedNum = Number(num);
                                   if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                     numbers.push(parsedNum);
                                   }
                                 });
                               } else {
                                 // Verificar se é um número válido
                                 const parsedNum = Number(bet);
                                 if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                   numbers.push(parsedNum);
                                 }
                               }
                             } else if (typeof bet === 'number') {
                               // Se é número, verificar se está no range válido
                               if (bet >= 0 && bet <= 36) {
                                 numbers.push(bet);
                               }
                             }
                           });
                         }
                         
                         // Remover duplicatas e limitar a 12 números
                         const uniqueNumbers = Array.from(new Set(numbers)).slice(0, 12);
                         
                         return uniqueNumbers.map((number, index) => {
                           // Definir cor baseada nas regras da roleta
                           let bgColor;
                           
                           // Verde: 0
                           if (number === 0) {
                             bgColor = 'bg-green-600';
                           }
                           // Vermelho: números específicos
                           else if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(number)) {
                             bgColor = 'bg-red-600';
                           }
                           // Preto: todos os outros números
                           else {
                             bgColor = 'bg-black';
                           }
                           
                           return (
                             <div 
                               key={index} 
                               className={`w-8 h-8 ${bgColor} text-white text-xs font-bold rounded-full flex items-center justify-center`}
                             >
                               {number}
                             </div>
                           );
                         });
                       })()} 
                     </div>
                   </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Confiança</p>
                    <p className="text-lg font-bold">
                      {(() => {
                        // Se confidence_level é um número válido, usar ele
                         if (typeof activeSignal.confidence_level === 'number' && activeSignal.confidence_level > 0) {
                           // Se o valor já está em porcentagem (>1), usar direto, senão multiplicar por 100
                           const percentage = activeSignal.confidence_level > 1 ? activeSignal.confidence_level : activeSignal.confidence_level * 100;
                           return `${percentage.toFixed(0)}%`;
                         }
                         // Se não há confidence_level válido, tentar converter confidence_level
                        if (activeSignal.confidence_level) {
                          if (activeSignal.confidence_level >= 80) return '85%';
                          if (activeSignal.confidence_level >= 60) return '65%';
                          if (activeSignal.confidence_level >= 40) return '45%';
                          return '20%';
                        }
                        return '0%';
                      })()} 
                    </p>
                  </div>
                </div>

                {/* Tempo para Ação */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Tempo para Ação</h4>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                      countdown <= 0 ? 'text-red-400' : countdown <= 30 ? 'text-yellow-400' : 'text-white'
                    }`}>
                      {countdown <= 0 ? 'EXPIRADO' : `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`}
                    </div>
                    <div className="relative">
                      <Progress 
                         value={progressValue} 
                         className={`h-3 bg-gray-700 transition-all duration-300 ${
                           countdown <= 0 ? 'opacity-100' : 'opacity-90'
                         }`}
                       />
                       {/* Overlay vermelho quando expirado */}
                       {countdown <= 0 && (
                         <div className="absolute inset-0 bg-red-500 rounded-full opacity-80 animate-pulse"></div>
                       )}
                       {/* Indicador de urgência quando restam poucos segundos */}
                       {countdown > 0 && countdown <= 30 && (
                         <div className="absolute inset-0 bg-yellow-500 rounded-full opacity-20 animate-pulse"></div>
                       )}
                    </div>
                    {/* Status do tempo */}
                    <div className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                      countdown <= 0 ? 'text-red-400' : countdown <= 30 ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      {countdown <= 0 ? 'Sinal expirado' : countdown <= 30 ? 'Últimos segundos!' : 'Tempo disponível'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Status da Roleta</p>
                     <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                         countdown <= 0 ? 'bg-red-400' : 'bg-green-400'
                       }`}></div>
                       <span className="text-sm">Online</span>
                       <span className="text-xs text-gray-400">
                         {activeSignal.table_id}
                       </span>
                     </div>
                  </div>
                </div>

                {/* Histórico da Estratégia */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Histórico da Estratégia</h4>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="text-center">
                       <p className="text-xs text-gray-400">Assertividade</p>
                       <p className="text-lg font-bold">
                         {(() => {
                           // Assertividade específica da estratégia ativa
                           const kpi = kpisData.find(k => k.strategy_id === (activeSignal.strategy_name || activeSignal.strategy_id));
                           if (kpi && typeof kpi.assertiveness_rate_percent === 'number' && !isNaN(kpi.assertiveness_rate_percent)) {
                             return `${kpi.assertiveness_rate_percent.toFixed(1)}%`;
                           }
                           // Se não há dados de KPI, mostrar 0% ao invés de N/A
                           return '0%';
                         })()} 
                       </p>
                     </div>
                     <div className="text-center">
                       <p className="text-xs text-gray-400">Sinais Hoje</p>
                       <p className="text-lg font-bold">
                         {(() => {
                           const kpi = kpisData.find(k => k.strategy_id === (activeSignal.strategy_name || activeSignal.strategy_id));
                           if (kpi && typeof kpi.total_signals_generated === 'number' && !isNaN(kpi.total_signals_generated)) {
                             return kpi.total_signals_generated.toString();
                           }
                           // Se não há dados de KPI, mostrar 0 ao invés de N/A
                           return '0';
                         })()} 
                       </p>
                     </div>
                   </div>
                </div>

                {/* Botão Ir para a Mesa */}
                <div className="flex flex-col justify-center">
                  <div className="relative group">
                    <Button 
                    size="lg" 
                    disabled={countdown <= 0}
                    className={`font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform ${
                      countdown <= 0 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50' 
                        : 'bg-green-600 hover:bg-green-500 text-white hover:scale-105'
                    }`}
                    onClick={() => {
                      if (countdown > 0) {
                        setSelectedActiveTable({
                          tableId: activeSignal.table_id || 'pragmatic-mega-roulette',
                          strategyName: activeSignal.strategy_name || activeSignal.strategy_id,
                          suggestedBets: activeSignal.bet_numbers || []
                        });
                      }
                    }}
                  >
                    <Target className="w-5 h-5 mr-2" />
                    {countdown <= 0 ? 'Sinal Expirado' : 'Aplicar Aposta'}
                  </Button>
                    
                    {/* Tooltip com números de aposta */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      <div className="text-xs text-gray-300 mb-1">Apostas Sugeridas:</div>
                      <div className="flex gap-1">
                        {(() => {
                          // Filtrar apenas números válidos (0-36)
                          const validNumbers: number[] = [];
                          
                          const betsArray = activeSignal.bet_numbers || activeSignal.suggested_bets;
                          
                          betsArray?.forEach(bet => {
                            if (typeof bet === 'string') {
                              if (bet.includes(',')) {
                                // String com números separados por vírgula
                                const nums = bet.split(',').map(n => n.trim());
                                nums.forEach(num => {
                                  const parsedNum = Number(num);
                                  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                    validNumbers.push(parsedNum);
                                  }
                                });
                              } else {
                                // Verificar se é um número válido
                                const parsedNum = Number(bet);
                                if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                  validNumbers.push(parsedNum);
                                }
                              }
                            } else if (typeof bet === 'number') {
                              // Se é número, verificar se está no range válido
                              if (bet >= 0 && bet <= 36) {
                                validNumbers.push(bet);
                              }
                            }
                          });
                          
                          // Remover duplicatas e limitar a 5
                          const uniqueNumbers = Array.from(new Set(validNumbers)).slice(0, 5);
                          
                          return (
                            <>
                              {uniqueNumbers.map((number, index) => (
                                <span key={index} className="bg-green-600 px-2 py-1 rounded text-xs font-bold">
                                  {number}
                                </span>
                              ))}
                              {validNumbers.length > 5 && (
                                <span className="text-gray-400 text-xs">+{validNumbers.length - 5}</span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      {/* Seta do tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 text-white opacity-50">
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <h3 className="text-lg font-semibold">Aguardando Padrão</h3>
                <p className="text-sm text-gray-400">
                  Nenhum padrão ativo no momento. Aguarde a próxima oportunidade.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Layout Principal do Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna Esquerda - Padrão Ativo e Estatísticas */}
              <div className="lg:col-span-2 space-y-6">
                {dashboardPreferences.showStatsCards && (
                  <StatsCards 
                        kpisData={kpisData} 
                        loading={loading_data} 
                        activeSignal={activeSignal}
                        countdown={countdown}
                      />
                )}
                
                {dashboardPreferences.showLiveSignals && (
                  <LiveSignals 
                    signals={liveSignalsData} 
                    activeSignal={activeSignal} 
                    countdown={countdown} 
                    progressValue={progressValue} 
                    loading={loading_data}
                    onGoToTable={(signal) => setSelectedActiveTable({
                      tableId: signal.table_id,
                      strategyName: signal.strategy_id,
                      suggestedBets: signal.bet_numbers || []
                    })}
                  />
                )}
                
                {dashboardPreferences.showPerformanceChart && (
                  <PerformanceChart kpisData={kpisData} loading={loading_data} />
                )}
              </div>
              
              {/* Coluna Direita - Status da Roleta e Atividade Recente */}
              <div className="space-y-6">
                {dashboardPreferences.showRouletteStatus && (
                  <RouletteStatus 
                  latestSpin={latestRouletteSpin} 
                  rouletteHistoryData={rouletteHistoryData} 
                />
                )}
                
                {dashboardPreferences.showRecentActivity && (
                  <RecentActivity 
                    signals={liveSignalsData} 
                    spins={rouletteHistoryData} 
                    loading={loading_data} 
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal da Roleta */}
      <RouletteModal
        isOpen={!!selectedActiveTable}
        onClose={() => setSelectedActiveTable(null)}
        tableId={selectedActiveTable?.tableId || ''}
        strategyName={selectedActiveTable?.strategyName || ''}
        suggestedBets={selectedActiveTable?.suggestedBets || []}
      />
    </DashboardLayout>
  );
}