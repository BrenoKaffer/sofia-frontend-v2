'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processando verificação...');
  const [error, setError] = useState<string | null>(null);
  const [showManualAction, setShowManualAction] = useState(false);
  const [targetRoute, setTargetRoute] = useState('/dashboard');

  useEffect(() => {
    // Timeout de segurança para mostrar opção manual se demorar
    const timer = setTimeout(() => {
      setShowManualAction(true);
      if (status === 'Processando verificação...') {
        setStatus('A verificação está demorando mais que o esperado...');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('Iniciando processamento do callback...');
        
        // Extrair parâmetros primeiro para identificar o tipo de fluxo
        let code = searchParams.get('code');
        let token = searchParams.get('token');
        let type = searchParams.get('type');
        const emailParam = searchParams.get('email');
        const emailLS =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('pending_signup_email') || undefined
            : undefined;
        const email = emailParam || emailLS;

        let hashAccessToken: string | null = null;
        let hashRefreshToken: string | null = null;
        let hashError: string | null = null;
        let hashErrorCode: string | null = null;
        let hashType: string | null = null;

        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hash);
          hashAccessToken = hashParams.get('access_token') || null;
          hashRefreshToken = hashParams.get('refresh_token') || null;
          hashError = hashParams.get('error') || null;
          hashErrorCode = hashParams.get('error_code') || null;
          hashType = hashParams.get('type') || null;
          // Se o hash tem "code" (PKCE), também capturar
          code = code || hashParams.get('code');
          token = token || hashParams.get('token');
          type = type || hashType || type;
        }

        console.log('Tipo de fluxo identificado:', type);

        // Verificar se já existe uma sessão válida antes de processar
        // MAS ignorar se for fluxo de recuperação de senha (precisa ir para reset-password)
        if (type !== 'recovery') {
          const { data: existingSession } = await supabase.auth.getSession();
          if (existingSession?.session) {
            console.log('Sessão existente encontrada, redirecionando...');
            toast.success('Sessão ativa recuperada!');
            router.replace('/dashboard');
            return;
          }
        }

        // Definir destino com base no tipo
        const finalTargetRoute = type === 'recovery' ? '/reset-password' : '/dashboard';
        setTargetRoute(finalTargetRoute);

        if (code) {
          setStatus('Trocando código por sessão...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          if (data?.session) {
            // Assegurar compatibilidade com o middleware (cookies de tokens)
            if (typeof document !== 'undefined') {
              const maxAge = 60 * 60 * 24 * 7; // 7 dias
              document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; samesite=lax`;
              document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${maxAge}; samesite=lax`;
            }
            toast.success('Login realizado com sucesso!');
            router.replace(finalTargetRoute);
            return;
          }
        }

        // Sessão no fragmento (#access_token) — fluxo implícito/magic
        if (hashAccessToken && hashRefreshToken) {
          setStatus('Configurando sessão...');
          const { data, error } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          });
          if (error) throw error;

          if (data?.session) {
            if (typeof document !== 'undefined') {
              const maxAge = 60 * 60 * 24 * 7;
              document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; samesite=lax`;
              document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${maxAge}; samesite=lax`;
            }
            toast.success('Login realizado com sucesso!');
            router.replace(finalTargetRoute);
            return;
          }

          // Fallback: tentar recuperar sessão se setSession não retornou imediatamente
          const { data: recovered } = await supabase.auth.getSession();
          if (recovered?.session) {
            if (typeof document !== 'undefined') {
              const maxAge = 60 * 60 * 24 * 7;
              document.cookie = `sb-access-token=${recovered.session.access_token}; path=/; max-age=${maxAge}; samesite=lax`;
              document.cookie = `sb-refresh-token=${recovered.session.refresh_token}; path=/; max-age=${maxAge}; samesite=lax`;
            }
            toast.success('Sessão criada com sucesso!');
            router.replace(finalTargetRoute);
            return;
          }

          setError('Não foi possível criar sessão automaticamente.');
          toast.error('Falha ao configurar sessão. Faça login novamente.');
          router.replace('/login');
          return;
        }

        if (token) {
          if (type === 'signup') {
            setStatus('Confirmando email...');
            if (!email) {
              setError('Email ausente no callback para confirmação.');
              router.replace('/email-confirmation');
              return;
            }
            const { data, error } = await supabase.auth.verifyOtp({
              type: 'signup',
              token,
              email,
            });
            if (error) throw error;

            // Tentar obter sessão após confirmação
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              if (typeof document !== 'undefined') {
                const maxAge = 60 * 60 * 24 * 7; // 7 dias
                document.cookie = `sb-access-token=${sessionData.session.access_token}; path=/; max-age=${maxAge}; samesite=lax`;
                document.cookie = `sb-refresh-token=${sessionData.session.refresh_token}; path=/; max-age=${maxAge}; samesite=lax`;
              }
              toast.success('Email confirmado e login realizado!');
              router.replace(finalTargetRoute);
            } else {
              toast.success('Email confirmado! Faça login para continuar.');
              router.replace('/login?verified=1');
            }
            return;
          }

          if (type === 'magiclink') {
            setStatus('Validando magic link...');
            if (!email) {
              setError('Email ausente no callback para magiclink.');
              router.replace('/login');
              return;
            }
            const { data, error } = await supabase.auth.verifyOtp({
              type: 'magiclink',
              token,
              email,
            });
            if (error) throw error;

            if (data?.session) {
              if (typeof document !== 'undefined') {
                const maxAge = 60 * 60 * 24 * 7; // 7 dias
                document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; samesite=lax`;
                document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${maxAge}; samesite=lax`;
              }
              toast.success('Login realizado com sucesso!');
              router.replace(finalTargetRoute);
              return;
            }
          }
        }

        // Erros vindos via hash
        if (hashError) {
          setError(hashErrorCode || hashError);
          toast.error('Falha ao processar autenticação.');
          router.replace('/login');
          return;
        }

        setStatus('Parâmetros ausentes. Redirecionando para login...');
        router.replace('/login');
      } catch (e: any) {
        console.error('Erro no callback de autenticação:', e);
        setError(e?.message || 'Erro ao processar autenticação.');
        toast.error('Falha ao processar autenticação.');
        router.replace('/login');
      }
    };

    processCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">{status}</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        
        {showManualAction && (
          <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-xs text-muted-foreground mb-2">
              Se não for redirecionado automaticamente:
            </p>
            <Button 
              onClick={() => router.push(targetRoute)}
              variant="outline"
              size="sm"
            >
              {targetRoute === '/reset-password' ? 'Redefinir Senha' : 'Ir para o Dashboard'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
