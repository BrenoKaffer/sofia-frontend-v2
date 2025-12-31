import { NextRequest, NextResponse } from 'next/server';

// Evita tentativa de inicialização durante a build e força execução dinâmica
export const dynamic = 'force-dynamic';
// Garantir execução em runtime Node.js para evitar Edge com libs do Supabase
export const runtime = 'nodejs';

// Inicialização segura via import dinâmico, só quando variáveis existem
async function getSupabaseSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

interface LogMetrics {
  overview: {
    total_logs: number;
    error_count: number;
    warn_count: number;
    info_count: number;
    debug_count: number;
    error_rate: number;
    warn_rate: number;
  };
  hourly_stats: Array<{
    hour: string;
    count: number;
  }>;
  top_errors: Array<{
    message: string;
    count: number;
    last_occurrence: string;
  }>;
  user_activity: Array<{
    user_id: string;
    log_count: number;
    error_count: number;
    last_activity: string;
  }>;
  context_breakdown: Array<{
    context: string;
    count: number;
    error_count: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseSafe();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h';
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '1h': startDate.setHours(startDate.getHours() - 1); break;
      case '24h': startDate.setHours(startDate.getHours() - 24); break;
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      default: startDate.setHours(startDate.getHours() - 24);
    }
    if (!supabase) {
      // Fallback amigável: resposta vazia quando envs faltam
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            total_logs: 0, error_count: 0, warn_count: 0, info_count: 0, debug_count: 0, error_rate: 0, warn_rate: 0
          },
          hourly_stats: [],
          top_errors: [],
          user_activity: [],
          context_breakdown: []
        },
        period,
        generated_at: new Date().toISOString(),
        disabled: true,
        message: 'Supabase não configurado — métricas vazias'
      });
    }

    // 1. Obter estatísticas gerais usando a função SQL
    const { data: overviewData, error: overviewError } = await supabase
      .rpc('get_log_stats_by_period', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

    if (overviewError) {
      console.error('Erro ao buscar estatísticas gerais:', overviewError);
    }

    // 2. Obter estatísticas horárias
    const { data: hourlyData, error: hourlyError } = await supabase
      .rpc('get_hourly_log_stats', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

    if (hourlyError) {
      console.error('Erro ao buscar estatísticas horárias:', hourlyError);
    }

    // 3. Obter top erros
    const { data: topErrorsData, error: topErrorsError } = await supabase
      .rpc('get_top_errors', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        limit_count: 10
      });

    if (topErrorsError) {
      console.error('Erro ao buscar top erros:', topErrorsError);
    }

    // 4. Obter atividade por usuário
    const { data: userActivityData, error: userActivityError } = await supabase
      .rpc('get_user_activity', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

    if (userActivityError) {
      console.error('Erro ao buscar atividade de usuários:', userActivityError);
    }

    // 5. Obter breakdown por contexto
    const { data: contextData, error: contextError } = await supabase
      .from('system_logs')
      .select('context, level')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('context', 'is', null);

    if (contextError) {
      console.error('Erro ao buscar dados por contexto:', contextError);
    }

    // Processar dados de contexto
    const contextBreakdown = contextData?.reduce((acc: any[], log) => {
      const existing = acc.find(item => item.context === log.context);
      if (existing) {
        existing.count++;
        if (log.level === 'ERROR') {
          existing.error_count++;
        }
      } else {
        acc.push({
          context: log.context,
          count: 1,
          error_count: log.level === 'ERROR' ? 1 : 0
        });
      }
      return acc;
    }, []) || [];

    // Montar resposta
    const metrics: LogMetrics = {
      overview: overviewData?.[0] || {
        total_logs: 0,
        error_count: 0,
        warn_count: 0,
        info_count: 0,
        debug_count: 0,
        error_rate: 0,
        warn_rate: 0
      },
      hourly_stats: hourlyData?.map((item: any) => ({
        hour: item.hour,
        count: parseInt(item.count)
      })) || [],
      top_errors: topErrorsData?.map((item: any) => ({
        message: item.message,
        count: parseInt(item.count),
        last_occurrence: item.last_occurrence
      })) || [],
      user_activity: userActivityData?.map((item: any) => ({
        user_id: item.user_id || 'Anônimo',
        log_count: parseInt(item.log_count),
        error_count: parseInt(item.error_count),
        last_activity: item.last_activity
      })) || [],
      context_breakdown: contextBreakdown.sort((a, b) => b.count - a.count)
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      period,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar métricas de logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
