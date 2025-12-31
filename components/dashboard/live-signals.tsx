'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Clock, 
  Zap,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedSignal {
  id: string;
  strategy_id: string;
  table_id: string;
  bet_numbers: (string | number)[];
  confidence_level: number;
  confidence_score?: number;
  confidence_factors?: {
    strategy_performance: number;
    table_performance: number;
    pattern_strength: number;
    data_volume: number;
    time_factor: number;
    consistency: number;
  };
  suggested_units?: number;
  expected_return: number;
  timestamp_generated: string;
  expires_at: string;
  status: string;
  message: string;
}

interface LiveSignalsProps {
  signals: GeneratedSignal[];
  loading?: boolean;
  onGoToTable?: (signal: GeneratedSignal) => void;
  activeSignal?: GeneratedSignal | null;
  countdown?: number;
  progressValue?: number;
  realtimeStatus?: 'connected' | 'reconnecting' | 'disconnected';
}

export function LiveSignals({ signals = [], loading = false, onGoToTable, activeSignal, countdown, progressValue, realtimeStatus }: LiveSignalsProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Função para alternar expansão da mensagem
  const toggleMessageExpansion = (signalId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(signalId)) {
      newExpanded.delete(signalId);
    } else {
      newExpanded.add(signalId);
    }
    setExpandedMessages(newExpanded);
  };
  const [displaySignals, setDisplaySignals] = useState<GeneratedSignal[]>(Array.isArray(signals) ? signals : []);
  const [isLive, setIsLive] = useState(true);
  const [signalCountdowns, setSignalCountdowns] = useState<{[key: string]: {timeLeft: number, progress: number}}>({});

  const getTimeRemaining = useCallback((expires_at: string) => {
    if (!expires_at) return { timeLeft: 0, progress: 0, display: 'Expirado', isExpired: true };
    
    const now = new Date().getTime();
    const expiresAt = new Date(expires_at).getTime();
    
    // Verificar se a data é válida
    if (isNaN(expiresAt)) {
      return { timeLeft: 0, progress: 0, display: 'Tempo inválido', isExpired: true };
    }
    
    const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
    
    if (timeLeft === 0) {
      return { timeLeft: 0, progress: 0, display: 'Expirado', isExpired: true };
    }
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    return { timeLeft, progress: 0, display, isExpired: false };
  }, []);

  const calculateProgress = useCallback((signal: GeneratedSignal) => {
    if (!signal.expires_at || !signal.timestamp_generated) return 0;
    
    const now = new Date().getTime();
    const expiresAt = new Date(signal.expires_at).getTime();
    const createdAt = new Date(signal.timestamp_generated).getTime();
    
    if (isNaN(expiresAt) || isNaN(createdAt)) return 0;
    
    const totalDuration = expiresAt - createdAt;
    let progress = 0;
    
    if (totalDuration > 0) {
      const remaining = Math.max(0, expiresAt - now);
      progress = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
    } else {
      // Fallback: assumir duração de 60 segundos (mais realista para roleta)
      const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      const assumedDuration = 60; // 60 segundos (1 minuto)
      progress = Math.max(0, Math.min(100, (timeLeft / assumedDuration) * 100));
    }
    
    return progress;
  }, []);

  // Atualizar countdowns a cada segundo (otimizado)
  // Memoizar cálculos de tempo para evitar recálculos desnecessários
  const memoizedTimeCalculations = useMemo(() => {
    const safeSignals = Array.isArray(displaySignals) ? displaySignals : [];
    return safeSignals.map(signal => ({
      id: signal.id,
      timeLeft: getTimeRemaining(signal.expires_at).timeLeft,
      progress: calculateProgress(signal)
    }));
  }, [displaySignals, getTimeRemaining, calculateProgress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSignalCountdowns((prevCountdowns: { [key: string]: { timeLeft: number; progress: number } }) => {
        const newCountdowns: { [key: string]: { timeLeft: number; progress: number } } = {};
        let hasChanges = false;
        
        memoizedTimeCalculations.forEach(calc => {
          const signal = displaySignals.find(s => s.id === calc.id);
          const timeData = signal ? getTimeRemaining(signal.expires_at) : { timeLeft: 0, progress: 0 };
          const progress = calc.progress;
          
          newCountdowns[calc.id] = {
            timeLeft: timeData.timeLeft,
            progress: progress
          };
          
          const prev = prevCountdowns[calc.id];
          if (!prev || prev.timeLeft !== timeData.timeLeft || Math.abs(prev.progress - progress) > 2) {
            hasChanges = true;
          }
        });
        
        // Verificar se o número de sinais mudou
        if (Object.keys(prevCountdowns).length !== Object.keys(newCountdowns).length) {
          hasChanges = true;
        }
        
        return hasChanges ? newCountdowns : prevCountdowns;
      });
    }, 3000); // Aumentar intervalo para 3 segundos para melhor performance

    return () => clearInterval(interval);
  }, [memoizedTimeCalculations, displaySignals, getTimeRemaining]); // Dependências otimizadas

  useEffect(() => {
    setDisplaySignals(Array.isArray(signals) ? signals : []);
  }, [signals]);

  const getConfidencePercentage = (level: 'High' | 'Medium' | 'Low' | 'Unknown') => {
    switch (level) {
      case 'High':
        return 85;
      case 'Medium':
        return 65;
      case 'Low':
        return 35;
      default:
        return 0;
    }
  };


  // Memoizar números da roleta para evitar recriação a cada render
  const rouletteNumbers = useMemo(() => [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
    24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ], []);

  // Memoizar validação de números da roleta
  const isValidRouletteNumber = useCallback((bet: any) => {
    const num = Number(bet);
    return !isNaN(num) && rouletteNumbers.includes(num);
  }, [rouletteNumbers]);

  // Memoizar cores dos números da roleta
  const redNumbers = useMemo(() => [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36], []);
  
  const getRouletteNumberColor = useCallback((number: number): string => {
    if (number === 0) return 'bg-green-600';
    return redNumbers.includes(number) ? 'bg-red-600' : 'bg-black';
  }, [redNumbers]);

  const getSignalStatus = (signal: GeneratedSignal) => {
    const timeData = getTimeRemaining(signal.expires_at);
    return timeData.isExpired ? 'Expirado' : 'Ativo';
  };

  const getStatusColor = (signal: GeneratedSignal) => {
    const status = getSignalStatus(signal);
    return status === 'Expirado' ? 'text-red-500' : 'text-green-500';
  };

  // Funções para o sistema de confiança
  const getConfidenceLevel = (score?: number): string => {
    if (!score) return 'DESCONHECIDO';
    if (score >= 80) return 'MUITO ALTA';
    if (score >= 60) return 'ALTA';
    if (score >= 40) return 'MÉDIA';
    if (score >= 20) return 'BAIXA';
    return 'MUITO BAIXA';
  };

  const getConfidenceColor = (score?: number): string => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  const getConfidenceIcon = (score?: number) => {
    if (!score) return Shield;
    if (score >= 80) return ShieldCheck;
    if (score >= 60) return ShieldCheck;
    if (score >= 40) return Shield;
    if (score >= 20) return ShieldAlert;
    return ShieldX;
  };

  const getTimeAgo = (timestamp_generated: string) => {
    if (!timestamp_generated) return 'Tempo indisponível';
    
    const now = new Date();
    const signalTime = new Date(timestamp_generated);
    
    // Verificar se a data é válida
    if (isNaN(signalTime.getTime())) {
      return 'Tempo inválido';
    }
    
    const diffInMinutes = Math.floor((now.getTime() - signalTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };



  // Categorizar sinais com lógica mais robusta e consistente
  const now = new Date();
  const nowTime = now.getTime();
  
  // Primeiro, separar sinais verdadeiramente expirados
  const expiredSignals = displaySignals.filter(signal => {
    if (!signal.expires_at) return false;
    const expiresAt = new Date(signal.expires_at);
    if (isNaN(expiresAt.getTime())) return false;
    return expiresAt.getTime() <= nowTime;
  });
  
  // Sinais ativos (não expirados)
  const activeSignals = displaySignals.filter(signal => {
    if (!signal.expires_at) return true; // Sinais sem expires_at são considerados ativos
    const expiresAt = new Date(signal.expires_at);
    if (isNaN(expiresAt.getTime())) return true;
    return expiresAt.getTime() > nowTime;
  });
  
  // Lógica para "Recentes" e "Anteriores" - garantindo consistência
  let recentSignals: GeneratedSignal[] = [];
  let olderSignals: GeneratedSignal[] = [];
  
  if (expiredSignals.length > 0) {
    // Se há sinais expirados, usar lógica baseada em expiração
    recentSignals = activeSignals;
    olderSignals = expiredSignals;
  } else {
    // Se não há sinais expirados, dividir baseado no tempo de criação
    const sortedByCreated = [...displaySignals].sort((a, b) => 
      new Date(b.timestamp_generated).getTime() - new Date(a.timestamp_generated).getTime()
    );
    
    if (sortedByCreated.length <= 3) {
      // Poucos sinais: todos são "recentes"
      recentSignals = sortedByCreated;
      olderSignals = [];
    } else {
      // Dividir: 70% mais recentes vs 30% mais antigos
      const recentCount = Math.ceil(sortedByCreated.length * 0.7);
      recentSignals = sortedByCreated.slice(0, recentCount);
      olderSignals = sortedByCreated.slice(recentCount);
    }
  }
  
  // Garantir que allSignals seja exatamente a soma de recentSignals + olderSignals
  const allSignals = [...recentSignals, ...olderSignals];
  
  // Verificar consistência das contagens

  return (
    <TooltipProvider>
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-urbanist">Padrões ao Vivo</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-jakarta">
                Monitoramento em tempo real das estratégias ativas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: isLive ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 2, repeat: isLive ? Infinity : 0 }}
              className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-500'}`}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className="gap-2"
            >
              {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="font-jakarta">{isLive ? 'Pausar' : 'Iniciar'}</span>
            </Button>
            {(() => {
              if (!realtimeStatus) return null;
              const statusLabel = realtimeStatus === 'connected' ? 'Conectado' : realtimeStatus === 'reconnecting' ? 'Reconectando' : 'Desconectado';
              const statusClasses =
                realtimeStatus === 'connected'
                  ? 'bg-green-500/10 text-green-700 border-green-500/30'
                  : realtimeStatus === 'reconnecting'
                  ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30'
                  : 'bg-red-500/10 text-red-700 border-red-500/30';
              return (
                <Badge variant="outline" className={`font-jakarta ${statusClasses}`}>
                  Realtime: {statusLabel}
                </Badge>
              );
            })()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent" className="gap-2 font-jakarta">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Recentes ({recentSignals.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2 font-jakarta">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Todos ({allSignals.length})
            </TabsTrigger>
            <TabsTrigger value="older" className="gap-2 font-jakarta">
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
              Anteriores ({olderSignals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-6 space-y-4">
            <AnimatePresence>
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground font-jakarta"
                >
                  Carregando sinais...
                </motion.div>
              ) : recentSignals.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground font-jakarta"
                >
                  Nenhum sinal recente
                </motion.div>
              ) : (
                recentSignals.map((signal, index) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg border bg-gradient-to-r from-green-500/5 to-blue-500/5 border-green-500/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 font-jakarta">
                          <Zap className="w-4 h-4" />
                          ATIVO
                        </Badge>
                        <Badge variant="secondary" className="font-jakarta">
                          {signal.confidence_level} ({getConfidencePercentage(
                            signal.confidence_level >= 80 ? 'High' : 
                            signal.confidence_level >= 60 ? 'Medium' : 
                            signal.confidence_level >= 30 ? 'Low' : 'Unknown'
                          )}%)
                        </Badge>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {(() => {
                          const timeLeft = signalCountdowns[signal.id]?.timeLeft || 0;
                          const isExpired = timeLeft === 0;
                          const isFinished = signal.status === 'finalizado' || signal.status === 'finished' || signal.status === 'expired' || signal.status === 'validated';
                          
                          // Se o sinal está finalizado, mostrar informação de status em vez de countdown
                          if (isFinished) {
                            return (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-bold font-jakarta text-gray-500">
                                  {signal.status === 'validated' ? 'VALIDADO' : 
                                   signal.status === 'expired' ? 'EXPIRADO' : 
                                   'FINALIZADO'}
                                </span>
                              </div>
                            );
                          }
                          
                          // Para sinais ativos, mostrar countdown e barra de progresso
                          const isUrgent = timeLeft <= 30 && timeLeft > 0;
                          
                          return (
                            <>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className={`w-4 h-4 ${
                                  isExpired ? 'text-red-500' : 
                                  isUrgent ? 'text-yellow-500' : 
                                  'text-green-500'
                                }`} />
                                <span className={`font-bold font-jakarta ${
                                  isExpired ? 'text-red-500' : 
                                  isUrgent ? 'text-yellow-500' : 
                                  'text-green-500'
                                }`}>
                                  {signalCountdowns[signal.id] ? 
                                    (signalCountdowns[signal.id].timeLeft > 0 ? 
                                      (() => {
                                        const minutes = Math.floor(signalCountdowns[signal.id].timeLeft / 60);
                                        const seconds = signalCountdowns[signal.id].timeLeft % 60;
                                        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                      })() : 
                                      'EXPIRADO'
                                    ) : 
                                    'Carregando...'
                                  }
                                </span>
                              </div>
                              {signalCountdowns[signal.id] && (
                                <div className="w-20 relative">
                                  <Progress 
                                    value={signalCountdowns[signal.id].progress} 
                                    className="h-2"
                                  />
                                  {/* Overlay para sinal expirado */}
                                  {signalCountdowns[signal.id].timeLeft === 0 && (
                                    <motion.div
                                      key={`expired-${signal.id}`}
                                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                      className="absolute inset-0 bg-red-500 rounded-full opacity-50"
                                    />
                                  )}
                                  {/* Overlay para sinal urgente (≤30s) */}
                                  {signalCountdowns[signal.id].timeLeft <= 30 && signalCountdowns[signal.id].timeLeft > 0 && (
                                    <motion.div
                                      key={`urgent-${signal.id}`}
                                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                                      transition={{ duration: 0.8, repeat: Infinity }}
                                      className="absolute inset-0 bg-yellow-500 rounded-full opacity-30"
                                    />
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Estratégia</p>
                        <p className="font-medium font-urbanist">{signal.strategy_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Roleta</p>
                        <p className="font-medium font-urbanist">
                          Roleta {signal.table_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Confiança</p>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  {(() => {
                                    const ConfidenceIcon = getConfidenceIcon(signal.confidence_score);
                                    return <ConfidenceIcon className={`w-4 h-4 ${getConfidenceColor(signal.confidence_score)}`} />;
                                  })()}
                                  <span className={`font-medium font-urbanist text-sm ${getConfidenceColor(signal.confidence_score)}`}>
                                    {signal.confidence_score ? `${signal.confidence_score}%` : 'N/A'}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-2">
                                  <p className="font-semibold">Nível: {getConfidenceLevel(signal.confidence_score)}</p>
                                  {signal.confidence_factors && (
                                    <div className="space-y-1 text-xs">
                                      <p>Performance da Estratégia: {(signal.confidence_factors.strategy_performance * 100).toFixed(1)}%</p>
                                      <p>Performance da Mesa: {(signal.confidence_factors.table_performance * 100).toFixed(1)}%</p>
                                      <p>Força do Padrão: {(signal.confidence_factors.pattern_strength * 100).toFixed(1)}%</p>
                                      <p>Volume de Dados: {(signal.confidence_factors.data_volume * 100).toFixed(1)}%</p>
                                      <p>Fator Temporal: {(signal.confidence_factors.time_factor * 100).toFixed(1)}%</p>
                                      <p>Consistência: {(signal.confidence_factors.consistency * 100).toFixed(1)}%</p>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">
                          {signal.status === 'validated' ? 'Lucro Real' : 'Lucro Esperado'}
                        </p>
                        <p className={`font-medium font-urbanist ${
                          signal.status === 'validated' 
                            ? (signal.expected_return > 0 ? 'text-green-600' : 'text-red-600')
                            : 'text-blue-600'
                        }`}>
                          {signal.expected_return !== undefined && signal.expected_return !== null 
                            ? `$${signal.expected_return.toFixed(2)}` 
                            : 'Calculando...'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground font-jakarta">Apostas Sugeridas</p>
                        {signal.suggested_units && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md border border-blue-200">
                            <Zap className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700 font-jakarta">
                              {signal.suggested_units} {signal.suggested_units === 1 ? 'unidade' : 'unidades'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          // Filtrar apenas números válidos (0-36)
                          const validNumbers: number[] = [];
                          
                          signal.bet_numbers?.forEach(bet => {
                            if (typeof bet === 'string') {
                              if (bet.includes(',')) {
                                // String com números separados por vírgula
                                const nums = bet.split(',').map(n => n.trim());
                                nums.forEach(num => {
                                  const parsedNum = Number(num);
                                  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                    validNumbers.push(parsedNum);
                                  }
                                });
                              } else {
                                // Verificar se é um número válido
                                const parsedNum = Number(bet);
                                if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                  validNumbers.push(parsedNum);
                                }
                              }
                            } else if (typeof bet === 'number') {
                              // Se é número, verificar se está no range válido
                              if (bet >= 0 && bet <= 36) {
                                validNumbers.push(bet);
                              }
                            }
                          });
                          
                          // Remover duplicatas
                          const uniqueNumbers = Array.from(new Set(validNumbers));
                          
                          return uniqueNumbers.map((number, betIndex) => (
                            <motion.div
                              key={betIndex}
                              whileHover={{ scale: 1.05 }}
                              className={`w-8 h-8 font-bold font-jakarta text-xs text-white flex items-center justify-center ${getRouletteNumberColor(number)} rounded-full`}
                            >
                              {number}
                            </motion.div>
                          ));
                        })()}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <div className={expandedMessages.has(signal.id) ? '' : 'line-clamp-2'}>
                          <p className="text-sm font-jakarta">
                            {expandedMessages.has(signal.id) ? signal.message : truncateText(signal.message)}
                          </p>
                        </div>
                        {signal.message.length > 60 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                            onClick={() => toggleMessageExpansion(signal.id)}
                          >
                            {expandedMessages.has(signal.id) ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                ver menos
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                ver mais
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">Status: {signal.status || 'Ativo'}</span>
                        {signal.confidence_score && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Confiança:</span>
                            <span className={`text-xs font-medium ${getConfidenceColor(signal.confidence_score)}`}>
                              {getConfidenceLevel(signal.confidence_score)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {onGoToTable && (
                      <div className="mt-3 flex justify-end">
                        {(() => {
                          const timeLeft = signalCountdowns[signal.id]?.timeLeft || 0;
                          const isExpired = timeLeft === 0;
                          
                          return (
                            <Button
                              variant={isExpired ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => !isExpired && onGoToTable(signal)}
                              disabled={isExpired}
                              className={`gap-1 text-xs px-3 py-1 h-7 font-jakarta transition-all duration-300 ${
                                isExpired ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''
                              }`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              {isExpired ? 'Sinal Expirado' : 'Ir para a Mesa'}
                            </Button>
                          );
                        })()} 
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="all" className="mt-6 space-y-4">
            <AnimatePresence>
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground font-jakarta"
                >
                  Carregando sinais...
                </motion.div>
              ) : allSignals.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground font-jakarta"
                >
                  Nenhum sinal encontrado
                </motion.div>
              ) : (
                allSignals.map((signal, index) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg border bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 font-jakarta">
                          <Zap className="w-4 h-4" />
                          SINAL
                        </Badge>
                        <Badge variant="secondary" className="font-jakarta">
                          {signal.confidence_level} ({getConfidencePercentage(
                            signal.confidence_level >= 80 ? 'High' : 
                            signal.confidence_level >= 60 ? 'Medium' : 
                            signal.confidence_level >= 30 ? 'Low' : 'Unknown'
                          )}%)
                        </Badge>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {(() => {
                          const timeLeft = signalCountdowns[signal.id]?.timeLeft || 0;
                          const isExpired = timeLeft === 0;
                          const isFinished = signal.status === 'finalizado' || signal.status === 'finished' || signal.status === 'expired' || signal.status === 'validated';
                          
                          // Se o sinal está finalizado, mostrar informação de status em vez de countdown
                          if (isFinished) {
                            return (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-bold font-jakarta text-gray-500">
                                  {signal.status === 'validated' ? 'VALIDADO' : 
                                   signal.status === 'expired' ? 'EXPIRADO' : 
                                   'FINALIZADO'}
                                </span>
                              </div>
                            );
                          }
                          
                          // Para sinais ativos, mostrar countdown e barra de progresso
                          const isUrgent = timeLeft <= 30 && timeLeft > 0;
                          
                          return (
                            <>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className={`w-4 h-4 ${
                                  isExpired ? 'text-red-500' : 
                                  isUrgent ? 'text-yellow-500' : 
                                  'text-blue-500'
                                }`} />
                                <span className={`font-bold font-jakarta ${
                                  isExpired ? 'text-red-500' : 
                                  isUrgent ? 'text-yellow-500' : 
                                  'text-blue-500'
                                }`}>
                                  {signalCountdowns[signal.id] ? 
                                    (signalCountdowns[signal.id].timeLeft > 0 ? 
                                      (() => {
                                        const minutes = Math.floor(signalCountdowns[signal.id].timeLeft / 60);
                                        const seconds = signalCountdowns[signal.id].timeLeft % 60;
                                        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                      })() : 
                                      'EXPIRADO'
                                    ) : 
                                    'Carregando...'
                                  }
                                </span>
                              </div>
                              {signalCountdowns[signal.id] && (
                                <div className="w-20 relative">
                                  <Progress 
                                    value={signalCountdowns[signal.id].progress} 
                                    className="h-2"
                                  />
                                  {/* Overlay para sinal expirado */}
                                  {signalCountdowns[signal.id].timeLeft === 0 && (
                                    <motion.div
                                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                      className="absolute inset-0 bg-red-500 rounded-full opacity-50"
                                    />
                                  )}
                                  {/* Overlay para sinal urgente (≤30s) */}
                                  {signalCountdowns[signal.id].timeLeft <= 30 && signalCountdowns[signal.id].timeLeft > 0 && (
                                    <motion.div
                                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                                      transition={{ duration: 0.8, repeat: Infinity }}
                                      className="absolute inset-0 bg-yellow-500 rounded-full opacity-30"
                                    />
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Estratégia</p>
                        <p className="font-medium font-urbanist">{signal.strategy_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Roleta</p>
                        <p className="font-medium font-urbanist">
                          Roleta {signal.table_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">
                          {signal.status === 'validated' ? 'Lucro Real' : 'Lucro Esperado'}
                        </p>
                        <p className={`font-medium font-urbanist ${
                          signal.status === 'validated' 
                            ? (signal.expected_return > 0 ? 'text-green-600' : 'text-red-600')
                            : 'text-blue-600'
                        }`}>
                          {signal.expected_return !== undefined && signal.expected_return !== null 
                            ? `$${signal.expected_return.toFixed(2)}` 
                            : 'Calculando...'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2 font-jakarta">Apostas Sugeridas</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          // Filtrar apenas números válidos (0-36)
                          const validNumbers: number[] = [];
                          
                          signal.bet_numbers?.forEach(bet => {
                            if (typeof bet === 'string') {
                              if (bet.includes(',')) {
                                // String com números separados por vírgula
                                const nums = bet.split(',').map(n => n.trim());
                                nums.forEach(num => {
                                  const parsedNum = Number(num);
                                  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                    validNumbers.push(parsedNum);
                                  }
                                });
                              } else {
                                // Verificar se é um número válido
                                const parsedNum = Number(bet);
                                if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                  validNumbers.push(parsedNum);
                                }
                              }
                            } else if (typeof bet === 'number') {
                              // Se é número, verificar se está no range válido
                              if (bet >= 0 && bet <= 36) {
                                validNumbers.push(bet);
                              }
                            }
                          });
                          
                          // Remover duplicatas
                          const uniqueNumbers = Array.from(new Set(validNumbers));
                          
                          return uniqueNumbers.map((number, betIndex) => (
                            <motion.div
                              key={betIndex}
                              whileHover={{ scale: 1.05 }}
                              className={`w-8 h-8 font-bold font-jakarta text-xs text-white flex items-center justify-center ${getRouletteNumberColor(number)} rounded-full`}
                            >
                              {number}
                            </motion.div>
                          ));
                        })()}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <div className={expandedMessages.has(signal.id) ? '' : 'line-clamp-2'}>
                          <p className="text-sm font-jakarta">
                            {expandedMessages.has(signal.id) ? signal.message : truncateText(signal.message)}
                          </p>
                        </div>
                        {signal.message.length > 60 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                            onClick={() => toggleMessageExpansion(signal.id)}
                          >
                            {expandedMessages.has(signal.id) ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                ver menos
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                ver mais
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Status: {signal.status || 'Processado'}</span>
                        {/* Unidades sugeridas removidas - não existe no schema */}
                      </div>
                    </div>

                    {onGoToTable && (
                      <div className="mt-3 flex justify-end">
                        {(() => {
                          const timeLeft = signalCountdowns[signal.id]?.timeLeft || 0;
                          const isExpired = timeLeft === 0;
                          
                          return (
                            <Button
                              variant={isExpired ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => !isExpired && onGoToTable(signal)}
                              disabled={isExpired}
                              className={`gap-1 text-xs px-3 py-1 h-7 font-jakarta transition-all duration-300 ${
                                isExpired ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''
                              }`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              {isExpired ? 'Sinal Expirado' : 'Ir para a Mesa'}
                            </Button>
                          );
                        })()} 
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="older" className="mt-6 space-y-4">
            <AnimatePresence>
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground font-jakarta"
                >
                  Carregando sinais...
                </motion.div>
              ) : olderSignals.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground font-jakarta"
                >
                  Nenhum sinal anterior
                </motion.div>
              ) : (
                olderSignals.map((signal, index) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-lg border bg-gradient-to-r from-gray-500/5 to-slate-500/5 border-gray-500/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 font-jakarta">
                          <Clock className="w-4 h-4" />
                          ANTERIOR
                        </Badge>
                        <Badge variant="secondary" className="font-jakarta">
                          {signal.confidence_level} ({getConfidencePercentage(
                            signal.confidence_level >= 80 ? 'High' : 
                            signal.confidence_level >= 60 ? 'Medium' : 
                            signal.confidence_level >= 30 ? 'Low' : 'Unknown'
                          )}%)
                        </Badge>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {(() => {
                          const timeLeft = signalCountdowns[signal.id]?.timeLeft || 0;
                          const isFinished = signal.status === 'finalizado' || signal.status === 'finished' || signal.status === 'expired' || signal.status === 'validated';
                          
                          // Se o sinal está finalizado, mostrar informação de status em vez de countdown
                          if (isFinished) {
                            return (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-bold font-jakarta text-gray-500">
                                  {signal.status === 'validated' ? 'VALIDADO' : 
                                   signal.status === 'expired' ? 'EXPIRADO' : 
                                   'FINALIZADO'}
                                </span>
                              </div>
                            );
                          }
                          
                          // Para sinais ativos ou antigos, mostrar countdown ou tempo decorrido
                          return (
                            <>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className={`font-bold font-jakarta ${
                                  signalCountdowns[signal.id] && signalCountdowns[signal.id].timeLeft === 0 
                                    ? 'text-red-500' 
                                    : signalCountdowns[signal.id] && signalCountdowns[signal.id].timeLeft <= 30 
                                    ? 'text-yellow-500' 
                                    : 'text-gray-500'
                                }`}>
                                  {signalCountdowns[signal.id] ? 
                                    (signalCountdowns[signal.id].timeLeft > 0 ? 
                                      (() => {
                                        const minutes = Math.floor(signalCountdowns[signal.id].timeLeft / 60);
                                        const seconds = signalCountdowns[signal.id].timeLeft % 60;
                                        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                      })() : 
                                      'Expirado'
                                    ) : 
                                    getTimeAgo(signal.timestamp_generated)
                                  }
                                </span>
                              </div>
                              {signalCountdowns[signal.id] && signalCountdowns[signal.id].timeLeft > 0 && (
                                <div className="w-20 relative">
                                  <Progress 
                                    value={signalCountdowns[signal.id].progress} 
                                    className="h-1 opacity-50"
                                  />
                                  {signalCountdowns[signal.id].timeLeft <= 30 && (
                                    <motion.div
                                      className="absolute inset-0 bg-yellow-400/20 rounded-full"
                                      animate={{ opacity: [0.2, 0.6, 0.2] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                    />
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Estratégia</p>
                        <p className="font-medium font-urbanist">{signal.strategy_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Roleta</p>
                        <p className="font-medium font-urbanist">
                          Roleta {signal.table_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">
                          {signal.status === 'validated' ? 'Lucro Real' : 'Lucro Esperado'}
                        </p>
                        <p className={`font-medium font-urbanist ${
                          signal.status === 'validated' 
                            ? (signal.expected_return > 0 ? 'text-green-600' : 'text-red-600')
                            : 'text-gray-500'
                        }`}>
                          {signal.expected_return !== undefined && signal.expected_return !== null 
                            ? `$${signal.expected_return.toFixed(2)}` 
                            : 'Calculando...'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2 font-jakarta">Apostas Sugeridas</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          // Filtrar apenas números válidos (0-36)
                          const validNumbers: number[] = [];
                          
                          signal.bet_numbers?.forEach(bet => {
                            if (typeof bet === 'string') {
                              if (bet.includes(',')) {
                                // String com números separados por vírgula
                                const nums = bet.split(',').map(n => n.trim());
                                nums.forEach(num => {
                                  const parsedNum = Number(num);
                                  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                    validNumbers.push(parsedNum);
                                  }
                                });
                              } else {
                                // Verificar se é um número válido
                                const parsedNum = Number(bet);
                                if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 36) {
                                  validNumbers.push(parsedNum);
                                }
                              }
                            } else if (typeof bet === 'number') {
                              // Se é número, verificar se está no range válido
                              if (bet >= 0 && bet <= 36) {
                                validNumbers.push(bet);
                              }
                            }
                          });
                          
                          // Remover duplicatas
                          const uniqueNumbers = Array.from(new Set(validNumbers));
                          
                          return uniqueNumbers.map((number, betIndex) => (
                            <motion.div
                              key={betIndex}
                              whileHover={{ scale: 1.05 }}
                              className={`w-8 h-8 font-bold font-jakarta text-xs text-white flex items-center justify-center ${getRouletteNumberColor(number)} rounded-full opacity-75`}
                            >
                              {number}
                            </motion.div>
                          ));
                        })()}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <div className={expandedMessages.has(signal.id) ? '' : 'line-clamp-2'}>
                          <p className="text-sm font-jakarta">
                            {expandedMessages.has(signal.id) ? signal.message : truncateText(signal.message)}
                          </p>
                        </div>
                        {signal.message.length > 60 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                            onClick={() => toggleMessageExpansion(signal.id)}
                          >
                            {expandedMessages.has(signal.id) ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                ver menos
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                ver mais
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Status: {signal.status || 'Finalizado'}</span>
                        {/* Unidades sugeridas removidas - não existe no schema */}
                      </div>
                    </div>

                    {onGoToTable && (
                      <div className="mt-3 flex justify-end">
                        {(() => {
                          const timeLeft = signalCountdowns[signal.id]?.timeLeft || 0;
                          const isExpired = timeLeft === 0;
                          
                          return (
                            <Button
                              variant={isExpired ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => !isExpired && onGoToTable(signal)}
                              disabled={isExpired}
                              className={`gap-1 text-xs px-3 py-1 h-7 font-jakarta transition-all duration-300 ${
                                isExpired ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''
                              }`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              {isExpired ? 'Sinal Expirado' : 'Ir para a Mesa'}
                            </Button>
                          );
                        })()} 
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}

export default LiveSignals;