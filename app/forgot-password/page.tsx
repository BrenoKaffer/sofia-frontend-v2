'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Brain, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error('Por favor, insira seu email');
      setIsLoading(false);
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Por favor, insira um email válido');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Erro ao enviar email de recuperação:', error);
        if (error.message.includes('User not found')) {
          toast.error('Email não encontrado em nossa base de dados');
        } else {
          toast.error(error.message || 'Erro ao enviar email de recuperação');
        }
        return;
      }

      setIsEmailSent(true);
      toast.success('Email de recuperação enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error('Erro ao reenviar email');
        return;
      }

      toast.success('Email reenviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao reenviar email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-accent/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="absolute top-6 right-6 z-50">
            <ThemeToggle />
          </div>
          
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl mb-4"
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SOFIA
            </h1>
            <p className="text-muted-foreground mt-2 font-sans">
              Sistema de Operação de Fichas Inteligentes
            </p>
          </div>

          <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              {!isEmailSent ? (
                <>
                  <CardTitle className="text-2xl font-heading">Esqueceu sua senha?</CardTitle>
                  <CardDescription className="font-sans">
                    Digite seu email para receber as instruções de recuperação
                  </CardDescription>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4 mx-auto"
                  >
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <CardTitle className="text-2xl font-heading">Email enviado!</CardTitle>
                  <CardDescription className="font-sans">
                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {!isEmailSent ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-sans">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    <span className="font-sans">
                      {isLoading ? 'Enviando...' : 'Enviar instruções'}
                    </span>
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors font-sans"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Voltar para o login
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground font-sans">
                      Enviamos as instruções para:
                    </p>
                    <p className="font-medium text-primary font-sans">{email}</p>
                    <p className="text-sm text-muted-foreground font-sans">
                      Não recebeu o email? Verifique sua pasta de spam ou clique no botão abaixo para reenviar.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleResendEmail}
                      variant="outline"
                      className="w-full h-11"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      <span className="font-sans">
                        {isLoading ? 'ReEnviando...' : 'reenviar email'}
                      </span>
                    </Button>

                    <Button
                      onClick={() => setIsEmailSent(false)}
                      variant="ghost"
                      className="w-full h-11"
                    >
                      <span className="font-sans">Tentar outro email</span>
                    </Button>
                  </div>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors font-sans"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Voltar para o login
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1932&q=80')] bg-cover bg-center opacity-10" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <h2 className="text-4xl font-heading font-bold mb-6">
              Recupere seu acesso
              <br />
              <span className="text-accent">de forma segura.</span>
            </h2>
            <p className="text-xl opacity-90 leading-relaxed font-sans">
              Enviaremos instruções detalhadas para seu email para que você possa 
              redefinir sua senha com total segurança.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-12 grid grid-cols-1 gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Email Seguro</h3>
                <p className="text-sm opacity-75 font-sans">Link de recuperação criptografado</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Processo Simples</h3>
                <p className="text-sm opacity-75 font-sans">Recuperação em poucos cliques</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
