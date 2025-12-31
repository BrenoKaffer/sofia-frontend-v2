import { NextRequest, NextResponse } from 'next/server';
import { backendIntegration } from '@/lib/backend-integration';

export const runtime = 'nodejs';

/**
 * Endpoint: GET /api/kpis-estrategias
 * Retorna KPIs e métricas de performance das estratégias
 * Requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implementar verificação de autenticação
    // const authResult = await verifyAuth(request);
    // if (!authResult.success) {
    //   return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    
    // Extrair parâmetros de consulta
    const tableId = searchParams.get('table_id');
    const strategyName = searchParams.get('strategy_name');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Buscar KPIs usando o serviço de integração
    const result = await backendIntegration.getKPIs(
      tableId || undefined,
      strategyName || undefined,
      dateFrom || undefined,
      dateTo || undefined
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar KPIs das estratégias',
        details: result.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message || 'KPIs obtidos com sucesso',
      metadata: {
        table_id: tableId,
        strategy_name: strategyName,
        date_range: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : null,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro no endpoint de KPIs:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
