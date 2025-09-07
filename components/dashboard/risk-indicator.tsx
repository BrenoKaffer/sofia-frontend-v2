'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RiskIndicatorProps {
  risk: string;
  className?: string;
}

export function RiskIndicator({ risk, className }: RiskIndicatorProps) {
  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'baixo':
        return {
          color: 'bg-green-500 text-white',
          label: 'Baixo Risco',
          icon: '🟢'
        };
      case 'médio':
      case 'medio':
        return {
          color: 'bg-yellow-500 text-white',
          label: 'Médio Risco',
          icon: '🟡'
        };
      case 'alto':
        return {
          color: 'bg-red-500 text-white',
          label: 'Alto Risco',
          icon: '🔴'
        };
      default:
        return {
          color: 'bg-gray-500 text-white',
          label: 'Risco Indefinido',
          icon: '⚪'
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
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}