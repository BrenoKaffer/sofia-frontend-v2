'use client';

import { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Activity, 
  Clock, 
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { rouletteCacheUtils } from '@/lib/roulette-cache';
import { cacheUtils } from '@/lib/api-cache';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CacheManagerProps {
  className?: string;
  showAdvanced?: boolean;
}

/**
 * Componente para gerenciar e monitorar o sistema de cache
 */
function CacheManagerComponent({ className, showAdvanced = false }: CacheManagerProps) {
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
    realtimeActive: false,
    subscribersCount: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Atualizar estatísticas
  const updateStats = async () => {
    try {
      const cacheStats = rouletteCacheUtils.getStats();
      setStats(cacheStats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao obter estatísticas do cache:', error);
    }
  };

  // Refresh completo do cache
  const handleFullRefresh = async () => {
    setIsRefreshing(true);
    try {
      rouletteCacheUtils.forceRefresh();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar refresh
      await updateStats();
    } catch (error) {
      console.error('Erro ao fazer refresh do cache:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Limpar cache específico
  const handleClearCache = (type: string) => {
    switch (type) {
      case 'realtime':
        cacheUtils.invalidateRealtime();
        break;
      case 'historical':
        cacheUtils.invalidateHistorical();
        break;
      case 'strategies':
        cacheUtils.invalidateStrategies();
        break;
      case 'all':
        cacheUtils.invalidateAll();
        break;
    }
    updateStats();
  };

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // A cada 5 segundos
    return () => clearInterval(interval);
  }, [updateStats]);

  // Subscrever a atualizações do cache
  useEffect(() => {
    const unsubscribe = rouletteCacheUtils.subscribe((data) => {
      if (data.type === 'realtime_update') {
        updateStats();
      }
    });
    return unsubscribe;
  }, [updateStats]);

  const hitRateColor = stats.hitRate >= 80 ? 'text-green-600' : 
                      stats.hitRate >= 60 ? 'text-yellow-600' : 'text-red-600';

  if (!showAdvanced) {
    // Versão simplificada
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cache do Sistema
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={stats.realtimeActive ? 'default' : 'secondary'}>
              {stats.realtimeActive ? 'Ativo' : 'Inativo'}
            </Badge>
            <Button 
              onClick={handleFullRefresh} 
              variant="ghost" 
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Taxa de Acerto</p>
              <p className={`font-medium ${hitRateColor}`}>
                {stats.hitRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Entradas</p>
              <p className="font-medium">{stats.size}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Acessos</p>
              <p className="font-medium">{stats.hits + stats.misses}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Versão avançada
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Gerenciador de Cache
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="controls">Controles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status do Sistema</span>
                  <Badge variant={stats.realtimeActive ? 'default' : 'secondary'}>
                    {stats.realtimeActive ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Ativo</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" />Inativo</>
                    )}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Entradas no Cache</span>
                  <span className="font-medium">{stats.size}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subscribers Ativos</span>
                  <span className="font-medium">{stats.subscribersCount}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de Acerto</span>
                  <span className={`font-medium ${hitRateColor}`}>
                    {stats.hitRate.toFixed(1)}%
                  </span>
                </div>
                
                <Progress value={stats.hitRate} className="h-2" />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Hits: {stats.hits}</span>
                  <span>Misses: {stats.misses}</span>
                </div>
              </div>
            </div>
            
            {lastUpdate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Última atualização: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Métricas de Performance
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Eficiência do Cache</span>
                    <div className="flex items-center gap-2">
                      <Progress value={stats.hitRate} className="h-1 flex-1" />
                      <span className={`text-xs ${hitRateColor}`}>
                        {stats.hitRate > 80 ? 'Excelente' : 
                         stats.hitRate > 60 ? 'Bom' : 'Precisa Melhorar'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Utilização</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(stats.size / 200) * 100} className="h-1 flex-1" />
                      <span className="text-xs">{stats.size}/200</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Atividade em Tempo Real
                </h4>
                
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Atualizações Automáticas</span>
                  <Badge variant={stats.realtimeActive ? 'default' : 'secondary'}>
                    {stats.realtimeActive ? 'Habilitado' : 'Desabilitado'}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="controls" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Ações Rápidas</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={handleFullRefresh} 
                    variant="outline" 
                    size="sm"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Completo
                  </Button>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={() => handleClearCache('all')} 
                          variant="outline" 
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpar Tudo
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove todas as entradas do cache</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Limpeza Seletiva</h4>
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleClearCache('realtime')} 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Dados em Tempo Real
                  </Button>
                  
                  <Button 
                    onClick={() => handleClearCache('historical')} 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Dados Históricos
                  </Button>
                  
                  <Button 
                    onClick={() => handleClearCache('strategies')} 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Estratégias
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export const CacheManager = memo(CacheManagerComponent);