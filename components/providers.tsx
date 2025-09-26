'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/auth-context';
import { SofiaProvider } from '@/contexts/sofia-context';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
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
        </ThemeProvider>
      </AuthProvider>
  );
}