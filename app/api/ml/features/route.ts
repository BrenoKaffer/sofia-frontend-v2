import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { ApiError, handleApiError } from '@/lib/api-error-handler';
import { apiCache } from '@/lib/api-cache';

/**
 * Proxy de features avançadas do ML Engine (topologia e setores)
 * Encaminha para o backend: GET /api/ml/features
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new ApiError('Usuário não autenticado', 401);
    }

    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get('table_id');
    const limit = searchParams.get('limit') || '50';

    if (!tableId) {
      throw new ApiError('Parâmetro table_id é obrigatório', 400);
    }

    // Cache por mesa para evitar sobrecarga
    const cacheKey = `ml_features_${tableId}_${limit}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const baseUrl = process.env.BACKEND_BASE_URL || 'http://localhost:3001/api';
    const url = `${baseUrl}/ml/features?table_id=${encodeURIComponent(tableId)}&limit=${encodeURIComponent(limit)}`;

    // Encaminhar headers de autenticação se existirem
    const headers: Record<string, string> = {};
    const apiKey = process.env.BACKEND_API_KEY;
    if (apiKey) headers['x-api-key'] = apiKey;

    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      const text = await resp.text();
      throw new ApiError(`Backend retornou erro (${resp.status}): ${text}`, resp.status);
    }

    const data = await resp.json();
    // Cache curto (60s)
    apiCache.set(cacheKey, data, { ttl: 60_000 });

    return NextResponse.json(data);
  } catch (error: any) {
    return handleApiError(error);
  }
}

/**
 * Metadados e documentação rápida
 */
export async function OPTIONS() {
  return NextResponse.json({
    methods: ['GET'],
    description: 'Obtém features de topologia e setores do ML Engine (proxy)',
    backend_endpoint: '/api/ml/features',
    parameters: {
      table_id: 'string (obrigatório)',
      limit: 'number (opcional), padrão 50'
    },
    response: {
      success: 'boolean',
      table_id: 'string',
      features: {
        colorFeatures: 'array|null',
        numberFeatures: 'array|null',
        patternFeatures: 'array|null',
        autonomousFeatures: 'array|null',
        topologyFeatures: '{ wheelIndexHistogram: number[], avgDistanceFromZero: number }|null',
        sectorFeatures: '{ voisinsRatio: number, tiersRatio: number, orphelinsRatio: number, noneRatio: number }|null',
        metadata: '{ totalSpins: number, recentSpins: number, extendedSpins: number }'
      }
    }
  });
}