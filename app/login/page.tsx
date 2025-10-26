'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2, Brain, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'framer-motion';
import { useLoadingState, LOADING_KEYS } from '@/lib/loading-states';
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/feature-flags';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  // Usar o sistema de loading states
  const { isLoading, startLoading, finishLoading, errorLoading } = useLoadingState(LOADING_KEYS.LOGIN);
  
  // Feature flags
  const enhancedAuthFlow = useFeatureFlag(FEATURE_FLAGS.ENHANCED_AUTH_FLOW);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      // Iniciar estado de carregamento (se feature flag estiver habilitada)
      if (enhancedAuthFlow) {
        startLoading('Verificando credenciais...');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        
        if (enhancedAuthFlow) {
          if (error.message.includes('Invalid login credentials')) {
            errorLoading('Credenciais inválidas. Verifique seu email e senha.');
          } else if (error.message.includes('Email not confirmed')) {
            errorLoading('Por favor, confirme seu email antes de fazer login.');
          } else {
            errorLoading(error.message || 'Erro ao fazer login');
          }
        } else {
          // Fallback para toast simples
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Credenciais inválidas. Verifique seu email e senha.');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Por favor, confirme seu email antes de fazer login.');
          } else {
            toast.error(error.message || 'Erro ao fazer login');
          }
        }
        return;
      }

      if (data.user) {
        if (enhancedAuthFlow) {
          finishLoading('Login realizado com sucesso!');
        } else {
          toast.success('Login realizado com sucesso!');
        }
        
        // Persistir token em cookie/localStorage para reconhecimento no middleware
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          if (token) {
            // Guardar no localStorage
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('auth_token', token);
            }
            // Definir cookie não httpOnly como fallback para o middleware
            const maxAge = rememberMe ? 60 * 60 * 24 * 30 : undefined; // 30 dias ou sessão
            const cookieParts = [
              `auth_token=${token}`,
              'Path=/',
              'SameSite=Lax',
            ];
            if (maxAge) cookieParts.push(`Max-Age=${maxAge}`);
            document.cookie = cookieParts.join('; ');
          }
        } catch (err) {
          console.warn('Falha ao persistir token em cookie/localStorage:', err);
        }
        
        // Adicionar pequeno delay para melhor UX
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, enhancedAuthFlow ? 500 : 100);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      
      if (enhancedAuthFlow) {
        errorLoading('Erro interno do servidor');
      } else {
        toast.error('Erro interno do servidor');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
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
              <CardTitle className="text-2xl font-heading">Bem-vindo de volta</CardTitle>
              <CardDescription className="font-sans">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-sans">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-sans">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-sans"
                    >
                      Lembrar-me
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline font-sans"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  <span className="font-sans">{isLoading ? 'Entrando...' : 'Entrar'}</span>
                </Button>
                
                <div className="text-center text-sm font-sans">
                  <span className="text-muted-foreground">Não tem uma conta? </span>
                  <Link
                    href="/register"
                    className="text-primary hover:underline font-medium"
                  >
                    Cadastre-se
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>



        </motion.div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1932&q=80')] bg-cover bg-center opacity-10" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <h2 className="text-4xl font-heading font-bold mb-6">
              A SOFIA pensa.
              <br />
              <span className="text-accent">Você apenas executa e lucra.</span>
            </h2>
            <p className="text-xl opacity-90 leading-relaxed font-sans">
              Inteligência artificial avançada para análise de roleta online.
              Padrões precisos em tempo real para maximizar seus resultados.
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
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">IA Avançada</h3>
                <p className="text-sm opacity-75 font-sans">Machine learning para análise precisa</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Tempo Real</h3>
                <p className="text-sm opacity-75 font-sans">Padrões instantâneos e precisos</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}