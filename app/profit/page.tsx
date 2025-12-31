'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

// Dados mock para demonstração
const profitData = [
  { date: '01/01', profit: 150, sessions: 3, winRate: 65 },
  { date: '02/01', profit: -80, sessions: 2, winRate: 40 },
  { date: '03/01', profit: 220, sessions: 4, winRate: 75 },
  { date: '04/01', profit: 180, sessions: 3, winRate: 70 },
  { date: '05/01', profit: -120, sessions: 2, winRate: 30 },
  { date: '06/01', profit: 300, sessions: 5, winRate: 80 },
  { date: '07/01', profit: 250, sessions: 4, winRate: 72 },
];

const strategyProfits = [
  { name: 'As Dúzias (Atrasadas)', profit: 450, sessions: 12, winRate: 75, color: '#10b981' },
  { name: 'Irmãos de Cores', profit: 280, sessions: 8, winRate: 68, color: '#3b82f6' },
  { name: 'Terminais que se Puxam', profit: -150, sessions: 6, winRate: 45, color: '#ef4444' },
  { name: 'Fibonacci Avançado', profit: 320, sessions: 10, winRate: 70, color: '#8b5cf6' },
];

// Estado populado por API com fallback aos mocks
const ProfitPageStateInit = () => {
  const [profitDataState, setProfitDataState] = useState(profitData);
  const [strategyProfitsState, setStrategyProfitsState] = useState(strategyProfits);
  return { profitDataState, setProfitDataState, strategyProfitsState, setStrategyProfitsState };
};

const monthlyData = [
  { month: 'Jan', profit: 1200, goal: 1000 },
  { month: 'Fev', profit: 800, goal: 1000 },
  { month: 'Mar', profit: 1500, goal: 1000 },
  { month: 'Abr', profit: 900, goal: 1000 },
  { month: 'Mai', profit: 1800, goal: 1000 },
  { month: 'Jun', profit: 1100, goal: 1000 },
];

const recentSessions = [
  {
    id: 1,
    date: '07/01/2024',
    time: '14:30',
    strategy: 'As Dúzias (Atrasadas)',
    table: 'Evolution Immersive',
    duration: '45min',
    profit: 150,
    bets: 12,
    winRate: 75
  },
  {
    id: 2,
    date: '07/01/2024',
    time: '10:15',
    strategy: 'Irmãos de Cores',
    table: 'Pragmatic Brazilian',
    duration: '30min',
    profit: -80,
    bets: 8,
    winRate: 37
  },
  {
    id: 3,
    date: '06/01/2024',
    time: '20:45',
    strategy: 'Fibonacci Avançado',
    table: 'Evolution Lightning',
    duration: '60min',
    profit: 220,
    bets: 15,
    winRate: 80
  },
];

export default function ProfitPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const { profitDataState, setProfitDataState, strategyProfitsState, setStrategyProfitsState } = ProfitPageStateInit();

  useEffect(() => {
    const fetchKpis = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/kpis-estrategias');
        const raw = await res.json();
        const dataArray = Array.isArray(raw) ? raw : (raw?.data || []);

        interface StrategyKpi {
          name: string;
          profit: number;
          sessions: number;
          winRate: number;
          color: string;
        }

        const strategies: StrategyKpi[] = dataArray.map((item: any) => ({
          name: item.strategy_id || item.strategy_name || 'Estratégia Desconhecida',
          profit: Number(item.total_net_profit_loss ?? item.total_net_payout ?? 0) || 0,
          sessions: Number(item.total_signals_generated ?? item.total_activations ?? 0) || 0,
          winRate: Number(item.assertiveness_rate_percent ?? item.hit_rate ?? 0) || 0,
          color: '#10b981'
        }));
        setStrategyProfitsState(strategies.length ? strategies : strategyProfits);

        const seriesLength = Math.max(
          ...dataArray.map((item: any) => (Array.isArray(item.recentPerformance) ? item.recentPerformance.length : 0)),
          0
        ) || 7;
        const profitsPerDay = Array.from({ length: seriesLength }, (_, i) =>
          dataArray.reduce((sum: number, item: any) => {
            const v = Array.isArray(item.recentPerformance) ? item.recentPerformance[i] : 0;
            return sum + (typeof v === 'number' ? v : 0);
          }, 0)
        );
        const sessionsPerDay = strategies.reduce((acc: number, st: StrategyKpi) => acc + Math.max(1, Math.round(st.sessions / seriesLength)), 0);
        const avgWinRate = strategies.length
          ? Math.round(strategies.reduce((acc: number, st: StrategyKpi) => acc + st.winRate, 0) / strategies.length)
          : 0;
        const computed = profitsPerDay.map((p, idx) => ({
          date: `${String(idx + 1).padStart(2, '0')}/01`,
          profit: Number(p) || 0,
          sessions: sessionsPerDay,
          winRate: avgWinRate
        }));

        setProfitDataState(computed.length ? computed : profitData);
      } catch (e) {
        setStrategyProfitsState(strategyProfits);
        setProfitDataState(profitData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKpis();
  }, [selectedPeriod]);

  const totalProfit = profitDataState.reduce((sum, day) => sum + day.profit, 0);
  const totalSessions = profitDataState.reduce((sum, day) => sum + day.sessions, 0);
  const avgWinRate = profitDataState.reduce((sum, day) => sum + day.winRate, 0) / profitDataState.length;
  const profitPerSession = totalProfit / (totalSessions || 1);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simular carregamento
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Lucro</h1>
            <p className="text-muted-foreground">
              Acompanhe sua performance financeira e evolução
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="1y">1 ano</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalProfit >= 0 ? '+' : ''}{((totalProfit / 1000) * 100).toFixed(1)}% do bankroll inicial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Média de {(totalSessions / 7).toFixed(1)} por dia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgWinRate.toFixed(1)}%</div>
              <Progress value={avgWinRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro por Sessão</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profitPerSession >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {profitPerSession.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Média por sessão
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="strategies">Por Estratégia</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Gráfico de Lucro Diário */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Evolução do Lucro</CardTitle>
                  <CardDescription>
                    Acompanhe sua performance diária nos últimos 7 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={profitDataState}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          `R$ ${value}`, 
                          name === 'profit' ? 'Lucro' : name
                        ]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Lucro"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Estratégia</CardTitle>
                <CardDescription>
                  Compare o desempenho de cada estratégia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategyProfitsState.map((strategy, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{strategy.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {strategy.sessions} sessões • {strategy.winRate}% de acerto
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          strategy.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {strategy.profit >= 0 ? '+' : ''}R$ {strategy.profit}
                        </div>
                        <div className="flex items-center gap-1">
                          {strategy.profit >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sessões Recentes</CardTitle>
                <CardDescription>
                  Histórico detalhado das suas últimas sessões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Estratégia</TableHead>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Apostas</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{session.date}</div>
                            <div className="text-sm text-muted-foreground">{session.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{session.strategy}</Badge>
                        </TableCell>
                        <TableCell>{session.table}</TableCell>
                        <TableCell>{session.duration}</TableCell>
                        <TableCell>{session.bets}</TableCell>
                        <TableCell>
                          <Badge variant={session.winRate >= 60 ? 'default' : 'secondary'}>
                            {session.winRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            session.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {session.profit >= 0 ? '+' : ''}R$ {session.profit}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Metas Mensais</CardTitle>
                <CardDescription>
                  Acompanhe o progresso das suas metas de lucro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `R$ ${value}`, 
                        name === 'profit' ? 'Lucro' : 'Meta'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="goal" fill="#e5e7eb" name="Meta" />
                    <Bar dataKey="profit" fill="#10b981" name="Lucro" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Meta Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 1.000</div>
                  <Progress value={75} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    75% concluído
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Dias Restantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">
                    Para atingir a meta
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Lucro Necessário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">R$ 250</div>
                  <p className="text-xs text-muted-foreground">
                    R$ 31,25 por dia
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}