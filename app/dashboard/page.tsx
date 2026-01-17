'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useUser } from '@/hooks/use-user';
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

// Lazy imports para componentes pesados
import { withLazyLoading } from '@/components/lazy/lazy-component';
import { usePerformanceMonitoring, useSmartMemo, useDebounce } from '@/hooks/use-performance';

// Componentes lazy
const LiveSignals = withLazyLoading(() => import('@/components/dashboard/live-signals'));
const StatsCards = withLazyLoading(() => import('@/components/dashboard/stats-cards'));
const PerformanceChart = withLazyLoading(() => import('@/components/dashboard/performance-chart'));
const RouletteStatus = withLazyLoading(() => import('@/components/dashboard/roulette-status'));
const RecentActivity = withLazyLoading(() => import('@/components/dashboard/recent-activity'));
const RouletteModal = withLazyLoading(() => import('@/components/dashboard/roulette-modal'));
const RealTimeMetrics = withLazyLoading(() => import('@/components/dashboard/real-time-metrics'));
const RealTimeMonitoringDashboard = withLazyLoading(() => import('@/components/dashboard/real-time-monitoring-dashboard'));

import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useDashboardPreferences } from '@/hooks/use-dashboard-preferences';
import { useSignalNotifications } from '@/hooks/use-signal-notifications';
import { AuthTest } from '@/components/auth/auth-test';

// Definiçéo de Tipos para os dados do Backend
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
  // Campos compaté­veis com o componente LiveSignals
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

function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { preferences: dashboardPreferences, loading: preferencesLoading } = useDashboardPreferences();
  const {
    processSignals,
    notifyConnectionLost,
    notifyConnectionRestored,
    notifyHighActivity,
    getNotificationStatus
  } = useSignalNotifications();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [selectedActiveTable, setSelectedActiveTable] = useState<{ tableId: string; strategyName: string; suggestedBets: (string | number)[] } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const lastActivityRef = useRef<number>(Date.now());
  const [activeTab, setActiveTab] = useState('overview');

  // Frases motivacionais reais sobre estratégias de roleta
  const motivationalPhrases = [
    "Disciplina e gestéo de banca séo fundamentais para o sucesso sustentável",
    "Análise de padrões históricos aumenta significativamente suas chances",
    "Nunca aposte mais do que pode perder - preserve seu capital",
    "Estratégias baseadas em dados superam intuiçéo a longo prazo",
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
    "seguir sua intuiçéo.",
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

  // Funçéo para obter a frase do dia baseada na data
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
      greeting: `Olá¡, ${firstName}! Hoje é© ${formattedDate}, dia de ${welcomePhrases[phraseIndex]}`,
      firstName
    };
  };

  // Estados para dados reais do backend
  const [liveSignalsData, setLiveSignalsData] = useState<GeneratedSignal[]>([]);
  const [latestRouletteSpin, setLatestRouletteSpin] = useState<RouletteSpin | null>(null);
  const [kpisData, setKpisData] = useState<KpiData[]>([]);
  const [rouletteHistoryData, setRouletteHistoryData] = useState<RouletteSpin[]>([]);
  const [activeSignal, setActiveSignal] = useState<GeneratedSignal | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  const [loading_data, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRouletteStatus, setActiveRouletteStatus] = useState<{table_id: string, status: string} | null>(null);
  const [monitoredTables, setMonitoredTables] = useState<string[]>([]); // Roletas monitoradas
  const monitoredTablesRef = useRef<string[]>([]); // Ref para evitar re-renders no Realtime
  const previousConnectionStatusRef = useRef<'connected' | 'disconnected' | 'reconnecting'>('connected');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const API_BASE_URL = '/api'; // Usar APIs locais do Next.js

  // Monitorar mudané§as no status de conexé£o para notificaé§éµes
  useEffect(() => {
    const previousStatus = previousConnectionStatusRef.current;
    
    if (previousStatus !== connectionStatus) {
      if (previousStatus === 'connected' && connectionStatus === 'disconnected') {
        // Conexé£o perdida
        notifyConnectionLost();
      } else if (previousStatus !== 'connected' && connectionStatus === 'connected') {
        // Conexé£o restaurada
        notifyConnectionRestored();
      }
      
      previousConnectionStatusRef.current = connectionStatus;
    }
  }, [connectionStatus, notifyConnectionLost, notifyConnectionRestored]);

  // Funçéo para buscar preferéªncias do Usuário (roletas monitoradas)
  const fetchUserPreferences = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/user-preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar preferéªncias (${response.status})`);
      }
      
      const preferences = await response.json();
      console.log('âœ… Preferéªncias do Usuário carregadas:', preferences);
      setMonitoredTables(preferences.tables || []);
      return preferences.tables || [];
    } catch (error) {
       console.error('âŒ Erro ao buscar preferéªncias:', error);
       return [];
     }
   }, [getToken]);
 
   // Funçéo para atualizar KPIs periodicamente
   const updateKPIs = useCallback(async () => {
     try {
       const token = await getToken();
       const response = await fetch(`${API_BASE_URL}/kpis`, {
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
       });
       
       if (response.ok) {
         const responseData = await response.json();
         const kpisData = responseData.data || [];
         setKpisData(kpisData);
         console.log('ðŸ”„ KPIs atualizados');
       }
     } catch (error) {
       console.error('âŒ Erro ao atualizar KPIs:', error);
     }
   }, [getToken]);
 
   // Funçéo para atualizar status da roleta
   const updateRouletteStatus = useCallback(async () => {
     try {
       const token = await getToken();
       const response = await fetch(`${API_BASE_URL}/roulette-status`, {
         headers: {
           'Authorization': `Bearer ${token}`,
           'Content-Type': 'application/json',
         },
       });
       
       if (response.ok) {
         const statusData = await response.json();
         setActiveRouletteStatus(statusData);
         console.log('ðŸ”„ Status da roleta atualizado');
       }
     } catch (error) {
       console.error('âŒ Erro ao atualizar status da roleta:', error);
     }
   }, [getToken]);

  // Funçéo para buscar table_ids do backend
  const fetchTableIds = useCallback(async () => {
    console.log('ðŸŽ¯ Iniciando busca de table_ids...');
    try {
      const token = await getToken();
      console.log('ðŸ”‘ Token para table_ids obtido:', token ? 'Sim' : 'Né£o');
      
      // Usar Promise.race para timeout sem AbortController
      const fetchPromise = fetch(`${API_BASE_URL}/table-ids`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('TABLE_IDS_TIMEOUT'));
        }, 8000);
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('ðŸ“¡ Table IDs Response status:', response.status);
      console.log('ðŸ“¡ Table IDs Response ok:', response.ok);
      
      if (!response.ok) {
        console.error('âŒ Erro ao buscar Table IDs:', response.status);
        setMonitoredTables([]);
        return [];
      }
      
      const data = await response.json();
      console.log('âœ… Table IDs fetched successfully:', data);
      
      // Verificar se os dados esté£o em uma propriedade 'data' ou diretamente no array
      const tableIds = Array.isArray(data) ? data : (data.data || []);
      console.log('ðŸŽ¯ Table IDs extraé­dos:', tableIds);
      
      setMonitoredTables(tableIds);
      return tableIds;
    } catch (error: any) {
      console.error('âŒ Erro ao buscar table_ids:', error);
      
      if (error?.message === 'TABLE_IDS_TIMEOUT') {
        console.log('â° Timeout nos Table IDs, usando dados offline');
      } else if (error?.name === 'AbortError') {
        console.log('â° Timeout nos Table IDs, usando dados offline');
      }
      
      // Retornar valores padré£o em caso de erro
      const defaultTables = ['mesa1', 'mesa2', 'mesa3'];
      setMonitoredTables(defaultTables);
      return defaultTables;
    }
  }, [getToken, API_BASE_URL]);

  // Funçéo para buscar KPIs do backend
  const fetchKpis = useCallback(async () => {
    try {
      const token = await getToken();
      
      // Usar Promise.race para timeout sem AbortController
      const fetchPromise = fetch(`${API_BASE_URL}/kpis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('KPIS_TIMEOUT'));
        }, 10000);
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        console.error('âŒ Erro ao buscar KPIs:', response.status);
        setKpisData([]);
        return;
      }
      
      const rawData = await response.json();
      console.log('âœ… Raw KPIs data received:', rawData);
      console.log('ðŸ“Š Tipo dos dados recebidos:', typeof rawData);
      console.log('ðŸ“Š é‰ array?', Array.isArray(rawData));
      console.log('ðŸ“Š Tem propriedade data?', rawData.hasOwnProperty('data'));
      
      // Verificar se os dados esté£o em uma propriedade 'data' ou diretamente no array
      const dataArray = Array.isArray(rawData) ? rawData : (rawData.data || []);
      console.log('âœ… Data array extracted:', dataArray);
      console.log('ðŸ“Š Tamanho do array:', dataArray.length);
      
      // Transformar os dados do backend para o formato esperado pelo frontend
      const transformedData: KpiData[] = dataArray.map((item: any, index: number) => {
        // Log para debug dos campos recebidos
        console.log(`âœ… Raw KPI item ${index + 1}:`, item);
        console.log(`ðŸ“Š Campos disponé­veis no item ${index + 1}:`, Object.keys(item));
        
        // Mapear campos da tabela strategy_kpis
        const total_signals = (item.total_signals_generated || item.total_activations || 0);
        const successful = (item.successful_signals || item.total_hits || 0);
        const failed = (item.failed_signals || item.total_misses || 0);
        const assertiveness = (item.assertiveness_rate_percent || item.hit_rate || 0);
        const profit = (item.total_net_profit_loss || item.total_net_payout || 0);
        
        console.log(`ðŸ“Š Valores extraé­dos do item ${index + 1}:`);
        console.log(`  - total_signals: ${total_signals} (original: ${item.total_signals_generated})`);
        console.log(`  - successful: ${successful} (original: ${item.successful_signals})`);
        console.log(`  - failed: ${failed} (original: ${item.failed_signals})`);
        console.log(`  - assertiveness: ${assertiveness} (original: ${item.assertiveness_rate_percent})`);
        console.log(`  - profit: ${profit} (original: ${item.total_net_profit_loss})`);
        
        const transformedItem = {
          strategy_id: item.strategy_id || 'Estraté©gia Desconhecida',
          total_signals_generated: Number(total_signals) || 0,
          successful_signals: Number(successful) || 0,
          failed_signals: Number(failed) || 0,
          assertiveness_rate_percent: Number(assertiveness) || 0,
          total_net_profit_loss: Number(profit) || 0,
          last_updated: item.last_updated || new Date().toISOString()
        };
        
        console.log(`ðŸ“Š Item transformado ${index + 1}:`, transformedItem);
        return transformedItem;
      });
      
      console.log('âœ… Transformed KPIs data:', transformedData);
      setKpisData(transformedData);
    } catch (error: any) {
      console.error('âŒ Erro ao buscar KPIs do backend:', error);
      
      if (error?.message === 'KPIS_TIMEOUT') {
        console.log('â° Timeout nos KPIs, usando dados offline');
      } else if (error?.name === 'AbortError') {
        console.log('â° Timeout nos KPIs, usando dados offline');
      }
      
      // Definir valores padré£o em caso de erro
      setKpisData([]);
    }  }, [getToken, API_BASE_URL, monitoredTables]);



  // Funçéo para buscar histé³rico da roleta do backend
  const fetchRouletteHistory = useCallback(async (table_id: string = 'pragmatic-mega-roulette') => {
    console.log('ðŸ” Iniciando busca do histé³rico da roleta...');
    try {
      const token = await getToken();
      console.log('ðŸ”‘ Token obtido:', token ? 'Sim' : 'Né£o');
      
      const response = await fetch(`${API_BASE_URL}/roulette-history?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('ðŸ“¡ Response status:', response.status);
      console.log('ðŸ“¡ Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('âŒ Response error:', errorText);
        throw new Error(`Backend né£o disponé­vel (${response.status}): ${errorText}`);
      }
      
      const data: RouletteSpin[] = await response.json();
      console.log('âœ… Roulette history fetched successfully:', data);
      console.log('ðŸ“Š Néºmero de giros recebidos:', data.length);
      setRouletteHistoryData(data);
      
      if (data.length > 0) {
        setLatestRouletteSpin(data[0]);
        console.log('ðŸŽ¯ éšltimo giro definido:', data[0].spin_number);
      } else {
        console.log('âŒ Nenhum giro encontrado no histé³rico');
      }
    } catch (error) {
      console.error('âŒ Erro ao buscar histé³rico da roleta:', error);
      setError('Né£o foi possé­vel carregar o histé³rico da roleta. Verifique a conexé£o com o backend.');
      setRouletteHistoryData([]);
      setLatestRouletteSpin(null);
    }
  }, [getToken, API_BASE_URL]);

  // Funçéo para buscar status da roleta ativa
  const fetchRouletteStatus = useCallback(async () => {
    console.log('ðŸ” Iniciando busca do status da roleta...');
    try {
      const token = await getToken();
      console.log('ðŸ”‘ Token obtido:', token ? 'Sim' : 'Né£o');
      
      const response = await fetch(`${API_BASE_URL}/roulette-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('ðŸ“¡ Response status:', response.status);
      console.log('ðŸ“¡ Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('âŒ Response error:', errorText);
        throw new Error(`Backend né£o disponé­vel (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log('âœ… Roulette status fetched successfully:', data);
      console.log('ðŸ“Š Tipo de dados retornados:', typeof data, Array.isArray(data) ? 'Array' : 'Object');
      
      // Se retornar array, pegar o primeiro item ativo
      if (Array.isArray(data) && data.length > 0) {
        const activeTable = data.find(table => table.status === 'active') || data[0];
        console.log('ðŸŽ¯ Mesa ativa selecionada:', activeTable);
        return activeTable;
      }
      
      return data;
    } catch (error) {
      console.error('âŒ Erro ao buscar status da roleta:', error);
      return null;
    }
  }, [getToken, API_BASE_URL]);

  // Funçéo para buscar padréµes recentes
  const fetchRecentSignals = useCallback(async () => {
    console.log('ðŸ” Iniciando busca de padréµes recentes...');
    try {
      const token = await getToken();
      console.log('ðŸ”‘ Token para padréµes obtido:', token ? 'Sim' : 'Né£o');
      
      // Usar Promise.race para timeout sem AbortController
      const fetchPromise = fetch(`${API_BASE_URL}/signals/recent?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('RECENT_SIGNALS_TIMEOUT'));
        }, 15000);
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('ðŸ“¡ Response status:', response.status);
      console.log('ðŸ“¡ Response ok:', response.ok);
      
      if (!response.ok) {
        console.error('âŒ Erro ao buscar sinais:', response.status);
        setLiveSignalsData([]);
        setActiveSignal(null);
        setCountdown(0);
        return;
      }
      
      const rawData: GeneratedSignal[] = await response.json();
      console.log('âœ… Recent signals fetched successfully:', rawData);
      console.log('ðŸ“Š Néºmero de padréµes recebidos:', rawData.length);
      
      // Buscar as preferéªncias atuais do Usuário para filtrar
      let currentMonitoredTables: string[] = [];
      try {
        const token = await getToken();
        const prefsResponse = await fetch(`${API_BASE_URL}/user-preferences`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (prefsResponse.ok) {
          const preferences = await prefsResponse.json();
          currentMonitoredTables = preferences.tables || [];
        }
      } catch (error) {
        console.log('âš ï¸ Usando todas as mesas devido a erro ao buscar preferéªncias:', error);
      }
      
      // Filtrar apenas sinais das roletas monitoradas
      const filteredData = rawData.filter(signal => {
        const isMonitored = currentMonitoredTables.length === 0 || currentMonitoredTables.includes(signal.table_id);
        if (!isMonitored) {
          console.log('ðŸš« Sinal filtrado (roleta né£o monitorada):', signal.table_id);
        }
        return isMonitored;
      });
      
      console.log('ðŸŽ¯ Sinais filtrados para roletas monitoradas:', filteredData.length, 'de', rawData.length);
      console.log('ðŸ“‹ Roletas monitoradas:', currentMonitoredTables);
      console.log('ðŸ“Š Dados brutos dos sinais:', rawData);
      console.log('ðŸ” Sinais filtrados:', filteredData);
      
      // Mapear dados para estrutura compaté­vel com LiveSignals
      const mappedData = filteredData.map(signal => ({
        ...signal,
        strategy_id: signal.strategy_name, // Mapear strategy_name para strategy_id
        bet_numbers: signal.suggested_bets, // Manter todas as apostas (néºmeros e strings como Red, Black, etc.)
        expected_return: signal.expected_return, // Usar valor calculado pela API
        status: signal.is_validated ? 'validated' : 'pending',
        confidence_level: typeof signal.confidence_level === 'string' ? 
          (signal.confidence_level === 'High' ? 85 : signal.confidence_level === 'Medium' ? 65 : 45) : 
          signal.confidence_level,
        // Garantir que campos essenciais sejam preservados
        message: signal.message, // Preservar mensagem da estraté©gia
        suggested_bets: signal.suggested_bets, // Preservar apostas sugeridas
        // Incluir campos de confiané§a se disponé­veis
        confidence_score: signal.confidence_score,
        confidence_factors: signal.confidence_factors
      }));
      
      console.log('ðŸ—‚ï¸ Dados mapeados:', mappedData);
      
      // Debug: Verificar se campos essenciais esté£o presentes
      mappedData.forEach((signal, index) => {
        console.log(`ðŸ“‹ Sinal ${index + 1}:`);
        console.log('  - ID:', signal.id);
        console.log('  - Estraté©gia:', signal.strategy_name);
        console.log('  - Apostas sugeridas (suggested_bets):', signal.suggested_bets);
        console.log('  - Apostas mapeadas (bet_numbers):', signal.bet_numbers);
        console.log('  - Mensagem:', signal.message);
        console.log('  - Status:', signal.status);
      });
      
      setLiveSignalsData(mappedData);
      
      // Processar notificaé§éµes para os novos sinais
      if (mappedData.length > 0) {
        try {
          await processSignals(mappedData.map(signal => ({
            id: signal.id,
            strategy_id: signal.strategy_id,
            table_id: signal.table_id,
            confidence: signal.confidence_level,
            created_at: signal.timestamp_generated,
            expires_at: signal.expires_at
          })));
          
          // Notificar alta atividade se muitos sinais
          if (mappedData.length >= 3) {
            await notifyHighActivity(mappedData.length);
          }
        } catch (error) {
          console.error('âŒ Erro ao processar notificaé§éµes de sinais:', error);
        }
      }
      
      // Se hé¡ padréµes, definir o mais recente como ativo
      if (mappedData.length > 0) {
        const mostRecentSignal = mappedData[0];
        setActiveSignal(mostRecentSignal);
        console.log('ðŸŽ¯ Sinal ativo inicial definido:', mostRecentSignal.strategy_id, 'ID:', mostRecentSignal.id);
        console.log('ðŸ”¢ Apostas do sinal ativo:', mostRecentSignal.bet_numbers);
        console.log('ðŸ“ Estraté©gia do sinal ativo:', mostRecentSignal.strategy_name);
        
        // Calcular countdown baseado em expires_at
        if (mostRecentSignal.expires_at) {
          const now = new Date().getTime();
          const expiresAt = new Date(mostRecentSignal.expires_at).getTime();
          const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setCountdown(timeLeft);
          console.log('â° Countdown inicial definido:', timeLeft, 'segundos');
        } else {
          setCountdown(0);
          console.log('â° Nenhum expires_at no sinal inicial, countdown = 0');
        }
      } else {
        setActiveSignal(null);
        setCountdown(0);
        console.log('âŒ Nenhum sinal encontrado, activeSignal = null');
      }
    } catch (error: any) {
      console.error('âŒ Erro ao buscar sinais recentes:', error);
      
      if (error?.message === 'RECENT_SIGNALS_TIMEOUT') {
        console.log('â° Timeout detectado');
        setError('Timeout na conexé£o com o servidor');
      } else if (error?.name === 'AbortError') {
        console.log('â° Timeout detectado');
        setError('Timeout na conexé£o com o servidor');
      } else {
        setError('Sistema temporariamente indisponé­vel');
      }
      setLiveSignalsData([]);
      setActiveSignal(null);
      setCountdown(0);
    }
  }, [getToken, API_BASE_URL]);

  // Efeito para sincronizar activeSignal com o primeiro sinal da lista
  useEffect(() => {
    if (liveSignalsData.length > 0 && !activeSignal) {
      const mostRecentSignal = liveSignalsData[0];
      setActiveSignal(mostRecentSignal);
      console.log('ðŸ”„ Sincronizando activeSignal com primeiro sinal da lista:', mostRecentSignal.strategy_id);
      
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
  }, [liveSignalsData]); // Removido activeSignal das dependéªncias para evitar loop infinito

  // Sincronizar estado com ref para evitar re-renders no Realtime
  useEffect(() => {
    monitoredTablesRef.current = monitoredTables;
  }, [monitoredTables]);

  // Efeito para carregar dados iniciais do backend
  useEffect(() => {
    console.log('ðŸ”„ useEffect executado - carregando dados reais!');
    console.log('ðŸ‘¤ User:', user);
    console.log('â³ isLoaded:', isLoaded);
    
    if (user && isLoaded) {
      console.log('âœ… Condié§éµes atendidas - iniciando carregamento de dados reais...');
      const loadInitialData = async () => {
          setLoadingData(true);
          setError(null);
          
          // Timeout geral para evitar travamento
          const timeoutId = setTimeout(() => {
            console.log('â° Timeout geral atingido, finalizando carregamento');
            setLoadingData(false);
            setError('Timeout na conexé£o. Alguns dados podem né£o estar disponé­veis.');
          }, 20000); // 20 segundos
          
          try {
            console.log('ðŸš€ Iniciando carregamento otimizado de dados...');
            console.log('ðŸ‘¤ Usuário logado:', user?.email);
            
            const token = await getToken();
            console.log('ðŸ”‘ Token obtido para carregamento inicial:', token ? 'Sim' : 'Né£o');
            console.log('ðŸ”— API_BASE_URL:', API_BASE_URL);
            
            if (!token) {
              throw new Error('Token de autenticaé§é£o né£o disponé­vel');
            }
            
            // Carregar dados essenciais primeiro (sequencial para melhor UX)
            console.log('ðŸ“Š Carregando dados essenciais...');
            
            // 1. Preferéªncias do Usuário (necessé¡rio para filtrar outros dados)
            console.log('ðŸ“‹ Carregando preferéªncias do Usuário...');
            try {
              // Usar Promise.race para timeout sem AbortController
              const fetchPromise = fetch(`${API_BASE_URL}/user-preferences`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                }
              });
              
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                  reject(new Error('PREFERENCES_TIMEOUT'));
                }, 5000);
              });
              
              const preferencesResponse = await Promise.race([fetchPromise, timeoutPromise]);
              console.log('ðŸ“‹ Status da resposta de preferéªncias:', preferencesResponse.status);
              
              if (preferencesResponse.ok) {
                const preferencesData = await preferencesResponse.json();
                console.log('âœ… Preferéªncias carregadas:', preferencesData);
                setMonitoredTables(preferencesData.tables || []);
              } else {
                console.error('âŒ Erro ao carregar preferéªncias:', preferencesResponse.status, preferencesResponse.statusText);
              }
            } catch (prefError: any) {
              if (prefError?.message === 'PREFERENCES_TIMEOUT') {
                console.log('â° Timeout ao carregar preferéªncias');
              } else if (prefError?.name === 'AbortError') {
                console.log('â° Timeout ao carregar preferéªncias');
              } else {
                console.warn('âš ï¸ Erro ao carregar preferéªncias, usando padréµes:', prefError);
              }
              setMonitoredTables([]);
            }
            
            // 2. Sinais recentes (dados mais importantes)
            console.log('ðŸŽ¯ Carregando sinais recentes...');
            try {
              // Usar Promise.race para timeout sem AbortController
              const fetchPromise = fetch(`${API_BASE_URL}/signals/recent?limit=5`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                }
              });
              
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                  console.log('â° Timeout na requisié§é£o de sinais - usando dados mock');
                  reject(new Error('REQUEST_TIMEOUT'));
                }, 15000);
              });
              
              const signalsResponse = await Promise.race([fetchPromise, timeoutPromise]);
              console.log('ðŸŽ¯ Status da resposta de sinais:', signalsResponse.status);
              if (signalsResponse.ok) {
                const responseData = await signalsResponse.json();
                const signalsData = responseData.data || [];
                console.log('âœ… Sinais carregados:', signalsData);
                console.log('ðŸ“Š Néºmero de sinais recebidos:', signalsData.length);
                setLiveSignalsData(signalsData);
                
                if (signalsData.length > 0) {
                  setActiveSignal(signalsData[0]);
                  console.log('ðŸŽ¯ Sinal ativo definido:', signalsData[0]);
                } else {
                  console.log('âš ï¸ Nenhum sinal encontrado');
                }
              } else {
                // Erro ao carregar sinais
                const errorText = await signalsResponse.text();
              }
            } catch (signalsError: any) {
              if (signalsError?.message === 'REQUEST_TIMEOUT') {
                // Timeout na requisié§é£o de sinais - continuando com dados mock
              } else if (signalsError?.name === 'AbortError') {
                // Requisié§é£o cancelada - continuando com dados mock
              } else {
                // Erro ao carregar sinais, continuando com dados mock
              }
              // Manter os dados mock em caso de erro
            }
            
            // 3. Carregar dados secundé¡rios em paralelo (né£o bloqueantes)
            // Carregando dados secundé¡rios...
            const secondaryPromises = [
              fetch(`${API_BASE_URL}/kpis`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
              }).then(res => res.ok ? res.json() : null).then(responseData => {
                if (responseData) {
                  // KPIs carregados
                  const kpisData = responseData.data || [];
                  setKpisData(kpisData);
                }
              }).catch(err => {
                // Erro ao carregar KPIs
              }),
              
              fetch(`${API_BASE_URL}/roulette-history?limit=10`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
              }).then(res => res.ok ? res.json() : null).then(data => {
                if (data) {
                  // Histé³rico carregado
                  setRouletteHistoryData(data);
                  if (data.length > 0) setLatestRouletteSpin(data[0]);
                }
              }).catch(err => {
                // Erro ao carregar histé³rico
              }),
              
              fetch(`${API_BASE_URL}/roulette-status`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
              }).then(res => res.ok ? res.json() : null).then(data => {
                if (data) {
                  // Status carregado
                  setActiveRouletteStatus(data);
                }
              }).catch(err => {
                // Erro ao carregar status
              })
            ];
            
            // Aguardar dados secundé¡rios sem bloquear a interface
            await Promise.allSettled(secondaryPromises);
            
            // Carregamento otimizado conclué­do
          } catch (error) {
            // Erro ao carregar dados do backend
            setError('Erro ao conectar com o servidor. Verifique sua conexé£o.');
          } finally {
            clearTimeout(timeoutId); // Limpar timeout geral
            setLoadingData(false);
            // Carregamento finalizado
          }
        };

      loadInitialData();

      // Configurar polling para atualizaé§éµes em tempo real
      console.log('ðŸ”„ Configurando polling para atualizaé§éµes...');
      setConnectionStatus('connected');
      
      // Polling para sinais recentes
      const pollSignals = async () => {
        try {
          const token = await getToken();
          const response = await fetch('/api/signals/recent', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const responseData = await response.json();
            const data = responseData.data || [];
            setLiveSignalsData(data.slice(0, 10));
            
            // Atualizar sinal ativo se houver um mais recente
            if (data.length > 0) {
              setActiveSignal(prev => {
                const newest = data[0];
                // Verificar se é© um sinal diferente (por ID) ou se né£o hé¡ sinal ativo
                if (!prev || newest.id !== prev.id) {
                  console.log('ðŸ”„ Atualizando sinal ativo:', newest.id, 'néºmeros:', newest.suggested_bets);
                  return newest;
                }
                return prev;
              });
            }
            
            setConnectionStatus('connected');
            lastActivityRef.current = Date.now();
          }
        } catch (error) {
          console.error('âŒ Erro ao buscar sinais:', error);
        }
      };
      
      // Polling para histé³rico de roleta
      const pollRouletteHistory = async () => {
        try {
          const token = await getToken();
          const response = await fetch('/api/roulette-history', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setRouletteHistoryData(data.slice(0, 20));
            
            if (data.length > 0) {
              setLatestRouletteSpin(data[0]);
            }
          }
        } catch (error) {
          console.error('âŒ Erro ao buscar histé³rico de roleta:', error);
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
         console.log('ðŸ§¹ Cleanup - removing polling intervals...');
         clearInterval(signalsInterval);
         clearInterval(rouletteInterval);
         console.log('ðŸ§¹ Cleanup completed successfully');
       };
    } else {
      console.log('âŒ Condié§éµes né£o atendidas para carregar dados:');
      console.log('   - User existe:', !!user);
      console.log('   - Loaded:', isLoaded);
    }
  }, [user, isLoaded]);

  // Rotaé§é£o das frases motivacionais
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) =>
        (prevIndex + 1) % motivationalPhrases.length
      );
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Atualizaé§éµes perié³dicas de dados
  useEffect(() => {
    if (user && isLoaded) {
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
  }, [user, isLoaded, updateKPIs, updateRouletteStatus]);

  // Contagem regressiva do sinal ativo baseada em expires_at
  useEffect(() => {
    if (activeSignal && activeSignal.expires_at) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const expiresAt = new Date(activeSignal.expires_at).getTime();
        const createdAt = new Date(activeSignal.timestamp_generated).getTime();
        const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
        
        setCountdown(timeLeft);
        
        // Calcular progresso da barra (comeé§a em 100% e diminui até© 0%)
        // Usar uma duraé§é£o padré£o de 5 minutos (300 segundos) se né£o conseguir calcular a duraé§é£o total
        const totalDuration = expiresAt - createdAt;
        let progress = 0;
        
        if (totalDuration > 0) {
          const remaining = Math.max(0, expiresAt - now);
          progress = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
        } else {
           // Fallback: assumir duraé§é£o de 60 segundos (mais realista para roleta) e calcular baseado no countdown
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

  // Atualizaé§é£o perié³dica do status da roleta
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
  }, [user, getToken]); // Removida fetchRouletteStatus das dependéªncias

  if (!isLoaded) {
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
            {/* Indicador de Status da Conexé£o */}
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
              Ver Histé³rico
            </Button>
            <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Play className="h-4 w-4" />
                  Ativar Estraté©gia
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ativar Nova Estraté©gia</DialogTitle>
                  <DialogDescription>
                    Selecione a estraté©gia que deseja ativar e configure os paré¢metros.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Estraté©gia</h4>
                    <Select defaultValue="fibonacci">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma estraté©gia" />
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

        {/* Tabs de Navegaé§é£o */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visé£o Geral</TabsTrigger>
            <TabsTrigger value="metrics">Mé©tricas em Tempo Real</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Mostrar skeleton durante carregamento */}
        {loading_data ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Informaé§éµes Diné¢micas */}
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

        {/* Seé§é£o Padré£o Ativo */}
        {loading_data ? (
          <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 text-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Estraté©gia e Néºmeros - Skeleton */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-600 text-white border-green-500">
                       <div className="w-2 h-2 bg-green-300 rounded-full mr-1 animate-pulse"></div>
                       Ao Vivo
                     </Badge>
                  </div>
                  <h3 className="text-lg font-semibold">Padré£o Ativo</h3>
                  <div className="text-sm text-gray-300">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">Néºmeros Indicados</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton key={index} className="w-8 h-8 rounded-full" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Confiané§a</p>
                    <div className="text-lg font-bold">
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                </div>

                {/* Tempo para Aé§é£o - Skeleton */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Tempo para Aé§é£o</h4>
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

                {/* Histé³rico da Estraté©gia - Skeleton */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Histé³rico da Estraté©gia</h4>
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

                {/* Boté£o Aplicar Aposta - Skeleton */}
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
                {/* Estraté©gia e Néºmeros */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-600 text-white border-green-500">
                       <div className="w-2 h-2 bg-green-300 rounded-full mr-1 animate-pulse"></div>
                       Ao Vivo
                     </Badge>
                  </div>
                  <h3 className="text-lg font-semibold">Padré£o Ativo</h3>
                  <p className="text-sm text-gray-300">
                     Estraté©gia: {activeSignal.strategy_name || activeSignal.strategy_id}
                   </p>
                  <div className="space-y-2">
                     <p className="text-xs text-gray-400">Néºmeros Indicados</p>
                     <div className="flex flex-wrap gap-1">
                       {(() => {
                         // Processar bet_numbers para exibir APENAS néºmeros vé¡lidos (0-36)
                         let numbers: number[] = [];
                         
                         // Usar bet_numbers ou suggested_bets como fallback
                         const betsArray = activeSignal.bet_numbers || activeSignal.suggested_bets;
                         
                         if (Array.isArray(betsArray)) {
                           // Se é© array, processar cada item
                           betsArray.forEach(bet => {
                             if (typeof bet === 'string') {
                               // Se é© string, pode ser "1,2,3" ou um néºmero individual
                               if (bet.includes(',')) {
                                 // String com néºmeros separados por vé­rgula
                                 const nums = bet.split(',').map(n => n.trim());
                                 nums.forEach(num => {
                                   const parsedNum = Number(num);
                                   if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                     numbers.push(parsedNum);
                                   }
                                 });
                               } else {
                                 // Verificar se é© um néºmero vé¡lido
                                 const parsedNum = Number(bet);
                                 if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                   numbers.push(parsedNum);
                                 }
                               }
                             } else if (typeof bet === 'number') {
                               // Se é© néºmero, verificar se esté¡ no range vé¡lido
                               if (bet >= 0 && bet <= 36) {
                                 numbers.push(bet);
                               }
                             }
                           });
                         }
                         
                         // Remover duplicatas e limitar a 12 néºmeros
                         const uniqueNumbers = Array.from(new Set(numbers)).slice(0, 12);
                         
                         return uniqueNumbers.map((number, index) => {
                           // Definir cor baseada nas regras da roleta
                           let bgColor;
                           
                           // Verde: 0
                           if (number === 0) {
                             bgColor = 'bg-green-600';
                           }
                           // Vermelho: néºmeros especé­ficos
                           else if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(number)) {
                             bgColor = 'bg-red-600';
                           }
                           // Preto: todos os outros néºmeros
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
                    <p className="text-xs text-gray-400">Confiané§a</p>
                    <p className="text-lg font-bold">
                      {(() => {
                        // Se confidence_level é© um néºmero vé¡lido, usar ele
                         if (typeof activeSignal.confidence_level === 'number' && activeSignal.confidence_level > 0) {
                           // Se o valor jé¡ esté¡ em porcentagem (>1), usar direto, sené£o multiplicar por 100
                           const percentage = activeSignal.confidence_level > 1 ? activeSignal.confidence_level : activeSignal.confidence_level * 100;
                           return `${percentage.toFixed(0)}%`;
                         }
                         // Se né£o hé¡ confidence_level vé¡lido, tentar converter confidence_level
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

                {/* Tempo para Aé§é£o */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Tempo para Aé§é£o</h4>
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
                       {/* Indicador de urgéªncia quando restam poucos segundos */}
                       {countdown > 0 && countdown <= 30 && (
                         <div className="absolute inset-0 bg-yellow-500 rounded-full opacity-20 animate-pulse"></div>
                       )}
                    </div>
                    {/* Status do tempo */}
                    <div className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                      countdown <= 0 ? 'text-red-400' : countdown <= 30 ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      {countdown <= 0 ? 'Sinal expirado' : countdown <= 30 ? 'éšltimos segundos!' : 'Tempo disponé­vel'}
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

                {/* Histé³rico da Estraté©gia */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Histé³rico da Estraté©gia</h4>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="text-center">
                       <p className="text-xs text-gray-400">Assertividade</p>
                       <p className="text-lg font-bold">
                         {(() => {
                           // Assertividade especé­fica da estraté©gia ativa
                           const kpi = kpisData.find(k => k.strategy_id === (activeSignal.strategy_name || activeSignal.strategy_id));
                           if (kpi && typeof kpi.assertiveness_rate_percent === 'number' && !isNaN(kpi.assertiveness_rate_percent)) {
                             return `${kpi.assertiveness_rate_percent.toFixed(1)}%`;
                           }
                           // Se né£o hé¡ dados de KPI, mostrar 0% ao invé©s de N/A
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
                           // Se né£o hé¡ dados de KPI, mostrar 0 ao invé©s de N/A
                           return '0';
                         })()} 
                       </p>
                     </div>
                   </div>
                </div>

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
                    
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        className="text-xs text-gray-300 underline underline-offset-4 hover:text-white transition-colors"
                        onClick={() => {
                          if (!activeSignal || !liveSignalsData.length) return;
                          const currentIndex = liveSignalsData.findIndex(
                            signal => signal.id === activeSignal.id
                          );
                          if (currentIndex === -1) return;
                          const nextIndex = currentIndex + 1;
                          const nextSignal =
                            nextIndex < liveSignalsData.length
                              ? liveSignalsData[nextIndex]
                              : null;
                          if (nextSignal) {
                            setActiveSignal(nextSignal);
                          } else {
                            setActiveSignal(null);
                          }
                        }}
                      >
                        Pular Padrão
                      </button>
                    </div>
                    
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      <div className="text-xs text-gray-300 mb-1">Apostas Sugeridas:</div>
                      <div className="flex gap-1">
                        {(() => {
                          const validNumbers: number[] = [];
                          
                          const betsArray = activeSignal.bet_numbers || activeSignal.suggested_bets;
                          
                          betsArray?.forEach(bet => {
                            if (typeof bet === 'string') {
                              if (bet.includes(',')) {
                                const nums = bet.split(',').map(n => n.trim());
                                nums.forEach(num => {
                                  const parsedNum = Number(num);
                                  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                    validNumbers.push(parsedNum);
                                  }
                                });
                              } else {
                                const parsedNum = Number(bet);
                                if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                  validNumbers.push(parsedNum);
                                }
                              }
                            } else if (typeof bet === 'number') {
                              if (bet >= 0 && bet <= 36) {
                                validNumbers.push(bet);
                              }
                            }
                          });
                          
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
                <h3 className="text-lg font-semibold">Aguardando Padré£o</h3>
                <p className="text-sm text-gray-400">
                  Nenhum padré£o ativo no momento. Aguarde a pré³xima oportunidade.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Componente de Teste de Autenticaé§é£o (apenas para desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6">
            <AuthTest />
          </div>
        )}

        {/* Layout Principal do Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna Esquerda - Padré£o Ativo e Estaté­sticas */}
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
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <RealTimeMetrics />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <RealTimeMonitoringDashboard isActive={true} />
          </TabsContent>
        </Tabs>
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

// Memoizaé§é£o do componente principal para otimizaé§é£o de performance
export default memo(DashboardPage);
