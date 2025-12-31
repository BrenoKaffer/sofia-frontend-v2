import { NextRequest, NextResponse } from 'next/server';
import { USE_MOCKS, fetchBackend, safeJson } from '@/lib/backend-proxy';

/**
 * POST /api/automation/initialize
 * Inicializa o sistema de automação
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    // Validar configuração
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuração é obrigatória' },
        { status: 400 }
      );
    }

    // Se mocks estiverem ativos, retornar sucesso imediato
    if (USE_MOCKS) {
      return NextResponse.json({
        success: true,
        message: 'Sistema de automação inicializado (mock)',
        data: { initialized: true, status: 'ready', config },
      });
    }

    // Fazer chamada para o backend Sofia via helper
    const response = await fetchBackend('/api/automation/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config })
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
          error: backendError || 'Falha ao inicializar sistema no backend',
        },
        { status: response.status }
      );
    }

    const result = (await safeJson(response)) || {};

    return NextResponse.json({
      success: true,
      message: 'Sistema de automação inicializado com sucesso',
      data: result
    });

  } catch (error) {
    console.error('Erro ao inicializar automação:', error);
    
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
 * GET /api/automation/initialize
 * Verifica se o sistema está inicializado
 */
export async function GET() {
  try {
    // Com mocks, indicar sistema como pronto
    if (USE_MOCKS) {
      return NextResponse.json({ success: true, initialized: true, status: 'ready' });
    }

    const response = await fetchBackend('/api/automation/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          initialized: false,
          error: 'Backend não disponível' 
        },
        { status: 503 }
      );
    }

    const result: any = (await safeJson(response)) || {};

    return NextResponse.json({
      success: true,
      initialized: Boolean(result.initialized ?? true),
      status: result.status || 'ready'
    });

  } catch (error) {
    console.error('Erro ao verificar status da automação:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        initialized: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}