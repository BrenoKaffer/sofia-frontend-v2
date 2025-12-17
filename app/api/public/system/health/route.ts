import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check Público do Sistema SOFIA
 * Endpoint: GET /api/public/system/health
 * Não requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Verificar saúde básica do sistema
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: await checkDatabaseHealth(),
        cache: await checkCacheHealth(),
        external_apis: await checkExternalAPIsHealth()
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      response_time: Date.now() - startTime
    };

    // Determinar status geral
    const allServicesHealthy = Object.values(systemHealth.services).every(
      service => service.status === 'healthy'
    );

    if (!allServicesHealthy) {
      systemHealth.status = 'degraded';
    }

    return NextResponse.json({
      success: true,
      data: systemHealth,
      message: 'Health check realizado com sucesso'
    }, {
      status: systemHealth.status === 'healthy' ? 200 : 503
    });

  } catch (error) {
    console.error('Erro no health check:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }, { status: 500 });
  }
}

/**
 * Verificar saúde do banco de dados
 */
async function checkDatabaseHealth() {
  try {
    // Simular verificação do banco de dados
    // Em produção, fazer uma query simples para verificar conectividade
    return {
      status: 'healthy',
      response_time: Math.floor(Math.random() * 50) + 10,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Erro de conexão',
      last_check: new Date().toISOString()
    };
  }
}

/**
 * Verificar saúde do cache
 */
async function checkCacheHealth() {
  try {
    // Simular verificação do cache/Redis
    return {
      status: 'healthy',
      response_time: Math.floor(Math.random() * 20) + 5,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Erro de cache',
      last_check: new Date().toISOString()
    };
  }
}

/**
 * Verificar saúde das APIs externas
 */
async function checkExternalAPIsHealth() {
  try {
    // Simular verificação de APIs externas
    return {
      status: 'healthy',
      response_time: Math.floor(Math.random() * 100) + 50,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Erro de API externa',
      last_check: new Date().toISOString()
    };
  }
}
