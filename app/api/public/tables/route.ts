import { NextRequest, NextResponse } from 'next/server';

// API pública para obter lista de mesas de roleta
export async function GET(request: NextRequest) {
  try {
    console.log('🎰 Buscando mesas de roleta disponíveis...');
    
    // Dados mock das mesas de roleta (substituir por dados reais do Supabase quando necessário)
    const tables = [
      {
        id: 'pragmatic-brazilian-roulette',
        name: 'Pragmatic Roleta Brasileira',
        provider: 'Pragmatic Play',
        type: 'live',
        status: 'active',
        players: 45,
        limits: {
          min: 1,
          max: 5000
        }
      },
      {
        id: 'pragmatic-mega-roulette',
        name: 'Pragmatic Mega Roulette',
        provider: 'Pragmatic Play',
        type: 'live',
        status: 'active',
        players: 78,
        limits: {
          min: 1,
          max: 10000
        }
      },
      {
        id: 'evolution-immersive-roulette',
        name: 'Evolution Immersive Roulette',
        provider: 'Evolution Gaming',
        type: 'live',
        status: 'active',
        players: 92,
        limits: {
          min: 1,
          max: 25000
        }
      },
      {
        id: 'evolution-roleta-ao-vivo',
        name: 'Evolution Roleta ao Vivo',
        provider: 'Evolution Gaming',
        type: 'live',
        status: 'active',
        players: 63,
        limits: {
          min: 1,
          max: 15000
        }
      }
    ];

    console.log(`✅ Retornando ${tables.length} mesas disponíveis`);
    
    return NextResponse.json({
      success: true,
      data: tables,
      total: tables.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar mesas:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: 'Não foi possível carregar as mesas de roleta'
      },
      { status: 500 }
    );
  }
}

// Método OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
