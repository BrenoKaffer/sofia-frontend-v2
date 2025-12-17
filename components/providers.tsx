'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/auth-context';
import { SofiaProvider } from '@/contexts/sofia-context';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  // Em desenvolvimento, desregistrar Service Workers e limpar caches para evitar referências antigas (ex: /@vite/client)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => regs.forEach((r) => r.unregister()))
          .catch(() => {});
      }
      if (typeof caches !== 'undefined') {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .catch(() => {});
      }
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        <SofiaProvider>
          <AnalyticsProvider
            config={{
              enablePerformanceTracking: true,
              enableEngagementTracking: true,
              enableErrorTracking: true,
              enableAutoPageTracking: true,
              sampleRate: 1.0,
            }}
          >
            {children}
          </AnalyticsProvider>
        </SofiaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
