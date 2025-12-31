/**
 * Exemplo de API com Rate Limiting
 * Demonstra diferentes configurações de rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, getRateLimitStatus, resetRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

// GET - Endpoint com rate limiting padrão
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    switch (action) {
      case 'status':
        // Verifica status do rate limiting sem aplicar limite
        const status = await getRateLimitStatus(request, 'public');
        return NextResponse.json({
          success: true,
          rateLimitStatus: status,
          message: 'Rate limit status retrieved successfully'
        });
        
      case 'test':
        // Endpoint de teste com rate limiting aplicado
        const rateLimitResponse = await withRateLimit(request, 'public');
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
        
        return NextResponse.json({
          success: true,
          message: 'Request allowed by rate limiter',
          timestamp: new Date().toISOString()
        });
        
      case 'ml-test':
        // Teste com rate limiting de ML (mais restritivo)
        const mlRateLimitResponse = await withRateLimit(request, 'ml');
        if (mlRateLimitResponse) {
          return mlRateLimitResponse;
        }
        
        return NextResponse.json({
          success: true,
          message: 'ML API request allowed',
          timestamp: new Date().toISOString()
        });
        
      case 'auth-test':
        // Teste com rate limiting de autenticação (muito restritivo)
        const authRateLimitResponse = await withRateLimit(request, 'auth');
        if (authRateLimitResponse) {
          return authRateLimitResponse;
        }
        
        return NextResponse.json({
          success: true,
          message: 'Auth API request allowed',
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: true,
          message: 'Rate limiting example API',
          availableActions: ['status', 'test', 'ml-test', 'auth-test'],
          usage: {
            status: 'GET /api/rate-limit-example?action=status',
            test: 'GET /api/rate-limit-example?action=test',
            mlTest: 'GET /api/rate-limit-example?action=ml-test',
            authTest: 'GET /api/rate-limit-example?action=auth-test'
          }
        });
    }
    
  } catch (error) {
    logger.error('Rate limit example API error', { metadata: { action } }, error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to process rate limit example request'
      },
      { status: 500 }
    );
  }
}

// POST - Endpoint com rate limiting customizado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'public', customConfig } = body;
    
    // Aplica rate limiting com configuração customizada
    const rateLimitResponse = await withRateLimit(
      request,
      type,
      customConfig
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Simula processamento de dados
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logger.info('Rate limit example POST processed', {
      metadata: {
        type,
        customConfig,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'POST request processed successfully',
      data: {
        processed: true,
        timestamp: new Date().toISOString(),
        rateLimitType: type,
        customConfig: customConfig || null
      }
    });
    
  } catch (error) {
    logger.error('Rate limit example POST error', {}, error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to process POST request'
      },
      { status: 500 }
    );
  }
}

// DELETE - Reset rate limiting para um IP específico
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const pathname = searchParams.get('pathname') || '/api/rate-limit-example';
    
    if (!ip) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing IP parameter',
          message: 'IP parameter is required for rate limit reset'
        },
        { status: 400 }
      );
    }
    
    // Gera chave de rate limiting
    const key = `rate_limit:${pathname}:${ip}`;
    
    // Reset rate limiting
    await resetRateLimit(key);
    
    logger.info('Rate limit reset', { metadata: { ip, pathname, key } });
    
    return NextResponse.json({
      success: true,
      message: 'Rate limit reset successfully',
      data: {
        ip,
        pathname,
        key,
        resetAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Rate limit reset error', {}, error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to reset rate limit'
      },
      { status: 500 }
    );
  }
}

// PUT - Configuração dinâmica de rate limiting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;
    
    switch (action) {
      case 'update-config':
        // Simula atualização de configuração
        // Em produção, isso poderia atualizar configurações no Redis
        logger.info('Rate limit config update requested', { metadata: { config } });
        
        return NextResponse.json({
          success: true,
          message: 'Rate limit configuration updated',
          data: {
            action,
            config,
            updatedAt: new Date().toISOString()
          }
        });
        
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            message: 'Supported actions: update-config'
          },
          { status: 400 }
        );
    }
    
  } catch (error) {
    logger.error('Rate limit config update error', {}, error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to update rate limit configuration'
      },
      { status: 500 }
    );
  }
}
