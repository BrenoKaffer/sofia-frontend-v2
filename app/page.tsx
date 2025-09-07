'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasRedirected) {
      setHasRedirected(true);
      
      // Usar setTimeout para evitar problemas de hidratação
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, hasRedirected]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Carregando SOFIA...</p>
      </div>
    </div>
  );
}