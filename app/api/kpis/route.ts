import { NextRequest, NextResponse } from 'next/server';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

// Configuração do Backend SOFIA
const SOFIA_BACKEND_URL = 'http://localhost:3001/api';

// MOCK DATA: Função para gerar KPIs simulados
function generateMockKPIs(tableId?: string | null) {
  const strategies = [
    'Hot Numbers AI',
    'Pattern Recognition', 
    'Color Sequence',
    'Fibonacci Analysis',
    'Statistical Model',
    'Martingale Strategy',
    'D\'Alembert System'
  ];
  
  const tables = [
    'pragmatic-brazilian-roulette',
    'pragmatic-mega-roulette', 
    'evolution-immersive-roulette',
    'evolution-roleta-ao-vivo',
    'netent-live-roulette'
  ];
  
  const mockKPIs: any[] = [];
  
  strategies.forEach((strategy, index) => {
    const totalSignals = Math.floor(Math.random() * 500) + 100;
    const successfulSignals = Math.floor(totalSignals * (0.4 + Math.random() * 0.4)); // 40-80% taxa de acerto
    const failedSignals = totalSignals - successfulSignals;
    const assertivenessRate = (successfulSignals / totalSignals) * 100;
    const avgProfit = Math.floor(Math.random() * 200) + 50;
    const avgLoss = Math.floor(Math.random() * 100) + 30;
    const netProfitLoss = (successfulSignals * avgProfit) - (failedSignals * avgLoss);
    
    mockKPIs.push({
      id: `mock_kpi_${index}`,
      strategy_name: strategy,
      table_id: tableId || tables[Math.floor(Math.random() * tables.length)],
      total_signals_generated: totalSignals,
      successful_signals: successfulSignals,
      failed_signals: failedSignals,
      assertiveness_rate_percent: Math.round(assertivenessRate * 100) / 100,
      total_net_profit_loss: netProfitLoss,
      avg_profit_per_win: avgProfit,
      avg_loss_per_loss: avgLoss,
      last_updated: new Date().toISOString(),
      period: '30d'
    });
  });
  
  // Filtrar por table_id se fornecido
  if (tableId) {
    return mockKPIs.filter(kpi => kpi.table_id === tableId);
  }
  
  return mockKPIs;
}

export async function GET(request: NextRequest) {
  // Extrair parâmetros da query
  const { searchParams } = new URL(request.url);
  const tableId = searchParams.get('table_id');
  
  try {
    console.log('🚀 Iniciando API de KPIs...');
    
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Header de autorização:', authHeader ? 'Presente' : 'Ausente');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token de autorização inválido');
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }
    
    console.log('✅ Autorização válida');

    // Buscar KPIs do backend SOFIA
    console.log('🔍 Buscando KPIs do backend SOFIA...');
    
    const kpisUrl = new URL(`${SOFIA_BACKEND_URL}/kpis-estrategias`);
    if (tableId) {
      kpisUrl.searchParams.set('table_id', tableId);
    }

    const response = await fetch(kpisUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      console.error('❌ Erro ao buscar KPIs do backend:', response.status, response.statusText);
      console.log('⚠️ Usando KPIs mock (fallback)');
      
      // MOCK DATA: Fallback com dados simulados para desenvolvimento
      const mockKPIs = generateMockKPIs(tableId);
      return NextResponse.json(mockKPIs);
    }

    const kpisData = await response.json();
    console.log('✅ KPIs recebidos do backend SOFIA:', kpisData);

    // Garantir que os dados numéricos sejam válidos
    const sanitizedData = Array.isArray(kpisData) ? kpisData.map(item => ({
      ...item,
      total_signals_generated: Number(item.total_signals_generated) || 0,
      successful_signals: Number(item.successful_signals) || 0,
      failed_signals: Number(item.failed_signals) || 0,
      assertiveness_rate_percent: Number(item.assertiveness_rate_percent) || 0,
      total_net_profit_loss: Number(item.total_net_profit_loss) || 0
    })) : [];

    return NextResponse.json(sanitizedData);
  } catch (error) {
    console.error('❌ Erro geral na API de KPIs:', error);
    console.log('⚠️ Usando KPIs mock (fallback devido a erro)');
    
    // MOCK DATA: Fallback com dados simulados em caso de erro
    const mockKPIs = generateMockKPIs(tableId);
    return NextResponse.json(mockKPIs);
  }
}