'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processando verificação...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const emailParam = searchParams.get('email') || undefined;
        const emailLS =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('pending_signup_email') || undefined
            : undefined;
        const email = emailParam || emailLS;

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
            router.replace('/dashboard');
            return;
          }
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
              router.replace('/dashboard');
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
              router.replace('/dashboard');
              return;
            }
          }
        }

        // Nenhum parâmetro reconhecido, enviar para login
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
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">{status}</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
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
