import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { backendIntegration } from '@/lib/backend-integration';

export const runtime = 'nodejs';

/**
 * Endpoint: GET /api/ai-signals
 * Retorna sinais de IA para apostas na roleta
 * Requer autenticação
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Extrair parâmetros de consulta
    const tableId = searchParams.get('table_id');
    const signalType = searchParams.get('type'); // 'hot_numbers', 'patterns', 'predictions', 'all'
    const confidence = parseFloat(searchParams.get('confidence') || '0.7');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validar parâmetros
    if (confidence < 0 || confidence > 1) {
      return NextResponse.json({
        success: false,
        error: 'Confiança deve estar entre 0 e 1'
      }, { status: 400 });
    }

    if (limit > 100) {
      return NextResponse.json({
        success: false,
        error: 'Limite máximo de 100 sinais por requisição'
      }, { status: 400 });
    }

    console.log('🤖 Buscando sinais de IA...');

    // Buscar sinais usando o serviço de integração
    const result = await backendIntegration.getAISignals(
      tableId || undefined,
      signalType || 'all',
      confidence,
      limit
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar sinais de IA',
        details: result.message
      }, { status: 500 });
    }

    console.log('✅ Sinais de IA obtidos:', Array.isArray(result.data) ? result.data.length : 0);

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        table_id: tableId,
        signal_type: signalType || 'all',
        confidence_threshold: confidence,
        generated_at: new Date().toISOString(),
        ai_model_version: '2.1.0'
      },
      message: result.message || 'Sinais de IA obtidos com sucesso'
    });

  } catch (error) {
    console.error('Erro no endpoint de sinais de IA:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Endpoint OPTIONS para informações da API
 */
export async function OPTIONS() {
  return NextResponse.json({
    methods: ['GET'],
    description: 'Endpoint para obter sinais de IA para apostas na roleta',
    parameters: {
      table_id: 'string - ID da mesa para filtrar sinais',
      type: 'string - Tipo de sinal (hot_numbers, patterns, predictions, all)',
      confidence: 'number - Nível mínimo de confiança (0-1, padrão: 0.7)',
      limit: 'number - Máximo de sinais a retornar (padrão: 10, máximo: 100)'
    },
    response_format: {
      data: 'array - Lista de sinais de IA',
      metadata: 'object - Metadados dos sinais',
      success: 'boolean - Status da operação',
      message: 'string - Mensagem opcional'
    },
    signal_types: {
      hot_numbers: 'Números que estão saindo com frequência',
      patterns: 'Padrões detectados nos últimos spins',
      predictions: 'Predições para próximos números',
      all: 'Todos os tipos de sinais disponíveis'
    }
  });
}
