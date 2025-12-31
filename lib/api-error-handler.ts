/**
 * Middleware para tratamento de erros da API
 * Padroniza as respostas de erro e logging
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

export class ApiError extends Error {
  public code?: string;
  public status?: number;
  public details?: any;

  constructor(message: string, status: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ApiErrorHandler {
  static handle(error: unknown, context?: string): NextResponse {
    const errorInfo = ApiErrorHandler.parseError(error);
    
    // Log do erro
    logger.error('API Error', {
      metadata: {
        context,
        errorInfo,
        stack: error instanceof Error ? error.stack : undefined
      }
    }, error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      {
        error: {
          message: errorInfo.message,
          code: errorInfo.code,
          ...(process.env.NODE_ENV === 'development' && {
            details: errorInfo.details,
            stack: error instanceof Error ? error.stack : undefined
          })
        }
      },
      { status: errorInfo.status }
    );
  }

  static parseError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      return new ApiError(
        error.message,
        500,
        'INTERNAL_ERROR',
        error.name
      );
    }

    if (typeof error === 'string') {
      return new ApiError(
        error,
        500,
        'INTERNAL_ERROR'
      );
    }

    return new ApiError(
      'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR',
      error
    );
  }

  static createError(message: string, code: string, status: number = 500, details?: any): ApiError {
    return new ApiError(message, status, code, details);
  }

  static badRequest(message: string = 'Bad Request', details?: any): ApiError {
    return this.createError(message, 'BAD_REQUEST', 400, details);
  }

  static unauthorized(message: string = 'Unauthorized', details?: any): ApiError {
    return this.createError(message, 'UNAUTHORIZED', 401, details);
  }

  static forbidden(message: string = 'Forbidden', details?: any): ApiError {
    return this.createError(message, 'FORBIDDEN', 403, details);
  }

  static notFound(message: string = 'Not Found', details?: any): ApiError {
    return this.createError(message, 'NOT_FOUND', 404, details);
  }

  static methodNotAllowed(message: string = 'Method Not Allowed', details?: any): ApiError {
    return this.createError(message, 'METHOD_NOT_ALLOWED', 405, details);
  }

  static conflict(message: string = 'Conflict', details?: any): ApiError {
    return this.createError(message, 'CONFLICT', 409, details);
  }

  static unprocessableEntity(message: string = 'Unprocessable Entity', details?: any): ApiError {
    return this.createError(message, 'UNPROCESSABLE_ENTITY', 422, details);
  }

  static tooManyRequests(message: string = 'Too Many Requests', details?: any): ApiError {
    return this.createError(message, 'TOO_MANY_REQUESTS', 429, details);
  }

  static internalServerError(message: string = 'Internal Server Error', details?: any): ApiError {
    return this.createError(message, 'INTERNAL_SERVER_ERROR', 500, details);
  }

  static serviceUnavailable(message: string = 'Service Unavailable', details?: any): ApiError {
    return this.createError(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}

// Função utilitária para wrapping de handlers de API
export function withErrorHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return ApiErrorHandler.handle(error, `${req.method} ${req.url}`);
    }
  };
}

// Middleware para validação de método HTTP
export function validateMethod(allowedMethods: string[]) {
  return (req: Request) => {
    if (!allowedMethods.includes(req.method || '')) {
      throw ApiErrorHandler.methodNotAllowed(
        `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`
      );
    }
  };
}

// Middleware para validação de Content-Type
export function validateContentType(expectedType: string = 'application/json') {
  return (req: Request) => {
    const contentType = req.headers.get('content-type');
    if (req.method !== 'GET' && req.method !== 'DELETE' && !contentType?.includes(expectedType)) {
      throw ApiErrorHandler.badRequest(
        `Invalid Content-Type. Expected: ${expectedType}`
      );
    }
  };
}

// Alias para compatibilidade
export const handleApiError = ApiErrorHandler.handle;

export default ApiErrorHandler;