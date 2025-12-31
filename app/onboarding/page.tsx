'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  BarChart3, 
  Target, 
  Shield, 
  Zap,
  TrendingUp,
  Users,
  Settings,
  Play,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  content: React.ReactNode;
  icon: React.ComponentType<any>;
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Bem-vindo à SOFIA',
    description: 'Sua assistente inteligente para análise de padrões em roletas online',
    icon: Brain,
    color: 'from-purple-500 to-blue-500',
    content: (
      <div className="text-center space-y-6">
        <div className="mx-auto w-32 h-32 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <Brain className="h-16 w-16 text-white" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Bem-vindo à SOFIA
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            SOFIA é uma plataforma avançada que utiliza inteligência artificial para identificar padrões em roletas online e maximizar suas chances de sucesso.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium">IA Avançada</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium">Análise em Tempo Real</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: 'Dashboard Principal',
    description: 'Seu centro de controle para monitoramento e análise',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500',
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Dashboard Principal</h3>
          <p className="text-muted-foreground mb-6">
            Aqui você encontra todas as informações importantes em tempo real
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Estatísticas de Performance</p>
                <p className="text-sm text-muted-foreground">Acompanhe seus resultados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Sinais Ativos</p>
                <p className="text-sm text-muted-foreground">Padrões identificados</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: 'Estratégias Inteligentes',
    description: 'Explore diferentes abordagens baseadas em dados',
    icon: Target,
    color: 'from-green-500 to-emerald-500',
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
            <Target className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Estratégias Inteligentes</h3>
          <p className="text-muted-foreground mb-6">
            Acesse estratégias testadas e validadas por nossa IA
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">Estratégias Conservadoras</span>
            <Badge variant="secondary">Baixo Risco</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <CheckCircle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">Estratégias Moderadas</span>
            <Badge variant="secondary">Risco Médio</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <CheckCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium">Estratégias Agressivas</span>
            <Badge variant="secondary">Alto Risco</Badge>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: 'Monitoramento em Tempo Real',
    description: 'Acompanhe as roletas e identifique oportunidades',
    icon: Shield,
    color: 'from-orange-500 to-red-500',
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Monitoramento em Tempo Real</h3>
          <p className="text-muted-foreground mb-6">
            Sistema avançado de detecção de padrões e alertas
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Mesa 1 - Ativa</span>
            </div>
            <p className="text-sm text-muted-foreground">Padrão detectado: Sequência vermelha</p>
          </div>
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Mesa 2 - Aguardando</span>
            </div>
            <p className="text-sm text-muted-foreground">Analisando histórico recente</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: 'Configurações Personalizadas',
    description: 'Ajuste a plataforma às suas preferências',
    icon: Settings,
    color: 'from-purple-500 to-pink-500',
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <Settings className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Configurações Personalizadas</h3>
          <p className="text-muted-foreground mb-6">
            Personalize sua experiência para máxima eficiência
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="font-medium">Notificações de Sinais</span>
            <div className="w-10 h-6 bg-blue-500 rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="font-medium">Modo Compacto</span>
            <div className="w-10 h-6 bg-gray-300 rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="font-medium">Tema Escuro</span>
            <div className="w-10 h-6 bg-blue-500 rounded-full relative">
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: 'Pronto para Começar!',
    description: 'Você está preparado para usar a SOFIA',
    icon: Play,
    color: 'from-green-500 to-blue-500',
    content: (
      <div className="text-center space-y-6">
        <div className="mx-auto w-32 h-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <CheckCircle className="h-16 w-16 text-white" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Tudo Pronto!
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Agora você conhece os principais recursos da SOFIA. Está pronto para começar a identificar padrões e maximizar seus resultados!
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Users className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-xs font-medium">Suporte 24/7</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Shield className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xs font-medium">100% Seguro</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Sparkles className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <p className="text-xs font-medium">IA Avançada</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const currentStepData = onboardingSteps[currentStep];

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    setIsCompleted(true);
    toast.success('Onboarding concluído com sucesso!');
    
    // Salvar no localStorage que o usuário completou o onboarding
    localStorage.setItem('onboarding_completed', 'true');
    
    // Redirecionar para o dashboard após 2 segundos
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    router.push('/dashboard');
  };

  useEffect(() => {
    // Verificar se o usuário já completou o onboarding
    const completed = localStorage.getItem('onboarding_completed');
    if (completed === 'true') {
      router.push('/dashboard');
    }
  }, [router]);

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="mx-auto w-32 h-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-16 w-16 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">Parabéns!</h1>
            <p className="text-xl text-gray-300">Redirecionando para o dashboard...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Skip Button */}
      <div className="absolute top-4 left-4 z-50">
        <Button 
          variant="ghost" 
          onClick={skipOnboarding}
          className="text-white hover:bg-white/10"
        >
          Pular Tutorial
        </Button>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">
              Passo {currentStep + 1} de {onboardingSteps.length}
            </span>
            <span className="text-sm text-gray-300">
              {Math.round(progress)}% concluído
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8 md:p-12">
                {currentStepData.content}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex space-x-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-white'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={nextStep}
            className={`bg-gradient-to-r ${currentStepData.color} text-white hover:opacity-90`}
          >
            {currentStep === onboardingSteps.length - 1 ? 'Finalizar' : 'Próximo'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}