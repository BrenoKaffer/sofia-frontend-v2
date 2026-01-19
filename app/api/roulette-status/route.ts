import { NextRequest, NextResponse } from 'next/server';
import { backendService } from '@/lib/backend-service';
import { auth } from '@/lib/auth-server';

// MOCK DATA: Função para gerar status das roletas simulados
function generateMockRouletteStatus() {
  const tables = [
    {
      id: 'pragmatic-brazilian-roulette',
      name: 'Pragmatic Roleta Brasileira',
      provider: 'Pragmatic Play'
    },
    {
      id: 'pragmatic-mega-roulette',
      name: 'Pragmatic Mega Roulette',
      provider: 'Pragmatic Play'
    },
    {
      id: 'evolution-immersive-roulette',
      name: 'Evolution Immersive Roulette',
      provider: 'Evolution Gaming'
    },
    {
      id: 'evolution-roleta-ao-vivo',
      name: 'Evolution Roleta ao Vivo',
      provider: 'Evolution Gaming'
    },
    {
      id: 'netent-live-roulette',
      name: 'NetEnt Live Roulette',
      provider: 'NetEnt'
    },
    {
      id: 'playtech-premium-roulette',
      name: 'Playtech Premium Roulette',
      provider: 'Playtech'
    }
  ];
  
  const statuses = ['active', 'inactive', 'maintenance', 'error'];
  const numbers = Array.from({length: 37}, (_, i) => i);
  const colors = ['red', 'black', 'green'];
  
  return tables.map((table, index) => {
    const now = new Date();
    const lastSpinTime = new Date(now.getTime() - Math.floor(Math.random() * 300000)); // Últimos 5 minutos
    const lastNumber = numbers[Math.floor(Math.random() * numbers.length)];
    const lastColor = lastNumber === 0 ? 'green' : (lastNumber % 2 === 0 ? 'black' : 'red');
    
    // Playtech em manutenção para simular variedade
    const status = table.id === 'playtech-premium-roulette' ? 'maintenance' : 
                  Math.random() > 0.1 ? 'active' : statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id: `status_${table.id}`,
      table_id: table.id,
      table_name: table.name,
      provider: table.provider,
      status: status,
      players_count: status === 'active' ? Math.floor(Math.random() * 200) + 10 : 0,
      last_spin: status === 'active' ? {
        number: lastNumber,
        color: lastColor,
        timestamp: lastSpinTime.toISOString(),
        spin_duration: Math.floor(Math.random() * 20) + 15 // 15-35 segundos
      } : null,
      lastNumbers: status === 'active' ? Array.from({length: 20}, () => numbers[Math.floor(Math.random() * numbers.length)]) : [],
      next_spin_estimate: status === 'active' ? 
        new Date(now.getTime() + Math.floor(Math.random() * 60000) + 30000).toISOString() : null, // 30s-1.5min
      connection_quality: status === 'active' ? 
        ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)] : 'disconnected',
      last_updated: new Date().toISOString(),
      uptime_percentage: status === 'maintenance' ? 0 : Math.floor(Math.random() * 20) + 80, // 80-100%
      error_message: status === 'error' ? 'Conexão com o provedor instável' : null
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Buscando status das roletas do backend SOFIA...');
    
    try {
      // Tentar buscar dados do backend real
      const backendResponse = await backendService.getRouletteStatus();

      console.log('✅ Status das roletas recebido do backend SOFIA');
      return NextResponse.json(backendResponse);

    } catch (backendError: any) {
      console.warn('⚠️ Backend não disponível, usando dados mock:', backendError.message);
      
      // MOCK DATA: Fallback com dados simulados para desenvolvimento
      const mockStatus = generateMockRouletteStatus();
      return NextResponse.json(mockStatus);
    }
  } catch (error) {
    console.error('Erro na API de status da roleta:', error);
    console.log('⚠️ Usando status mock (fallback devido a erro)');
    
    // MOCK DATA: Fallback com dados simulados em caso de erro
    const mockStatus = generateMockRouletteStatus();
    return NextResponse.json(mockStatus);
  }
}
