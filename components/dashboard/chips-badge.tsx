'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChipsBadgeProps {
  chips: string | number;
  className?: string;
}

export function ChipsBadge({ chips, className }: ChipsBadgeProps) {
  const getChipsConfig = (chipsValue: string | number) => {
    const chipsStr = chipsValue.toString().toLowerCase();
    
    if (chipsStr.includes('1')) {
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🔵',
        label: '1 Ficha'
      };
    } else if (chipsStr.includes('2')) {
      return {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: '🟣',
        label: '2 Fichas'
      };
    } else if (chipsStr.includes('3')) {
      return {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '🟠',
        label: '3 Fichas'
      };
    } else if (chipsStr.includes('4')) {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '🔴',
        label: '4 Fichas'
      };
    } else if (chipsStr.includes('1-2')) {
      return {
        color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        icon: '🔵🟣',
        label: '1-2 Fichas'
      };
    } else if (chipsStr.includes('2-3')) {
      return {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: '🟣🟠',
        label: '2-3 Fichas'
      };
    } else if (chipsStr.includes('3-4')) {
      return {
        color: 'bg-pink-100 text-pink-800 border-pink-200',
        icon: '🟠🔴',
        label: '3-4 Fichas'
      };
    } else {
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '⚪',
        label: chipsStr
      };
    }
  };

  const config = getChipsConfig(chips);

  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.color,
        'font-medium text-xs px-2 py-1 rounded-full border',
        className
      )}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}