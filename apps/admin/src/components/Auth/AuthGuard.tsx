'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  useEffect(() => {
    if (!ready) return;

    if (isAuthPage) {
      if (token) router.replace('/dashboard');
    } else {
      if (!token) router.replace('/auth/sign-in');
    }
  }, [ready, token, router, isAuthPage]);

  if (isAuthPage) return <>{children}</>;
  if (!ready || !token) return null;
  return <>{children}</>;
}
