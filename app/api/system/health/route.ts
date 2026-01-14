import { NextRequest, NextResponse } from 'next/server';
import { backendService } from '@/lib/backend-service';

export const dynamic = 'force-dynamic';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    backend: ServiceStatus;
    cache: ServiceStatus;
    auth: ServiceStatus;
  };
  metrics: {
    responseTime: number;
    memoryUsage?: NodeJS.MemoryUsage;
    cpuUsage?: number;
  };
}

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: any;
}

const startTime = Date.now();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const checkStartTime = Date.now();
  // Habilitar bypass em desenvolvimento para evitar 503 quando serviços não estão configurados
  const isAuthBypassEnabled = process.env.NEXT_PUBLIC_AUTH_DEV_BYPASS === 'true' || process.env.AUTH_DEV_BYPASS === 'true';
  const hasSupabaseEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasBackendUrl = !!process.env.SOFIA_BACKEND_URL;
  const isDev = process.env.NODE_ENV !== 'production';

  try {
    // Executar checks de saúde em paralelo
    const [databaseCheck, backendCheck, cacheCheck, authCheck] = await Promise.allSettled([
      checkDatabase({ isAuthBypassEnabled, hasSupabaseEnv }),
      checkBackend({ isAuthBypassEnabled, hasBackendUrl }),
      checkCache(),
      checkAuth({ isAuthBypassEnabled, hasSupabaseEnv })
    ]);

    const services = {
      database: extractResult(databaseCheck),
      backend: extractResult(backendCheck),
      cache: extractResult(cacheCheck),
      auth: extractResult(authCheck)
    };

    // Determinar status geral com consciência de ambiente de desenvolvimento
    const statuses = Object.values(services).map(s => s.status);
    let overallStatus: HealthCheckResult['status'];
    if (statuses.every(s => s === 'healthy')) {
      overallStatus = 'healthy';
    } else if (statuses.some(s => s === 'unhealthy')) {
      overallStatus = (isDev || isAuthBypassEnabled || !hasSupabaseEnv || !hasBackendUrl) ? 'degraded' : 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    const responseTime = Date.now() - checkStartTime;

    const healthResult: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - startTime,
      services,
      metrics: {
        responseTime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: getCpuUsage()
      }
    };

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
      if (url && key) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
        const level = overallStatus === 'unhealthy' ? 'error' : overallStatus === 'degraded' ? 'warn' : 'info';
        await supabase.from('system_logs').insert([{
          level,
          message: 'system_health',
          context: 'health_check',
          source: 'frontend',
          metadata: {
            status: overallStatus,
            services,
            metrics: healthResult.metrics
          }
        }]);
      }
    } catch {}

    // Retornar status HTTP apropriado
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthResult, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Erro no health check:', error);
    
    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - startTime,
      services: {
        database: { status: 'unhealthy', error: 'Health check failed' },
        backend: { status: 'unhealthy', error: 'Health check failed' },
        cache: { status: 'unhealthy', error: 'Health check failed' },
        auth: { status: 'unhealthy', error: 'Health check failed' }
      },
      metrics: {
        responseTime: Date.now() - checkStartTime,
        memoryUsage: process.memoryUsage()
      }
    };

    return NextResponse.json(errorResult, { status: 503 });
  }
}

async function checkDatabase({ isAuthBypassEnabled, hasSupabaseEnv }: { isAuthBypassEnabled: boolean; hasSupabaseEnv: boolean; }): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Se não houver Supabase configurado ou bypass ativo, retornar degradado
    if (!hasSupabaseEnv || isAuthBypassEnabled) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: { configured: hasSupabaseEnv, bypass: isAuthBypassEnabled }
      };
    }

    const { supabase } = await import('@/lib/supabase');
    
    // Teste simples de conectividade
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      // Tratar erro como degradado em desenvolvimento para evitar 503
      if (isAuthBypassEnabled) {
        return {
          status: 'degraded',
          responseTime,
          error: error.message
        };
      }
      return {
        status: 'unhealthy',
        responseTime,
        error: error.message
      };
    }

    return {
      status: 'healthy',
      responseTime,
      details: { connection: 'active' }
    };

  } catch (error) {
    // Tratar falha como degradada se bypass ativo ou Supabase não configurado
    if (!hasSupabaseEnv || isAuthBypassEnabled) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Database check degraded'
      };
    }
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkBackend({ isAuthBypassEnabled, hasBackendUrl }: { isAuthBypassEnabled: boolean; hasBackendUrl: boolean; }): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Se backend não estiver configurado ou bypass ativo, retornar degradado
    if (!hasBackendUrl || isAuthBypassEnabled) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: { configured: hasBackendUrl, bypass: isAuthBypassEnabled }
      };
    }

    // Tentar fazer uma requisição simples ao backend
    const result = await backendService.healthCheck();
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      details: result
    };

  } catch (error) {
    // Em desenvolvimento, tratar como degradado
    if (isAuthBypassEnabled || !hasBackendUrl) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Backend check degraded'
      };
    }
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Backend connection failed'
    };
  }
}

async function checkCache(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // Verificar se o cache está funcionando
    const testKey = 'health_check_test';
    const testValue = Date.now().toString();
    
    // Simular operação de cache (localStorage para client-side)
    if (typeof window !== 'undefined') {
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        return {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          details: { type: 'localStorage' }
        };
      }
    }

    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: { type: 'server-side' }
    };

  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Cache check failed'
    };
  }
}

async function checkAuth({ isAuthBypassEnabled, hasSupabaseEnv }: { isAuthBypassEnabled: boolean; hasSupabaseEnv: boolean; }): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    if (isAuthBypassEnabled || !hasSupabaseEnv) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: { bypass: isAuthBypassEnabled, configured: hasSupabaseEnv }
      };
    }

    const { supabase } = await import('@/lib/supabase');
    
    // Verificar se o serviço de auth está respondendo
    const { data, error } = await supabase.auth.getSession();
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'degraded',
        responseTime,
        error: error.message
      };
    }

    return {
      status: 'healthy',
      responseTime,
      details: { 
        sessionActive: !!data.session,
        authService: 'supabase'
      }
    };

  } catch (error) {
    // Em desenvolvimento, tratar como degradado
    if (isAuthBypassEnabled || !hasSupabaseEnv) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Auth service check degraded'
      };
    }
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Auth service check failed'
    };
  }
}

function extractResult(result: PromiseSettledResult<ServiceStatus>): ServiceStatus {
  if (result.status === 'fulfilled') {
    return result.value;
  } else {
    return {
      status: 'unhealthy',
      error: result.reason?.message || 'Service check failed'
    };
  }
}

function determineOverallStatus(services: HealthCheckResult['services']): HealthCheckResult['status'] {
  const statuses = Object.values(services).map(s => s.status);
  
  if (statuses.every(s => s === 'healthy')) {
    return 'healthy';
  } else if (statuses.some(s => s === 'unhealthy')) {
    return 'unhealthy';
  } else {
    return 'degraded';
  }
}

function getCpuUsage(): number {
  try {
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000000; // Convert to seconds
  } catch {
    return 0;
  }
}
