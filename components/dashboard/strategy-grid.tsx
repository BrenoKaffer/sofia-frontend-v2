'use client';

import { StrategyCard } from './strategy-card';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target } from 'lucide-react';

interface Strategy {
  name: string;
  description: string;
  logic: string;
  focus: string;
  risk: string;
  recommendedChips: string;
  category: string;
}

interface StrategyGridProps {
  strategies: Strategy[];
  loading?: boolean;
}

export function StrategyGrid({ strategies, loading = false }: StrategyGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-80">
            <div className="h-full bg-card/30 backdrop-blur-sm border border-border/30 rounded-lg animate-pulse">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Search className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2 font-urbanist">
          Nenhuma estratégia encontrada
        </h3>
        <p className="text-muted-foreground font-jakarta">
          Tente ajustar os filtros para encontrar estratégias que correspondam aos seus critérios.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-sm text-muted-foreground font-jakarta"
      >
        <Target className="w-4 h-4" />
        <span>
          Exibindo {strategies.length} estratégia{strategies.length !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* Grid de estratégias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {strategies.map((strategy, index) => (
            <motion.div
              key={`${strategy.name}-${strategy.category}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                layout: { duration: 0.3 }
              }}
            >
              <StrategyCard strategy={strategy} index={index} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer com informações adicionais */}
      {strategies.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-6 border-t border-border/50"
        >
          <p className="text-xs text-muted-foreground font-jakarta">
            💡 Dica: Clique nos filtros acima para encontrar estratégias específicas para seu estilo de jogo
          </p>
        </motion.div>
      )}
    </div>
  );
}