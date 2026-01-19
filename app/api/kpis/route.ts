import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { backendService } from '@/lib/backend-service';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

// Interfaces
interface KpiFilters {
  table_id?: string;
}

interface ApiResponse {
  data: any[];
  success: boolean;
  message: string;
}

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
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extrair parâmetros da query
    const { searchParams } = new URL(request.url);
    const filters: KpiFilters = {
      table_id: searchParams.get('table_id') || undefined
    };

    console.log('🚀 Buscando KPIs do backend...');

    try {
      // Tentar buscar dados do backend real
      const backendResponse = await backendService.getKpisEstrategias(filters.table_id);

      console.log('✅ KPIs recebidos do backend SOFIA');
      return NextResponse.json(backendResponse);

    } catch (backendError: any) {
      console.warn('⚠️ Backend não disponível, usando dados mock:', backendError.message);
      
      // Fallback para dados mock em caso de erro
      const mockKPIs = generateMockKPIs(filters.table_id);
      const mockResponse: ApiResponse = {
        data: mockKPIs,
        success: true,
        message: 'Dados simulados (backend indisponível)'
      };
      
      return NextResponse.json(mockResponse);
    }

  } catch (error: any) {
    console.error('Erro geral na API de KPIs:', error);
    
    // Fallback final para dados mock
    const mockKPIs = generateMockKPIs();
    const mockResponse: ApiResponse = {
      data: mockKPIs,
      success: false,
      message: 'Erro interno do servidor'
    };
    
    return NextResponse.json(mockResponse, { status: 500 });
  }
}
