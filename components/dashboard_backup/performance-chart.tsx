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

// Tipagem para os dados de KPI e histórico de spins
interface KpiData {
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
  rouletteHistoryData: RouletteSpin[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium font-urbanist">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-jakarta">
            {entry.dataKey}: {entry.value}
            {entry.dataKey === 'profit' && '$'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PerformanceChart({ kpisData, rouletteHistoryData }: PerformanceChartProps) {
  // Dados para o gráfico de Lucro (Exemplo: agregação de lucro por hora ou dia)
  // Isso exigiria uma lógica de agregação mais complexa ou uma VIEW no Supabase
  // Para MVP, podemos simular um histórico de lucro a partir de kpisData ou manter um mock básico.
  // Para fins de demonstração, vamos usar um mock com o lucro total:
  const profitData = [
    { time: 'Início', profit: 0 },
    { time: 'Agora', profit: kpisData.reduce((sum, kpi) => sum + kpi.total_net_profit_loss, 0) || 0 },
  ];
  // Uma abordagem melhor seria agrupar `strategy_activations` por dia/hora para um gráfico de linha.
  // Por enquanto, mantenha o mock se não tiver um endpoint granular para isso.

  // Dados para o gráfico de Estratégias (vitórias/derrotas por estratégia)
  const strategyData = kpisData.map(kpi => ({
    name: kpi.strategy_id,
    wins: kpi.successful_signals,
    losses: kpi.failed_signals,
    profit: kpi.total_net_profit_loss,
  }));

  // Dados para o gráfico de Distribuição (Vitórias/Perdas Globais)
  const totalSuccessful = kpisData.reduce((sum, kpi) => sum + kpi.successful_signals, 0);
  const totalFailed = kpisData.reduce((sum, kpi) => sum + kpi.failed_signals, 0);
  const totalSignals = totalSuccessful + totalFailed;

  const distributionData = [
    { name: 'Vitórias', value: totalSignals > 0 ? parseFloat(((totalSuccessful / totalSignals) * 100).toFixed(1)) : 0, color: '#10B981' },
    { name: 'Perdas', value: totalSignals > 0 ? parseFloat(((totalFailed / totalSignals) * 100).toFixed(1)) : 0, color: '#EF4444' },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-urbanist">Performance Analytics</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-jakarta">
              Análise detalhada de resultados
            </p>
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
                <AreaChart data={profitData}>
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
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
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
                <BarChart data={strategyData} layout="horizontal">
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
                <LineChart data={[
                  { time: 'Início', signals: 0 },
                  { time: 'Agora', signals: kpisData.reduce((sum, kpi) => sum + kpi.total_signals_generated, 0) || 0 }
                ]}>
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
}