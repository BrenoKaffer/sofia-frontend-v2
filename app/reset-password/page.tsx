'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
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
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const validatingRef = useRef(false);

  useEffect(() => {
    // Verificar se há parâmetros de recuperação de senha na URL
    const checkTokenValidity = async () => {
      // Evita validação duplicada em Strict Mode ou re-renders rápidos
      if (validatingRef.current) return;
      validatingRef.current = true;

      try {
        // Tentar pegar parâmetros da URL (query string)
        let error = searchParams.get('error');
        let errorCode = searchParams.get('error_code');
        let errorDescription = searchParams.get('error_description');
        let code = searchParams.get('code');
        let accessToken = searchParams.get('access_token');
        let refreshToken = searchParams.get('refresh_token');
        let type = searchParams.get('type');

        // Se não encontrou na query string, tentar pegar do hash (fragmento)
        if (!code && !accessToken && !error && typeof window !== 'undefined' && window.location.hash) {
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

        console.log('Debug Reset Password:', { 
          code: code ? 'present' : 'missing', 
          accessToken: accessToken ? 'present' : 'missing', 
          refreshToken: refreshToken ? 'present' : 'missing',
          type,
          error, 
          hash: typeof window !== 'undefined' ? window.location.hash : 'N/A' 
        });

        // Primeiro, verificar se há erros na URL
        if (error) {
          console.error('Erro na URL:', { error, errorCode, errorDescription });
          setIsValidToken(false);
          
          // Mostrar mensagem específica baseada no tipo de erro
          if (errorCode === 'otp_expired' || error === 'access_denied') {
            toast.error('Link de recuperação expirado ou inválido');
          } else {
            toast.error('Erro no link de recuperação: ' + (errorDescription || error));
          }
          return;
        }

        // Função auxiliar para timeout
        const withTimeout = <T,>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout na operação')), ms)
            )
          ]);
        };

        // Verificar tokens válidos
        
        // 1. Caso PKCE (Code Flow)
        if (code) {
          try {
            // Usando timeout para evitar hang infinito
            const { error } = await withTimeout(supabase.auth.exchangeCodeForSession(code));
            
            if (error) {
              console.error('Erro ao trocar código por sessão:', error);
              setIsValidToken(false);
              // Mensagem amigável para erro comum de código já usado
              if (error.message?.includes('Flow state not found') || error.message?.includes('code has expired')) {
                toast.error('Este link já foi utilizado ou expirou. Solicite um novo.');
              } else {
                toast.error('Código de recuperação inválido ou expirado');
              }
            } else {
              setIsValidToken(true);
            }
          } catch (error: any) {
            console.error('Erro ao processar código:', error);
            setIsValidToken(false);
            if (error.message === 'Timeout na operação') {
               toast.error('Tempo limite excedido ao validar o código. Tente novamente.');
            } else {
               toast.error('Erro ao processar link de recuperação');
            }
          }
          return;
        }

        // 2. Caso Implicit Flow (Hash com tokens)
        if (type === 'recovery' && accessToken) {
          // Mesmo se refresh_token estiver faltando, tentamos validar apenas com access_token se possível,
          // mas setSession exige refresh_token. 
          // Se refresh_token estiver faltando, assumimos erro.
          if (!refreshToken) {
             console.error('Refresh token ausente no link de recuperação');
             setIsValidToken(false);
             toast.error('Link de recuperação incompleto (refresh token ausente)');
             return;
          }

          try {
            console.log('Tentando definir sessão com tokens da URL...');
            // Tenta estabelecer a sessão com os tokens fornecidos
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Erro ao validar token via setSession:', error);
              throw error; // Lança o erro para o catch
            } 
            
            console.log('Sessão definida com sucesso');
            setIsValidToken(true);
            
          } catch (error: any) {
            console.error('Erro ao processar token (catch):', error);
            
            // Tentativa de fallback: verificar se o usuário já está logado apesar do erro
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              console.log('Recuperação via fallback: Usuário autenticado encontrado');
              setIsValidToken(true);
            } else {
              setIsValidToken(false);
              toast.error('Link de recuperação inválido ou expirado');
            }
          }
          return;
        } 

        // 3. Caso nenhum token encontrado
        console.warn('Nenhum token de recuperação encontrado na URL');
        setIsValidToken(false);
        // Não mostrar toast se já foi mostrado um erro específico
        if (!error) {
          // toast.error('Link de recuperação inválido (nenhum token encontrado)');
        }

      } catch (err) {
        console.error('Erro inesperado na validação do token:', err);
        setIsValidToken(false);
        toast.error('Erro inesperado ao validar link');
      }
    };

    checkTokenValidity();
    
    // Fallback de segurança global para garantir que a UI não fique travada
    const timeoutId = setTimeout(() => {
      setIsValidToken((current) => {
        if (current === null) {
          console.warn('Timeout global na validação do token');
          // Só mostra toast se ainda não tiver validado
          if (validatingRef.current) {
             toast.error('Tempo limite excedido na validação');
          }
          return false;
        }
        return current;
      });
    }, 15000); // 15 segundos (fallback final)

    return () => clearTimeout(timeoutId);
  }, [searchParams, supabase.auth]);

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
    setIsLoading(true);

    if (!password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Erro ao redefinir senha:', error);
        toast.error(error.message || 'Erro ao redefinir senha');
        return;
      }

      setIsPasswordReset(true);
      toast.success('Senha redefinida com sucesso!');
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Erro interno do servidor');
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
              {searchParams.get('error_code') === 'otp_expired' 
                ? 'O link de recuperação expirou'
                : 'O link de recuperação é inválido ou expirou'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6 font-sans">
              {searchParams.get('error_code') === 'otp_expired'
                ? 'Links de recuperação têm validade limitada por segurança. Solicite um novo link para continuar.'
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
