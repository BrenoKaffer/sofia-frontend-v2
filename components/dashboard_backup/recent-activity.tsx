'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Activity
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
}

interface RecentActivityProps {
  signals: any[]; // Recebe todos os padrões para processar como atividades
  // Idealmente, você teria uma lista de `strategy_activations` para wins/losses
  // Para MVP, transformaremos `signals` em `ActivityItem`
}

export function RecentActivity({ signals }: RecentActivityProps) {
  // Transformar os `signals` em `ActivityItem` para exibição
  const activities: ActivityItem[] = signals.map(signal => {
    const timeAgo = Math.floor((new Date().getTime() - new Date(signal.timestamp_generated).getTime()) / 1000);
    let timeString = '';
    if (timeAgo < 60) timeString = `${timeAgo}s atrás`;
    else if (timeAgo < 3600) timeString = `${Math.floor(timeAgo / 60)} min atrás`;
    else timeString = `${Math.floor(timeAgo / 3600)}h atrás`;

    return {
      id: signal.id,
      type: 'signal' as const, // Todos são 'signal' por enquanto
      title: 'Padrão Gerado',
      description: `Estratégia ${signal.strategy_id} - Aposta em ${signal.bet_numbers.join(', ')}`,
      time: timeString,
      status: signal.confidence_level > 0.8 ? 'info' as const : 'warning' as const, // Exemplo: confiança como status
      // Para 'win'/'loss', você precisaria dos dados da tabela `strategy_activations`
      // Ex: value: signal.profit, status: signal.profit > 0 ? 'success' : 'error'
    };
  }).slice(0, 10); // Exibir as 10 atividades mais recentes
  const getIcon = (type: string) => {
    switch (type) {
      case 'win': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'loss': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'strategy': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/10 border-green-500/20';
      case 'error': return 'bg-red-500/10 border-red-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'win': return 'bg-green-500/20';
      case 'loss': return 'bg-red-500/20';
      case 'alert': return 'bg-yellow-500/20';
      case 'strategy': return 'bg-blue-500/20';
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
          <div className="space-y-4">
            {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-jakarta">
                    Nenhuma atividade recente.
                </div>
            ) : (
                activities.map((activity, index) => (
                    <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border transition-all hover:shadow-sm ${getStatusColor(activity.status)}`}
                    >
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                        {getIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm font-urbanist">{activity.title}</h4>
                            {activity.value && (
                            <Badge 
                                variant={activity.value > 0 ? 'default' : 'destructive'}
                                className="text-xs font-jakarta"
                            >
                                {activity.value > 0 ? '+' : ''}${activity.value.toFixed(2)}
                            </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 font-jakarta">
                            {activity.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-jakarta">
                            <Clock className="w-3 h-3" />
                            {activity.time}
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