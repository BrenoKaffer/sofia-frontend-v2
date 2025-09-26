import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface StrategyMetrics {
  strategy_id: string;
  strategy_name: string;
  table_id: string;
  success_rate: number;
  total_signals: number;
  successful_signals: number;
  failed_signals: number;
  net_profit: number;
  avg_confidence: number;
  last_signal_time: string;
  performance_trend: 'up' | 'down' | 'stable';
  risk_level: 'low' | 'medium' | 'high';
}

interface TableMetrics {
  table_id: string;
  table_name: string;
  active_strategies: number;
  total_spins: number;
  hot_numbers: number[];
  cold_numbers: number[];
  pattern_strength: number;
  volatility: number;
  last_spin: number;
  last_spin_time: string;
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Buscar dados de performance das estratégias
    const { data: strategiesData, error: strategiesError } = await supabase
      .from('strategy_performance_kpis')
      .select('*')
      .order('last_updated', { ascending: false });

    if (strategiesError) {
      console.error('Erro ao buscar dados de estratégias:', strategiesError);
    }

    // Buscar dados de sinais gerados hoje
    const { data: signalsData, error: signalsError } = await supabase
      .from('generated_signals')
      .select('*')
      .gte('timestamp_generated', todayStart.toISOString())
      .order('timestamp_generated', { ascending: false });

    if (signalsError) {
      console.error('Erro ao buscar sinais:', signalsError);
    }

    // Buscar dados de giros das mesas
    const { data: spinsData, error: spinsError } = await supabase
      .from('roulette_spins')
      .select('*')
      .gte('spin_timestamp', todayStart.toISOString())
      .order('spin_timestamp', { ascending: false });

    if (spinsError) {
      console.error('Erro ao buscar giros:', spinsError);
    }

    // Processar métricas das estratégias
    const strategiesMetrics: StrategyMetrics[] = (strategiesData || []).map(strategy => {
      const recentSignals = (signalsData || []).filter(signal => 
        signal.strategy_name === strategy.strategy_id
      );

      // Calcular tendência baseada nos últimos sinais
      const recentSuccessRate = recentSignals.length > 0 
        ? (recentSignals.filter(s => s.is_validated).length / recentSignals.length) * 100
        : strategy.assertiveness_rate_percent;

      let performanceTrend: 'up' | 'down' | 'stable' = 'stable';
      if (recentSuccessRate > strategy.assertiveness_rate_percent + 5) {
        performanceTrend = 'up';
      } else if (recentSuccessRate < strategy.assertiveness_rate_percent - 5) {
        performanceTrend = 'down';
      }

      // Determinar nível de risco baseado na volatilidade
      let riskLevel: 'low' | 'medium' | 'high' = 'medium';
      if (strategy.assertiveness_rate_percent > 70) {
        riskLevel = 'low';
      } else if (strategy.assertiveness_rate_percent < 50) {
        riskLevel = 'high';
      }

      return {
        strategy_id: strategy.strategy_id,
        strategy_name: strategy.strategy_id,
        table_id: recentSignals[0]?.table_id || 'N/A',
        success_rate: strategy.assertiveness_rate_percent,
        total_signals: strategy.total_signals_generated,
        successful_signals: strategy.successful_signals,
        failed_signals: strategy.failed_signals,
        net_profit: strategy.total_net_profit_loss,
        avg_confidence: recentSignals.reduce((acc, signal) => acc + (signal.confidence_level || 0), 0) / (recentSignals.length || 1),
        last_signal_time: recentSignals[0]?.timestamp_generated || strategy.last_updated,
        performance_trend: performanceTrend,
        risk_level: riskLevel
      };
    });

    // Processar métricas das mesas
    const tablesMap = new Map<string, any>();
    
    (spinsData || []).forEach(spin => {
      if (!tablesMap.has(spin.table_id)) {
        tablesMap.set(spin.table_id, {
          table_id: spin.table_id,
          table_name: `Mesa ${spin.table_id}`,
          spins: [],
          last_spin: spin.spin_number,
          last_spin_time: spin.spin_timestamp
        });
      }
      tablesMap.get(spin.table_id).spins.push(spin.spin_number);
    });

    const tablesMetrics: TableMetrics[] = Array.from(tablesMap.values()).map(table => {
      const spins = table.spins;
      const numberCounts = new Map<number, number>();
      
      // Contar frequência dos números
      spins.forEach((num: number) => {
        numberCounts.set(num, (numberCounts.get(num) || 0) + 1);
      });

      // Identificar números quentes e frios
      const sortedNumbers = Array.from(numberCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      
      const hotNumbers = sortedNumbers.slice(0, 5).map(([num]) => num);
      const coldNumbers = Array.from({length: 37}, (_, i) => i)
        .filter(num => !numberCounts.has(num) || numberCounts.get(num)! < 2)
        .slice(0, 5);

      // Calcular volatilidade (desvio padrão dos números)
      const mean = spins.reduce((acc: number, num: number) => acc + num, 0) / spins.length;
      const variance = spins.reduce((acc: number, num: number) => acc + Math.pow(num - mean, 2), 0) / spins.length;
      const volatility = Math.sqrt(variance);

      // Calcular força do padrão (baseado na distribuição)
      const expectedFreq = spins.length / 37;
      const patternStrength = 1 - (Array.from(numberCounts.values())
        .reduce((acc, freq) => acc + Math.abs(freq - expectedFreq), 0) / (spins.length * 2));

      const activeStrategies = strategiesMetrics.filter(s => s.table_id === table.table_id).length;

      return {
        table_id: table.table_id,
        table_name: table.table_name,
        active_strategies: activeStrategies,
        total_spins: spins.length,
        hot_numbers: hotNumbers,
        cold_numbers: coldNumbers,
        pattern_strength: Math.max(0, patternStrength),
        volatility: volatility,
        last_spin: table.last_spin,
        last_spin_time: table.last_spin_time
      };
    });

    // Calcular métricas gerais
    const totalSignalsToday = signalsData?.length || 0;
    const successfulSignalsToday = signalsData?.filter(s => s.is_validated).length || 0;
    const successRateToday = totalSignalsToday > 0 ? (successfulSignalsToday / totalSignalsToday) * 100 : 0;
    
    const profitToday = strategiesMetrics.reduce((acc, strategy) => {
      const todaySignals = (signalsData || []).filter(s => s.strategy_name === strategy.strategy_id);
      const todayProfit = todaySignals.reduce((profit, signal) => {
        return profit + (signal.is_validated ? signal.suggested_units : -signal.suggested_units);
      }, 0);
      return acc + todayProfit;
    }, 0);

    // Simular dados de saúde do sistema (em produção, estes viriam de monitoramento real)
    const systemHealth = {
      cpu_usage: Math.floor(Math.random() * 30) + 20, // 20-50%
      memory_usage: Math.floor(Math.random() * 40) + 30, // 30-70%
      api_response_time: Math.floor(Math.random() * 100) + 50, // 50-150ms
      websocket_connections: Math.floor(Math.random() * 20) + 10 // 10-30 conexões
    };

    const response = {
      timestamp: now.toISOString(),
      active_tables: tablesMetrics.length,
      total_signals_today: totalSignalsToday,
      success_rate_today: successRateToday,
      profit_today: profitToday,
      strategies_performance: strategiesMetrics,
      tables_status: tablesMetrics,
      system_health: systemHealth
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro ao buscar métricas em tempo real:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
