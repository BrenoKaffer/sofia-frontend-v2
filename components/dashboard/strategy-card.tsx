'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskIndicator } from './risk-indicator';
import { ChipsBadge } from './chips-badge';
import { Target, Info, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface Strategy {
  name: string;
  description: string;
  logic: string;
  focus: string;
  risk: string;
  recommendedChips: string;
  category: string;
}

interface StrategyCardProps {
  strategy: Strategy;
  index?: number;
}

export function StrategyCard({ strategy, index = 0 }: StrategyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="h-full bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg font-urbanist text-foreground mb-2">
                {strategy.name}
              </CardTitle>
              <Badge 
                variant="outline" 
                className="text-xs font-jakarta bg-primary/10 text-primary border-primary/20"
              >
                {strategy.category}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <RiskIndicator risk={strategy.risk} />
              <ChipsBadge chips={strategy.recommendedChips} />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Descrição */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Info className="w-4 h-4" />
              Descrição
            </div>
            <p className="text-sm text-foreground font-jakarta leading-relaxed">
              {strategy.description}
            </p>
          </div>

          {/* Lógica */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lightbulb className="w-4 h-4" />
              Como Funciona
            </div>
            <p className="text-sm text-muted-foreground font-jakarta leading-relaxed">
              {strategy.logic}
            </p>
          </div>

          {/* Foco */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="w-4 h-4" />
              Foco Principal
            </div>
            <p className="text-sm text-primary font-jakarta font-medium">
              {strategy.focus}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}