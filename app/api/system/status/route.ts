import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { backendIntegration } from '@/lib/backend-integration';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

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

    // Verificar privilégios de administrador (via Supabase) ou token de admin no header
    const isAdmin = await checkAdminRole(userId);
    const header = request.headers.get('authorization') || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : header;
    const expected = process.env.HEALTH_ADMIN_TOKEN || process.env.NEXT_HEALTH_ADMIN_TOKEN || '';
    const hasTokenAdmin = !!expected && bearer.trim() === expected.trim();
    if (!isAdmin && !hasTokenAdmin) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado - requer privilégios de administrador' },
        { status: 403 }
      );
    }

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

async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    if (!url || !key) return false;
    const supabaseAdmin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    // Preferir view admin_users quando disponível
    const { data: adminView } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (adminView?.user_id) return true;
    // Fallback: verificar account_status diretamente
    const { data } = await supabaseAdmin
      .from('user_profiles')
      .select('account_status')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    const status = (data as any)?.account_status;
    return status === 'admin' || status === 'superadmin';
  } catch {
    return false;
  }
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
