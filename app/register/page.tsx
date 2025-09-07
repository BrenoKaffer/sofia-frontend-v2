'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
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

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (!acceptTerms) {
      toast.error('Você deve aceitar os termos de uso');
      setIsLoading(false);
      return;
    }

    try {
      const success = await register(name, email, password);
      if (success) {
        toast.success('Conta criada com sucesso!');
        router.push('/dashboard');
      } else {
        toast.error('Erro ao criar conta');
      }
    } catch (error) {
      toast.error('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div 
          className="w-full max-w-md space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-sans">
                SOFIA
              </h1>
            </div>
            <p className="text-muted-foreground font-sans">
              Sistema de Operação de Fichas Inteligentes
            </p>
            <div className="absolute top-4 right-4">
              <ThemeToggle />
            </div>
          </div>

          {/* Register Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold font-sans">Criar Conta</CardTitle>
              <CardDescription className="font-sans">
                Junte-se à SOFIA e comece a lucrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-sans">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 font-sans"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-sans">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 font-sans"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-sans">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10 font-sans"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-sans">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 pr-10 font-sans"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm font-sans">
                    Aceito os{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      termos de uso
                    </Link>
                    {' '}e{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      política de privacidade
                    </Link>
                  </Label>
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
                  <span className="font-sans">{isLoading ? 'Criando conta...' : 'Criar Conta'}</span>
                </Button>
                
                <div className="text-center text-sm font-sans">
                  <span className="text-muted-foreground">Já tem uma conta? </span>
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Faça login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground font-sans">
              Para teste, use qualquer email e senha válidos
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Marketing/Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_70%)]" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold leading-tight font-sans">
              Comece sua jornada
              <span className="block text-accent">rumo ao sucesso</span>
            </h2>
            
            <p className="text-lg text-white/90 leading-relaxed font-sans">
              Junte-se a milhares de usuários que já descobriram o poder da inteligência artificial aplicada à análise de roleta.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="font-sans">Conta gratuita para começar</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="font-sans">Acesso a todas as funcionalidades</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="font-sans">Suporte técnico especializado</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}