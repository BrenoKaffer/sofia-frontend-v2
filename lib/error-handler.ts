import { toast } from 'sonner';
import React from 'react';

// Tipos de erro
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

// Severidade do erro
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Interface para erro customizado
export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

// Interface para log de erro
interface ErrorLog {
  id: string;
  error: AppError;
  stackTrace?: string;
  breadcrumbs: Breadcrumb[];
  environment: string;
  version: string;
}

// Interface para breadcrumb
interface Breadcrumb {
  timestamp: Date;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

// Classe principal para tratamento de erros
export class ErrorHandler {
  private static breadcrumbs: Breadcrumb[] = [];
  private static maxBreadcrumbs = 50;
  private static isProduction = process.env.NODE_ENV === 'production';

  // Adicionar breadcrumb
  static addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>) {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date(),
    });

    // Manter apenas os últimos breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  // Criar erro customizado
  static createError(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity,
    options?: {
      code?: string;
      statusCode?: number;
      context?: Record<string, any>;
      cause?: Error;
    }
  ): AppError {
    const error = new Error(message) as AppError;
    error.type = type;
    error.severity = severity;
    error.code = options?.code;
    error.statusCode = options?.statusCode;
    error.context = options?.context;
    error.timestamp = new Date();
    error.cause = options?.cause;

    // Adicionar informações do ambiente
    if (typeof window !== 'undefined') {
      error.userAgent = window.navigator.userAgent;
      error.url = window.location.href;
    }

    return error;
  }

  // Tratar erro
  static handle(error: Error | AppError, context?: Record<string, any>) {
    const appError = this.normalizeError(error, context);
    
    // Adicionar breadcrumb do erro
    this.addBreadcrumb({
      category: 'error',
      message: appError.message,
      level: 'error',
      data: {
        type: appError.type,
        severity: appError.severity,
        code: appError.code,
        context: appError.context,
      },
    });

    // Log do erro
    this.logError(appError);

    // Mostrar notificação para o usuário
    this.showUserNotification(appError);

    // Reportar erro (em produção)
    if (this.isProduction) {
      this.reportError(appError);
    }

    return appError;
  }

  // Normalizar erro
  private static normalizeError(error: Error | AppError, context?: Record<string, any>): AppError {
    if (this.isAppError(error)) {
      if (context) {
        error.context = { ...error.context, ...context };
      }
      return error;
    }

    // Determinar tipo e severidade baseado na mensagem/tipo do erro
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;

    if (error.message.includes('fetch') || error.message.includes('network')) {
      type = ErrorType.NETWORK;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
      type = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('403') || error.message.includes('forbidden')) {
      type = ErrorType.AUTHORIZATION;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      type = ErrorType.NOT_FOUND;
      severity = ErrorSeverity.LOW;
    } else if (error.message.includes('500') || error.message.includes('server')) {
      type = ErrorType.SERVER;
      severity = ErrorSeverity.CRITICAL;
    }

    return this.createError(error.message, type, severity, {
      context,
      cause: error,
    });
  }

  // Verificar se é AppError
  private static isAppError(error: any): error is AppError {
    return error && typeof error.type === 'string' && typeof error.severity === 'string';
  }

  // Log do erro
  private static logError(error: AppError) {
    const logData = {
      message: error.message,
      type: error.type,
      severity: error.severity,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      timestamp: error.timestamp,
      stack: error.stack,
      breadcrumbs: this.breadcrumbs.slice(-10), // Últimos 10 breadcrumbs
    };

    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      console.error('🚨 Erro crítico:', logData);
    } else if (error.severity === ErrorSeverity.MEDIUM) {
      console.warn('⚠️ Erro médio:', logData);
    } else {
      console.info('ℹ️ Erro baixo:', logData);
    }
  }

  // Mostrar notificação para o usuário
  private static showUserNotification(error: AppError) {
    const userMessage = this.getUserFriendlyMessage(error);

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(userMessage, {
          duration: 10000,
          action: {
            label: 'Recarregar',
            onClick: () => window.location.reload(),
          },
        });
        break;
      case ErrorSeverity.HIGH:
        toast.error(userMessage, { duration: 8000 });
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(userMessage, { duration: 5000 });
        break;
      case ErrorSeverity.LOW:
        toast.info(userMessage, { duration: 3000 });
        break;
    }
  }

  // Obter mensagem amigável para o usuário
  private static getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Problema de conexão. Verifique sua internet e tente novamente.';
      case ErrorType.AUTHENTICATION:
        return 'Sessão expirada. Faça login novamente.';
      case ErrorType.AUTHORIZATION:
        return 'Você não tem permissão para esta ação.';
      case ErrorType.NOT_FOUND:
        return 'Recurso não encontrado.';
      case ErrorType.SERVER:
        return 'Erro no servidor. Tente novamente em alguns minutos.';
      case ErrorType.VALIDATION:
        return error.message || 'Dados inválidos. Verifique as informações.';
      default:
        return 'Algo deu errado. Tente novamente.';
    }
  }

  // Reportar erro (para serviços externos)
  private static async reportError(error: AppError) {
    try {
      // Aqui você pode integrar com serviços como Sentry, LogRocket, etc.
      const errorLog: ErrorLog = {
        id: crypto.randomUUID(),
        error,
        stackTrace: error.stack,
        breadcrumbs: this.breadcrumbs,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      };

      // Exemplo de envio para endpoint de logging
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog),
      }).catch(() => {
        // Falha silenciosa no envio de logs
      });
    } catch {
      // Falha silenciosa no reporte de erro
    }
  }

  // Limpar breadcrumbs
  static clearBreadcrumbs() {
    this.breadcrumbs = [];
  }

  // Obter breadcrumbs
  static getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }
}

// Hook para usar tratamento de erros em componentes
export function useErrorHandler() {
  const handleError = (error: Error | AppError, context?: Record<string, any>) => {
    return ErrorHandler.handle(error, context);
  };

  const addBreadcrumb = (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
    ErrorHandler.addBreadcrumb(breadcrumb);
  };

  return {
    handleError,
    addBreadcrumb,
  };
}

// Wrapper para async functions com tratamento de erro
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw ErrorHandler.handle(error as Error, context);
    }
  };
}

// Wrapper para componentes React com error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: AppError; retry: () => void }>
) {
  return function WrappedComponent(props: P) {
    const [error, setError] = React.useState<AppError | null>(null);

    const retry = () => {
      setError(null);
    };

    if (error) {
      if (fallback) {
        const FallbackComponent = fallback;
        return React.createElement(FallbackComponent, { error, retry });
      }

      return React.createElement(
        'div',
        { className: 'p-4 border border-red-200 rounded-lg bg-red-50' },
        React.createElement('h3', { className: 'text-red-800 font-semibold' }, 'Algo deu errado'),
        React.createElement('p', { className: 'text-red-600 text-sm mt-1' }, error.message),
        React.createElement(
          'button',
          {
            onClick: retry,
            className: 'mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700'
          },
          'Tentar novamente'
        )
      );
    }

    try {
      return React.createElement(Component, props);
    } catch (error) {
      const appError = ErrorHandler.handle(error as Error);
      setError(appError);
      return null;
    }
  };
}

// Utilitários para tipos específicos de erro
export const ErrorUtils = {
  // Erro de rede
  network: (message: string, context?: Record<string, any>) =>
    ErrorHandler.createError(message, ErrorType.NETWORK, ErrorSeverity.HIGH, { context }),

  // Erro de API
  api: (message: string, statusCode: number, context?: Record<string, any>) =>
    ErrorHandler.createError(message, ErrorType.API, ErrorSeverity.MEDIUM, { statusCode, context }),

  // Erro de validação
  validation: (message: string, context?: Record<string, any>) =>
    ErrorHandler.createError(message, ErrorType.VALIDATION, ErrorSeverity.LOW, { context }),

  // Erro de autenticação
  auth: (message: string, context?: Record<string, any>) =>
    ErrorHandler.createError(message, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH, { context }),

  // Erro crítico
  critical: (message: string, context?: Record<string, any>) =>
    ErrorHandler.createError(message, ErrorType.SERVER, ErrorSeverity.CRITICAL, { context }),
};

export default ErrorHandler;