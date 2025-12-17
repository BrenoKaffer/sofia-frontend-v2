'use client';

import { memo } from 'react';
import { StatsCards } from './stats-cards';
import { useCurrentSession, useRecentStats, useActiveStrategies } from '@/lib/roulette-cache';
import { useMultipleIntelligentCache } from '@/hooks/use-intelligent-cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatsCardsCachedProps {
  className?: string;
}

/**
 * Componente wrapper que integra cache inteligente com StatsCards
 */
function StatsCardsCachedComponent({ className }: StatsCardsCachedProps) {
  // Usar múltiplas requisições com cache inteligente
  const {
    data,
    loading,
    error,
    refreshAll
  } = useMultipleIntelligentCache([
    {
      key: 'session',
      fetcher: async () => {
        // Simular dados da sessão atual
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          totalBets: 156,
          totalWins: 89,
          winRate: 57.1,
          profit: 2847.50,
          profitPercentage: 12.3,
          avgBetValue: 25.50,
          biggestWin: 450.00,
          currentStreak: 3,
          sessionsToday: 4,
          totalSessions: 127
        };
      },
      options: {
        ttl: 30000, // 30 segundos
        tags: ['session', 'stats'],
        refreshInterval: 15000,
        backgroundRefresh: true
      }
    },
    {
      key: 'performance',
      fetcher: async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return {
          dailyProfit: 1247.80,
          weeklyProfit: 5632.40,
          monthlyProfit: 18945.60,
          dailyChange: 8.7,
          weeklyChange: -2.1,
          monthlyChange: 15.4,
          bestDay: 2847.50,
          worstDay: -456.30,
          consistency: 78.5
        };
      },
      options: {
        ttl: 60000, // 1 minuto
        tags: ['performance', 'stats'],
        refreshInterval: 30000,
        backgroundRefresh: true
      }
    },
    {
      key: 'strategies',
      fetcher: async () => {
        await new Promise(resolve => setTimeout(resolve, 120));
        return {
          activeStrategies: 3,
          bestStrategy: 'Fibonacci Avançado',
          bestStrategyProfit: 1456.80,
          totalStrategies: 8,
          avgStrategyPerformance: 82.3,
          strategiesWinRate: 68.9
        };
      },
      options: {
        ttl: 120000, // 2 minutos
        tags: ['strategies', 'stats'],
        refreshInterval: 60000,
        backgroundRefresh: true
      }
    }
  ]);

  // Converter dados para o formato esperado pelo StatsCards (KpiData[])
  const convertedStats = [{
    strategy_id: 'general',
    total_signals_generated: data.session?.totalBets || 0,
    successful_signals: data.session?.totalWins || 0,
    failed_signals: (data.session?.totalBets || 0) - (data.session?.totalWins || 0),
    assertiveness_rate_percent: data.session?.winRate || 0,
    total_net_profit_loss: data.session?.profit || 0,
    last_updated: new Date().toISOString()
  }];

  // Loading skeleton
  if (loading && !data.session) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error && !data.session) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            Erro ao Carregar Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar as estatísticas. Verifique sua conexão.
          </p>
          <Button 
            onClick={() => refreshAll()} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Status bar para debug (opcional) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Cache: {Object.keys(data).filter(key => data[key]).length}/3 carregados
          </span>
          <Button 
            onClick={() => refreshAll()} 
            variant="ghost" 
            size="sm"
            disabled={loading}
            className="h-6 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      )}

      {/* Componente principal */}
      <StatsCards 
        kpisData={convertedStats}
        loading={loading}
      />
    </div>
  );
}

export const StatsCardsCached = memo(StatsCardsCachedComponent);

/**
 * Hook para controle manual do cache de estatísticas
 */
export function useStatsCacheControl() {
  const session = useCurrentSession();
  const stats = useRecentStats();
  const strategies = useActiveStrategies();

  return {
    refreshSession: session.refresh,
    refreshStats: stats.refresh,
    refreshStrategies: strategies.refresh,
    refreshAll: () => {
      session.refresh();
      stats.refresh();
      strategies.refresh();
    },
    invalidateAll: () => {
      session.invalidate();
      stats.invalidate();
      strategies.invalidate();
    },
    isLoading: session.loading || stats.loading || strategies.loading,
    hasError: session.error || stats.error || strategies.error
  };
}