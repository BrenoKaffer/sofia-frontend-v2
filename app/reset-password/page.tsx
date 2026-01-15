'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [errorState, setErrorState] = useState<{ code: string | null; description: string | null }>({ code: null, description: null });
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const validatingRef = useRef(false);

  const runWithTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout em ${label} após ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkTokenValidity = async () => {
      if (validatingRef.current) return;
      validatingRef.current = true;

      try {
        let error = searchParams.get('error');
        let errorCode = searchParams.get('error_code');
        let errorDescription = searchParams.get('error_description');
        let code = searchParams.get('code');
        let accessToken = searchParams.get('access_token');
        let refreshToken = searchParams.get('refresh_token');
        let type = searchParams.get('type');

        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1); // remove o #
          const params = new URLSearchParams(hash);
          
          error = params.get('error') || error;
          errorCode = params.get('error_code') || errorCode;
          errorDescription = params.get('error_description') || errorDescription;
          code = params.get('code') || code;
          accessToken = params.get('access_token') || accessToken;
          refreshToken = params.get('refresh_token') || refreshToken;
          type = params.get('type') || type;
        }

        console.log('Debug Reset Password:', JSON.stringify({ 
          code: code ? 'present' : 'missing', 
          accessToken: accessToken ? 'present' : 'missing', 
          refreshToken: refreshToken ? 'present' : 'missing',
          type,
          error, 
          hashLength: typeof window !== 'undefined' ? window.location.hash.length : 0
        }, null, 2));

        if (error) {
          console.error('Erro na URL:', { error, errorCode, errorDescription });
          setIsValidToken(false);
          setErrorState({ code: errorCode, description: errorDescription });
          
          if (errorCode === 'otp_expired' || error === 'access_denied') {
            toast.error('Link de recuperação expirado (uso único)');
          } else {
            toast.error('Erro no link de recuperação: ' + (errorDescription || error));
          }
          return;
        }

        if (code) {
          setIsValidToken(true);
          return;
        }

        if (accessToken && (type === 'recovery' || type === 'magiclink' || type === 'invite')) {
          console.log('Tokens de recuperação encontrados na URL. Marcando link como potencialmente válido.');
          setRecoveryToken(accessToken);
          setIsValidToken(true);
          return;
        }

        console.warn('Nenhum token de recuperação encontrado na URL');
        setIsValidToken(false);

      } catch (err: any) {
        console.error('Erro inesperado na validação do token:', err);
        setIsValidToken(false);
      }
    };

    checkTokenValidity();
    
    const timeoutId = setTimeout(() => {
      setIsValidToken((current) => {
        if (current === true) return true;
        if (current === null) {
          console.warn('Timeout global na validação do token');
          if (validatingRef.current) {
            toast.error('Tempo limite excedido. Tente solicitar um novo link.');
          }
          return false;
        }
        return current;
      });
    }, 15000); 

    return () => {
        clearTimeout(timeoutId);
    };
  }, [searchParams, isMounted]); // Removido supabase.auth das deps

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const validatePassword = (password: string) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (password.length < minLength) {
      return 'A senha deve ter pelo menos 6 caracteres';
    }
    if (!hasUpperCase) {
      return 'A senha deve conter pelo menos uma letra maiúscula';
    }
    if (!hasLowerCase) {
      return 'A senha deve conter pelo menos uma letra minúscula';
    }
    if (!hasNumbers) {
      return 'A senha deve conter pelo menos um número';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    console.log('Iniciando redefinição de senha...');

    try {
      if (!recoveryToken) {
        throw new Error('Link de recuperação inválido ou expirado. Solicite um novo.');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: recoveryToken,
          password,
        }),
        signal: controller.signal,
      }).catch((err) => {
        if (err.name === 'AbortError') {
          throw new Error('O servidor demorou para responder. Verifique sua conexão e tente novamente.');
        }
        throw err;
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let payload: any = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        const message = payload?.error || 'Erro ao redefinir senha. Tente novamente.';
        throw new Error(message);
      }

      toast.success('Senha redefinida com sucesso!');
      setIsPasswordReset(true);
      
      if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/login');
      }
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error: any) {
      console.error('Erro no fluxo de redefinição:', error);
      console.error('Stack do erro de redefinição:', error.stack);
      
      let errorMessage = 'Erro ao redefinir senha. Tente novamente.';

      if (error.message) {
          errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando link de recuperação...</p>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="inline-flex items-center justify-center mb-2"
            >
              <div className="relative w-[240px] h-[60px] md:w-[280px] md:h-[70px] mx-auto">
                <Image
                  src="/logo_sofia.png"
                  alt="SOFIA"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>
            <p className="text-muted-foreground mt-2 font-sans">
              Sistema de Operação de Fichas Inteligentes e Autônomas
            </p>
          </div>
          <Card className="w-full">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4 mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-heading">Link Inválido</CardTitle>
            <CardDescription className="font-sans">
              {errorState.code === 'otp_expired' 
                ? 'O link de recuperação expirou ou já foi utilizado'
                : 'O link de recuperação é inválido ou expirou'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6 font-sans">
              {errorState.code === 'otp_expired'
                ? 'Por segurança, os links de recuperação são de uso único e expiram rapidamente. Por favor, solicite um novo link.'
                : 'Por favor, solicite um novo link de recuperação de senha.'
              }
            </p>
            <div className="space-y-3">
              <Link href="/forgot-password">
                <Button className="w-full">
                  Solicitar novo link
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Voltar para o login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Reset Password Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-accent/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="absolute top-6 right-6 z-50">
          </div>
          
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
              className="inline-flex items-center justify-center mb-2"
            >
              <div className="relative w-[240px] h-[60px] md:w-[280px] md:h-[70px] mx-auto">
                <Image
                  src="/logo_sofia.png"
                  alt="SOFIA"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>
            <p className="text-muted-foreground mt-2 font-sans">
              Sistema de Operação de Fichas Inteligentes e Autônomas
            </p>
          </div>

          <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              {!isPasswordReset ? (
                <>
                  <CardTitle className="text-2xl font-heading">Redefinir Senha</CardTitle>
                  <CardDescription className="font-sans">
                    Digite sua nova senha abaixo
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
                  <CardTitle className="text-2xl font-heading">Senha Redefinida!</CardTitle>
                  <CardDescription className="font-sans">
                    Sua senha foi alterada com sucesso. Você será redirecionado para o login.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {!isPasswordReset ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-sans">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Digite sua nova senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 pl-10 pr-10"
                        required
                        autoComplete="new-password"
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
                    <p className="text-xs text-muted-foreground font-sans">
                      Mínimo 6 caracteres com letras maiúsculas, minúsculas e números
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-sans">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirme sua nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 pl-10 pr-10"
                        required
                        autoComplete="new-password"
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

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    <span className="font-sans">
                      {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                    </span>
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground font-sans">
                    Redirecionando para a página de login...
                  </p>
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Ir para o login agora
                    </Button>
                  </Link>
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
              Nova senha,
              <br />
              <span className="text-accent">nova segurança.</span>
            </h2>
            <p className="text-xl opacity-90 leading-relaxed font-sans">
              Defina uma senha forte para manter sua conta protegida e 
              continuar aproveitando todos os recursos da SOFIA.
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
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Segurança Avançada</h3>
                <p className="text-sm opacity-75 font-sans">Criptografia de ponta a ponta</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Acesso Protegido</h3>
                <p className="text-sm opacity-75 font-sans">Sua conta sempre segura</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
