import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/error-boundary';
import { MonitoringProvider } from '@/components/providers/MonitoringProvider';

export const metadata: Metadata = {
  title: 'SOFIA - Sistema de Operação de Fichas Inteligentes',
  description: 'Inteligência artificial para análise de roleta online com padrões em tempo real',
  keywords: 'roleta, IA, padrões, apostas, análise, tempo real',
  authors: [{ name: 'SOFIA Team' }],
  creator: 'SOFIA Team',
  publisher: 'SOFIA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sofia-ai.com'),
  openGraph: {
    title: 'SOFIA - Sistema de Operação de Fichas Inteligentes',
    description: 'Inteligência artificial para análise de roleta online',
    type: 'website',
    locale: 'pt_BR',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans">
        <ErrorBoundary>
          <MonitoringProvider>
            <Providers>
              {children}
              <Toaster position="top-right" />
            </Providers>
          </MonitoringProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}