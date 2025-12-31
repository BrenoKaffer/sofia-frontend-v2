'use client';

import { memo } from 'react';
import { LiveSignals } from './live-signals';
import { useLiveSignals, rouletteCacheUtils } from '@/lib/roulette-cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface LiveSignalsCachedProps {
  onGoToTable?: (signal: any) => void;
  activeSignal?: any;
}

/**
 * Componente wrapper que integra cache inteligente com LiveSignals
 */
function LiveSignalsCachedComponent({ onGoToTable, activeSignal }: LiveSignalsCachedProps) {
  const { 
    data: signals, 
    loading, 
    error, 
    isStale, 
    refresh, 
    lastUpdated,
    isRefreshing 
  } = useLiveSignals();

  // Converter dados do cache para o formato esperado pelo componente
  const convertedSignals = signals?.map((signal: any) => ({
    id: signal.id,
    strategy_id: signal.strategy || 'default',
    table_id: 'table-1',
    bet_numbers: [signal.number],
    confidence_level: Math.round(signal.confidence),
    confidence_score: signal.confidence,
    confidence_factors: {
      strategy_performance: 85,
      table_performance: 78,
      pattern_strength: signal.confidence,
      data_volume: 92,
      time_factor: 88,
      consistency: 75
    },
    suggested_units: Math.ceil(signal.confidence / 20),
    expected_return: signal.expectedReturn,
    timestamp_generated: new Date(signal.timestamp).toISOString(),
    expires_at: new Date(signal.timestamp + 60000).toISOString(), // 1 minuto de validade
    status: 'active',
    message: `Sinal gerado pela estratégia ${signal.strategy} com ${signal.bets} apostas ativas`
  })) || [];

  // Loading skeleton
  if (loading && !signals) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </CardTitle>
          <Skeleton className="h-8 w-20" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !signals) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            Erro ao Carregar Sinais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os sinais ao vivo. Verifique sua conexão.
          </p>
          <Button 
            onClick={() => refresh()} 
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
      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {isStale ? (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <WifiOff className="h-3 w-3 mr-1" />
              Dados Desatualizados
            </Badge>
          ) : (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Wifi className="h-3 w-3 mr-1" />
              Ao Vivo
            </Badge>
          )}
          
          {lastUpdated && (
            <span>
              Última atualização: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <Button 
          onClick={() => refresh()} 
          variant="ghost" 
          size="sm"
          disabled={isRefreshing}
          className="h-6 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Componente principal */}
      <LiveSignals
        signals={convertedSignals}
        loading={loading}
        onGoToTable={onGoToTable}
        activeSignal={activeSignal}
      />
    </div>
  );
}

export const LiveSignalsCached = memo(LiveSignalsCachedComponent);

/**
 * Hook para estatísticas do cache de sinais
 */
export function useSignalsCacheStats() {
  return {
    getStats: () => rouletteCacheUtils.getStats(),
    forceRefresh: () => rouletteCacheUtils.forceRefresh(),
    subscribe: (callback: (data: any) => void) => rouletteCacheUtils.subscribe(callback)
  };
}