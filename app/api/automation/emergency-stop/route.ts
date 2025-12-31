import { NextRequest, NextResponse } from 'next/server';
import { USE_MOCKS, fetchBackend, safeJson } from '@/lib/backend-proxy';

/**
 * POST /api/automation/emergency-stop
 * Executa parada de emergência do sistema de automação
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚨 PARADA DE EMERGÊNCIA SOLICITADA');

    // Com mocks, responder imediatamente com sucesso
    if (USE_MOCKS) {
      return NextResponse.json({
        success: true,
        message: 'Parada de emergência simulada (mocks ativos)',
        timestamp: new Date().toISOString(),
        data: { emergencyActive: true }
      });
    }

    const response = await fetchBackend('/api/automation/emergency-stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        reason: 'Manual emergency stop from dashboard'
      })
    });

    if (!response.ok) {
      const errorData = await safeJson(response);
      console.error('❌ Falha na parada de emergência no backend:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: (errorData as any)?.error || 'Falha ao executar parada de emergência no backend' 
        },
        { status: response.status }
      );
    }

    const result = await safeJson(response);
    console.log('✅ Parada de emergência executada com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Parada de emergência executada com sucesso',
      timestamp: new Date().toISOString(),
      data: result
    });

  } catch (error) {
    console.error('❌ Erro crítico na parada de emergência:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro crítico na parada de emergência',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/automation/emergency-stop
 * Verifica se o sistema está em parada de emergência
 */
export async function GET() {
  try {
    if (USE_MOCKS) {
      return NextResponse.json({
        success: true,
        emergencyActive: false,
        lastEmergencyStop: null,
        reason: null
      });
    }

    const response = await fetchBackend('/api/automation/emergency-status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          emergencyActive: false,
          error: 'Backend não disponível' 
        },
        { status: 503 }
      );
    }

    const result: any = await safeJson(response);

    return NextResponse.json({
      success: true,
      emergencyActive: Boolean(result?.emergencyActive ?? false),
      lastEmergencyStop: result?.lastEmergencyStop || null,
      reason: result?.reason || null
    });

  } catch (error) {
    console.error('Erro ao verificar status de emergência:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        emergencyActive: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}