'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Timer, Zap, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedSignal {
  id: string;
  strategy_id: string;
  table_id: string;
  bet_numbers: (string | number)[];
  confidence_level: number;
  expected_return: number;
  timestamp_generated: string;
  expires_at: string;
  status: string;
  message: string;
  suggested_units?: number;
}

interface ActiveSignalHeroProps {
  signal: GeneratedSignal | null;
  onEnterTable?: (tableId: string) => void;
}

export function ActiveSignalHero({ signal, onEnterTable }: ActiveSignalHeroProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!signal) {
      setTimeLeft(0);
      setProgress(0);
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const expires = new Date(signal.expires_at).getTime();
      const created = new Date(signal.timestamp_generated).getTime();
      const totalDuration = expires - created;
      const remaining = Math.max(0, expires - now);

      setTimeLeft(Math.ceil(remaining / 1000));
      setProgress((remaining / totalDuration) * 100);
      setIsUrgent(remaining < 15000); // Menos de 15s é urgente
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [signal]);

  if (!signal) {
    return (
      <Card className="bg-card/30 border-dashed border-2 border-border/50 min-h-[300px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto animate-pulse">
            <Zap className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-medium text-muted-foreground font-heading">Aguardando Sinal</h3>
            <p className="text-sm text-muted-foreground/60 font-sans max-w-[250px] mx-auto mt-2">
              Nossa IA está analisando 14 estratégias em tempo real. O próximo sinal aparecerá aqui.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getNumberColor = (num: string | number) => {
    const n = Number(num);
    if (n === 0) return 'bg-green-600 border-green-400';
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    return redNumbers.includes(n) 
      ? 'bg-red-600 border-red-400' 
      : 'bg-slate-900 border-slate-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden border-2 ${isUrgent ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-primary/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]'}`}>
        
        {/* Background Effects */}
        <div className={`absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl ${isUrgent ? 'from-red-500/10' : 'from-primary/10'} to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl`} />
        
        <CardHeader className="relative z-10 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isUrgent ? "destructive" : "default"} className="animate-pulse px-3 py-1 text-sm font-bold tracking-wider">
                {isUrgent ? 'ÚLTIMOS SEGUNDOS' : 'SINAL ENCONTRADO'}
              </Badge>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest font-heading">
                {signal.strategy_id}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xl font-bold">
              <Timer className={`w-5 h-5 ${isUrgent ? 'text-red-500' : 'text-primary'}`} />
              <span className={isUrgent ? 'text-red-500' : 'text-primary'}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <Progress value={progress} className={`h-1.5 mt-4 ${isUrgent ? 'bg-red-950' : 'bg-primary/20'}`} indicatorClassName={isUrgent ? 'bg-red-500' : 'bg-primary'} />
        </CardHeader>

        <CardContent className="relative z-10 pt-6 space-y-8">
          
          {/* Main Action Area */}
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest font-sans">
                Cobrir os números
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {signal.bet_numbers.map((num, idx) => (
                  <motion.div
                    key={`${signal.id}-${num}-${idx}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: idx * 0.05, type: "spring" }}
                    className={`
                      w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center
                      text-lg sm:text-xl font-bold text-white shadow-lg border-b-4
                      ${getNumberColor(num)}
                    `}
                  >
                    {num}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                <span className="text-xs text-muted-foreground uppercase block mb-1">Confiança</span>
                <span className="text-lg font-bold text-green-500">{signal.confidence_level}%</span>
              </div>
              <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                <span className="text-xs text-muted-foreground uppercase block mb-1">Mesa</span>
                <span className="text-lg font-bold truncate px-2">{signal.table_id}</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <Button 
              size="lg" 
              className={`w-full h-14 text-lg font-bold uppercase tracking-widest shadow-lg transition-all
                ${isUrgent 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20 animate-pulse' 
                  : 'bg-primary hover:bg-primary/90 shadow-primary/20 hover:scale-[1.01]'
                }
              `}
              onClick={() => onEnterTable && onEnterTable(signal.table_id)}
            >
              <div className="flex items-center gap-3">
                <span>Entrar na Mesa Agora</span>
                <ArrowRight className="w-6 h-6" />
              </div>
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3 font-sans">
              <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5" />
              Clique para abrir a roleta automaticamente
            </p>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
