'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChipsBadgeProps {
  chips: string | number;
  className?: string;
}

export function ChipsBadge({ chips, className }: ChipsBadgeProps) {
  const normalizeChips = (chipsValue: string | number) => {
    if (typeof chipsValue === 'number') {
      if (!Number.isFinite(chipsValue)) return null;
      const n = Math.trunc(chipsValue);
      return n > 0 ? n.toString() : null;
    }

    const raw = (chipsValue || '').toString().trim().toLowerCase();
    if (!raw) return null;

    if (raw.includes('-')) return raw.replace(/\s+/g, '');
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed.toString() : raw;
  };

  const getChipsConfig = (chipsValue: string | number) => {
    const chipsStr = normalizeChips(chipsValue);

    if (chipsStr === '1-2') {
      return {
        color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        label: '1-2 Fichas'
      };
    }

    if (chipsStr === '2-3') {
      return {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        label: '2-3 Fichas'
      };
    }

    if (chipsStr === '3-4') {
      return {
        color: 'bg-pink-100 text-pink-800 border-pink-200',
        label: '3-4 Fichas'
      };
    }

    if (chipsStr === '1') {
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        label: '1 Ficha'
      };
    } else if (chipsStr === '2') {
      return {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        label: '2 Fichas'
      };
    } else if (chipsStr === '3') {
      return {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        label: '3 Fichas'
      };
    } else if (chipsStr === '4') {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        label: '4 Fichas'
      };
    } else {
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        label: chipsStr || 'N/A'
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
      {config.label}
    </Badge>
  );
}
