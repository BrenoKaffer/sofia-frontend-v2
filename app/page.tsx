'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-user';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpar timeout anterior se existir
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    if (isLoaded && !hasRedirected) {
      setHasRedirected(true);
      setIsRedirecting(true);
      
      // Implementar debounce para prevenir múltiplos redirecionamentos
      redirectTimeoutRef.current = setTimeout(() => {
        if (isSignedIn) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      }, 150); // Aumentado para 150ms para melhor debounce
    }

    // Cleanup function
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [isSignedIn, isLoaded, router, hasRedirected]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <LoadingOverlay 
        isVisible={isRedirecting} 
        message={isSignedIn ? "Redirecionando para o dashboard..." : "Redirecionando para o login..."} 
        variant="blur"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">
            {!isLoaded ? 'Carregando SOFIA...' : 'Redirecionando...'}
          </p>
        </div>
      </div>
    </>
  );
}