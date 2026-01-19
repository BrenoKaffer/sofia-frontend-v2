'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (ready && !token) router.replace('/auth/sign-in');
  }, [token, ready, router]);
  return <>{children}</>;
}
