'use client';

import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  LineChart, 
  Search,
  Filter,
  FileText,
  Target,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingDown,
  Eye,
  Settings,
  Star,
  Pause,
  Play
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

const lineChartData = [
  { name: 'Seg', Fibonacci: 65, Martingale: 55, Dozens: 70 },
  { name: 'Ter', Fibonacci: 72, Martingale: 58, Dozens: 68 },
  { name: 'Qua', Fibonacci: 68, Martingale: 60, Dozens: 65 },
  { name: 'Qui', Fibonacci: 75, Martingale: 62, Dozens: 72 },
  { name: 'Sex', Fibonacci: 80, Martingale: 65, Dozens: 75 },
  { name: 'Sáb', Fibonacci: 78, Martingale: 68, Dozens: 78 },
  { name: 'Dom', Fibonacci: 82, Martingale: 70, Dozens: 80 },
];

const barChartData = [
  { name: 'Evolution', roi: 2.4 },
  { name: 'Pragmatic', roi: 1.8 },
  { name: 'Playtech', roi: 2.1 },
  { name: 'Authentic', roi: 1.5 },
  { name: 'Ezugi', roi: 1.9 },
];

const pieChartData = [
  { name: 'Fibonacci', value: 35 },
  { name: 'Martingale', value: 25 },
  { name: 'Dozens', value: 20 },
  { name: 'Colors', value: 15 },
  { name: 'Hot Numbers', value: 5 },
];

const CHART_COLORS = {
  primary: '#10B981',
  secondary: '#3B82F6', 
  tertiary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  muted: '#6B7280'
};

const COLORS = [CHART_COLORS.success, CHART_COLORS.secondary, CHART_COLORS.tertiary, CHART_COLORS.warning, CHART_COLORS.danger];

const rankingData = [
  { rank: 1, strategy: 'Fibonacci Reversal', accuracy: 78, signals: 145, roi: 2.4, profit: 1250, risk: 'Baixo' },
  { rank: 2, strategy: 'Hot Numbers', accuracy: 81, signals: 62, roi: 2.2, profit: 980, risk: 'Médio' },
  { rank: 3, strategy: 'Dozens Pattern', accuracy: 72, signals: 98, roi: 1.9, profit: 750, risk: 'Baixo' },
  { rank: 4, strategy: 'Color Sequence', accuracy: 68, signals: 175, roi: 1.7, profit: 650, risk: 'Alto' },
  { rank: 5, strategy: 'Martingale Pro', accuracy: 65, signals: 210, roi: 1.5, profit: 580, risk: 'Alto' },
];

const performanceData = [
  { period: 'Janeiro', profit: 2450, loss: -850, sessions: 45, winRate: 72 },
  { period: 'Fevereiro', profit: 3200, loss: -1200, sessions: 52, winRate: 75 },
  { period: 'Março', profit: 2800, loss: -950, sessions: 48, winRate: 68 },
  { period: 'Abril', profit: 3850, loss: -1100, sessions: 58, winRate: 78 },
  { period: 'Maio', profit: 4200, loss: -1350, sessions: 62, winRate: 76 },
  { period: 'Junho', profit: 3650, loss: -1050, sessions: 55, winRate: 74 },
];

const riskMetrics = {
  maxDrawdown: 15.2,
  currentDrawdown: 3.8,
  sharpeRatio: 1.85,
  volatility: 12.4,
  riskScore: 6.2,
  consecutiveLosses: 3,
  maxConsecutiveLosses: 7
};

const comparativeData = [
  { name: 'Fibonacci', accuracy: 78, roi: 2.4, profit: 1250, maxDrawdown: 12.5, sharpeRatio: 1.85, signals: 145, status: 'Ativa' },
  { name: 'Martingale', accuracy: 65, roi: 1.5, profit: 580, maxDrawdown: 18.2, sharpeRatio: 1.12, signals: 210, status: 'Ativa' },
  { name: 'Dozens', accuracy: 72, roi: 1.9, profit: 750, maxDrawdown: 10.8, sharpeRatio: 1.65, signals: 98, status: 'Ativa' },
  { name: 'Colors', accuracy: 68, roi: 1.7, profit: 650, maxDrawdown: 14.3, sharpeRatio: 1.35, signals: 175, status: 'Pausada' },
];

const detailedPerformance = [
  { period: 'Janeiro', profit: 2450, loss: 850, sessions: 45, winRate: 72 },
  { period: 'Fevereiro', profit: 3200, loss: 1200, sessions: 52, winRate: 75 },
  { period: 'Março', profit: 2800, loss: 950, sessions: 48, winRate: 68 },
  { period: 'Abril', profit: 3850, loss: 1100, sessions: 58, winRate: 78 },
];

export default function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState('week');
  const [strategyFilter, setStrategyFilter] = useState('all');
  const [rouletteFilter, setRouletteFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [isAdvancedReportOpen, setIsAdvancedReportOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(['accuracy', 'roi', 'profit']);
  const [favoriteStrategy, setFavoriteStrategy] = useState<string | null>(null);
  const [rankingStatuses, setRankingStatuses] = useState<Record<string, 'Ativa' | 'Pausada'>>(() => {
    return rankingData.reduce((acc, item) => {
      acc[item.strategy] = 'Ativa';
      return acc;
    }, {} as Record<string, 'Ativa' | 'Pausada'>);
  });
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    totalProfit: 0,
    totalLoss: 0,
    netProfit: 0,
    avgWinRate: '0.0'
  });

  const calculateRealTimeMetrics = () => {
    const totalProfit = performanceData.reduce((sum, item) => sum + item.profit, 0);
    const totalLoss = performanceData.reduce((sum, item) => sum + Math.abs(item.loss), 0);
    const netProfit = totalProfit - totalLoss;
    const avgWinRate = performanceData.reduce((sum, item) => sum + item.winRate, 0) / performanceData.length;
    
    return {
      totalProfit,
      totalLoss,
      netProfit,
      avgWinRate: avgWinRate.toFixed(1)
    };
  };

  useEffect(() => {
    setRealTimeMetrics(calculateRealTimeMetrics());
  }, []);

  const executiveSummary = useMemo(() => {
    const profitSum = comparativeData.reduce((acc, item) => acc + item.profit, 0)
    const top = comparativeData.reduce((best, item) => (item.profit > best.profit ? item : best), comparativeData[0])
    const topShare = profitSum ? top.profit / profitSum : 0
    const isConcentrated = topShare >= 0.5

    const netProfit = realTimeMetrics.netProfit
    const profitText =
      netProfit > 0 ? "Seu resultado está positivo" : netProfit < 0 ? "Seu resultado está negativo" : "Seu resultado está estável"

    if (netProfit > 0 && isConcentrated && top.maxDrawdown >= 15) {
      return `${profitText}, mas está concentrado em ${top.name}, que apresenta drawdown elevado (${top.maxDrawdown}%). Os blocos abaixo ajudam a entender o porquê e onde ajustar com mais segurança.`
    }

    if (riskMetrics.maxDrawdown >= 15) {
      return `${profitText}, mas o drawdown máximo segue alto (${riskMetrics.maxDrawdown}%). Os blocos abaixo ajudam a entender o porquê e onde ajustar com mais segurança.`
    }

    return `${profitText}, com risco sob controle para o período (drawdown máximo de ${riskMetrics.maxDrawdown}%). Os blocos abaixo ajudam a entender o porquê e onde ajustar com mais segurança.`
  }, [realTimeMetrics.netProfit]);

  const handleExport = async () => {
    setIsExporting(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const data = {
      period: dateFilter,
      strategy: strategyFilter,
      roulette: rouletteFilter,
      metrics: selectedMetrics,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-sofia-${dateFilter}-${Date.now()}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Relatórios e Análises</h1>
              <p className="text-muted-foreground mt-1">Decisões estratégicas baseadas em performance e risco</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExport}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <Select value={strategyFilter} onValueChange={setStrategyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estratégia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="fibonacci">Fibonacci</SelectItem>
                  <SelectItem value="martingale">Martingale</SelectItem>
                  <SelectItem value="dozens">Dozens</SelectItem>
                  <SelectItem value="colors">Colors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <Select value={rouletteFilter} onValueChange={setRouletteFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Roleta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="evolution">Evolution</SelectItem>
                  <SelectItem value="pragmatic">Pragmatic</SelectItem>
                  <SelectItem value="playtech">Playtech</SelectItem>
                  <SelectItem value="authentic">Authentic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumo Executivo
              </CardTitle>
              <CardDescription>Síntese do período para orientar a leitura</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{executiveSummary}</p>
            </CardContent>
          </Card>

          {showAdvancedFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Formato de Exportação</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Métricas Incluídas</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'accuracy', label: 'Assertividade' },
                      { id: 'roi', label: 'ROI' },
                      { id: 'profit', label: 'Lucro' },
                      { id: 'risk', label: 'Risco' },
                      { id: 'signals', label: 'Sinais' }
                    ].map((metric) => (
                      <Badge 
                        key={metric.id}
                        variant={selectedMetrics.includes(metric.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedMetrics(prev => 
                            prev.includes(metric.id) 
                              ? prev.filter(m => m !== metric.id)
                              : [...prev, metric.id]
                          );
                        }}
                      >
                        {metric.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ações Rápidas</Label>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsAdvancedReportOpen(true)}>
                      <FileText className="h-3 w-3" />
                      Relatório avançado
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Visualizar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Acerto</p>
                <p className="text-2xl font-bold text-green-600">78.5%</p>
                <p className="text-xs text-muted-foreground mt-1">+2.3% vs mês anterior</p>
              </div>
              <div className="text-right">
                <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                <Badge variant="secondary" className="text-xs">Excelente</Badge>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ROI Médio</p>
                <p className="text-2xl font-bold text-blue-600">12.3%</p>
                <p className="text-xs text-muted-foreground mt-1">Meta: 10%</p>
              </div>
              <div className="text-right">
                <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                <Badge variant="default" className="text-xs">Acima da Meta</Badge>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(realTimeMetrics.netProfit)}</p>
                <p className="text-xs text-muted-foreground mt-1">Últimos 30 dias</p>
              </div>
              <div className="text-right">
                <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                <Badge variant="default" className="text-xs">Positivo</Badge>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score de Risco</p>
                <p className="text-2xl font-bold text-orange-600">{riskMetrics.riskScore}/10</p>
                <p className="text-xs text-muted-foreground mt-1">Moderado</p>
              </div>
              <div className="text-right">
                <AlertTriangle className="h-8 w-8 text-orange-600 mb-2" />
                <Badge variant="outline" className="text-xs">Controlado</Badge>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Análise de Risco</h3>
            <Badge variant="outline">Tempo Real</Badge>
          </div>
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium cursor-help">Max Drawdown</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maior queda do pico ao vale no período.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-bold text-red-500">{riskMetrics.maxDrawdown}%</p>
                <Progress value={riskMetrics.maxDrawdown} className="mt-2 h-2" />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-5 w-5 text-blue-500 mr-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium cursor-help">Sharpe Ratio</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Quanto retorno você teve pelo risco que correu.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-bold text-blue-500">{riskMetrics.sharpeRatio}</p>
                <Badge variant={riskMetrics.sharpeRatio > 1 ? 'default' : 'secondary'} className="mt-2">
                  {riskMetrics.sharpeRatio > 1 ? 'Bom' : 'Regular'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5 text-yellow-500 mr-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium cursor-help">Volatilidade</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Oscilação média dos resultados no período.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-bold text-yellow-500">{riskMetrics.volatility}%</p>
                <Progress value={riskMetrics.volatility} className="mt-2 h-2" />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium cursor-help">Perdas Consecutivas</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sequência atual de perdas no período monitorado.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-bold text-orange-500">{riskMetrics.consecutiveLosses}</p>
                <Badge variant={riskMetrics.consecutiveLosses > 5 ? 'destructive' : 'secondary'} className="mt-2">
                  {riskMetrics.consecutiveLosses > 5 ? 'Alto' : 'Normal'}
                </Badge>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                  <span className="text-sm font-medium">Taxa de Vitória</span>
                </div>
                <p className="text-xl font-bold text-green-500">{realTimeMetrics.avgWinRate}%</p>
                <Progress value={parseFloat(realTimeMetrics.avgWinRate)} className="mt-2 h-2" />
              </div>
            </div>
          </TooltipProvider>
        </Card>

        <Tabs defaultValue="comparative">
          <TabsList className="mb-4">
            <TabsTrigger value="comparative">Análise Comparativa</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="insights">Insights e Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="comparative" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise Comparativa de Estratégias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <Label>Comparar Estratégias:</Label>
                    <div className="flex gap-2">
                      {comparativeData.map((strategy) => (
                        <Badge
                          key={strategy.name}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        >
                          {strategy.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <TooltipProvider>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Estratégia</TableHead>
                            <TableHead>Taxa de Acerto</TableHead>
                            <TableHead>ROI Médio</TableHead>
                            <TableHead>Lucro Total</TableHead>
                            <TableHead>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">Max Drawdown</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Maior queda do pico ao vale no período.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">Sharpe Ratio</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Quanto retorno você teve pelo risco que correu.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead>Sinais Gerados</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparativeData.map((strategy) => (
                            <TableRow key={strategy.name}>
                              <TableCell className="font-medium">{strategy.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className={strategy.accuracy > 70 ? 'text-green-600' : 'text-red-600'}>
                                    {strategy.accuracy}%
                                  </span>
                                  <Progress value={strategy.accuracy} className="w-16 h-2" />
                                </div>
                              </TableCell>
                              <TableCell className={strategy.roi > 0 ? 'text-green-600' : 'text-red-600'}>
                                {strategy.roi > 0 ? '+' : ''}
                                {strategy.roi}%
                              </TableCell>
                              <TableCell className={strategy.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                                R$ {strategy.profit.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-red-600">-{strategy.maxDrawdown}%</TableCell>
                              <TableCell className={strategy.sharpeRatio > 1 ? 'text-green-600' : 'text-orange-600'}>
                                {strategy.sharpeRatio}
                              </TableCell>
                              <TableCell>{strategy.signals}</TableCell>
                              <TableCell>
                                <Badge variant={strategy.status === 'Ativa' ? 'default' : 'secondary'}>{strategy.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TooltipProvider>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-4">Performance Comparativa (Últimos 30 dias)</h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.3} />
                          <XAxis dataKey="name" stroke={CHART_COLORS.muted} fontSize={12} />
                          <YAxis stroke={CHART_COLORS.muted} fontSize={12} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="Fibonacci" stroke={CHART_COLORS.success} strokeWidth={3} activeDot={{ r: 6, fill: CHART_COLORS.success }} />
                          <Line type="monotone" dataKey="Martingale" stroke={CHART_COLORS.secondary} strokeWidth={3} activeDot={{ r: 6, fill: CHART_COLORS.secondary }} />
                          <Line type="monotone" dataKey="Dozens" stroke={CHART_COLORS.tertiary} strokeWidth={3} activeDot={{ r: 6, fill: CHART_COLORS.tertiary }} />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" className="gap-2" onClick={() => setIsAdvancedReportOpen(true)}>
                      <FileText className="h-4 w-4" />
                      Explorar cenários
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            <TabsContent value="ranking" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Estratégias</CardTitle>
                <CardDescription>
                  Classificação das estratégias por desempenho geral
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Estratégia</TableHead>
                      <TableHead className="text-right">Assertividade</TableHead>
                      <TableHead className="text-right">Padrões</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankingData.map((item) => (
                      <TableRow key={item.rank}>
                        <TableCell>
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {item.rank}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{item.strategy}</span>
                            {favoriteStrategy === item.strategy ? <Badge variant="secondary">Fixada</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.accuracy}%</TableCell>
                        <TableCell className="text-right">{item.signals}</TableCell>
                        <TableCell className="text-right">{item.roi}x</TableCell>
                        <TableCell>
                          <Badge variant={rankingStatuses[item.strategy] === 'Ativa' ? 'default' : 'secondary'}>
                            {rankingStatuses[item.strategy]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setFavoriteStrategy((prev) => (prev === item.strategy ? null : item.strategy))}
                              aria-label="Fixar estratégia"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setRankingStatuses((prev) => ({
                                  ...prev,
                                  [item.strategy]: prev[item.strategy] === 'Ativa' ? 'Pausada' : 'Ativa'
                                }));
                              }}
                              aria-label="Ativar ou pausar estratégia"
                            >
                              {rankingStatuses[item.strategy] === 'Ativa' ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Ver detalhes">
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" className="gap-2">
                  <LineChart className="h-4 w-4" />
                  Ver Detalhes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Insights e Alertas
                </CardTitle>
                <CardDescription>Leituras estratégicas baseadas nos dados atuais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sugestão baseada nos dados:</strong> considerar aumentar a exposição em Fibonacci em até +10% e manter Dozens ativa.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sugestão baseada nos dados:</strong> considerar pausar Martingale por 24h ou reduzir stake até o drawdown voltar a um patamar mais seguro.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sugestão baseada nos dados:</strong> considerar aumentar a frequência de sinais na roleta Evolution, mantendo limite de risco.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
          Use{" "}
          <a href="/daily-goals" className="font-medium text-foreground underline underline-offset-4">
            Metas Diárias
          </a>{" "}
          para executar melhor. Use{" "}
          <a href="/bankroll" className="font-medium text-foreground underline underline-offset-4">
            Gestão de Banca
          </a>{" "}
          para proteger o capital.
        </div>

        <Dialog open={isAdvancedReportOpen} onOpenChange={setIsAdvancedReportOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Relatório avançado</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="accuracy">
              <TabsList className="mb-4">
                <TabsTrigger value="accuracy">Assertividade</TabsTrigger>
                <TabsTrigger value="roi">ROI por Roleta</TabsTrigger>
                <TabsTrigger value="distribution">Distribuição</TabsTrigger>
                <TabsTrigger value="performance">Performance Detalhada</TabsTrigger>
              </TabsList>

              <TabsContent value="accuracy" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução da Assertividade por Estratégia</CardTitle>
                    <CardDescription>Porcentagem de acerto ao longo do tempo para as principais estratégias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[360px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={lineChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.3} />
                          <XAxis dataKey="name" stroke={CHART_COLORS.muted} fontSize={12} />
                          <YAxis stroke={CHART_COLORS.muted} fontSize={12} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="Fibonacci" stroke={CHART_COLORS.success} strokeWidth={3} activeDot={{ r: 6, fill: CHART_COLORS.success }} />
                          <Line type="monotone" dataKey="Martingale" stroke={CHART_COLORS.secondary} strokeWidth={3} activeDot={{ r: 6, fill: CHART_COLORS.secondary }} />
                          <Line type="monotone" dataKey="Dozens" stroke={CHART_COLORS.tertiary} strokeWidth={3} activeDot={{ r: 6, fill: CHART_COLORS.tertiary }} />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="roi" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>ROI por Roleta</CardTitle>
                    <CardDescription>Retorno sobre investimento para cada roleta monitorada</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[360px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} opacity={0.3} />
                          <XAxis dataKey="name" stroke={CHART_COLORS.muted} fontSize={12} />
                          <YAxis stroke={CHART_COLORS.muted} fontSize={12} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Legend />
                          <Bar dataKey="roi" fill={CHART_COLORS.primary} name="ROI" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="distribution" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição</CardTitle>
                    <CardDescription>Visão complementar, útil para análise avançada</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[360px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={140}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="mt-0">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Performance detalhada por período
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {detailedPerformance.map((period) => (
                          <Card key={period.period} className="p-4">
                            <div className="text-center">
                              <h4 className="font-semibold text-lg mb-2">{period.period}</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Lucro:</span>
                                  <span className="text-green-600 font-medium">R$ {period.profit.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Perda:</span>
                                  <span className="text-red-600 font-medium">R$ {period.loss.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Sessões:</span>
                                  <span className="font-medium">{period.sessions}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Taxa vitória:</span>
                                  <span className="font-medium">{period.winRate}%</span>
                                </div>
                              </div>
                              <Progress value={period.winRate} className="mt-3 h-2" />
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Métricas avançadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <h4 className="font-semibold mb-4">Distribuição de resultados</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Vitórias grandes (&gt;5x):</span>
                              <Badge variant="default">12%</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Vitórias médias (2-5x):</span>
                              <Badge variant="secondary">45%</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Vitórias pequenas (&lt;2x):</span>
                              <Badge variant="outline">21%</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Perdas:</span>
                              <Badge variant="destructive">22%</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <h4 className="font-semibold mb-4">Tempo de sessão</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Média por sessão:</span>
                              <span className="font-medium">2h 15min</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sessão mais longa:</span>
                              <span className="font-medium">4h 30min</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Melhor horário:</span>
                              <span className="font-medium">14h-18h</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total este mês:</span>
                              <span className="font-medium">67h 45min</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <h4 className="font-semibold mb-4">Eficiência</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Sinais por hora:</span>
                              <span className="font-medium">8.5</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Precisão de entrada:</span>
                              <span className="font-medium">94.2%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tempo médio de análise:</span>
                              <span className="font-medium">45s</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Score de disciplina:</span>
                              <Badge variant="default">Excelente</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
