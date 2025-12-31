/**
 * Componente de Mapa de Calor para Roleta
 * Visualiza a frequência dos números da roleta em formato de mapa de calor
 */

'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RouletteNumber {
  number: number;
  frequency: number;
  lastSeen?: string;
  color: 'red' | 'black' | 'green';
}

interface RouletteHeatmapProps {
  data: RouletteNumber[];
  title?: string;
  description?: string;
  showStats?: boolean;
  className?: string;
}

// Layout padrão da roleta europeia
const ROULETTE_LAYOUT = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

// Números vermelhos na roleta
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Função para determinar a cor do número
const getNumberColor = (number: number): 'red' | 'black' | 'green' => {
  if (number === 0) return 'green';
  return RED_NUMBERS.includes(number) ? 'red' : 'black';
};

// Função para calcular a intensidade da cor baseada na frequência
const getHeatmapIntensity = (frequency: number, maxFrequency: number): number => {
  if (maxFrequency === 0) return 0;
  return Math.min(frequency / maxFrequency, 1);
};

// Função para obter a cor de fundo baseada na intensidade
const getBackgroundColor = (intensity: number, baseColor: 'red' | 'black' | 'green'): string => {
  const alpha = Math.max(0.1, intensity);
  
  switch (baseColor) {
    case 'red':
      return `rgba(239, 68, 68, ${alpha})`;
    case 'black':
      return `rgba(55, 65, 81, ${alpha})`;
    case 'green':
      return `rgba(34, 197, 94, ${alpha})`;
    default:
      return `rgba(107, 114, 128, ${alpha})`;
  }
};

export function RouletteHeatmap({ 
  data, 
  title = "Mapa de Calor da Roleta", 
  description = "Frequência dos números baseada no histórico",
  showStats = true,
  className = ""
}: RouletteHeatmapProps) {
  
  // Criar mapa de dados para acesso rápido
  const dataMap = useMemo(() => {
    const map = new Map<number, RouletteNumber>();
    data.forEach(item => {
      map.set(item.number, item);
    });
    return map;
  }, [data]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const frequencies = data.map(d => d.frequency);
    const maxFrequency = Math.max(...frequencies);
    const minFrequency = Math.min(...frequencies);
    const avgFrequency = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
    
    const hotNumbers = data
      .filter(d => d.frequency > avgFrequency * 1.2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
    
    const coldNumbers = data
      .filter(d => d.frequency < avgFrequency * 0.8)
      .sort((a, b) => a.frequency - b.frequency)
      .slice(0, 5);

    return {
      maxFrequency,
      minFrequency,
      avgFrequency: Math.round(avgFrequency * 100) / 100,
      hotNumbers,
      coldNumbers,
      totalSpins: frequencies.reduce((a, b) => a + b, 0)
    };
  }, [data]);

  // Renderizar célula do número
  const renderNumberCell = (number: number) => {
    const numberData = dataMap.get(number);
    const frequency = numberData?.frequency || 0;
    const baseColor = getNumberColor(number);
    const intensity = stats ? getHeatmapIntensity(frequency, stats.maxFrequency) : 0;
    const backgroundColor = getBackgroundColor(intensity, baseColor);
    
    const textColor = baseColor === 'black' || intensity > 0.5 ? 'white' : 'black';

    return (
      <TooltipProvider key={number}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
                w-12 h-12 flex items-center justify-center rounded-lg border-2 
                cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg
                ${baseColor === 'red' ? 'border-red-300' : baseColor === 'black' ? 'border-gray-400' : 'border-green-300'}
              `}
              style={{ 
                backgroundColor,
                color: textColor,
                fontWeight: intensity > 0.3 ? 'bold' : 'normal'
              }}
            >
              <span className="text-sm font-medium">{number}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-semibold">Número {number}</p>
              <p className="text-sm">Frequência: {frequency}</p>
              {numberData?.lastSeen && (
                <p className="text-xs text-gray-500">Último: {numberData.lastSeen}</p>
              )}
              {stats && (
                <p className="text-xs">
                  {frequency > stats.avgFrequency ? '🔥 Quente' : 
                   frequency < stats.avgFrequency ? '❄️ Frio' : '➖ Normal'}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zero separado */}
        <div className="flex justify-center">
          {renderNumberCell(0)}
        </div>

        {/* Grid principal da roleta */}
        <div className="space-y-2">
          {ROULETTE_LAYOUT.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-2">
              {row.map(number => renderNumberCell(number))}
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="flex justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Vermelho</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 rounded"></div>
            <span>Preto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Verde</span>
          </div>
        </div>

        {/* Estatísticas */}
        {showStats && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                Números Quentes
              </h4>
              <div className="space-y-1">
                {stats.hotNumbers.map((num, index) => (
                  <div key={num.number} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="w-8 h-6 text-xs">
                        {num.number}
                      </Badge>
                      #{index + 1}
                    </span>
                    <span className="font-medium">{num.frequency}x</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-blue-500" />
                Números Frios
              </h4>
              <div className="space-y-1">
                {stats.coldNumbers.map((num, index) => (
                  <div key={num.number} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="w-8 h-6 text-xs">
                        {num.number}
                      </Badge>
                      #{index + 1}
                    </span>
                    <span className="font-medium">{num.frequency}x</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-3 gap-4 pt-2 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.totalSpins}</p>
                <p className="text-sm text-gray-600">Total de Giros</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.avgFrequency}</p>
                <p className="text-sm text-gray-600">Média</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.maxFrequency}</p>
                <p className="text-sm text-gray-600">Máximo</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}