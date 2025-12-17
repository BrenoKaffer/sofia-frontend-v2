'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, Target, AlertTriangle, CheckCircle, Zap, BarChart3, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StrategyMetrics {
  strategy_id: string;
  strategy_name: string;
  table_id: string;
  success_rate: number;
  total_signals: number;
  successful_signals: number;
  failed_signals: number;
  net_profit: number;
  avg_confidence: number;
  last_signal_time: string;
  performance_trend: 'up' | 'down' | 'stable';
  risk_level: 'low' | 'medium' | 'high';
}

interface TableMetrics {
  table_id: string;
  table_name: string;
  active_strategies: number;
  total_spins: number;
  hot_numbers: number[];
  cold_numbers: number[];
  pattern_strength: number;
  volatility: number;
  last_spin: number;
  last_spin_time: string;
}

interface RealTimeData {
  timestamp: string;
  active_tables: number;
  total_signals_today: number;
  success_rate_today: number;
  profit_today: number;
  strategies_performance: StrategyMetrics[];
  tables_status: TableMetrics[];
  system_health: {
    cpu_usage: number;
    memory_usage: number;
    api_response_time: number;
    websocket_connections: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function RealTimeMetrics() {
  const [data, setData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/real-time-metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar métricas');
      }

      const metricsData = await response.json();
      setData(metricsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchMetrics, 5000); // Atualiza a cada 5 segundos
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchMetrics, autoRefresh]);

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar métricas: {error}</span>
          </div>
          <Button onClick={fetchMetrics} className="mt-4" variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const getPerformanceTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Métricas em Tempo Real</h2>
          <p className="text-gray-600">Última atualização: {new Date(data.timestamp).toLocaleTimeString()}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={toggleAutoRefresh}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesas Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active_tables}</div>
            <p className="text-xs text-muted-foreground">
              {data.tables_status.length} mesas monitoradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sinais Hoje</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_signals_today}</div>
            <p className="text-xs text-muted-foreground">
              Taxa de sucesso: {data.success_rate_today.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.profit_today >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.profit_today >= 0 ? '+' : ''}{data.profit_today.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Unidades de lucro/prejuízo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saúde do Sistema</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ótimo</div>
            <p className="text-xs text-muted-foreground">
              CPU: {data.system_health.cpu_usage}% | RAM: {data.system_health.memory_usage}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="strategies" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="strategies">Performance por Estratégia</TabsTrigger>
          <TabsTrigger value="tables">Status das Mesas</TabsTrigger>
          <TabsTrigger value="system">Saúde do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de estratégias */}
            <Card>
              <CardHeader>
                <CardTitle>Estratégias Ativas</CardTitle>
                <CardDescription>Performance em tempo real por estratégia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.strategies_performance.map((strategy) => (
                  <div key={strategy.strategy_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{strategy.strategy_name}</h4>
                        <p className="text-sm text-gray-600">Mesa: {strategy.table_id}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPerformanceTrendIcon(strategy.performance_trend)}
                        <Badge className={getRiskLevelColor(strategy.risk_level)}>
                          {strategy.risk_level.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Taxa de Sucesso:</span>
                        <div className="font-semibold">{strategy.success_rate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Lucro Líquido:</span>
                        <div className={`font-semibold ${strategy.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {strategy.net_profit >= 0 ? '+' : ''}{strategy.net_profit.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Sinais Totais:</span>
                        <div className="font-semibold">{strategy.total_signals}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Confiança Média:</span>
                        <div className="font-semibold">{strategy.avg_confidence.toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    <Progress 
                      value={strategy.success_rate} 
                      className="mt-3"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Gráfico de performance */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Performance</CardTitle>
                <CardDescription>Taxa de sucesso por estratégia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.strategies_performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="strategy_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="success_rate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.tables_status.map((table) => (
              <Card key={table.table_id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {table.table_name}
                    <Badge variant="outline">{table.active_strategies} estratégias</Badge>
                  </CardTitle>
                  <CardDescription>
                    Último giro: {table.last_spin} às {new Date(table.last_spin_time).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Total de Giros:</span>
                      <div className="text-lg font-semibold">{table.total_spins}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Volatilidade:</span>
                      <div className="text-lg font-semibold">{table.volatility.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Força do Padrão:</span>
                    <Progress value={table.pattern_strength * 100} className="mt-1" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Números Quentes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {table.hot_numbers.slice(0, 5).map((num) => (
                          <Badge key={num} variant="destructive" className="text-xs">
                            {num}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Números Frios:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {table.cold_numbers.slice(0, 5).map((num) => (
                          <Badge key={num} variant="secondary" className="text-xs">
                            {num}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recursos do Sistema</CardTitle>
                <CardDescription>Monitoramento em tempo real</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>CPU</span>
                    <span>{data.system_health.cpu_usage}%</span>
                  </div>
                  <Progress value={data.system_health.cpu_usage} className="mt-1" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Memória</span>
                    <span>{data.system_health.memory_usage}%</span>
                  </div>
                  <Progress value={data.system_health.memory_usage} className="mt-1" />
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Tempo de Resposta da API:</span>
                  <div className="text-lg font-semibold">{data.system_health.api_response_time}ms</div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Conexões WebSocket:</span>
                  <div className="text-lg font-semibold">{data.system_health.websocket_connections}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status de Conectividade</CardTitle>
                <CardDescription>Estado das conexões do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>API Principal</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WebSocket Server</span>
                    <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Banco de Dados</span>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sistema de ML</span>
                    <Badge className="bg-green-100 text-green-800">Processando</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RealTimeMetrics;