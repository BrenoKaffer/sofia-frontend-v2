import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Verifica a conexão entre frontend e backend
 */

const SOFIA_BACKEND_URL = process.env.SOFIA_BACKEND_URL || 'http://localhost:3001';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  frontend: {
    status: 'ok';
    version: string;
    environment: string;
  };
  backend: {
    status: 'ok' | 'error';
    url: string;
    responseTime?: number;
    error?: string;
  };
  database: {
    status: 'ok' | 'error';
    error?: string;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const isDev = process.env.NODE_ENV !== 'production';
  const isAuthBypassEnabled = process.env.NEXT_PUBLIC_AUTH_DEV_BYPASS === 'true' || process.env.AUTH_DEV_BYPASS === 'true';
  const hasSupabaseEnv = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasBackendUrl = !!process.env.SOFIA_BACKEND_URL;
  
  const healthCheck: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    frontend: {
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    },
    backend: {
      status: 'ok',
      url: SOFIA_BACKEND_URL
    },
    database: {
      status: 'ok'
    }
  };

  // Verificar conexão com o backend
  try {
    const backendStartTime = Date.now();
    const response = await fetch(`${SOFIA_BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 segundos timeout
    });

    const backendResponseTime = Date.now() - backendStartTime;
    healthCheck.backend.responseTime = backendResponseTime;

    if (!response.ok) {
      throw new Error(`Backend respondeu com status ${response.status}`);
    }

    const backendHealth = await response.json();
    console.log('✅ Backend health check:', backendHealth);

  } catch (error) {
    console.error('❌ Erro na verificação do backend:', error);
    healthCheck.backend.status = 'error';
    healthCheck.backend.error = error instanceof Error ? error.message : 'Erro desconhecido';
    // Em desenvolvimento ou sem backend configurado, tratar como degradado
    healthCheck.status = (isDev || isAuthBypassEnabled || !hasBackendUrl) ? 'healthy' : 'unhealthy';
    if (healthCheck.status === 'healthy') {
      // Se backend indisponível mas estamos em dev, sinalizar como degradado no payload
      healthCheck.status = 'unhealthy' as any; // manter compat com tipo atual e status HTTP ajustado abaixo
    }
  }

  // Verificar conexão com o Supabase (database)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configurações do Supabase não encontradas');
    }

    // Teste simples de conectividade com Supabase
    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase respondeu com status ${supabaseResponse.status}`);
    }

    console.log('✅ Database (Supabase) health check: OK');

  } catch (error) {
    console.error('❌ Erro na verificação do database:', error);
    healthCheck.database.status = 'error';
    healthCheck.database.error = error instanceof Error ? error.message : 'Erro desconhecido';
    // Em desenvolvimento ou sem supabase configurado, não retornar 503
    if (!(isDev || isAuthBypassEnabled || !hasSupabaseEnv)) {
      healthCheck.status = 'unhealthy';
    }
  }

  const totalResponseTime = Date.now() - startTime;
  console.log(`🏥 Health check concluído em ${totalResponseTime}ms - Status: ${healthCheck.status}`);

  // Retornar status HTTP apropriado
  const isUnhealthy = healthCheck.status === 'unhealthy';
  const statusCode = isUnhealthy ? (isDev ? 200 : 503) : 200;

  return NextResponse.json(healthCheck, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export async function HEAD(request: NextRequest) {
  // Endpoint simples para verificação rápida
  try {
    const response = await fetch(`${SOFIA_BACKEND_URL}/api/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });

    const isDev = process.env.NODE_ENV !== 'production';
    return new NextResponse(null, { 
      status: response.ok ? 200 : (isDev ? 200 : 503),
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    return new NextResponse(null, { status: isDev ? 200 : 503 });
  }
}
