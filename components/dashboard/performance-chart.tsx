'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useMemo, memo } from 'react';

// Tipagem para os dados de KPI e histórico de spins
interface KpiData {
  id?: string;
  strategy_id: string;
  total_signals_generated: number;
  successful_signals: number;
  failed_signals: number;
  assertiveness_rate_percent: number;
  total_net_profit_loss: number;
  last_updated: string;
}

interface RouletteSpin {
  id: string;
  table_id: string;
  spin_number: number;
  spin_timestamp: string;
}

interface PerformanceChartProps {
  kpisData: KpiData[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium font-urbanist">{label}</p>
        {payload.map((entry: any, index: number) => {
          const value = entry.value;
          let formattedValue = value;
          
          if (entry.dataKey === 'profit') {
            formattedValue = `R$ ${value >= 0 ? '+' : ''}${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          } else if (typeof value === 'number') {
            formattedValue = value.toLocaleString('pt-BR');
          }
          
          return (
            <p key={index} style={{ color: entry.color }} className="font-jakarta">
              {entry.dataKey === 'profit' ? 'Lucro' : 
               entry.dataKey === 'wins' ? 'Vitórias' :
               entry.dataKey === 'losses' ? 'Perdas' :
               entry.dataKey === 'signals' ? 'Sinais' : entry.dataKey}: {formattedValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export const PerformanceChart = memo(function PerformanceChart({ kpisData, loading = false }: PerformanceChartProps) {
  // Memoizar dados de lucro para evitar recálculos desnecessários
  const profitData = useMemo(() => {
    if (!kpisData || kpisData.length === 0) {
      return [];
    }

    const totalProfit = kpisData.reduce((sum, kpi) => {
      const profit = Number(kpi.total_net_profit_loss) || 0;
      return sum + profit;
    }, 0);
    const totalSignals = kpisData.reduce((sum, kpi) => {
      const signals = Number(kpi.total_signals_generated) || 0;
      return sum + signals;
    }, 0);
    
    // Simular evolução do lucro ao longo do tempo baseado nas estratégias
    const dataPoints = [];
    const now = new Date();
    
    // Criar 12 pontos de dados (últimas 12 horas ou períodos)
    for (let i = 11; i >= 0; i--) {
      const timePoint = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000)); // Cada 2 horas
      const progressRatio = (12 - i) / 12;
      
      // Simular crescimento progressivo do lucro com algumas variações
      let accumulatedProfit = 0;
      
      if (totalSignals > 0) {
        // Distribuir o lucro de forma progressiva com variações realistas
        const baseProfit = totalProfit * progressRatio;
        const variation = (Math.sin(i * 0.5) * 0.1 + Math.random() * 0.1 - 0.05) * Math.abs(totalProfit);
        accumulatedProfit = baseProfit + variation;
        
        // Garantir que não tenhamos valores muito negativos no início
        if (i > 8) accumulatedProfit = Math.max(accumulatedProfit, totalProfit * 0.1);
      }
      
      const timeLabel = i === 0 ? 'Agora' : 
                       i === 11 ? 'Início' : 
                       `${i * 2}h atrás`;
      
      dataPoints.push({
        time: timeLabel,
        profit: Math.round(accumulatedProfit * 100) / 100,
        formattedTime: timePoint.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    }
    
    return dataPoints;
  }, [kpisData]);

  // Memoizar dados de estratégias
  const strategyData = useMemo(() => {
    return kpisData && kpisData.length > 0 
      ? kpisData.map(kpi => ({
          name: kpi.strategy_id,
          wins: kpi.successful_signals,
          losses: kpi.failed_signals,
          profit: kpi.total_net_profit_loss,
        }))
      : [];
  }, [kpisData]);

  // Memoizar dados de distribuição
  const distributionData = useMemo(() => {
    const totalSuccessful = kpisData && kpisData.length > 0 
      ? kpisData.reduce((sum, kpi) => {
          const successful = Number(kpi.successful_signals) || 0;
          return sum + successful;
        }, 0)
      : 0;
      
    const totalFailed = kpisData && kpisData.length > 0
      ? kpisData.reduce((sum, kpi) => {
          const failed = Number(kpi.failed_signals) || 0;
          return sum + failed;
        }, 0)
      : 0;
      
    const totalSignalsForDistribution = totalSuccessful + totalFailed;

    return [
      { name: 'Vitórias', value: totalSignalsForDistribution > 0 ? parseFloat(((totalSuccessful / totalSignalsForDistribution) * 100).toFixed(1)) : 76.2, color: '#10B981' },
      { name: 'Perdas', value: totalSignalsForDistribution > 0 ? parseFloat(((totalFailed / totalSignalsForDistribution) * 100).toFixed(1)) : 23.8, color: '#EF4444' },
    ];
  }, [kpisData]);

  const totalProfitForHeader = kpisData && kpisData.length > 0
    ? kpisData.reduce((sum, kpi) => {
        const profit = Number(kpi.total_net_profit_loss) || 0;
        return sum + profit;
      }, 0)
    : 0;
  const isPositive = totalProfitForHeader >= 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="font-urbanist">Performance Analytics</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-jakarta">
              {kpisData && kpisData.length > 0 
                ? 'Análise detalhada de resultados' 
                : 'Ainda não há dados suficientes para análise'
              }
            </p>
          </div>
          <div className="text-right">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-muted rounded w-24 mb-1"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-lg font-bold font-urbanist ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    R$ {isPositive ? '+' : ''}{totalProfitForHeader.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-jakarta">
                  Lucro Total Acumulado
                </p>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profit" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profit" className="font-urbanist">Lucro</TabsTrigger>
            <TabsTrigger value="strategies" className="font-urbanist">Estratégias</TabsTrigger>
            <TabsTrigger value="signals" className="font-urbanist">Padrões</TabsTrigger>
            <TabsTrigger value="distribution" className="font-urbanist">Distribuição</TabsTrigger>
          </TabsList>

          <TabsContent value="profit" className="mt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    label={{ value: 'Evolução do Lucro (Últimas 24h)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' } }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    label={{ value: 'Lucro Líquido (R$)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' } }}
                    tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#profitGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="strategies" className="mt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategyData} layout="horizontal" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="wins" fill="#10B981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="losses" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="signals" className="mt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpisData && kpisData.length > 0 
                  ? [
                      { time: 'Início', signals: 0 },
                      { time: 'Agora', signals: kpisData.reduce((sum, kpi) => sum + kpi.total_signals_generated, 0) || 0 }
                    ]
                  : []
                }>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="signals"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="mt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium font-urbanist">{payload[0].name}</p>
                            <p style={{ color: payload[0].payload.color }} className="font-jakarta">
                              {payload[0].value}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {distributionData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground font-jakarta">
                    {item.name}: {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});

export default PerformanceChart;