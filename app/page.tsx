'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-user';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (isLoaded && !hasRedirected) {
      setHasRedirected(true);
      
      // Usar setTimeout para evitar problemas de hidratação
      const timer = setTimeout(() => {
        if (isSignedIn) {
          router.replace('/dashboard');
        } else {
          router.replace('/sign-in');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, isLoaded, router, hasRedirected]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Carregando SOFIA...</p>
      </div>
    </div>
  );
}