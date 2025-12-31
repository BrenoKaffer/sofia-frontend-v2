'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard/layout';
import { MetricsTab } from './metrics-tab';
import { RouletteHeatmap } from '@/components/analytics/roulette-heatmap';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  Activity, 
  TrendingUp, 
  History, 
  Filter, 
  Bell, 
  Settings, 
  Download,
  RefreshCw,
  Clock,
  Flame,
  Snowflake,
  BarChart3,
  Play,
  Pause,
  Target,
  Users,
  FlipHorizontal,
  GitCompare,
  EyeOff,
  Zap,
  Timer,
  Gauge,
  AlertTriangle,
  TrendingDown,
  Calendar,
  BarChart2,
  PieChart,
  LineChart
} from 'lucide-react';

// Mock data removed




interface Roulette {
  id: string;
  name: string;
  provider: string;
  status: 'online' | 'offline' | 'maintenance';
  lastNumbers: number[];
  isMonitored: boolean;
  lastUpdate: string;
  totalSpins: number;
  hotNumbers: number[];
  coldNumbers: number[];
  isSpinning?: boolean;
}

export default function RouletteStatusPage() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showMonitoredOnly, setShowMonitoredOnly] = useState(false);
  const [roulettes, setRoulettes] = useState<Roulette[]>([]);
  const [filterType, setFilterType] = useState(['all']);
  const [lastXSpins, setLastXSpins] = useState('20');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [selectedRoulette, setSelectedRoulette] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('24h');
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedRouletteForAlert, setSelectedRouletteForAlert] = useState<string | null>(null);
  const [hoveredNumber, setHoveredNumber] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('grid');
  const [lastTabByRoulette, setLastTabByRoulette] = useState<Record<string, string>>({});
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, any>>({});
  const [realTimeAlerts, setRealTimeAlerts] = useState<any[]>([]);
  const [spinVelocity, setSpinVelocity] = useState<Record<string, number>>({});
  const [trendAnalysis, setTrendAnalysis] = useState<Record<string, any>>({});

  // Carregar preferências de abas do localStorage na inicialização
  useEffect(() => {
    const savedTabPreferences = localStorage.getItem('roulette-tab-preferences');
    if (savedTabPreferences) {
      try {
        setLastTabByRoulette(JSON.parse(savedTabPreferences));
      } catch (error) {
        console.error('Erro ao carregar preferências de abas:', error);
      }
    }
  }, []);

  // Fetch real data from API
  useEffect(() => {
    const fetchRouletteStatus = async () => {
      try {
        const token = await getToken();
        if (!token) {
           console.log("Aguardando autenticação...");
           return;
        }

        const response = await fetch('/api/roulette-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          // Handle both array and { data: [...] } formats
          const rawData = Array.isArray(result) ? result : (result.data || []);
          
          // Map API data to internal interface
          const mappedData: Roulette[] = rawData.map((item: any) => {
            const lastNumbers = item.lastNumbers || [];
            // Simple calculation for hot/cold numbers if not provided
            // This is a basic estimation based on frequency in the last numbers
            const frequency: Record<number, number> = {};
            lastNumbers.forEach((n: number) => { frequency[n] = (frequency[n] || 0) + 1; });
            
            const sortedNumbers = Object.entries(frequency)
              .sort(([, a], [, b]) => b - a)
              .map(([n]) => parseInt(n));
              
            return {
              id: item.table_id || item.id,
              name: item.table_name || item.name,
              provider: item.provider || 'Unknown',
              status: item.status,
              lastNumbers: lastNumbers,
              isMonitored: item.is_monitored ?? true,
              lastUpdate: item.last_updated || new Date().toISOString(),
              totalSpins: item.totalSpins || lastNumbers.length * 5 + Math.floor(Math.random() * 100), // Estimate if missing
              hotNumbers: item.hotNumbers || sortedNumbers.slice(0, 5),
              coldNumbers: item.coldNumbers || sortedNumbers.slice(-5),
              isSpinning: item.status === 'active'
            };
          });

          setRoulettes(mappedData);
          setIsLoading(false);
        } else {
          console.error('Erro ao buscar status das roletas:', response.statusText);
        }
      } catch (error) {
        console.error('Erro na requisição de status:', error);
      }
    };

    fetchRouletteStatus();
    
    // Atualiza a cada 5 segundos
    const interval = setInterval(fetchRouletteStatus, 5000);
    return () => clearInterval(interval);
  }, [getToken]);

  // Simulação de métricas em tempo real (mantido apenas para dados secundários não vindos da API ainda)
  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics: Record<string, any> = {};
      const newVelocity: Record<string, number> = {};
      const newTrends: Record<string, any> = {};
      
      roulettes.forEach(roulette => {
        // Métricas de performance
        newMetrics[roulette.id] = {
          avgSpinTime: Math.random() * 30 + 15, // 15-45 segundos
          efficiency: Math.random() * 20 + 80, // 80-100%
          uptime: Math.random() * 5 + 95, // 95-100%
          totalSpinsToday: Math.floor(Math.random() * 500) + 200,
          revenue: Math.random() * 10000 + 5000,
          playerCount: Math.floor(Math.random() * 50) + 10
        };
        
        // Velocidade de giros (giros por hora)
        newVelocity[roulette.id] = Math.random() * 40 + 60; // 60-100 giros/hora
        
        // Análise de tendências
        newTrends[roulette.id] = {
          hotStreak: Math.floor(Math.random() * 10) + 1,
          coldStreak: Math.floor(Math.random() * 15) + 5,
          patternDetected: Math.random() > 0.7,
          volatility: Math.random() * 100,
          predictability: Math.random() * 100
        };
      });
      
      setPerformanceMetrics(newMetrics);
      setSpinVelocity(newVelocity);
      setTrendAnalysis(newTrends);
      
      // Gerar alertas aleatórios
      if (Math.random() > 0.8) {
        const alertTypes = ['hot_number', 'cold_streak', 'pattern_detected', 'high_volatility'];
        const randomAlert = {
          id: Date.now(),
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          rouletteId: roulettes[Math.floor(Math.random() * roulettes.length)].id,
          message: 'Novo padrão detectado',
          timestamp: new Date()
        };
        setRealTimeAlerts(prev => [randomAlert, ...prev.slice(0, 4)]);
      }
    };
    
    // Atualizar métricas a cada 5 segundos
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Executar imediatamente
    
    return () => clearInterval(interval);
  }, [roulettes]);

  // Função para filtrar números baseado no limite de spins
  const getFilteredNumbers = (numbers: number[]) => {
    const limit = parseInt(lastXSpins);
    // Se o limite for 500, mostra todos os números disponíveis
    if (limit >= 500) {
      return numbers;
    }
    return numbers.slice(0, limit);
  };

  // Processar dados para o mapa de calor
  const heatmapData = useMemo(() => {
    if (!selectedRoulette) return [];

    const roulette = roulettes.find(r => r.id === selectedRoulette);
    if (!roulette || !roulette.lastNumbers) return [];

    // Calcular frequência de cada número
    const numberFrequency: { [key: number]: number } = {};
    const numberLastSeen: { [key: number]: string } = {};

    // Inicializar todos os números (0-36) com frequência 0
    for (let i = 0; i <= 36; i++) {
      numberFrequency[i] = 0;
    }

    // Contar frequências dos números filtrados
    const filteredNumbers = getFilteredNumbers(roulette.lastNumbers);
    filteredNumbers.forEach((number, index) => {
      if (number >= 0 && number <= 36) {
        numberFrequency[number]++;
        if (!numberLastSeen[number]) {
          numberLastSeen[number] = `Posição ${filteredNumbers.length - index}`;
        }
      }
    });

    // Determinar cor do número (vermelho, preto ou verde)
    const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
      if (num === 0) return 'green';
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      return redNumbers.includes(num) ? 'red' : 'black';
    };

    // Converter para formato do componente
    return Object.entries(numberFrequency).map(([number, frequency]) => ({
      number: parseInt(number),
      frequency,
      lastSeen: numberLastSeen[parseInt(number)] || 'Nunca',
      color: getNumberColor(parseInt(number))
    }));
  }, [selectedRoulette, roulettes, lastXSpins, timeFilter]);

  // Salvar preferências de abas no localStorage
  const saveTabPreference = (rouletteId: string, tabValue: string) => {
    const updatedPreferences = {
      ...lastTabByRoulette,
      [rouletteId]: tabValue
    };
    setLastTabByRoulette(updatedPreferences);
    localStorage.setItem('roulette-tab-preferences', JSON.stringify(updatedPreferences));
  };

  // Função para lidar com mudança de aba
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Se há uma roleta selecionada, salvar a preferência
    if (selectedRoulette) {
      saveTabPreference(selectedRoulette, value);
    }
  };

  // Função para obter a aba padrão para uma roleta específica
  const getDefaultTabForRoulette = (rouletteId: string) => {
    return lastTabByRoulette[rouletteId] || 'grid';
  };

  // Restaurar a última aba quando uma roleta específica é selecionada
  useEffect(() => {
    if (selectedRoulette) {
      const preferredTab = getDefaultTabForRoulette(selectedRoulette);
      setActiveTab(preferredTab);
    }
  }, [selectedRoulette, lastTabByRoulette]);

  // Função para selecionar uma roleta e restaurar sua última aba
  const selectRouletteAndRestoreTab = (rouletteId: string) => {
    setSelectedRoulette(rouletteId);
    const preferredTab = getDefaultTabForRoulette(rouletteId);
    setActiveTab(preferredTab);
  };

  const toggleMonitored = (id: string) => {
    setRoulettes(roulettes.map(roulette => 
      roulette.id === id ? {...roulette, isMonitored: !roulette.isMonitored} : roulette
    ));
  };

  const toggleComparison = (id: string) => {
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison(selectedForComparison.filter(rId => rId !== id));
    } else {
      setSelectedForComparison([...selectedForComparison, id]);
    }
  };

  const openAlertDialog = (rouletteId: string) => {
    setSelectedRouletteForAlert(rouletteId);
    setAlertDialogOpen(true);
  };

  const handleNumberHover = (number: number | null) => {
    setHoveredNumber(number);
    
    // Remove todas as classes de highlight existentes
    document.querySelectorAll('.highlight, .highlight-active').forEach(el => {
      el.classList.remove('highlight', 'highlight-active');
    });
    
    if (number !== null) {
      // Adiciona highlight para todos os elementos com o mesmo número
      document.querySelectorAll(`[data-number="${number}"]`).forEach(el => {
        el.classList.add('highlight');
      });
    }
  };

  const handleNumberMouseEnter = (number: number, event: React.MouseEvent) => {
    handleNumberHover(number);
    // Adiciona highlight-active apenas ao elemento atual
    (event.target as HTMLElement).classList.add('highlight-active');
  };

  const handleNumberMouseLeave = () => {
    handleNumberHover(null);
  };

  // Auto-refresh em modo tempo real
  useEffect(() => {
    if (!isRealTimeMode) return;
    
    const interval = setInterval(() => {
      // Simular atualização dos dados
      setRoulettes(prev => prev.map(roulette => ({
        ...roulette,
        lastUpdate: new Date().toLocaleString('pt-BR')
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [isRealTimeMode]);

  const getFilteredRoulettes = () => {
    let filtered = roulettes;
    
    if (showMonitoredOnly) {
      filtered = filtered.filter(r => r.isMonitored);
    }
    
    if (showOnlineOnly) {
      filtered = filtered.filter(r => r.status === 'online');
    }
    
    return filtered;
  };

  const getTimeFilteredData = () => {
    // Simular filtro por tempo - em produção seria baseado em timestamps reais
    switch(timeFilter) {
      case '1h': return roulettes.map(r => ({...r, lastNumbers: r.lastNumbers.slice(0, 5)}));
      case '24h': return roulettes;
      case '7d': return roulettes.map(r => ({...r, lastNumbers: [...r.lastNumbers, ...r.lastNumbers]}));
      default: return roulettes;
    }
  };

  const handleFilterTypeChange = (value: string) => {
    if (filterType.includes(value)) {
      setFilterType(filterType.filter(f => f !== value));
    } else {
      setFilterType([...filterType.filter(f => f !== 'all'), value]);
    }
  };

  const displayedRoulettes = getFilteredRoulettes();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'default';
      case 'offline': return 'destructive';
      case 'maintenance': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'maintenance': return 'Manutenção';
      default: return 'Desconhecido';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Histórico das Roletas</h1>
              <p className="text-muted-foreground">Acompanhe o status e histórico completo das roletas</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Controles de Filtro Inteligentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Inteligentes e Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Status das Roletas</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="monitored-only"
                      checked={showMonitoredOnly} 
                      onCheckedChange={setShowMonitoredOnly} 
                    />
                    <Label htmlFor="monitored-only" className="text-sm">Apenas monitoradas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="online-only"
                      checked={showOnlineOnly} 
                      onCheckedChange={setShowOnlineOnly} 
                    />
                    <Label htmlFor="online-only" className="text-sm">Apenas online</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Intervalo de Tempo</Label>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Última hora</SelectItem>
                    <SelectItem value="24h">Últimas 24h</SelectItem>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch 
                    id="real-time"
                    checked={isRealTimeMode} 
                    onCheckedChange={setIsRealTimeMode} 
                  />
                  <Label htmlFor="real-time" className="text-sm flex items-center gap-1">
                    {isRealTimeMode ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    Tempo Real
                  </Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Últimas Jogadas</Label>
                <Select value={lastXSpins} onValueChange={setLastXSpins}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Últimas 10</SelectItem>
                    <SelectItem value="20">Últimas 20</SelectItem>
                    <SelectItem value="50">Últimas 50</SelectItem>
                    <SelectItem value="100">Últimas 100</SelectItem>
                    <SelectItem value="200">Últimas 200</SelectItem>
                    <SelectItem value="300">Últimas 300</SelectItem>
                    <SelectItem value="500">Últimas 500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tipos de Análise (Múltipla Seleção)</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'hot', label: 'Números quentes', icon: Flame },
                    { value: 'cold', label: 'Números frios', icon: Snowflake },
                    { value: 'patterns', label: 'Padrões', icon: BarChart3 },
                    { value: 'sequences', label: 'Sequências', icon: Activity },
                    { value: 'terminals', label: 'Terminais', icon: Target },
                    { value: 'neighbors', label: 'Vizinhos', icon: Users },
                    { value: 'mirrors', label: 'Espelhos', icon: FlipHorizontal }
                  ].map((option) => {
                    const IconComponent = option.icon;
                    const isSelected = filterType.includes(option.value);
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`gap-2 transition-all duration-200 ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                            : 'hover:bg-primary/10 hover:border-primary/50'
                        }`}
                        onClick={() => handleFilterTypeChange(option.value)}
                      >
                        <IconComponent className="h-4 w-4" />
                        {option.label}
                        {isSelected && (
                          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">✓</Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Modo Comparação</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="comparison-mode"
                    checked={isComparisonMode} 
                    onCheckedChange={setIsComparisonMode} 
                  />
                  <Label htmlFor="comparison-mode" className="text-sm flex items-center gap-1">
                    <GitCompare className="h-3 w-3" />
                    Comparar Roletas
                  </Label>
                </div>
                {isComparisonMode && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Selecione múltiplas roletas para comparar estatísticas
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex justify-between items-center mb-4">
            <TabsList className="transition-all duration-200">
              <TabsTrigger value="grid" className="transition-all duration-200 hover:bg-primary/10">Visão Geral</TabsTrigger>
              <TabsTrigger value="history" className="transition-all duration-200 hover:bg-primary/10">Histórico Detalhado</TabsTrigger>
              <TabsTrigger value="heatmap" className="transition-all duration-200 hover:bg-primary/10">Mapa de Calor</TabsTrigger>
              <TabsTrigger value="analytics" className="transition-all duration-200 hover:bg-primary/10">Análises</TabsTrigger>
              <TabsTrigger value="metrics" className="transition-all duration-200 hover:bg-primary/10">Métricas RT</TabsTrigger>
              {compareMode && selectedForComparison.length > 1 && (
                <TabsTrigger value="comparison" className="transition-all duration-200 hover:bg-primary/10">Comparação ({selectedForComparison.length})</TabsTrigger>
              )}
            </TabsList>
            <div className="flex items-center gap-2">
              {isRealTimeMode && (
                <Badge variant="outline" className="animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Tempo Real Ativo
                </Badge>
              )}
            </div>
          </div>

          <TabsContent value="grid" className="mt-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedRoulettes.map((roulette) => (
                <Card key={roulette.id} className={`overflow-hidden ${roulette.isMonitored ? 'border-primary/50' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {roulette.name}
                          {roulette.status === 'online' && (
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(roulette.status)}>
                            {getStatusText(roulette.status)}
                          </Badge>
                          {roulette.isSpinning && (
                            <Badge variant="outline" className="animate-pulse">
                              Girando
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {roulette.lastUpdate}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          type="button"
                          variant={roulette.isMonitored ? "default" : "outline"}
                          size="sm"
                          className="gap-1"
                          onClick={() => toggleMonitored(roulette.id)}
                        >
                          {roulette.isMonitored ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          {roulette.isMonitored ? 'Monitorando' : 'Monitorar'}
                        </Button>
                        
                        {compareMode && (
                          <Button 
                            type="button"
                            variant={selectedForComparison.includes(roulette.id) ? "default" : "outline"}
                            size="sm"
                            className="gap-1"
                            onClick={() => toggleComparison(roulette.id)}
                          >
                            <GitCompare className="h-4 w-4" />
                            {selectedForComparison.includes(roulette.id) ? 'Selecionada' : 'Comparar'}
                          </Button>
                        )}
                        
                        <Dialog open={alertDialogOpen && selectedRouletteForAlert === roulette.id} onOpenChange={(open) => !open && setAlertDialogOpen(false)}>
                          <DialogTrigger asChild>
                            <Button 
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => openAlertDialog(roulette.id)}
                            >
                              <Bell className="h-4 w-4" />
                              Alertas
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Configurar Alertas - {roulette.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Tipos de Alerta</Label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { id: 'hot-numbers', label: 'Números quentes', icon: Flame, description: '5+ repetições' },
                                    { id: 'cold-numbers', label: 'Números frios', icon: Snowflake, description: '20+ giros sem aparecer' },
                                    { id: 'patterns', label: 'Padrões', icon: BarChart3, description: 'Detectados' },
                                    { id: 'sequences', label: 'Sequências', icon: Activity, description: 'Especiais' }
                                  ].map((alert) => {
                                    const IconComponent = alert.icon;
                                    return (
                                      <Button
                                        key={alert.id}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 hover:bg-primary/10 hover:border-primary/50 flex-col h-auto p-3"
                                      >
                                        <div className="flex items-center gap-2">
                                          <IconComponent className="h-4 w-4" />
                                          {alert.label}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{alert.description}</span>
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Método de Notificação</Label>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { id: 'browser-notification', label: 'Navegador', icon: Bell, defaultSelected: true },
                                    { id: 'sound-alert', label: 'Som', icon: Activity, defaultSelected: false }
                                  ].map((method) => {
                                    const IconComponent = method.icon;
                                    return (
                                      <Button
                                        key={method.id}
                                        type="button"
                                        variant={method.defaultSelected ? "default" : "outline"}
                                        size="sm"
                                        className={`gap-2 transition-all duration-200 ${
                                          method.defaultSelected 
                                            ? 'bg-primary text-primary-foreground shadow-md' 
                                            : 'hover:bg-primary/10 hover:border-primary/50'
                                        }`}
                                      >
                                        <IconComponent className="h-4 w-4" />
                                        {method.label}
                                        {method.defaultSelected && (
                                          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">✓</Badge>
                                        )}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={() => setAlertDialogOpen(false)}>Salvar Alertas</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Últimos Números ({lastXSpins})</h4>
                          <span className="text-xs text-muted-foreground">{roulette.totalSpins} giros totais</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {getFilteredNumbers(roulette.lastNumbers).map((num, index) => (
                            <span 
                              key={index}
                              data-number={num}
                              className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 ${
                                num === 0 ? 'bg-green-600 text-white' :
                                [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'bg-red-500 text-white' : 'bg-black text-white'
                              }`}
                              onMouseEnter={(e) => handleNumberMouseEnter(num, e)}
                              onMouseLeave={handleNumberMouseLeave}
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Flame className="h-4 w-4 text-red-500" />
                            Números Quentes
                          </h4>
                          <div className="flex gap-1">
                            {roulette.hotNumbers.map((num, index) => (
                              <span 
                                key={index}
                                data-number={num}
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 ${
                                  num === 0 ? 'bg-green-600 text-white' :
                                  [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'bg-red-500 text-white' : 'bg-black text-white'
                                }`}
                                onMouseEnter={(e) => handleNumberMouseEnter(num, e)}
                                onMouseLeave={handleNumberMouseLeave}
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Snowflake className="h-4 w-4 text-blue-500" />
                            Números Frios
                          </h4>
                          <div className="flex gap-1">
                            {roulette.coldNumbers.map((num, index) => (
                              <span 
                                key={index}
                                data-number={num}
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 ${
                                  num === 0 ? 'bg-green-600 text-white' :
                                  [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'bg-red-500 text-white' : 'bg-black text-white'
                                }`}
                                onMouseEnter={(e) => handleNumberMouseEnter(num, e)}
                                onMouseLeave={handleNumberMouseLeave}
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
              {displayedRoulettes.map((roulette) => (
                <Card key={roulette.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                             {roulette.name}
                             <Badge variant={getStatusColor(roulette.status)}>
                               {getStatusText(roulette.status)}
                             </Badge>
                           </CardTitle>
                        <CardDescription>
                          Histórico completo dos últimos {lastXSpins} números
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Bell className="h-4 w-4" />
                          Configurar Alerta
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="h-4 w-4" />
                          Exportar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Estatísticas Rápidas */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-primary">{roulette.totalSpins}</div>
                          <div className="text-sm text-muted-foreground">Total de Giros</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-red-500">{roulette.hotNumbers.length}</div>
                          <div className="text-sm text-muted-foreground">Números Quentes</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-500">{roulette.coldNumbers.length}</div>
                          <div className="text-sm text-muted-foreground">Números Frios</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold text-green-500">{roulette.lastNumbers[0]}</div>
                          <div className="text-sm text-muted-foreground">Último Número</div>
                        </div>
                      </div>

                      {/* Tabela de Histórico */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold">Histórico de Números</h4>
                          <div className="text-sm text-muted-foreground">
                            Exibindo {getFilteredNumbers(roulette.lastNumbers).length} de {roulette.lastNumbers.length} números
                          </div>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <div className={`${parseInt(lastXSpins) >= 100 ? 'max-h-96 overflow-y-auto' : ''} p-4 bg-muted/30`}>
                            <div className="grid grid-cols-10 gap-1">
                              {getFilteredNumbers(roulette.lastNumbers).map((num, index) => (
                                <div key={index} className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">#{getFilteredNumbers(roulette.lastNumbers).length - index}</div>
                                  <div 
                                    data-number={num}
                                    className={`inline-flex items-center justify-center h-10 w-10 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 ${
                                      num === 0 ? 'bg-green-600 text-white' :
                                      [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'bg-red-500 text-white' : 'bg-black text-white'
                                    }`}
                                    onMouseEnter={(e) => handleNumberMouseEnter(num, e)}
                                    onMouseLeave={handleNumberMouseLeave}
                                  >
                                    {num}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Análise de Padrões */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Flame className="h-5 w-5 text-red-500" />
                            Análise de Números Quentes
                          </h4>
                          <div className="space-y-2">
                            {roulette.hotNumbers.map((num, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                                      num === 0 ? 'bg-green-600 text-white' :
                                      [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'bg-red-500 text-white' : 'bg-black text-white'
                                    }`}
                                  >
                                    {num}
                                  </span>
                                  <span className="font-medium">Número {num}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{Math.floor(Math.random() * 10) + 5} aparições</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Snowflake className="h-5 w-5 text-blue-500" />
                            Análise de Números Frios
                          </h4>
                          <div className="space-y-2">
                            {roulette.coldNumbers.map((num, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                                      num === 0 ? 'bg-green-600 text-white' :
                                      [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'bg-red-500 text-white' : 'bg-black text-white'
                                    }`}
                                  >
                                    {num}
                                  </span>
                                  <span className="font-medium">Número {num}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{Math.floor(Math.random() * 3) + 1} aparições</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="heatmap" className="mt-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Mapa de Calor das Roletas
                </CardTitle>
                <CardDescription>
                  Selecione uma roleta para visualizar o mapa de calor detalhado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Selecionar Roleta</Label>
                    <Select value={selectedRoulette || ""} onValueChange={(value) => {
                      setSelectedRoulette(value || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha uma roleta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {displayedRoulettes.map((roulette) => (
                          <SelectItem key={roulette.id} value={roulette.id}>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${
                                roulette.status === 'online' ? 'bg-green-500' : 
                                roulette.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              {roulette.name}
                              {roulette.isMonitored && <Badge variant="outline" className="ml-2 text-xs">Monitorada</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedRoulette && (
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          roulettes.find(r => r.id === selectedRoulette)?.status === 'online' ? 'bg-green-500' : 
                          roulettes.find(r => r.id === selectedRoulette)?.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <span className="font-medium">{roulettes.find(r => r.id === selectedRoulette)?.name}</span>
                      </div>
                      <Badge className={getStatusColor(roulettes.find(r => r.id === selectedRoulette)?.status || 'offline')}>
                        {getStatusText(roulettes.find(r => r.id === selectedRoulette)?.status || 'offline')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {roulettes.find(r => r.id === selectedRoulette)?.totalSpins} giros totais
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedRoulette ? (
              <RouletteHeatmap
                data={heatmapData}
                title={`Mapa de Calor - ${roulettes.find(r => r.id === selectedRoulette)?.name}`}
                description={`Frequência dos números baseada nos últimos ${lastXSpins} giros (filtro: ${timeFilter})`}
                showStats={true}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione uma roleta acima para visualizar o mapa de calor</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {displayedRoulettes.map((roulette) => (
                <Card key={roulette.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Análises - {roulette.name}
                    </CardTitle>
                    <CardDescription>
                      Padrões e tendências identificadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Distribuição por Cor */}
                      <div>
                        <h4 className="font-semibold mb-3">Distribuição por Cor</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 bg-red-500 rounded"></div>
                              <span>Vermelho</span>
                            </div>
                            <span className="font-medium">
                              {getFilteredNumbers(roulette.lastNumbers).filter(n => [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n)).length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 bg-black rounded"></div>
                              <span>Preto</span>
                            </div>
                            <span className="font-medium">
                              {getFilteredNumbers(roulette.lastNumbers).filter(n => ![1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36,0].includes(n)).length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 bg-green-600 rounded"></div>
                              <span>Zero</span>
                            </div>
                            <span className="font-medium">
                              {getFilteredNumbers(roulette.lastNumbers).filter(n => n === 0).length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Padrões Detectados */}
                      <div>
                        <h4 className="font-semibold mb-3">Padrões Detectados</h4>
                        <div className="space-y-2">
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                              <span className="font-medium text-sm">Sequência de Vermelhos</span>
                            </div>
                            <p className="text-xs text-muted-foreground">3 números vermelhos consecutivos detectados</p>
                          </div>
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                              <span className="font-medium text-sm">Números Vizinhos</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Números próximos na roda apareceram recentemente</p>
                          </div>
                        </div>
                      </div>

                      {/* Ações Recomendadas */}
                      <div>
                        <h4 className="font-semibold mb-3">Ações Recomendadas</h4>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <Bell className="h-4 w-4" />
                            Configurar Alerta para Padrão
                          </Button>
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <Download className="h-4 w-4" />
                            Exportar Análise Completa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Aba de Comparação */}
          <TabsContent value="comparison" className="mt-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Comparação de Roletas</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedForComparison([])
                    setCompareMode(false)
                  }}
                >
                  Limpar Seleção
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedForComparison.map(rouletteId => {
                  const roulette = roulettes.find((r: Roulette) => r.id === rouletteId)
                  if (!roulette) return null
                  
                  return (
                    <Card key={roulette.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="flex items-center gap-2">
                            {roulette.name}
                            <Badge className={getStatusColor(roulette.status)}>
                              {getStatusText(roulette.status)}
                            </Badge>
                          </CardTitle>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleComparison(roulette.id)}
                          >
                            ✕
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{roulette.lastNumbers[0]}</div>
                              <div className="text-sm text-muted-foreground">Último Número</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{roulette.totalSpins}</div>
                              <div className="text-sm text-muted-foreground">Total de Giros</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium mb-2">Últimos 10 Números</div>
                            <div className="flex flex-wrap gap-1">
                              {roulette.lastNumbers.slice(0, 10).map((num: number, idx: number) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="text-xs cursor-pointer transition-all duration-200"
                                  data-number={num}
                                  onMouseEnter={(e) => handleNumberMouseEnter(num, e)}
                                  onMouseLeave={handleNumberMouseLeave}
                                >
                                  {num}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium mb-2">Números Quentes</div>
                            <div className="flex flex-wrap gap-1">
                              {roulette.hotNumbers.map((num: number, idx: number) => (
                                <Badge 
                                  key={idx} 
                                  variant="destructive" 
                                  className="text-xs cursor-pointer transition-all duration-200"
                                  data-number={num}
                                  onMouseEnter={(e) => handleNumberMouseEnter(num, e)}
                                  onMouseLeave={handleNumberMouseLeave}
                                >
                                  {num}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium mb-2">Números Frios</div>
                            <div className="flex flex-wrap gap-1">
                              {roulette.coldNumbers.map((num: number, idx: number) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary" 
                                  className="text-xs cursor-pointer transition-all duration-200"
                                  data-number={num}
                                  onMouseEnter={(e) => handleNumberMouseEnter(num, e)}
                                  onMouseLeave={handleNumberMouseLeave}
                                >
                                  {num}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              
              {selectedForComparison.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Análise Comparativa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">Números em Comum (Quentes)</div>
                        <div className="flex flex-wrap gap-1 justify-center mt-2">
                          {/* Simulação de números quentes em comum */}
                          <Badge variant="destructive">7</Badge>
                          <Badge variant="destructive">23</Badge>
                          <Badge variant="destructive">31</Badge>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">Padrões Similares</div>
                        <div className="mt-2">
                          <Badge variant="outline">Sequências Pares</Badge>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">Divergências</div>
                        <div className="mt-2">
                          <Badge variant="secondary">Velocidade de Giro</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="mt-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <MetricsTab 
              roulettes={displayedRoulettes}
              performanceMetrics={performanceMetrics}
              spinVelocity={spinVelocity}
              trendAnalysis={trendAnalysis}
              realTimeAlerts={realTimeAlerts}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}