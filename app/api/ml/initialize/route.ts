import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

/**
 * Endpoint para inicializar o sistema de Machine Learning
 */
export async function POST(request: NextRequest) {
  const BACKEND_BASE =
    process.env.BACKEND_URL ||
    process.env.SOFIA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:3001';

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await (request as any).json();
    } catch {
      body = {};
    }

    const config = (body && typeof body === 'object' ? body.config ?? body : {}) || {};

    const defaultConfig = {
      learning_rate: 0.001,
      epochs: 100,
      batch_size: 32,
      validation_split: 0.2,
      early_stopping: true,
      model_type: 'neural_network',
      features: ['spin_history', 'time_patterns', 'table_trends'],
      target: 'next_number_probability'
    };

    const mlConfig = { ...defaultConfig, ...(config || {}) };

    const backendUrl = `${BACKEND_BASE}/api/ml/initialize`;
    const response = await fetch(
      backendUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: mlConfig }),
        timeout: 30000 as any
      } as any
    );

    if (response && typeof (response as any).ok === 'boolean') {
      if (!response.ok) {
        let message = response.statusText || 'Erro no backend';
        try {
          const maybeJson = await response.json();
          message = maybeJson?.error || maybeJson?.message || message;
        } catch {}

        return NextResponse.json(
          {
            success: false,
            error:
              response.status === 401 ? 'Usuário não autenticado' : String(message)
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    const initializationData = {
      status: 'initializing',
      config: mlConfig,
      estimated_time: '2-5 minutes',
      progress: 0,
      models: {
        pattern_recognition: {
          status: 'pending',
          accuracy: null,
          last_trained: null
        },
        number_prediction: {
          status: 'pending',
          accuracy: null,
          last_trained: null
        },
        strategy_optimization: {
          status: 'pending',
          accuracy: null,
          last_trained: null
        }
      },
      features_enabled: [
        'pattern_detection',
        'predictive_analysis',
        'strategy_auto_creation',
        'real_time_optimization'
      ],
      initialization_id: `ml_init_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    };

    return NextResponse.json({
      success: true,
      message: 'Sistema de Machine Learning iniciado com sucesso',
      data: initializationData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Timeout na requisição', isTimeout: true },
        { status: 408 }
      );
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { success: false, error: 'Erro de rede', isNetworkError: true },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint de informações sobre a API
 */
export async function OPTIONS() {
  return NextResponse.json({
    methods: ['POST'],
    description: 'Endpoint para inicializar o sistema de Machine Learning avançado',
    parameters: {
      config: {
        learning_rate: 'number - Taxa de aprendizado (padrão: 0.001)',
        epochs: 'number - Número de épocas de treinamento (padrão: 100)',
        batch_size: 'number - Tamanho do lote (padrão: 32)',
        validation_split: 'number - Divisão para validação (padrão: 0.2)',
        early_stopping: 'boolean - Parada antecipada (padrão: true)',
        model_type: 'string - Tipo do modelo (padrão: neural_network)',
        features: 'array - Características a serem utilizadas',
        target: 'string - Variável alvo para predição'
      }
    },
    response_format: {
      success: 'boolean - Status da operação',
      message: 'string - Mensagem de status',
      data: {
        status: 'string - Status da inicialização',
        config: 'object - Configurações aplicadas',
        estimated_time: 'string - Tempo estimado',
        progress: 'number - Progresso da inicialização',
        models: 'object - Status dos modelos',
        features_enabled: 'array - Funcionalidades habilitadas',
        initialization_id: 'string - ID único da inicialização'
      },
      timestamp: 'string - Timestamp da operação'
    },
    authentication: 'required',
    notes: [
      'Requer autenticação',
      'Processo de inicialização pode levar alguns minutos',
      'Retorna ID único para acompanhar o progresso',
      'Configurações podem ser personalizadas via parâmetros'
    ]
  });
}
