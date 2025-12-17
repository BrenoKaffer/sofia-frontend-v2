/**
 * Utilitário para retry logic e tratamento de erros em chamadas de API
 */

// Interfaces para tipos específicos
export interface ApiErrorType {
  name?: string;
  message: string;
  status?: number;
  isTimeout?: boolean;
  isNetworkError?: boolean;
}

// Interfaces para configuração de retry
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: ApiErrorType | Error) => boolean;
  onRetry?: (attempt: number, error: ApiErrorType | Error) => void;
}

export interface ApiCallOptions extends RequestInit {
  timeout?: number;
  retryOptions?: RetryOptions;
}

/**
 * Classe para gerenciar erros de API
 */
export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public response?: Response;
  public isTimeout: boolean;
  public isNetworkError: boolean;

  constructor(
    message: string,
    status: number = 0,
    statusText: string = '',
    response?: Response,
    isTimeout: boolean = false,
    isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.isTimeout = isTimeout;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Função para determinar se um erro deve ser retentado
 */
function shouldRetry(error: ApiErrorType | Error): boolean {
  // Retry em casos de:
  // - Timeout
  // - Erro de rede
  // - Status 5xx (erro do servidor)
  // - Status 429 (rate limit)
  // - Status 408 (request timeout)
  if (error instanceof ApiError) {
    return (
      error.isTimeout ||
      error.isNetworkError ||
      error.status >= 500 ||
      error.status === 429 ||
      error.status === 408
    );
  }

  // Retry para erros de rede genéricos
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Retry para AbortError (timeout)
  if (error.name === 'AbortError') {
    return true;
  }

  return false;
}

/**
 * Função para calcular delay com backoff exponencial
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Função para fazer sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Função principal para fazer chamadas de API com retry logic
 */
export async function apiCallWithRetry(
  url: string,
  options: ApiCallOptions = {}
): Promise<Response> {
  const {
    timeout = 30000,
    retryOptions = {},
    ...fetchOptions
  } = options;

  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = shouldRetry,
    onRetry
  } = retryOptions;

  let lastError: ApiErrorType | Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Configurar timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Combinar signal do timeout com signal existente
      const signal = fetchOptions.signal
        ? AbortSignal.any([controller.signal, fetchOptions.signal])
        : controller.signal;

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal
        });

        clearTimeout(timeoutId);

        // Verificar se a resposta é bem-sucedida
        if (!response.ok) {
          throw new ApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response.statusText,
            response,
            false,
            false
          );
        }

        return response;

      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Tratar timeout
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new ApiError(
            'Request timeout',
            408,
            'Request Timeout',
            undefined,
            true,
            false
          );
        }

        // Tratar erro de rede
        if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          throw new ApiError(
            'Network error',
            0,
            'Network Error',
            undefined,
            false,
            true
          );
        }

        throw fetchError;
      }

    } catch (error) {
      lastError = error as Error | ApiErrorType;

      // Se não deve tentar novamente ou é a última tentativa
      if (!retryCondition(error as Error | ApiErrorType) || attempt > maxRetries) {
        throw error;
      }

      // Callback de retry
      if (onRetry) {
        onRetry(attempt, error as Error | ApiErrorType);
      }

      // Calcular delay e aguardar
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoffMultiplier);
      console.warn(`API call failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${delay}ms:`, error);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Função helper para fazer chamadas JSON com retry
 */
export async function apiJsonCall<T = unknown>(
  url: string,
  options: ApiCallOptions = {}
): Promise<T> {
  const response = await apiCallWithRetry(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  try {
    return await response.json();
  } catch (parseError) {
    throw new ApiError(
      'Failed to parse JSON response',
      response.status,
      response.statusText,
      response
    );
  }
}

/**
 * Hook para configurações padrão de retry
 */
export const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: shouldRetry,
  onRetry: (attempt, error) => {
    console.warn(`Retry attempt ${attempt}:`, error.message || error);
  }
};

/**
 * Configurações específicas para diferentes tipos de endpoints
 */
export const retryConfigs = {
  // Para endpoints críticos (dados em tempo real)
  realtime: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 1.5
  },
  
  // Para endpoints de dados históricos
  historical: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 15000,
    backoffMultiplier: 2
  },
  
  // Para endpoints de configuração
  config: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffMultiplier: 2
  },
  
  // Para uploads/operações críticas
  critical: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2.5
  }
};