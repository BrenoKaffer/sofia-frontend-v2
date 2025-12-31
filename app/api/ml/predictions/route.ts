import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { apiCache } from '@/lib/api-cache';

/**
 * Endpoint para obter predições do sistema de Machine Learning
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const table_id = searchParams.get('table_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const prediction_type = searchParams.get('prediction_type') || 'next_number';
    const confidence_min = parseFloat(searchParams.get('confidence_min') || '70');

    if (!table_id) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro table_id é obrigatório' },
        { status: 400 }
      );
    }

    if (limit > 50) {
      return NextResponse.json(
        { success: false, error: 'Limite máximo de 50 predições por requisição' },
        { status: 400 }
      );
    }

    const cacheKey = `ml_predictions_${table_id}_${prediction_type}_${limit}_${confidence_min}`;
    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached.data);
    }

    const backendUrl = `${BACKEND_BASE}/api/ml/predictions${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`;

    const response = await fetch(
      backendUrl,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 as any
      } as any
    );

    if (!response || typeof (response as any).ok !== 'boolean') {
      const fallback = {
        success: true,
        data: [],
        filters: {
          table_id,
          prediction_type,
          confidence_min,
          limit
        },
        timestamp: new Date().toISOString()
      };
      apiCache.set(cacheKey, fallback, { ttl: 30_000 });
      return NextResponse.json(fallback);
    }

    if (!response.ok) {
      let message = response.statusText || 'Erro no backend';
      try {
        const maybeJson = await response.json();
        message =
          maybeJson?.error ||
          maybeJson?.message ||
          maybeJson?.details?.message ||
          message;
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
    apiCache.set(cacheKey, data, { ttl: 30_000 });

    return NextResponse.json(data);
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
    methods: ['GET'],
    description: 'Endpoint para obter predições do sistema de Machine Learning',
    parameters: {
      table_id: 'string - ID da mesa (obrigatório)',
      limit: 'number - Número máximo de predições (padrão: 10, máximo: 50)',
      prediction_type: 'string - Tipo de predição (next_number, color_sequence, pattern_analysis, hot_cold_numbers)',
      confidence_min: 'number - Confiança mínima (padrão: 70)'
    },
    response_format: {
      success: 'boolean - Status da operação',
      data: 'array - Lista de predições',
      context: 'object - Contexto do modelo ML',
      filters: 'object - Filtros aplicados',
      stats: 'object - Estatísticas das predições',
      timestamp: 'string - Timestamp da operação'
    },
    prediction_types: {
      next_number: 'Predição do próximo número',
      color_sequence: 'Análise de sequência de cores',
      pattern_analysis: 'Detecção de padrões',
      hot_cold_numbers: 'Análise de números quentes/frios'
    },
    authentication: 'required',
    cache_duration: '30 seconds'
  });
}
