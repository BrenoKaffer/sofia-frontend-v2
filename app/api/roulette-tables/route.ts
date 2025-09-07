import { NextRequest, NextResponse } from 'next/server';

// Configuração do Backend SOFIA
const SOFIA_BACKEND_URL = 'http://localhost:3001/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Iniciando API de tabelas de roleta...');
    
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    // Buscar tabelas de roleta do backend SOFIA
    console.log('🔍 Buscando tabelas de roleta do backend SOFIA...');
    
    const response = await fetch(`${SOFIA_BACKEND_URL}/roulette-tables`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      console.error('❌ Erro ao buscar tabelas do backend:', response.status, response.statusText);
      throw new Error(`Backend retornou erro: ${response.status}`);
    }

    const tablesData = await response.json();
    console.log('✅ Tabelas recebidas do backend SOFIA:', tablesData);
    
    // Garantir que os dados sejam um array
    const sanitizedData = Array.isArray(tablesData) ? tablesData : [];
    
    return NextResponse.json(sanitizedData);
  } catch (error) {
    console.error('❌ Erro na API de tabelas de roleta:', error);
    console.log('⚠️ Usando tabelas padrão (fallback)');
    
    // MOCK DATA: Fallback com dados simulados para desenvolvimento
    const defaultTables = [
      { 
        id: 'pragmatic-brazilian-roulette', 
        name: 'Pragmatic Roleta Brasileira', 
        status: 'online', 
        last_updated: new Date().toISOString(),
        provider: 'Pragmatic Play',
        players_count: 47,
        last_number: 23,
        last_color: 'red'
      },
      { 
        id: 'pragmatic-mega-roulette', 
        name: 'Pragmatic Mega Roulette', 
        status: 'online', 
        last_updated: new Date().toISOString(),
        provider: 'Pragmatic Play',
        players_count: 89,
        last_number: 7,
        last_color: 'red'
      },
      { 
        id: 'evolution-immersive-roulette', 
        name: 'Evolution Immersive Roulette', 
        status: 'online', 
        last_updated: new Date().toISOString(),
        provider: 'Evolution Gaming',
        players_count: 156,
        last_number: 0,
        last_color: 'green'
      },
      { 
        id: 'evolution-roleta-ao-vivo', 
        name: 'Evolution Roleta ao Vivo', 
        status: 'online', 
        last_updated: new Date().toISOString(),
        provider: 'Evolution Gaming',
        players_count: 73,
        last_number: 14,
        last_color: 'red'
      },
      { 
        id: 'playtech-premium-roulette', 
        name: 'Playtech Premium Roulette', 
        status: 'maintenance', 
        last_updated: new Date().toISOString(),
        provider: 'Playtech',
        players_count: 0,
        last_number: null,
        last_color: null
      },
      { 
        id: 'netent-live-roulette', 
        name: 'NetEnt Live Roulette', 
        status: 'online', 
        last_updated: new Date().toISOString(),
        provider: 'NetEnt',
        players_count: 34,
        last_number: 18,
        last_color: 'red'
      }
    ];
    
    return NextResponse.json(defaultTables);
  }
}