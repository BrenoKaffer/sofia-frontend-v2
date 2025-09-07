'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Zap, DollarSign, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

// Tipagem para os dados de KPI reais
interface KpiData {
  strategy_id: string;
  total_signals_generated: number;
  successful_signals: number;
  failed_signals: number;
  assertiveness_rate_percent: number;
  total_net_profit_loss: number;
  last_updated: string;
}

interface StatsCardsProps {
  kpisData: KpiData[]; // Recebe os dados de KPI como prop
  loading?: boolean;
}

export function StatsCards({ kpisData, loading = false }: StatsCardsProps) {
  // Lógica para calcular os valores dos cartões a partir dos kpisData
  const totalActiveSignals = kpisData.reduce((sum, kpi) => sum + kpi.total_signals_generated, 0);
  const globalAssertiveness = kpisData.length > 0 ? 
    (kpisData.reduce((sum, kpi) => sum + (kpi.assertiveness_rate_percent * kpi.total_signals_generated), 0) / 
    kpisData.reduce((sum, kpi) => sum + kpi.total_signals_generated, 0)) : 0;
  
  const totalRoiMensal = kpisData.reduce((sum, kpi) => sum + kpi.total_net_profit_loss, 0);
  const activeStrategiesCount = kpisData.length; // Ou adicione lógica para contar apenas as realmente "ativas"
  const stats = [
    {
      title: 'Padrões Ativos',
      value: loading ? '...' : totalActiveSignals.toString(),
      change: '+2.5%', // Pode vir de uma comparação histórica no backend
      trend: 'up',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Taxa de Acerto',
      value: loading ? '...' : `${globalAssertiveness.toFixed(1)}%`,
      change: '+1.2%', // Pode vir de uma comparação histórica no backend
      trend: 'up',
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Lucro Total (R$)',
      value: loading ? '...' : `${totalRoiMensal >= 0 ? '+' : ''}${totalRoiMensal.toFixed(2)}`,
      change: '+5.1%', // Pode vir de uma comparação histórica no backend
      trend: totalRoiMensal >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Estratégias Monitoradas',
      value: loading ? '...' : activeStrategiesCount.toString(),
      change: '+1', // Pode vir de uma comparação histórica no backend
      trend: 'up',
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-card/50 backdrop-blur-sm border border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-urbanist">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-jakarta">{stat.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1 font-jakarta">
                    {stat.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                      {stat.change}
                    </span>
                    <span className="ml-1">vs. semana anterior</span>
                  </div>
                </div>
              </div>
            </CardContent>
            
            {/* Gradient overlay */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-12 translate-x-12" />
          </Card>
        </motion.div>
      ))}
    </div>
  );
}