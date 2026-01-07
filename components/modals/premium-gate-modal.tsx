'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Shield, BarChart3, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PremiumGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function PremiumGateModal({ isOpen, onClose, featureName }: PremiumGateModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    // Redireciona para o checkout do plano premium
    window.location.href = 'https://pay.v1sofia.com/?plan=premium&price_id=sofia-premium-mensal';
  };

  const handleViewPlans = () => {
    router.push('/account/upgrade');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-border">
        {/* Header Visual */}
        <div className="relative h-32 bg-gradient-to-r from-emerald-900 to-emerald-950 flex items-center justify-center overflow-hidden">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-20" 
               style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Crown className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-emerald-300 tracking-wider uppercase">Área Premium</span>
          </div>
        </div>

        <div className="px-6 pb-8 pt-2">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {featureName ? `Desbloqueie ${featureName}` : 'Desbloqueie o Poder Total'}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Essa funcionalidade faz parte do plano <span className="text-emerald-500 font-semibold">SOFIA PRO</span>, 
              criado para quem quer operar com consistência profissional, não com sorte.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="mt-0.5 min-w-[20px]">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-sm">
                <span className="font-medium text-foreground block mb-0.5">Automação Inteligente</span>
                <span className="text-muted-foreground text-xs">Execute estratégias 24/7 sem desgaste emocional.</span>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="mt-0.5 min-w-[20px]">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-sm">
                <span className="font-medium text-foreground block mb-0.5">Leitura de Contexto</span>
                <span className="text-muted-foreground text-xs">IA analisa o momento do mercado antes de entrar.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="mt-0.5 min-w-[20px]">
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-sm">
                <span className="font-medium text-foreground block mb-0.5">Gestão Profissional</span>
                <span className="text-muted-foreground text-xs">Proteção de capital e stop-loss automático.</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleUpgrade} 
              className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:scale-[1.02]"
            >
              Ativar SOFIA PRO
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleViewPlans}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Ver comparação de planos
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-muted-foreground/60 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Você continua usando o plano atual normalmente até decidir.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
