import './globals.css';
import 'reactflow/dist/style.css';
import type { Metadata } from 'next';
import { Poppins, Bruno_Ace, Plus_Jakarta_Sans, Urbanist } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/error-boundary';
import { MonitoringProvider } from '@/components/providers/MonitoringProvider';
import ClientTransitionOverlayWithBackground from '@/components/layout/ClientTransitionOverlayWithBackground';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

const brunoAce = Bruno_Ace({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bruno-ace',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SOFIA | Sistema de Operação de Fichas Inteligentes e Autônomas',
  description: 'Inteligência artificial para análise de roleta online com padrões em tempo real',
  keywords: 'roleta, IA, padrões, apostas, análise, tempo real',
  icons: {
    icon: [
      { url: '/logo_sofia_claro.png', media: '(prefers-color-scheme: light)' },
      { url: '/logo_sofia.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: [
      { url: '/logo_sofia_claro.png', media: '(prefers-color-scheme: light)' },
      { url: '/logo_sofia.png', media: '(prefers-color-scheme: dark)' },
    ],
    shortcut: ['/logo_sofia_claro.png', '/logo_sofia.png'],
  },
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
    title: 'SOFIA | Sistema de Operação de Fichas Inteligentes e Autônomas',
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
      <body className={`${poppins.variable} ${brunoAce.variable} ${plusJakartaSans.variable} ${urbanist.variable} font-sans`} suppressHydrationWarning>
        <ErrorBoundary>
          <Providers>
            <MonitoringProvider>
              <ClientTransitionOverlayWithBackground />
              {children}
              <SpeedInsights />
              <Analytics />
              <Toaster position="top-right" />
            </MonitoringProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
