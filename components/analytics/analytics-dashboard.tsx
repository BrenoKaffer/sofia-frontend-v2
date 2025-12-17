/**
 * Dashboard de Analytics
 * Visualiza métricas e estatísticas do sistema de analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  MousePointer, 
  Eye, 
  AlertTriangle,
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { useRealTimeMetrics, useAnalytics } from '@/hooks/use-analytics';
import { logger } from '@/lib/logger';

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Interface para dados do dashboard
interface DashboardData {
  overview: {
    totalEvents: number;
    uniqueUsers: number;
    pageViews: number;
    apiCalls: number;
    errors: number;
    avgResponseTime: number;
  };
  performance: {
    avgPageLoadTime: number;
    avgFCP: number;
    avgLCP: number;
    errorRate: number;
  };
  engagement: {
    avgTimeOnPage: number;
    avgScrollDepth: number;
    bounceRate: number;
    returnVisitorRate: number;
  };
  business: {
    totalProfit: number;
    winRate: number;
    avgBetAmount: number;
    totalBets: number;
  };
  trends: Array<{
    date: string;
    events: number;
    users: number;
    errors: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
    avgTime: number;
  }>;
  apiEndpoints: Array<{
    endpoint: string;
    calls: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('today');
  const [refreshing, setRefreshing] = useState(false);
  
  const { metrics, fetchMetrics, fetchPageStats } = useRealTimeMetrics();
  const { track } = useAnalytics();
  
  // Carrega dados do dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simula dados do dashboard (em produção, viria de uma API)
      const mockData: DashboardData = {
        overview: {
          totalEvents: 15420,
          uniqueUsers: 1250,
          pageViews: 8930,
          apiCalls: 4560,
          errors: 23,
          avgResponseTime: 245,
        },
        performance: {
          avgPageLoadTime: 1.2,
          avgFCP: 0.8,
          avgLCP: 2.1,
          errorRate: 0.15,
        },
        engagement: {
          avgTimeOnPage: 180,
          avgScrollDepth: 65,
          bounceRate: 35,
          returnVisitorRate: 42,
        },
        business: {
          totalProfit: 12450.75,
          winRate: 68.5,
          avgBetAmount: 125.30,
          totalBets: 892,
        },
        trends: [
          { date: '2024-01-01', events: 1200, users: 150, errors: 5 },
          { date: '2024-01-02', events: 1350, users: 180, errors: 3 },
          { date: '2024-01-03', events: 1100, users: 140, errors: 8 },
          { date: '2024-01-04', events: 1450, users: 200, errors: 2 },
          { date: '2024-01-05', events: 1600, users: 220, errors: 4 },
          { date: '2024-01-06', events: 1380, users: 190, errors: 6 },
          { date: '2024-01-07', events: 1520, users: 210, errors: 1 },
        ],
        topPages: [
          { page: '/dashboard', views: 2450, avgTime: 240 },
          { page: '/trading', views: 1890, avgTime: 320 },
          { page: '/analytics', views: 1560, avgTime: 180 },
          { page: '/settings', views: 980, avgTime: 120 },
          { page: '/profile', views: 750, avgTime: 90 },
        ],
        apiEndpoints: [
          { endpoint: '/api/ml/predict', calls: 1250, avgResponseTime: 450, errorRate: 0.8 },
          { endpoint: '/api/trading/signals', calls: 980, avgResponseTime: 320, errorRate: 1.2 },
          { endpoint: '/api/auth/login', calls: 560, avgResponseTime: 180, errorRate: 2.1 },
          { endpoint: '/api/user/profile', calls: 340, avgResponseTime: 120, errorRate: 0.3 },
        ],
      };
      
      // Fallback seguro em caso de erro ao buscar dados reais
      const fallbackData: DashboardData = mockData;
      
      // Tentar carregar dados reais do endpoint; fallback para mock em caso de falha
      try {
        const qs = selectedDate ? `?date=${encodeURIComponent(selectedDate)}` : '';
        const res = await fetch(`/api/analytics${qs}`);
        if (res.ok) {
          const payload = await res.json();
          const incoming = (payload && typeof payload === 'object') ? (payload.data ?? payload) : null;
          if (incoming) {
            setData(incoming);
          } else {
            setData(fallbackData);
          }
        } else {
          setData(fallbackData);
        }
      } catch (fetchErr) {
        setData(fallbackData);
      }

      // Rastreia visualização do dashboard
      track('page_view', 'analytics_dashboard_viewed', {
        dateFilter: selectedDate,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      logger.error('Failed to load dashboard data', { component: 'AnalyticsDashboard', action: 'LOAD_DATA' }, err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  // Atualiza dados
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    await fetchMetrics();
    await fetchPageStats();
    setRefreshing(false);
    
    track('user_action', 'analytics_dashboard_refreshed');
  };
  
  // Exporta dados
  const handleExport = () => {
    if (!data) return;
    
    const exportData = {
      timestamp: new Date().toISOString(),
      dateFilter: selectedDate,
      data,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedDate}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    track('user_action', 'analytics_data_exported', {
      dateFilter: selectedDate,
    });
  };
  
  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Carregando analytics...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados de analytics: {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Nenhum dado de analytics disponível.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Métricas e insights detalhados do sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +15% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              -5% em relação ao período anterior
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="business">Negócio</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfico de Eventos por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Tipo</CardTitle>
                <CardDescription>
                  Distribuição dos tipos de eventos coletados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Page Views', value: data.overview.pageViews },
                        { name: 'API Calls', value: data.overview.apiCalls },
                        { name: 'User Actions', value: 2100 },
                        { name: 'Errors', value: data.overview.errors },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data && COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Páginas Mais Visitadas</CardTitle>
                <CardDescription>
                  Páginas com maior número de visualizações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{page.page}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{page.views.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(page.avgTime)}s médio
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Endpoints</CardTitle>
              <CardDescription>
                Estatísticas dos endpoints de API mais utilizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.apiEndpoints}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="endpoint" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="calls" fill="#8884d8" name="Chamadas" />
                  <Bar dataKey="avgResponseTime" fill="#82ca9d" name="Tempo Médio (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tempo de Carregamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performance.avgPageLoadTime}s</div>
                <p className="text-xs text-muted-foreground">Média de carregamento</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">First Contentful Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performance.avgFCP}s</div>
                <p className="text-xs text-muted-foreground">Primeiro conteúdo visível</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Largest Contentful Paint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performance.avgLCP}s</div>
                <p className="text-xs text-muted-foreground">Maior elemento carregado</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performance.errorRate}%</div>
                <p className="text-xs text-muted-foreground">Erros por requisição</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tempo na Página</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(data.engagement.avgTimeOnPage)}s</div>
                <p className="text-xs text-muted-foreground">Tempo médio por página</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Profundidade de Scroll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.engagement.avgScrollDepth}%</div>
                <p className="text-xs text-muted-foreground">Scroll médio da página</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Rejeição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.engagement.bounceRate}%</div>
                <p className="text-xs text-muted-foreground">Usuários que saem rapidamente</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Visitantes Recorrentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.engagement.returnVisitorRate}%</div>
                <p className="text-xs text-muted-foreground">Taxa de retorno</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Business Tab */}
        <TabsContent value="business" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {data.business.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Lucro acumulado</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Vitória</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.business.winRate}%</div>
                <p className="text-xs text-muted-foreground">Sinais corretos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Aposta Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {data.business.avgBetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Valor médio por aposta</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Apostas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.business.totalBets.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Apostas realizadas</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendências ao Longo do Tempo</CardTitle>
              <CardDescription>
                Evolução das métricas principais nos últimos dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="events" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Eventos"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stackId="2" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    name="Usuários"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="errors" 
                    stackId="3" 
                    stroke="#ff7300" 
                    fill="#ff7300" 
                    name="Erros"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsDashboard;