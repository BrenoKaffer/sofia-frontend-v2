'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Play, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnboardingTriggerProps {
  userId?: string;
  userEmail?: string;
}

export function OnboardingTrigger({ userId, userEmail }: OnboardingTriggerProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar se é um novo usuário
    const checkNewUser = () => {
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      const lastLoginDate = localStorage.getItem('last_login_date');
      const today = new Date().toDateString();

      // Se nunca completou o onboarding ou é o primeiro login do dia
      if (!onboardingCompleted || lastLoginDate !== today) {
        setIsNewUser(true);
        
        // Se nunca completou o onboarding, mostrar modal de boas-vindas
        if (!onboardingCompleted) {
          setTimeout(() => {
            setShowWelcome(true);
          }, 1500); // Delay para não aparecer imediatamente
        }
      }

      // Atualizar data do último login
      localStorage.setItem('last_login_date', today);
    };

    checkNewUser();
  }, [userId]);

  const startOnboarding = () => {
    setShowWelcome(false);
    router.push('/onboarding');
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowWelcome(false);
    setIsNewUser(false);
  };

  const restartOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    router.push('/onboarding');
  };

  return (
    <>
      {/* Modal de Boas-vindas para Novos Usuários */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Brain className="h-8 w-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              Bem-vindo à SOFIA! 🎉
            </DialogTitle>
            <DialogDescription className="text-center space-y-4">
              <span className="block">
                Olá{userEmail ? `, ${userEmail.split('@')[0]}` : ''}! Estamos muito felizes em tê-lo conosco.
              </span>
              <span className="block">
                A SOFIA é sua assistente inteligente para análise de padrões em roletas online. 
                Que tal fazer um tour rápido para conhecer todos os recursos?
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 mt-6">
            <Button 
              onClick={startOnboarding}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Tour Guiado (5 min)
            </Button>
            
            <Button 
              variant="outline" 
              onClick={skipOnboarding}
              className="w-full"
            >
              Pular por Agora
            </Button>
          </div>
          
          <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 mr-1" />
            Você pode acessar o tour a qualquer momento na Central de Ajuda
          </div>
        </DialogContent>
      </Dialog>

      {/* Botão Flutuante para Reiniciar Onboarding (apenas para usuários que já completaram) */}
      {!isNewUser && (
        <div className="fixed bottom-4 right-4 z-50">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 3, duration: 0.3 }}
          >
            <Card className="w-80 shadow-lg border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm">Precisa de Ajuda?</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsNewUser(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs mb-3">
                  Quer relembrar como usar a SOFIA? Refaça o tour guiado!
                </CardDescription>
                <Button 
                  size="sm" 
                  onClick={restartOnboarding}
                  className="w-full text-xs h-8"
                  variant="outline"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Refazer Tour
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </>
  );
}

// Hook para verificar status do onboarding
export function useOnboardingStatus() {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed') === 'true';
    const firstVisit = localStorage.getItem('first_visit_date');
    
    setIsCompleted(completed);
    setIsFirstVisit(!firstVisit);

    // Marcar primeira visita
    if (!firstVisit) {
      localStorage.setItem('first_visit_date', new Date().toISOString());
    }
  }, []);

  const markAsCompleted = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsCompleted(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    setIsCompleted(false);
  };

  return {
    isCompleted,
    isFirstVisit,
    markAsCompleted,
    resetOnboarding
  };
}