import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { ApiError, handleApiError } from '@/lib/api-error-handler';
import { apiCache } from '@/lib/api-cache';

/**
 * Endpoint para obter predições do sistema de Machine Learning
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      throw new ApiError('Usuário não autenticado', 401);
    }

    const { searchParams } = new URL(request.url);
    const table_id = searchParams.get('table_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const prediction_type = searchParams.get('prediction_type') || 'next_number';
    const confidence_min = parseFloat(searchParams.get('confidence_min') || '70');

    // Validar parâmetros obrigatórios
    if (!table_id) {
      throw new ApiError('Parâmetro table_id é obrigatório', 400);
    }

    if (limit > 50) {
      throw new ApiError('Limite máximo de 50 predições por requisição', 400);
    }

    // Verificar cache
    const cacheKey = `ml_predictions_${table_id}_${prediction_type}_${limit}_${confidence_min}`;
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Simular predições do sistema ML
    const predictions = [];
    const predictionTypes = {
      next_number: generateNumberPredictions,
      color_sequence: generateColorPredictions,
      pattern_analysis: generatePatternPredictions,
      hot_cold_numbers: generateHotColdPredictions
    };

    const generator = predictionTypes[prediction_type as keyof typeof predictionTypes] || generateNumberPredictions;
    
    for (let i = 0; i < limit; i++) {
      const prediction = generator(table_id, i);
      if (prediction.confidence >= confidence_min) {
        predictions.push(prediction);
      }
    }

    // Dados de contexto do ML
    const mlContext = {
      model_version: '2.1.0',
      last_training: '2024-01-15T10:30:00Z',
      training_data_size: 50000,
      model_accuracy: 0.847,
      feature_importance: {
        spin_history: 0.35,
        time_patterns: 0.28,
        table_trends: 0.22,
        player_behavior: 0.15
      },
      prediction_latency_ms: Math.floor(Math.random() * 50) + 10
    };

    const responseData = {
      success: true,
      data: predictions,
      context: mlContext,
      filters: {
        table_id,
        prediction_type,
        confidence_min,
        limit
      },
      stats: {
        total_predictions: predictions.length,
        avg_confidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length || 0,
        high_confidence_count: predictions.filter(p => p.confidence >= 85).length
      },
      timestamp: new Date().toISOString()
    };

    // Armazenar no cache por 30 segundos
    apiCache.set(cacheKey, responseData, { ttl: 30 });

    return NextResponse.json(responseData);

  } catch (error) {
    return handleApiError(error);
  }
}

// Funções auxiliares para gerar diferentes tipos de predições
function generateNumberPredictions(table_id: string, index: number) {
  const numbers = Array.from({ length: 37 }, (_, i) => i); // 0-36
  const predicted_number = numbers[Math.floor(Math.random() * numbers.length)];
  
  return {
    id: `pred_${Date.now()}_${index}`,
    type: 'next_number',
    table_id,
    predicted_value: predicted_number,
    confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
    probability_distribution: generateProbabilityDistribution(),
    reasoning: [
      'Análise de padrões dos últimos 100 spins',
      'Tendência identificada nos números pares',
      'Correlação temporal detectada'
    ],
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos
    metadata: {
      algorithm: 'deep_neural_network',
      features_used: ['spin_sequence', 'time_interval', 'sector_analysis'],
      model_confidence: Math.random() * 0.3 + 0.7
    }
  };
}

function generateColorPredictions(table_id: string, index: number) {
  const colors = ['red', 'black', 'green'];
  const predicted_color = colors[Math.floor(Math.random() * colors.length)];
  
  return {
    id: `pred_color_${Date.now()}_${index}`,
    type: 'color_sequence',
    table_id,
    predicted_value: predicted_color,
    confidence: Math.floor(Math.random() * 25) + 75,
    sequence_analysis: {
      last_10_colors: generateColorSequence(10),
      pattern_detected: 'alternating_tendency',
      streak_probability: Math.random() * 0.4 + 0.3
    },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    metadata: {
      algorithm: 'pattern_recognition',
      sequence_length_analyzed: 50
    }
  };
}

function generatePatternPredictions(table_id: string, index: number) {
  const patterns = ['hot_sector', 'cold_numbers', 'neighbor_tendency', 'dozen_pattern'];
  const detected_pattern = patterns[Math.floor(Math.random() * patterns.length)];
  
  return {
    id: `pred_pattern_${Date.now()}_${index}`,
    type: 'pattern_analysis',
    table_id,
    predicted_value: detected_pattern,
    confidence: Math.floor(Math.random() * 20) + 80,
    pattern_details: {
      type: detected_pattern,
      strength: Math.random() * 0.5 + 0.5,
      duration_estimate: `${Math.floor(Math.random() * 10) + 5} spins`,
      affected_numbers: generateAffectedNumbers(detected_pattern)
    },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    metadata: {
      algorithm: 'pattern_detection_ml',
      historical_accuracy: Math.random() * 0.2 + 0.75
    }
  };
}

function generateHotColdPredictions(table_id: string, index: number) {
  return {
    id: `pred_hotcold_${Date.now()}_${index}`,
    type: 'hot_cold_numbers',
    table_id,
    predicted_value: {
      hot_numbers: Array.from({ length: 5 }, () => Math.floor(Math.random() * 37)),
      cold_numbers: Array.from({ length: 5 }, () => Math.floor(Math.random() * 37)),
      neutral_numbers: Array.from({ length: 3 }, () => Math.floor(Math.random() * 37))
    },
    confidence: Math.floor(Math.random() * 15) + 85,
    analysis_period: '100 spins',
    temperature_scores: generateTemperatureScores(),
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    metadata: {
      algorithm: 'statistical_analysis_ml',
      sample_size: 100
    }
  };
}

// Funções auxiliares
function generateProbabilityDistribution() {
  const distribution: { [key: number]: number } = {};
  for (let i = 0; i <= 36; i++) {
    distribution[i] = Math.random() * 0.05 + 0.02; // 2-7% para cada número
  }
  return distribution;
}

function generateColorSequence(length: number) {
  const colors = ['red', 'black', 'green'];
  return Array.from({ length }, () => colors[Math.floor(Math.random() * colors.length)]);
}

function generateAffectedNumbers(pattern: string) {
  const counts = {
    hot_sector: 8,
    cold_numbers: 6,
    neighbor_tendency: 5,
    dozen_pattern: 12
  };
  
  const count = counts[pattern as keyof typeof counts] || 5;
  return Array.from({ length: count }, () => Math.floor(Math.random() * 37));
}

function generateTemperatureScores() {
  const scores: { [key: number]: number } = {};
  for (let i = 0; i <= 36; i++) {
    scores[i] = Math.random() * 2 - 1; // -1 a 1 (frio a quente)
  }
  return scores;
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
