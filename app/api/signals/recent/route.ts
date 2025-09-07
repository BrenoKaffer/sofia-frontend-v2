import { NextRequest, NextResponse } from 'next/server';

// Configuração do Backend SOFIA
const SOFIA_BACKEND_URL = 'http://localhost:3001/api';

// Cache para simular sinais contínuos
let signalCache: any[] = [];
let lastSignalGeneration = 0;
const SIGNAL_GENERATION_INTERVAL = 30000; // Gerar novo sinal a cada 30 segundos (tempo real entre rodadas de roleta)

// MOCK DATA: Função para gerar sinais simulados compatíveis com o frontend
function generateMockSignals(limit: number = 50, tableId?: string | null) {
  const now = new Date();
  const currentTime = now.getTime();
  
  // Verificar se é hora de gerar um novo sinal
  if (currentTime - lastSignalGeneration > SIGNAL_GENERATION_INTERVAL || signalCache.length === 0) {
    console.log('🎯 Gerando novo sinal mock...');
    
    const tables = [
      'pragmatic-brazilian-roulette',
      'pragmatic-mega-roulette', 
      'evolution-immersive-roulette',
      'evolution-roleta-ao-vivo',
      'netent-live-roulette'
    ];
    
    const strategies = [
      'Martingale Clássico',
      'Fibonacci Avançado', 
      'D\'Alembert Modificado',
      'Labouchere Progressivo',
      'Paroli Conservador'
    ];
    
    const signalTypes = ['hot_number', 'cold_number', 'color_pattern', 'dozen_pattern', 'column_pattern'];
    const numbers = Array.from({length: 37}, (_, i) => i); // 0-36
    
    const selectedTable = tableId || tables[Math.floor(Math.random() * tables.length)];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const confidenceLevel = Math.floor(Math.random() * 40) + 60; // 60-100%
    
    // Gerar apostas sugeridas (números) - garantir que sempre tenha pelo menos 2
    const betCount = Math.floor(Math.random() * 4) + 2; // 2-5 apostas
    const suggestedBets = [];
    const usedNumbers = new Set();
    
    while (suggestedBets.length < betCount && usedNumbers.size < numbers.length) {
      const number = numbers[Math.floor(Math.random() * numbers.length)];
      if (!usedNumbers.has(number)) {
        usedNumbers.add(number);
        suggestedBets.push(number);
      }
    }
    
    const newSignal = {
      id: `mock_signal_${currentTime}`,
      strategy_name: strategy,
      strategy_id: strategy,
      table_id: selectedTable,
      suggested_bets: suggestedBets,
      bet_numbers: suggestedBets,
      suggested_units: Math.floor(Math.random() * 5) + 1, // 1-5 unidades
      confidence_level: confidenceLevel,
      confidence_score: confidenceLevel / 100,
      confidence_factors: {
        strategy_performance: Math.random() * 0.4 + 0.6, // 0.6-1.0
        table_performance: Math.random() * 0.4 + 0.6,
        pattern_strength: Math.random() * 0.4 + 0.6,
        data_volume: Math.random() * 0.4 + 0.6,
        time_factor: Math.random() * 0.4 + 0.6,
        consistency: Math.random() * 0.4 + 0.6
      },
      expected_return: Math.random() * 200 + 50, // 50-250
      timestamp_generated: now.toISOString(),
      expires_at: new Date(currentTime + 25000).toISOString(), // 25 segundos de duração (tempo real para apostar na roleta)
      is_validated: Math.random() > 0.3,
      type: signalTypes[Math.floor(Math.random() * signalTypes.length)],
      status: 'active',
      message: `Padrão ${signalTypes[Math.floor(Math.random() * signalTypes.length)]} detectado na mesa ${selectedTable}. Aposte nos números sugeridos com ${confidenceLevel}% de confiança.`
    };
    
    // Adicionar novo sinal ao cache e manter apenas os últimos 10
    signalCache.unshift(newSignal);
    signalCache = signalCache.slice(0, 10);
    lastSignalGeneration = currentTime;
    
    console.log(`✅ Novo sinal gerado: ${newSignal.id} com números [${suggestedBets.join(', ')}]`);
  }
  
  // Filtrar sinais muito antigos (manter sinais expirados por mais tempo para exibição contínua)
  const validSignals = signalCache.filter(signal => {
    const expiresAt = new Date(signal.expires_at).getTime();
    const timeSinceExpired = currentTime - expiresAt;
    // Manter sinais por até 60 segundos após expiração para exibição contínua
    return timeSinceExpired < 60000; // 60 segundos
  });
  
  // Se não há sinais válidos, gerar um imediatamente
  if (validSignals.length === 0) {
    lastSignalGeneration = 0; // Forçar geração
    return generateMockSignals(limit, tableId);
  }
  
  const mockSignals = validSignals.slice(0, Math.min(limit, 10));
  
  return mockSignals.sort((a, b) => new Date(b.timestamp_generated).getTime() - new Date(a.timestamp_generated).getTime());
}

export async function GET(request: NextRequest) {
  // Extrair parâmetros da query
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const tableId = searchParams.get('table_id');
  
  try {
    console.log('🚀 Iniciando API de sinais recentes...');
    
    // Verificar autorização (aceitar token mock para desenvolvimento)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    // Para desenvolvimento, aceitar token mock
    if (token !== 'mock-jwt-token-for-demo') {
      console.log('⚠️ Token inválido, usando dados mock como fallback');
    }

    // DESENVOLVIMENTO: Usar sempre dados mock para garantir funcionamento
    console.log('🔧 Modo desenvolvimento: usando dados mock');
    
    // MOCK DATA: Dados simulados para desenvolvimento
    const mockSignals = generateMockSignals(limit, tableId);
    console.log('✅ Sinais mock gerados:', mockSignals.length);
    
    return NextResponse.json(mockSignals);
    
    // TODO: Descomentar quando backend estiver funcionando corretamente
    /*
    // Buscar sinais recentes do backend SOFIA
    console.log('🔍 Buscando sinais recentes do backend SOFIA...');
    
    const signalsUrl = new URL(`${SOFIA_BACKEND_URL}/signals/recent`);
    if (limit) {
      signalsUrl.searchParams.set('limit', limit.toString());
    }
    if (tableId) {
      signalsUrl.searchParams.set('table_id', tableId);
    }

    const response = await fetch(signalsUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      console.warn('⚠️ Erro ao buscar sinais do backend:', response.status, response.statusText);
      console.log('⚠️ Usando sinais mock (fallback)');
      
      // MOCK DATA: Fallback com dados simulados para desenvolvimento
      const mockSignals = generateMockSignals(limit, tableId);
      return NextResponse.json(mockSignals);
    }

    const signalsData = await response.json();
    console.log('✅ Sinais recebidos do backend SOFIA:', signalsData?.length || 0);

    // Garantir que os dados sejam um array
    const sanitizedData = Array.isArray(signalsData) ? signalsData : [];

    return NextResponse.json(sanitizedData);
    */
  } catch (error) {
    console.error('Erro na API de sinais recentes:', error);
    console.log('⚠️ Usando sinais mock (fallback devido a erro)');
    
    // MOCK DATA: Fallback com dados simulados em caso de erro
    const mockSignals = generateMockSignals(limit, tableId);
    return NextResponse.json(mockSignals);
  }
}