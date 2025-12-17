'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Timer, 
  Gauge, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  BarChart2,
  PieChart,
  LineChart
} from 'lucide-react';

interface MetricsTabProps {
  roulettes: any[];
  performanceMetrics: Record<string, any>;
  spinVelocity: Record<string, number>;
  trendAnalysis: Record<string, any>;
  realTimeAlerts: any[];
}

export function MetricsTab({ 
  roulettes, 
  performanceMetrics, 
  spinVelocity, 
  trendAnalysis, 
  realTimeAlerts 
}: MetricsTabProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getVelocityColor = (velocity: number) => {
    if (velocity >= 90) return 'text-green-600';
    if (velocity >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return 'bg-green-500';
    if (efficiency >= 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Alertas em Tempo Real */}
      {realTimeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {realTimeAlerts.map((alert) => {
                const roulette = roulettes.find(r => r.id === alert.rouletteId);
                return (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="font-medium">{roulette?.name}</div>
                        <div className="text-sm text-muted-foreground">{alert.message}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {alert.timestamp.toLocaleTimeString()}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Giros Totais Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(performanceMetrics).reduce((acc: number, metrics: any) => 
                acc + (metrics?.totalSpinsToday || 0), 0
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Todas as roletas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Jogadores Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(performanceMetrics).reduce((acc: number, metrics: any) => 
                acc + (metrics?.playerCount || 0), 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Conectados agora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                Object.values(performanceMetrics).reduce((acc: number, metrics: any) => 
                  acc + (metrics?.revenue || 0), 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Detalhadas por Roleta */}
      <div className="space-y-4">
        {roulettes.map((roulette) => {
          const metrics = performanceMetrics[roulette.id] || {};
          const velocity = spinVelocity[roulette.id] || 0;
          const trends = trendAnalysis[roulette.id] || {};

          return (
            <Card key={roulette.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{roulette.name}</CardTitle>
                  <Badge className={roulette.status === 'online' ? 'bg-green-500' : 'bg-red-500'}>
                    {roulette.status === 'online' ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Velocidade de Giros */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-medium">Velocidade</span>
                    </div>
                    <div className={`text-xl font-bold ${getVelocityColor(velocity)}`}>
                      {velocity.toFixed(0)} giros/h
                    </div>
                    <Progress value={Math.min(velocity, 100)} className="h-2" />
                  </div>

                  {/* Eficiência */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      <span className="text-sm font-medium">Eficiência</span>
                    </div>
                    <div className="text-xl font-bold">
                      {formatPercentage(metrics.efficiency || 0)}
                    </div>
                    <Progress 
                      value={metrics.efficiency || 0} 
                      className="h-2"
                    />
                  </div>

                  {/* Tempo Médio de Giro */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm font-medium">Tempo Médio</span>
                    </div>
                    <div className="text-xl font-bold">
                      {(metrics.avgSpinTime || 0).toFixed(0)}s
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Por giro
                    </div>
                  </div>

                  {/* Uptime */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm font-medium">Uptime</span>
                    </div>
                    <div className="text-xl font-bold">
                      {formatPercentage(metrics.uptime || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Últimas 24h
                    </div>
                  </div>
                </div>

                {/* Análise de Tendências */}
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    Análise de Tendências
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-500">
                        {trends.hotStreak || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Sequência Quente</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-500">
                        {trends.coldStreak || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Sequência Fria</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {formatPercentage(trends.volatility || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Volatilidade</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {formatPercentage(trends.predictability || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Previsibilidade</div>
                    </div>
                  </div>
                  
                  {trends.patternDetected && (
                    <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Padrão detectado</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Estatísticas Adicionais */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Giros Hoje:</span>
                      <span className="ml-2 font-medium">{(metrics.totalSpinsToday || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Jogadores:</span>
                      <span className="ml-2 font-medium">{metrics.playerCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Receita:</span>
                      <span className="ml-2 font-medium">{formatCurrency(metrics.revenue || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}