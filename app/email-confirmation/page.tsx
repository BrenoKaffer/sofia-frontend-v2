'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function EmailConfirmationContent() {
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar se há um email nos parâmetros da URL
    const email = searchParams.get('email');
    if (email) {
      setUserEmail(email);
    }

    // Verificar se o usuário já está logado e confirmado
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email_confirmed_at) {
        setIsConfirmed(true);
        toast.success('Email confirmado com sucesso!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    };

    checkUser();

    // Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setIsConfirmed(true);
        toast.success('Email confirmado com sucesso!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, searchParams]);

  const handleResendEmail = async () => {
    if (resendCount >= 3) {
      toast.error('Limite de reenvios atingido. Aguarde alguns minutos antes de tentar novamente.');
      return;
    }

    setIsResending(true);
    
    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Erro ao reenviar email:', data.error);
        if (data.error === 'User not found') {
          toast.error('Email não encontrado.');
        } else {
          toast.error(data.error || 'Erro ao reenviar email de confirmação');
        }
      } else {
        setResendCount(prev => prev + 1);
        toast.success('Email de confirmação reenviado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            {isConfirmed ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto"
                >
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </motion.div>
                <CardTitle className="text-2xl font-heading text-green-600 dark:text-green-400">
                  Email confirmado!
                </CardTitle>
                <CardDescription className="font-sans">
                  Sua conta foi ativada com sucesso. Redirecionando para o dashboard...
                </CardDescription>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mx-auto"
                >
                  <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </motion.div>
                <CardTitle className="text-2xl font-heading">
                  Confirme seu Email
                </CardTitle>
                <CardDescription className="font-sans">
                  Enviamos um link de confirmação para{' '}
                  <span className="font-medium text-foreground">
                    {userEmail || 'seu email'}
                  </span>
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!isConfirmed && (
              <>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Instruções:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Verifique sua caixa de entrada</li>
                        <li>• Verifique a pasta de spam/lixo eletrônico</li>
                        <li>• Clique no link de confirmação no email</li>
                        <li>• Retorne a esta página após confirmar</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    disabled={isResending || resendCount >= 3}
                    variant="outline"
                    className="w-full"
                  >
                    {isResending ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    {isResending ? 'Reenviando...' : 'Reenviar Email'}
                  </Button>

                  {resendCount > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Emails enviados: {resendCount}/3
                    </p>
                  )}
                </div>

                <div className="text-center text-sm font-sans space-y-2">
                  <p className="text-muted-foreground">
                    Já confirmou seu email?
                  </p>
                  <button
                    onClick={async () => {
                      // 1. Tentar logout via Supabase
                      await supabase.auth.signOut();
                      
                      // 2. Limpar cookies manualmente para garantir (Middleware lê estes)
                      document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      document.cookie = "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      document.cookie = "sofia_status=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      document.cookie = "sofia_plan=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      document.cookie = "sofia_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      
                      // 3. Forçar recarregamento completo para /login
                      window.location.href = '/login';
                    }}
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer"
                  >
                    Fazer Login
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}

            {isConfirmed && (
              <div className="text-center">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ir para Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function EmailConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <EmailConfirmationContent />
    </Suspense>
  );
}
