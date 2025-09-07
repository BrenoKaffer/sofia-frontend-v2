'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/auth-context';
import { SofiaProvider } from '@/contexts/sofia-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        <SofiaProvider>
          {children}
        </SofiaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}