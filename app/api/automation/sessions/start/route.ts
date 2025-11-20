import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend, safeJson, numberOrZero } from '@/lib/backend-proxy';

/**
 * POST /api/automation/sessions/start
 * Inicia uma nova sessão de automação
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, strategy, suggestedBets, config } = body;

    // Validar dados obrigatórios
    if (!tableId || !strategy) {
      return NextResponse.json(
        { success: false, error: 'tableId e strategy são obrigatórios' },
        { status: 400 }
      );
    }

    if (!suggestedBets || !Array.isArray(suggestedBets) || suggestedBets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'suggestedBets deve ser um array não vazio' },
        { status: 400 }
      );
    }

    // Validar configuração
    const sessionConfig = {
      stake: config?.stake || 5,
      maxStake: config?.maxStake || 50,
      stopLoss: config?.stopLoss || 100,
      takeProfit: config?.takeProfit || 200,
      maxConsecutiveLosses: config?.maxConsecutiveLosses || 5,
      betDelay: config?.betDelay || 3000,
      ...config
    };

    // Fazer chamada para o backend Sofia usando helper padronizado
    const response = await fetchBackend('/api/automation/sessions/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tableId,
        strategy,
        suggestedBets,
        config: sessionConfig,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = (await safeJson(response)) || {};
      const backendError =
        typeof errorData === 'object' && errorData !== null && 'error' in (errorData as Record<string, unknown>)
          ? (errorData as any).error
          : undefined;
      return NextResponse.json(
        {
          success: false,
          error: backendError || 'Falha ao iniciar sessão no backend',
        },
        { status: response.status }
      );
    }

    const result: any = (await safeJson(response)) || {};

    return NextResponse.json({
      success: true,
      message: 'Sessão de automação iniciada com sucesso',
      sessionId: result.sessionId,
      provider: result.provider || 'unknown',
      config: sessionConfig,
      data: result
    });

  } catch (error) {
    console.error('Erro ao iniciar sessão de automação:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/automation/sessions/start
 * Lista sessões ativas
 */
export async function GET() {
  try {
    const response = await fetchBackend('/api/automation/sessions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          sessions: [],
          error: 'Backend não disponível' 
        },
        { status: 503 }
      );
    }

    const result: any = (await safeJson(response)) || {};

    return NextResponse.json({
      success: true,
      sessions: Array.isArray(result.sessions) ? result.sessions : [],
      totalSessions: numberOrZero(result.totalSessions),
      activeSessions: numberOrZero(result.activeSessions)
    });

  } catch (error) {
    console.error('Erro ao listar sessões:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        sessions: [],
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}