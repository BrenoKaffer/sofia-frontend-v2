import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { backendService } from '@/lib/backend-service';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

// Interfaces
interface SignalFilters {
  limit?: number;
  table_id?: string;
}

interface ApiResponse {
  data: any[];
  success: boolean;
  message: string;
}

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
    console.log('Gerando novo sinal mock...');
    
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
    
    console.log(`Novo sinal gerado: ${newSignal.id} com números [${suggestedBets.join(', ')}]`);
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
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair parâmetros da query
    const { searchParams } = new URL(request.url);
    const filters: SignalFilters = {
      limit: parseInt(searchParams.get('limit') || '50'),
      table_id: searchParams.get('table_id') || undefined
    };

    console.log('Buscando sinais recentes do backend...');

    try {
      // Tentar buscar dados do backend real
      const backendResponse = await backendService.getRecentSignals({
        limit: filters.limit,
        table_id: filters.table_id
      });

      console.log('Dados recebidos do backend SOFIA');
      return NextResponse.json(backendResponse);

    } catch (backendError: any) {
      console.warn('Backend não disponível, usando dados mock:', backendError.message);
      
      // Fallback para dados mock
      const mockSignals = generateMockSignals(filters.limit || 50, filters.table_id);
      const mockResponse: ApiResponse = {
        data: mockSignals,
        success: true,
        message: 'Dados simulados (backend indisponível)'
      };
      
      return NextResponse.json(mockResponse);
    }

  } catch (error: any) {
    // Erro geral na API de sinais recentes
    
    // Fallback final para dados mock
    const mockSignals = generateMockSignals(50);
    const mockResponse: ApiResponse = {
      data: mockSignals,
      success: false,
      message: 'Erro interno do servidor'
    };
    
    return NextResponse.json(mockResponse, { status: 500 });
  }
}
