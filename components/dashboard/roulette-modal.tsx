'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, X } from 'lucide-react';

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  strategyName?: string;
  suggestedBets?: (string | number)[];
}

export function RouletteModal({ 
  isOpen, 
  onClose, 
  tableId, 
  strategyName, 
  suggestedBets = [] 
}: RouletteModalProps) {
  // URL configurável - por enquanto usando um placeholder
  // Esta URL será configurável nas configurações do usuário
  const rouletteUrl = `https://example-casino.com/roulette/${tableId}`;
  
  const getRouletteNumberColor = (number: number): string => {
    if (number === 0) return 'bg-green-600';
    if ([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(number)) {
      return 'bg-red-600';
    }
    return 'bg-black';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-xl font-urbanist">
                Mesa {tableId}
              </DialogTitle>
              {strategyName && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {strategyName}
                  </Badge>
                  {suggestedBets.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Apostas:</span>
                      <div className="flex gap-1">
                        {suggestedBets.slice(0, 6).map((bet, index) => (
                          <div
                            key={index}
                            className={`w-6 h-6 ${getRouletteNumberColor(typeof bet === 'string' ? parseInt(bet) : bet)} text-white text-xs font-bold rounded-full flex items-center justify-center`}
                          >
                            {bet}
                          </div>
                        ))}
                        {suggestedBets.length > 6 && (
                          <div className="w-6 h-6 bg-muted rounded-full text-muted-foreground text-xs flex items-center justify-center">
                            +{suggestedBets.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(rouletteUrl, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir em Nova Aba
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Fechar
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-6">
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            {/* Placeholder para o iframe da roleta */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Carregando Mesa {tableId}</h3>
                <p className="text-sm text-muted-foreground">
                  O iframe da roleta será configurado nas configurações
                </p>
                <p className="text-xs text-muted-foreground">
                  URL: {rouletteUrl}
                </p>
              </div>
            </div>
            
            {/* Quando implementado, substituir por: */}
            {/* 
            <iframe
              src={rouletteUrl}
              className="w-full h-full rounded-lg border-0"
              title={`Mesa ${tableId}`}
              allow="fullscreen"
            />
            */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RouletteModal;