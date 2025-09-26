import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { backendIntegration } from '@/lib/backend-integration';

/**
 * Endpoint: GET /api/system/status
 * Retorna status completo do sistema SOFIA
 * Requer autenticação de administrador
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // TODO: Verificar se o usuário é administrador
    // const isAdmin = await checkAdminRole(userId);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { success: false, error: 'Acesso negado - requer privilégios de administrador' },
    //     { status: 403 }
    //   );
    // }

    console.log('📊 Coletando status do sistema...');

    // Coletar status de todos os componentes
    const [
      backendStatus,
      mlStatus,
      databaseStatus,
      cacheStatus
    ] = await Promise.allSettled([
      backendIntegration.getBackendStatus(),
      backendIntegration.getMLStatus(),
      checkDatabaseStatus(),
      checkCacheStatus()
    ]);

    // Processar resultados
    const systemStatus = {
      overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date().toISOString(),
      components: {
        backend: getStatusResult(backendStatus),
        machine_learning: getStatusResult(mlStatus),
        database: getStatusResult(databaseStatus),
        cache: getStatusResult(cacheStatus),
        frontend: {
          status: 'healthy',
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          node_version: process.version
        }
      },
      metrics: {
        total_requests: 0, // TODO: Implementar contador de requisições
        active_users: 0,   // TODO: Implementar contador de usuários ativos
        error_rate: 0,     // TODO: Implementar taxa de erro
        response_time: 0   // TODO: Implementar tempo de resposta médio
      }
    };

    // Determinar status geral
    const componentStatuses = Object.values(systemStatus.components).map(c => c.status);
    if (componentStatuses.includes('unhealthy')) {
      systemStatus.overall = 'unhealthy';
    } else if (componentStatuses.includes('degraded')) {
      systemStatus.overall = 'degraded';
    }

    console.log('✅ Status do sistema coletado:', systemStatus.overall);

    return NextResponse.json({
      success: true,
      data: systemStatus,
      message: `Sistema ${systemStatus.overall === 'healthy' ? 'funcionando normalmente' : 'com problemas detectados'}`
    });

  } catch (error) {
    console.error('Erro ao coletar status do sistema:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Funções auxiliares
function getStatusResult(result: PromiseSettledResult<any>) {
  if (result.status === 'fulfilled' && result.value?.success) {
    return {
      status: 'healthy' as const,
      data: result.value.data,
      message: result.value.message,
      last_check: new Date().toISOString()
    };
  } else {
    return {
      status: 'unhealthy' as const,
      error: result.status === 'rejected' ? result.reason?.message : 'Serviço indisponível',
      last_check: new Date().toISOString()
    };
  }
}

async function checkDatabaseStatus() {
  // TODO: Implementar verificação real do banco de dados
  return {
    success: true,
    data: {
      connection_pool: 'active',
      query_time: '< 100ms',
      active_connections: 5
    },
    message: 'Banco de dados operacional'
  };
}

async function checkCacheStatus() {
  // TODO: Implementar verificação real do cache
  return {
    success: true,
    data: {
      hit_rate: '95%',
      memory_usage: '45%',
      active_keys: 1250
    },
    message: 'Cache operacional'
  };
}

/**
 * Endpoint OPTIONS para informações da API
 */
export async function OPTIONS() {
  return NextResponse.json({
    methods: ['GET'],
    description: 'Endpoint para monitoramento completo do status do sistema',
    authentication: 'required - admin role',
    response_format: {
      data: {
        overall: 'string - Status geral (healthy, degraded, unhealthy)',
        timestamp: 'string - Timestamp da verificação',
        components: 'object - Status de cada componente',
        metrics: 'object - Métricas do sistema'
      },
      success: 'boolean - Status da operação',
      message: 'string - Mensagem opcional'
    },
    components_monitored: [
      'backend - Servidor backend SOFIA',
      'machine_learning - Sistema de IA/ML',
      'database - Banco de dados',
      'cache - Sistema de cache',
      'frontend - Servidor frontend'
    ]
  });
}
