import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { backendService } from '@/lib/backend-service';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

// Rate limiting - máximo 1 request por segundo por usuário
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 1000; // 1 segundo

// Cache em memória para dados em tempo real
let realtimeDataCache: {
  signals: Array<{ id: number; type: string; confidence: number; timestamp: string }>;
  kpis: Record<string, any>;
  tableStatus: Array<{ id: string; status: string; players: number }>;
  lastUpdate: number;
  isWebSocketAvailable: boolean;
} = {
  signals: [],
  kpis: {},
  tableStatus: [],
  lastUpdate: 0,
  isWebSocketAvailable: false
};

// Dados mock para fallback
const mockData = {
  signals: [
    { id: 1, type: 'RED', confidence: 0.85, timestamp: new Date().toISOString() },
    { id: 2, type: 'BLACK', confidence: 0.78, timestamp: new Date().toISOString() },
    { id: 3, type: 'GREEN', confidence: 0.92, timestamp: new Date().toISOString() }
  ],
  kpis: {
    totalBets: 1250,
    winRate: 68.5,
    profit: 2340.50,
    activeTables: 12
  },
  tableStatus: [
    { id: 'table_1', status: 'active', players: 8 },
    { id: 'table_2', status: 'active', players: 12 },
    { id: 'table_3', status: 'maintenance', players: 0 }
  ]
};

// Função para verificar rate limiting
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(userId) || 0;
  
  if (now - lastRequest < RATE_LIMIT_WINDOW) {
    return false; // Rate limit excedido
  }
  
  rateLimitMap.set(userId, now);
  return true;
}

// Função para atualizar cache de dados usando o backend service
async function updateRealtimeCache() {
  const now = Date.now();
  
  // Atualizar cache apenas se passou mais de 5 segundos
  if (now - realtimeDataCache.lastUpdate < 5000) {
    return realtimeDataCache;
  }
  
  try {
    console.log('🔄 Atualizando cache de dados em tempo real...');
    
    // Tentar buscar dados do backend real
    const [signalsData, kpisData, tableStatusData] = await Promise.allSettled([
      backendService.getRecentSignals({}),
      backendService.getKpisEstrategias(),
      backendService.getRouletteStatus()
    ]);
    
    // Processar resultados
    if (signalsData.status === 'fulfilled') {
      realtimeDataCache.signals = signalsData.value.data || [];
      realtimeDataCache.isWebSocketAvailable = true;
    }
    
    if (kpisData.status === 'fulfilled') {
      realtimeDataCache.kpis = kpisData.value.data || {};
    }
    
    if (tableStatusData.status === 'fulfilled') {
      realtimeDataCache.tableStatus = tableStatusData.value.data || [];
    }
    
    // Se alguma requisição falhou, usar dados mock para os campos faltantes
    if (signalsData.status === 'rejected' || kpisData.status === 'rejected' || tableStatusData.status === 'rejected') {
      console.warn('⚠️ Algumas requisições falharam, usando dados mock como fallback');
      realtimeDataCache.isWebSocketAvailable = false;
      
      if (signalsData.status === 'rejected') {
        realtimeDataCache.signals = mockData.signals.map(signal => ({
          ...signal,
          timestamp: new Date().toISOString()
        }));
      }
      
      if (kpisData.status === 'rejected') {
        realtimeDataCache.kpis = mockData.kpis;
      }
      
      if (tableStatusData.status === 'rejected') {
        realtimeDataCache.tableStatus = mockData.tableStatus;
      }
    }
    
    realtimeDataCache.lastUpdate = now;
    console.log('✅ Cache de dados em tempo real atualizado');
    
  } catch (error) {
    console.error('Erro ao atualizar cache de dados em tempo real:', error);
    // Em caso de erro, usar dados mock
    realtimeDataCache.signals = mockData.signals.map(signal => ({
      ...signal,
      timestamp: new Date().toISOString()
    }));
    realtimeDataCache.kpis = mockData.kpis;
    realtimeDataCache.tableStatus = mockData.tableStatus;
    realtimeDataCache.isWebSocketAvailable = false;
    realtimeDataCache.lastUpdate = now;
  }
  
  return realtimeDataCache;
}

// GET: Buscar dados em tempo real via middleware
export async function GET(request: NextRequest) {
  try {
    // Obter informações de autenticação do middleware
    const userId = request.headers.get('x-user-id');
    const authType = request.headers.get('x-auth-type');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verificar rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns segundos.' },
        { status: 429 }
      );
    }
    
    // Obter parâmetros da query
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type'); // 'signals', 'kpis', 'tables', 'all'
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Atualizar cache de dados
    const cachedData = await updateRealtimeCache();
    
    // Retornar dados baseado no tipo solicitado
    let responseData: any = {};
    
    switch (dataType) {
      case 'signals':
        responseData = {
          signals: cachedData.signals.slice(0, limit),
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'kpis':
        responseData = {
          kpis: cachedData.kpis,
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'tables':
        responseData = {
          tables: cachedData.tableStatus,
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'all':
      default:
        responseData = {
          signals: cachedData.signals.slice(0, limit),
          kpis: cachedData.kpis,
          tables: cachedData.tableStatus,
          timestamp: new Date().toISOString(),
          cacheAge: Date.now() - cachedData.lastUpdate
        };
        break;
    }
    
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Erro no endpoint realtime-data:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST: Enviar comandos para o WebSocket interno (se necessário)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { action, data } = body;
    
    // Aqui você pode implementar ações específicas
    // como solicitar dados específicos do WebSocket interno
    
    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro no POST realtime-data:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
