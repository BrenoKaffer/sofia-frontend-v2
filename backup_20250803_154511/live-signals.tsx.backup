'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Clock, 
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedSignal {
  id: string;
  strategy_id: string;
  table_id: string;
  bet_numbers: number[];
  confidence_level: number;
  expected_return: number;
  timestamp_generated: string;
  expires_at: string;
  status: string;
  message: string;
}

interface LiveSignalsProps {
  signals: GeneratedSignal[];
  loading?: boolean;
}

export function LiveSignals({ signals, loading = false }: LiveSignalsProps) {
  const [displaySignals, setDisplaySignals] = useState<GeneratedSignal[]>(signals);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    setDisplaySignals(signals);
  }, [signals]);

  const getConfidenceNumber = (level: 'High' | 'Medium' | 'Low' | 'Unknown') => {
    switch (level) {
      case 'High':
        return 3;
      case 'Medium':
        return 2;
      case 'Low':
        return 1;
      default:
        return 0;
    }
  };


  const getTimeAgo = (timestamp_generated: string) => {
    if (!timestamp_generated) return 'Tempo indisponível';
    const now = new Date();
    const signalTime = new Date(timestamp_generated);
    const diffInMinutes = Math.floor((now.getTime() - signalTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h atrás`;
  };



  // Categorizar sinais baseado no tempo
  const now = new Date();
  const recentSignals = displaySignals.filter(signal => {
    const signalTime = new Date(signal.timestamp_generated);
    const diffInMinutes = (now.getTime() - signalTime.getTime()) / (1000 * 60);
    return diffInMinutes <= 5; // Padrões dos últimos 5 minutos são considerados ativos
  });
  
  const olderSignals = displaySignals.filter(signal => {
    const signalTime = new Date(signal.timestamp_generated);
    const diffInMinutes = (now.getTime() - signalTime.getTime()) / (1000 * 60);
    return diffInMinutes > 5;
  });
  
  const allSignals = displaySignals;

  return (
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
                          {typeof signal.confidence_level === 'number' ? (signal.confidence_level * 100).toFixed(1) : signal.confidence_level}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-500 font-bold font-jakarta">
                          {getTimeAgo(signal.timestamp_generated)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Estratégia</p>
                        <p className="font-medium font-urbanist">{signal.strategy_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Roleta</p>
                        <p className="font-medium font-urbanist">Roleta {signal.table_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Lucro Esperado</p>
                        <p className="font-medium font-urbanist">${signal.expected_return ? signal.expected_return.toFixed(2) : '0.00'}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2 font-jakarta">Apostas Sugeridas</p>
                      <div className="flex flex-wrap gap-2">
                        {signal.bet_numbers.map((bet, betIndex) => (
                          <motion.div
                            key={betIndex}
                            whileHover={{ scale: 1.05 }}
                            className="px-3 py-1 bg-gradient-to-r from-primary to-accent rounded-full text-white font-bold font-jakarta text-sm"
                          >
                            {bet}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-jakarta">{signal.message}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Status: {signal.status}</span>
                        {/* <span className="text-xs text-muted-foreground">Unidades Sugeridas: {signal.suggested_units}</span> */}
                      </div>
                    </div>
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
                          {typeof signal.confidence_level === 'number' ? (signal.confidence_level * 100).toFixed(0) : signal.confidence_level}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-500 font-bold font-jakarta">
                          {getTimeAgo(signal.timestamp_generated)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Estratégia</p>
                        <p className="font-medium font-urbanist">{signal.strategy_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Roleta</p>
                        <p className="font-medium font-urbanist">Roleta {signal.table_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Lucro Esperado</p>
                        <p className="font-medium font-urbanist">${signal.expected_return ? signal.expected_return.toFixed(2) : '0.00'}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2 font-jakarta">Apostas Sugeridas</p>
                      <div className="flex flex-wrap gap-2">
                        {signal.bet_numbers.map((bet, betIndex) => (
                          <motion.div
                            key={betIndex}
                            whileHover={{ scale: 1.05 }}
                            className="px-3 py-1 bg-gradient-to-r from-primary to-accent rounded-full text-white font-bold font-jakarta text-sm"
                          >
                            {bet}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-jakarta">{signal.message}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Status: {signal.status}</span>
                        {/* <span className="text-xs text-muted-foreground">Unidades Sugeridas: {signal.suggested_units}</span> */}
                      </div>
                    </div>
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
                          {typeof signal.confidence_level === 'number' ? (signal.confidence_level * 100).toFixed(0) : signal.confidence_level}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500 font-bold font-jakarta">
                          {getTimeAgo(signal.timestamp_generated)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Estratégia</p>
                        <p className="font-medium font-urbanist">{signal.strategy_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Roleta</p>
                        <p className="font-medium font-urbanist">Roleta {signal.table_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-jakarta">Lucro Esperado</p>
                        <p className="font-medium font-urbanist">${signal.expected_return ? signal.expected_return.toFixed(2) : '0.00'}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2 font-jakarta">Apostas Sugeridas</p>
                      <div className="flex flex-wrap gap-2">
                        {signal.bet_numbers.map((bet, betIndex) => (
                          <motion.div
                            key={betIndex}
                            whileHover={{ scale: 1.05 }}
                            className="px-3 py-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full text-white font-bold font-jakarta text-sm"
                          >
                            {bet}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-jakarta">{signal.message}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Status: {signal.status}</span>
                        {/* <span className="text-xs text-muted-foreground">Unidades Sugeridas: {signal.suggested_units}</span> */}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}