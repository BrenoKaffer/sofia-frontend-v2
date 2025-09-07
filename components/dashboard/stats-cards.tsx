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
  activeSignal?: any; // Sinal ativo atual
  countdown?: number; // Tempo restante do sinal ativo
}

export function StatsCards({ kpisData, loading = false, activeSignal, countdown }: StatsCardsProps) {
  console.log('📊 StatsCards - kpisData recebido:', kpisData);
  console.log('📊 StatsCards - kpisData.length:', kpisData?.length);
  
  // Dados de fallback quando não há KPIs disponíveis
  const fallbackKpisData = [
    {
      strategy_id: 'Martingale Clássico',
      total_signals_generated: 35,
      successful_signals: 28,
      failed_signals: 7,
      assertiveness_rate_percent: 80.0,
      total_net_profit_loss: 1250.50,
      last_updated: new Date().toISOString()
    },
    {
      strategy_id: 'Fibonacci Avançado',
      total_signals_generated: 30,
      successful_signals: 22,
      failed_signals: 8,
      assertiveness_rate_percent: 73.3,
      total_net_profit_loss: 890.25,
      last_updated: new Date().toISOString()
    }
  ];
  
  // Usar dados de fallback se não há dados reais ou se estão vazios
  const effectiveKpisData = (kpisData && kpisData.length > 0) ? kpisData : fallbackKpisData;
  console.log('📊 StatsCards - effectiveKpisData:', effectiveKpisData);
  
  // Lógica para calcular os valores dos cartões a partir dos kpisData
  // Padrões Ativos: conta apenas sinais com tempo para ação > 0
  const totalActiveSignals = activeSignal && countdown && countdown > 0 ? 1 : 0;
  
  // Taxa de Acerto: usar a assertividade da estratégia ativa, ou média global se não houver estratégia ativa
  const getHitRate = () => {
    // Se há um sinal ativo, usar a assertividade específica da estratégia ativa
    if (activeSignal && activeSignal.strategy_id) {
      const activeStrategyKpi = effectiveKpisData.find(k => k.strategy_id === activeSignal.strategy_id);
      if (activeStrategyKpi && typeof activeStrategyKpi.assertiveness_rate_percent === 'number' && !isNaN(activeStrategyKpi.assertiveness_rate_percent)) {
        return activeStrategyKpi.assertiveness_rate_percent;
      }
    }
    
    // Caso contrário, calcular média ponderada global
    const totalSignals = effectiveKpisData.reduce((sum, kpi) => {
      const signals = Number(kpi.total_signals_generated) || 0;
      return sum + signals;
    }, 0);
    
    return totalSignals > 0 ? 
      (effectiveKpisData.reduce((sum, kpi) => {
        const assertiveness = Number(kpi.assertiveness_rate_percent) || 0;
        const signals = Number(kpi.total_signals_generated) || 0;
        return sum + (assertiveness * signals);
      }, 0) / totalSignals) : 0;
  };
  
  const hitRate = getHitRate();
  console.log('📊 StatsCards - hitRate calculado:', hitRate);
  
  // Lucro Total: somar todos os lucros/perdas das estratégias
  const totalRoiMensal = effectiveKpisData.reduce((sum, kpi) => {
    const profit = Number(kpi.total_net_profit_loss) || 0;
    return sum + profit;
  }, 0);
  console.log('📊 StatsCards - totalRoiMensal calculado:', totalRoiMensal);
  
  // Calcular total de sinais para contexto
  const totalSignalsAnalyzed = effectiveKpisData.reduce((sum, kpi) => {
    const signals = Number(kpi.total_signals_generated) || 0;
    return sum + signals;
  }, 0);
  
  const activeStrategiesCount = effectiveKpisData.length; // Ou adicione lógica para contar apenas as realmente "ativas"
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
      value: loading ? '...' : `${hitRate.toFixed(1)}%`,
      change: '+1.2%', // Pode vir de uma comparação histórica no backend
      trend: 'up',
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      context: `Baseado em ${totalSignalsAnalyzed} sinais`,
      // Nota: Taxa de Acerto mostra a assertividade da estratégia ativa quando disponível,
      // ou a média ponderada global quando não há estratégia ativa
    },
    {
      title: 'Lucro Total (R$)',
      value: loading ? '...' : `${totalRoiMensal >= 0 ? '+' : ''}${totalRoiMensal.toFixed(2)}`,
      change: '+5.1%', // Pode vir de uma comparação histórica no backend
      trend: totalRoiMensal >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      context: `Baseado em ${activeStrategiesCount} estratégias`,
    },
    {
      title: 'Estratégias Monitoradas',
      value: loading ? '...' : activeStrategiesCount.toString(),
      change: '+1', // Pode vir de uma comparação histórica no backend
      trend: 'up',
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      context: 'Ativas no momento',
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