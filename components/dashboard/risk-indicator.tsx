'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RiskIndicatorProps {
  risk: string;
  className?: string;
}

export function RiskIndicator({ risk, className }: RiskIndicatorProps) {
  const getRiskConfig = (riskLevel: string) => {
    const normalized = (riskLevel || '').toString().trim().toLowerCase();
    switch (normalized) {
      case 'low':
      case 'baixo':
        return {
          color: 'bg-green-500 text-white',
          label: 'Baixo Risco',
        };
      case 'medium':
      case 'médio':
      case 'medio':
        return {
          color: 'bg-yellow-500 text-white',
          label: 'Médio Risco',
        };
      case 'high':
      case 'alto':
        return {
          color: 'bg-red-500 text-white',
          label: 'Alto Risco',
        };
      default:
        return {
          color: 'bg-gray-500 text-white',
          label: 'Risco Indefinido',
        };
    }
  };

  const config = getRiskConfig(risk);

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        config.color,
        'font-medium text-xs px-2 py-1 rounded-full',
        className
      )}
    >
      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-white/90" />
      {config.label}
    </Badge>
  );
}
