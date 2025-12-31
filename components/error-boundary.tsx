'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Capturar erro no Sentry
    const errorId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: 'ErrorBoundary',
      },
    });

    this.setState({ errorId });

    // Callback personalizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  handleReportFeedback = () => {
    if (this.state.errorId) {
      Sentry.showReportDialog({ eventId: this.state.errorId });
    }
  };

  openSupportEmail = () => {
    const to = 'suporte@v1sofia.com';
    const subject = encodeURIComponent(`SOFIA - Reporte de erro${this.state.errorId ? ` (${this.state.errorId})` : ''}`);
    const bodyParts = [
      'Descreva o que estava fazendo quando o erro ocorreu:',
      '',
      `URL: ${typeof window !== 'undefined' ? window.location.href : ''}`,
      `Erro ID: ${this.state.errorId || 'N/A'}`,
      `Agente: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`,
    ];
    const body = encodeURIComponent(bodyParts.join('\n'));
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;
    const win = window.open(gmailUrl, '_blank');
    if (!win) {
      window.location.href = mailtoUrl;
    }
  };

  render() {
    if (this.state.hasError) {
      // Renderizar fallback personalizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Renderizar UI de erro padrão
      return (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-[2147483646] pointer-events-auto">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Algo deu errado
              </CardTitle>
              <CardDescription className="text-gray-600">
                Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-md bg-red-50 p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Detalhes do erro (desenvolvimento):
                  </h4>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap break-all">
                    {this.state.error.message}
                  </pre>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>

                {this.state.errorId && (
                  <Button
                    onClick={this.handleReportFeedback}
                    variant="outline"
                    className="w-full"
                  >
                    Reportar problema
                  </Button>
                )}
                <Button
                  onClick={this.openSupportEmail}
                  variant="outline"
                  className="w-full"
                >
                  Enviar email ao suporte
                </Button>

                <Button
                  onClick={() => window.location.href = '/'}
                  variant="ghost"
                  className="w-full"
                >
                  Voltar ao início
                </Button>
              </div>

              {this.state.errorId && (
                <p className="text-xs text-gray-500 text-center">
                  ID do erro: {this.state.errorId}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook para usar Error Boundary de forma mais conveniente
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    Sentry.captureException(error, {
      extra: errorInfo,
      tags: {
        component: 'useErrorHandler',
      },
    });
  }, []);

  return { handleError };
}

// Componente wrapper para facilitar o uso
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
