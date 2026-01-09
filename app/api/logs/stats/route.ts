import { NextRequest, NextResponse } from 'next/server';

// Evitar tentativa de pré-renderização: esta rota é dinâmica
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Inicialização segura do Supabase apenas dentro dos handlers
async function getSupabaseSafe() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// GET - Obter estatísticas dos logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseSafe();
    if (!supabase) {
      const { searchParams } = new URL(request.url);
      const hours = parseInt(searchParams.get('hours') || '24');
      return NextResponse.json({
        period: {
          hours,
          startDate: null,
          endDate: null,
          totalLogs: 0
        },
        levelStats: [],
        contextStats: [],
        hourlyStats: [],
        recentErrors: [],
        userActivity: [],
        metrics: { errorRate: 0, warnRate: 0, healthScore: 100 },
        disabled: true,
        message: 'Supabase não configurado — retornando estatísticas vazias'
      });
    }
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de período
    const hours = parseInt(searchParams.get('hours') || '24');
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();

    // 1. Estatísticas por nível
    const { data: levelStats, error: levelError } = await supabase
      .from('system_logs')
      .select('level, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (levelError) {
      throw levelError;
    }

    // Contar por nível
    const levelCounts = levelStats.reduce((acc: Record<string, number>, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});

    const totalLogs = levelStats.length;

    // 2. Estatísticas por contexto
    const { data: contextStats, error: contextError } = await supabase
      .from('system_logs')
      .select('context')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('context', 'is', null);

    if (contextError) {
      throw contextError;
    }

    const contextCounts = contextStats.reduce((acc: Record<string, number>, log) => {
      const context = log.context || 'unknown';
      acc[context] = (acc[context] || 0) + 1;
      return acc;
    }, {});

    // 3. Logs por hora (últimas 24 horas)
    const { data: hourlyStats, error: hourlyError } = await supabase
      .rpc('get_hourly_log_stats', {
        start_date: startDate,
        end_date: endDate
      });

    // Se a função RPC não existir, fazer manualmente
    let hourlyData = [];
    if (hourlyError) {
      // Agrupar por hora manualmente
      const hourlyMap: Record<string, number> = {};
      
      for (const log of levelStats) {
        const hour = new Date(log.created_at || '').toISOString().slice(0, 13) + ':00:00.000Z';
        hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
      }

      hourlyData = Object.entries(hourlyMap).map(([hour, count]) => ({
        hour,
        count
      })).sort((a, b) => a.hour.localeCompare(b.hour));
    } else {
      hourlyData = hourlyStats || [];
    }

    // 4. Top erros (últimos erros únicos)
    const { data: errorLogs, error: errorLogsError } = await supabase
      .from('system_logs')
      .select('message, stack_trace, created_at, details')
      .eq('level', 'ERROR')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(10);

    if (errorLogsError) {
      throw errorLogsError;
    }

    // 5. Usuários mais ativos (por logs)
    const { data: userStats, error: userError } = await supabase
      .from('system_logs')
      .select('user_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('user_id', 'is', null);

    if (userError) {
      throw userError;
    }

    const userCounts = userStats.reduce((acc: Record<string, number>, log) => {
      if (log.user_id) {
        acc[log.user_id] = (acc[log.user_id] || 0) + 1;
      }
      return acc;
    }, {});

    // 6. Performance metrics
    const errorRate = totalLogs > 0 ? ((levelCounts.ERROR || 0) / totalLogs * 100) : 0;
    const warnRate = totalLogs > 0 ? ((levelCounts.WARN || 0) / totalLogs * 100) : 0;

    // Resposta final
    return NextResponse.json({
      period: {
        hours,
        startDate,
        endDate,
        totalLogs
      },
      levelStats: Object.entries(levelCounts).map(([level, count]) => ({
        level,
        count,
        percentage: totalLogs > 0 ? Math.round((count / totalLogs) * 100 * 100) / 100 : 0
      })).sort((a, b) => b.count - a.count),
      contextStats: Object.entries(contextCounts).map(([context, count]) => ({
        context,
        count,
        percentage: totalLogs > 0 ? Math.round((count / totalLogs) * 100 * 100) / 100 : 0
      })).sort((a, b) => b.count - a.count),
      hourlyStats: hourlyData,
      recentErrors: errorLogs?.map(log => ({
        message: log.message,
        timestamp: log.created_at,
        hasStackTrace: !!log.stack_trace,
        details: log.details
      })) || [],
      userActivity: Object.entries(userCounts).map(([userId, count]) => ({
        userId,
        count
      })).sort((a, b) => b.count - a.count).slice(0, 10),
      metrics: {
        errorRate: Math.round(errorRate * 100) / 100,
        warnRate: Math.round(warnRate * 100) / 100,
        healthScore: Math.max(0, 100 - errorRate - (warnRate * 0.5))
      }
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas dos logs:', error);
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// POST - Executar limpeza de logs antigos
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseSafe();
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase não configurado — limpeza desativada',
        disabled: true
      }, { status: 200 });
    }
    const body = await request.json();
    const daysToKeep = body.daysToKeep || 30;

    if (daysToKeep < 1 || daysToKeep > 365) {
      return NextResponse.json(
        { error: 'daysToKeep deve estar entre 1 e 365' },
        { status: 400 }
      );
    }

    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

    // Contar logs que serão deletados
    const { count: logsToDelete, error: countError } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffDate);

    if (countError) {
      throw countError;
    }

    // Deletar logs antigos
    const { error: deleteError } = await supabase
      .from('system_logs')
      .delete()
      .lt('created_at', cutoffDate);

    if (deleteError) {
      throw deleteError;
    }

    // Log da operação de limpeza
    await supabase
      .from('system_logs')
      .insert([{
        level: 'INFO',
        message: 'Limpeza automática de logs executada',
        context: 'system',
        details: {
          deleted_count: logsToDelete || 0,
          days_kept: daysToKeep,
          cutoff_date: cutoffDate
        }
      }]);

    return NextResponse.json({
      success: true,
      deletedCount: logsToDelete || 0,
      daysKept: daysToKeep,
      cutoffDate,
      message: `${logsToDelete || 0} logs antigos foram removidos`
    });

  } catch (error) {
    console.error('Erro ao executar limpeza de logs:', error);
    return NextResponse.json(
      { error: 'Erro ao executar limpeza', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
