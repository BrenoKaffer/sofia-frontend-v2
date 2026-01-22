'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  if (pathname.startsWith('/auth')) return <>{children}</>;
  useEffect(() => {
    if (ready && !token) router.replace('/auth/sign-in');
  }, [token, ready, router]);
  if (!ready) return null;
  if (!token) return null;
  return <>{children}</>;
}
