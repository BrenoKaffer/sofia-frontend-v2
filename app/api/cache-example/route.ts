/**
 * Exemplo de API com cache Redis integrado
 * Demonstra como usar o middleware de cache nas rotas
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCache, CacheInvalidator } from '../../../lib/cache-middleware';
import { redisCache, CACHE_TTL, CACHE_KEYS } from '../../../lib/redis';
import { logger } from '../../../lib/logger';

// Simulação de dados para exemplo
const mockData = {
  users: [
    { id: 1, name: 'João Silva', email: 'joao@example.com', lastLogin: new Date() },
    { id: 2, name: 'Maria Santos', email: 'maria@example.com', lastLogin: new Date() },
    { id: 3, name: 'Pedro Costa', email: 'pedro@example.com', lastLogin: new Date() }
  ],
  strategies: [
    { id: 1, name: 'Estratégia A', winRate: 0.75, profit: 1250.50 },
    { id: 2, name: 'Estratégia B', winRate: 0.68, profit: 980.25 },
    { id: 3, name: 'Estratégia C', winRate: 0.82, profit: 1890.75 }
  ]
};

// Função simulada para buscar dados (simula delay de API)
async function fetchDataFromDatabase(type: string, userId?: string) {
  // Simula delay de database
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  logger.info('Fetching data from database', { userId, metadata: { type, context: 'cache-example' } });
  
  switch (type) {
    case 'users':
      return mockData.users;
    case 'strategies':
      return userId ? 
        mockData.strategies.filter(s => s.id <= parseInt(userId)) : 
        mockData.strategies;
    default:
      return [];
  }
}

// Handler principal sem cache (para comparação)
async function handleWithoutCache(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'users';
  const userId = searchParams.get('userId');
  
  try {
    const startTime = performance.now();
    const data = await fetchDataFromDatabase(type, userId || undefined);
    const endTime = performance.now();
    
    return NextResponse.json({
      success: true,
      data,
      meta: {
        cached: false,
        fetchTime: `${(endTime - startTime).toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching data without cache', {
      metadata: {
        context: 'cache-example'
      }
    }, error as Error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// Handler com cache Redis
async function handleWithCache(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'users';
  const userId = searchParams.get('userId');
  
  try {
    const startTime = performance.now();
    
    // Gera chave de cache
    const cacheKey = `${CACHE_KEYS.API}cache-example:${type}${userId ? `:user:${userId}` : ''}`;
    
    // Tenta buscar do cache primeiro
    let data = await redisCache.get(cacheKey);
    let fromCache = true;
    
    if (!data) {
      // Se não está no cache, busca do "database"
      data = await fetchDataFromDatabase(type, userId || undefined);
      
      // Salva no cache com TTL apropriado
      await redisCache.set(cacheKey, data, CACHE_TTL.MEDIUM);
      fromCache = false;
    }
    
    const endTime = performance.now();
    
    return NextResponse.json({
      success: true,
      data,
      meta: {
        cached: fromCache,
        cacheKey,
        fetchTime: `${(endTime - startTime).toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching data with cache', { 
      metadata: { context: 'cache-example' }
    }, error as Error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// GET - Buscar dados (com ou sem cache)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const useCache = searchParams.get('cache') !== 'false';
  
  logger.info('Cache example API called', { 
    metadata: {
      useCache,
      params: Object.fromEntries(searchParams.entries()),
      context: 'cache-example'
    }
  });
  
  if (useCache) {
    return handleWithCache(req);
  } else {
    return handleWithoutCache(req);
  }
}

// POST - Criar/atualizar dados (invalida cache)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;
    
    logger.info('Creating/updating data', { metadata: { type, context: 'cache-example' } });
    
    // Simula criação/atualização no database
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Invalida cache relacionado
    const pattern = `${CACHE_KEYS.API}cache-example:${type}*`;
    const invalidatedCount = await redisCache.delPattern(pattern);
    
    logger.info('Cache invalidated after data update', { 
      metadata: {
        pattern, 
        invalidatedCount,
        context: 'cache-example'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Data updated successfully',
      meta: {
        invalidatedCacheEntries: invalidatedCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error updating data', { 
      metadata: { context: 'cache-example' }
    }, error as Error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update data' },
      { status: 500 }
    );
  }
}

// DELETE - Limpar cache específico
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const action = searchParams.get('action');
    
    let result = { invalidatedCount: 0, message: '' };
    
    switch (action) {
      case 'clear-type':
        if (type) {
          result.invalidatedCount = await redisCache.delPattern(`${CACHE_KEYS.API}cache-example:${type}*`);
          result.message = `Cleared cache for type: ${type}`;
        }
        break;
        
      case 'clear-all':
        result.invalidatedCount = await redisCache.delPattern(`${CACHE_KEYS.API}cache-example:*`);
        result.message = 'Cleared all cache for cache-example';
        break;
        
      case 'clear-api':
        result.invalidatedCount = await redisCache.delPattern(`${CACHE_KEYS.API}*`);
        result.message = 'Cleared all API cache';
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: clear-type, clear-all, or clear-api' },
          { status: 400 }
        );
    }
    
    logger.info('Cache cleared via DELETE endpoint', { 
      metadata: {
        action, 
        type, 
        ...result,
        context: 'cache-example'
      }
    });
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error clearing cache', { 
      metadata: { context: 'cache-example' }
    }, error as Error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

// Exemplo de uso do middleware de cache (comentado para não interferir)
// export const GET = withCache({ ttl: CACHE_TTL.MEDIUM })(handleWithCache);
