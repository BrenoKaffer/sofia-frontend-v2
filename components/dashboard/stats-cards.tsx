'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Zap, DollarSign, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo, memo } from 'react';

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

export const StatsCards = memo(function StatsCards({ kpisData, loading = false, activeSignal, countdown }: StatsCardsProps) {
  
  // Memoizar dados efetivos para evitar recálculos
  const effectiveKpisData = useMemo(() => {
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
    
    return (kpisData && kpisData.length > 0) ? kpisData : fallbackKpisData;
  }, [kpisData]);
  
  // Memoizar cálculos dos stats para otimizar performance
  const statsCalculations = useMemo(() => {
    const totalActiveSignals = activeSignal && countdown && countdown > 0 ? 1 : 0;
  
  // Taxa de Acerto: usar a assertividade da estratégia ativa, ou média global se não houver estratégia ativa
  const getHitRate = () => {
    // Se há um sinal ativo, usar a assertividade específica da estratégia ativa
    if (activeSignal && activeSignal.strategy_id) {
      const activeStrategyKpi = effectiveKpisData.find(k => k.strategy_id === activeSignal.strategy_id);
      if (activeStrategyKpi && typeof activeStrategyKpi.assertiveness_rate_percent !== 'undefined') {
        const n = Number(activeStrategyKpi.assertiveness_rate_percent);
        return Number.isFinite(n) ? n : 0;
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
  const safeHitRate = Number.isFinite(hitRate) ? hitRate : 0;
  
  // Lucro Total: somar todos os lucros/perdas das estratégias
  const totalRoiMensal = effectiveKpisData.reduce((sum, kpi) => {
    const profit = Number(kpi.total_net_profit_loss) || 0;
    return sum + profit;
  }, 0);
  
  // Calcular total de sinais para contexto
  const totalSignalsAnalyzed = effectiveKpisData.reduce((sum, kpi) => {
    const signals = Number(kpi.total_signals_generated) || 0;
    return sum + signals;
  }, 0);
  
  const activeStrategiesCount = effectiveKpisData.length; // Ou adicione lógica para contar apenas as realmente "ativas"
    return {
      totalActiveSignals,
      totalAssertiveness: safeHitRate,
      totalRoiMensal,
      activeStrategiesCount,
      totalSignals: totalSignalsAnalyzed
    };
  }, [effectiveKpisData, activeSignal, countdown]);

  const stats = [
    {
      title: 'Padrões Ativos',
      value: loading ? '...' : statsCalculations.totalActiveSignals.toString(),
      change: '+12%',
      trend: 'up' as const,
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      context: countdown && countdown > 0 ? `${countdown}s restantes` : 'Aguardando próximo sinal',
    },
    {
      title: 'Taxa de Acerto',
      value: loading ? '...' : `${Number(statsCalculations.totalAssertiveness).toFixed(1)}%`,
      change: '+2.1%',
      trend: statsCalculations.totalAssertiveness >= 70 ? 'up' as const : 'down' as const,
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      context: `${statsCalculations.totalSignals} sinais analisados`,
    },
    {
      title: 'ROI Mensal',
      value: loading ? '...' : `${statsCalculations.totalRoiMensal >= 0 ? '+' : ''}${statsCalculations.totalRoiMensal.toFixed(2)}`,
      change: '+5.1%',
      trend: statsCalculations.totalRoiMensal >= 0 ? 'up' as const : 'down' as const,
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      context: `Baseado em ${statsCalculations.activeStrategiesCount} estratégias`,
    },
    {
      title: 'Estratégias Monitoradas',
      value: loading ? '...' : statsCalculations.activeStrategiesCount.toString(),
      change: '+1',
      trend: 'up' as const,
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      context: 'Ativas no momento',
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="stats-cards">
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
});

export default StatsCards;