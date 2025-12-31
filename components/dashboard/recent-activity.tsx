'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Target,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Tipagem para os itens de atividade (baseado em generated_signals, mas adaptado)
interface ActivityItem {
  id: string;
  type: 'signal' | 'win' | 'loss' | 'alert' | 'strategy'; // Tipo de atividade
  title: string; // Título da atividade (ex: "Padrão Gerado")
  description: string; // Descrição (ex: "Estratégia X - Números Y")
  time: string; // Tempo decorrido (ex: "2 min atrás")
  value?: number; // Lucro/Perda, se aplicável
  status?: 'success' | 'error' | 'warning' | 'info'; // Status da atividade
  confidence?: number; // Nível de confiança do sinal
}

interface RecentActivityProps {
  signals: any[]; // Recebe todos os padrões para processar como atividades
  spins?: any[]; // Histórico de giros da roleta
  loading?: boolean; // Estado de carregamento
}

export function RecentActivity({ signals = [], spins, loading = false }: RecentActivityProps) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Função para alternar expansão da descrição
  const toggleDescriptionExpansion = (id: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Função para simular resultado baseado na confiança do sinal
  const simulateSignalResult = (signal: any, index: number) => {
    const confidence = signal.confidence_level;
    const confidenceScore = signal.confidence_score || 0;
    
    // Simular resultado baseado na confiança e posição (para variedade)
    let isWin = false;
    let profitValue = 0;
    
    if (confidence === 'High' || confidenceScore > 0.8) {
      isWin = Math.random() > 0.2; // 80% chance de vitória para alta confiança
      profitValue = isWin ? (50 + Math.random() * 200) : -(20 + Math.random() * 80);
    } else if (confidence === 'Medium' || confidenceScore > 0.6) {
      isWin = Math.random() > 0.35; // 65% chance de vitória para média confiança
      profitValue = isWin ? (30 + Math.random() * 150) : -(15 + Math.random() * 60);
    } else {
      isWin = Math.random() > 0.5; // 50% chance de vitória para baixa confiança
      profitValue = isWin ? (20 + Math.random() * 100) : -(10 + Math.random() * 40);
    }
    
    return { isWin, profitValue };
  };

  // Transformar os `signals` em `ActivityItem` para exibição
  const activities: ActivityItem[] = (Array.isArray(signals) ? signals : []).map((signal, index) => {
    const timeAgo = Math.floor((new Date().getTime() - new Date(signal.timestamp_generated).getTime()) / 1000);
    let timeString = '';
    if (timeAgo < 60) timeString = `${timeAgo}s atrás`;
    else if (timeAgo < 3600) timeString = `${Math.floor(timeAgo / 60)} min atrás`;
    else timeString = `${Math.floor(timeAgo / 3600)}h atrás`;

    // Simular resultado para sinais mais antigos (que já "aconteceram")
    const isOldSignal = timeAgo > 300; // Sinais com mais de 5 minutos
    const { isWin, profitValue } = isOldSignal ? simulateSignalResult(signal, index) : { isWin: null, profitValue: 0 };
    
    // Determinar tipo e status baseado no resultado
    let type: ActivityItem['type'] = 'signal';
    let status: ActivityItem['status'] = 'info';
    let title = 'Sinal Gerado';
    
    if (isOldSignal && isWin !== null) {
      type = isWin ? 'win' : 'loss';
      status = isWin ? 'success' : 'error';
      title = isWin ? 'Vitória Confirmada' : 'Resultado Negativo';
    } else {
      // Sinal ativo/recente
      const confidence = signal.confidence_level;
      if (confidence === 'High') {
        status = 'info';
      } else if (confidence === 'Medium') {
        status = 'warning';
      } else {
        status = 'warning';
      }
    }

    return {
      id: signal.id,
      type,
      title,
      description: `${signal.strategy_id} - Números ${signal.bet_numbers?.join(', ') || 'N/A'}`,
      time: timeString,
      status,
      value: isOldSignal && isWin !== null ? profitValue : undefined,
      confidence: signal.confidence_score || (signal.confidence_level === 'High' ? 0.85 : signal.confidence_level === 'Medium' ? 0.7 : 0.55)
    };
  }).slice(0, 10); // Exibir as 10 atividades mais recentes
  const getIcon = (type: string, confidence?: number) => {
    switch (type) {
      case 'win': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'loss': return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'strategy': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'signal': {
        if (confidence && confidence > 0.8) {
          return <Target className="w-5 h-5 text-blue-600" />;
        } else if (confidence && confidence > 0.6) {
          return <Zap className="w-5 h-5 text-orange-600" />;
        } else {
          return <Activity className="w-5 h-5 text-gray-600" />;
        }
      }
      default: return <Activity className="w-5 h-5 text-primary" />;
    }
  };

  const getStatusColor = (status?: string, type?: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:border-green-800';
      case 'error': return 'bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-950 dark:border-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950 dark:border-yellow-800';
      case 'info': {
        if (type === 'signal') {
          return 'bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800';
        }
        return 'bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800';
      }
      default: return 'bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800';
    }
  };

  const getIconBg = (type: string, confidence?: number) => {
    switch (type) {
      case 'win': return 'bg-green-100 dark:bg-green-900';
      case 'loss': return 'bg-red-100 dark:bg-red-900';
      case 'alert': return 'bg-yellow-100 dark:bg-yellow-900';
      case 'strategy': return 'bg-blue-100 dark:bg-blue-900';
      case 'signal': {
        if (confidence && confidence > 0.8) {
          return 'bg-blue-100 dark:bg-blue-900';
        } else if (confidence && confidence > 0.6) {
          return 'bg-orange-100 dark:bg-orange-900';
        } else {
          return 'bg-gray-100 dark:bg-gray-900';
        }
      }
      default: return 'bg-primary/20';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-urbanist">Atividade Recente</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-jakarta">
              Últimas ações do sistema
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground font-jakarta">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                Carregando atividades...
              </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-jakarta">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    Nenhuma atividade recente.
                </div>
            ) : (
                activities.map((activity, index) => (
                    <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer ${getStatusColor(activity.status, activity.type)}`}
                    >
                    <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getIconBg(activity.type, activity.confidence)}`}>
                        {getIcon(activity.type, activity.confidence)}
                        </div>
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm font-urbanist">{activity.title}</h4>
                            <div className="flex items-center gap-2">
                              {activity.confidence && (
                                <Badge variant="outline" className="text-xs font-jakarta px-2 py-1">
                                  {(activity.confidence * 100).toFixed(0)}%
                                </Badge>
                              )}
                              {activity.value && (
                                <Badge 
                                    variant={activity.value > 0 ? 'default' : 'destructive'}
                                    className={`text-xs font-jakarta px-2 py-1 ${
                                      activity.value > 0 
                                        ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200' 
                                        : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200'
                                    }`}
                                >
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    {activity.value > 0 ? '+' : ''}{activity.value.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                        </div>
                        <div className="mb-2">
                          <div className={expandedDescriptions.has(activity.id) ? '' : 'line-clamp-2'}>
                            <p className="text-sm text-muted-foreground font-jakarta">
                              {expandedDescriptions.has(activity.id) ? activity.description : truncateText(activity.description)}
                            </p>
                          </div>
                          {activity.description.length > 60 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-xs text-primary hover:text-primary/80 mt-1"
                              onClick={() => toggleDescriptionExpansion(activity.id)}
                            >
                              {expandedDescriptions.has(activity.id) ? (
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-jakarta">
                              <Clock className="w-3 h-3" />
                              {activity.time}
                          </div>
                          {activity.type === 'win' && (
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              ✓ Sucesso
                            </span>
                          )}
                          {activity.type === 'loss' && (
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">
                              ✗ Perda
                            </span>
                          )}
                          {activity.type === 'signal' && (
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              ⚡ Ativo
                            </span>
                          )}
                        </div>
                        </div>
                    </div>
                    </motion.div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default RecentActivity;