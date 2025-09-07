import { NextRequest, NextResponse } from 'next/server';

// Configuração do Backend SOFIA
const SOFIA_BACKEND_URL = 'http://localhost:3001/api';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Iniciando API de opções disponíveis...');
    
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    // Buscar opções disponíveis do backend SOFIA
    console.log('🔍 Buscando opções disponíveis do backend SOFIA...');
    
    const optionsResponse = await fetch(`${SOFIA_BACKEND_URL}/available-options`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    let strategies: string[] = [];
    let uniqueTableIds: string[] = [];
    let backendDefaultPreferences: any = null;

    if (optionsResponse.ok) {
      const optionsData = await optionsResponse.json();
      strategies = optionsData.strategies || [];
      uniqueTableIds = (optionsData.tables || []).map((table: any) => table.id || table);
      backendDefaultPreferences = optionsData.default_preferences;
      console.log('✅ Opções recebidas do backend SOFIA:', {
        strategies: strategies.length,
        tables: uniqueTableIds.length,
        hasDefaults: !!backendDefaultPreferences
      });
    } else {
      console.warn('⚠️ Erro ao buscar opções do backend, usando fallback');
      // Fallback para dados padrão
      strategies = [
        'Irmãos de Cores',
        'Terminais Pull',
        'Espelho',
        'Onda',
        'As Dúzias (Atrasadas)',
        'Terminais que se Puxam',
        'Os Opostos',
        'Cavalo/Linha',
        'Sequência de Números',
        'Padrão Fibonacci'
      ];
      uniqueTableIds = [
        'pragmatic-brazilian-roulette',
        'pragmatic-mega-roulette',
        'evolution-immersive-roulette',
        'evolution-roleta-ao-vivo'
      ];
    }

    // Mapear para formato de roletas com nomes amigáveis - MAPEAMENTO EXPANDIDO PARA TODAS AS 48 MESAS
    const nameMapping: { [key: string]: string } = {
      // Evolution Gaming
      'evolution-Football-studio-roulette': 'Evolution Football Studio Roulette',
      'evolution-american-roulette': 'Evolution American Roulette',
      'evolution-auto-lightning-roulette': 'Evolution Auto Lightning Roulette',
      'evolution-auto-roulette': 'Evolution Auto Roulette',
      'evolution-auto-roulette-vip': 'Evolution Auto Roulette VIP',
      'evolution-double-ball-roulette': 'Evolution Double Ball Roulette',
      'evolution-hippodrome-grand-casino': 'Evolution Hippodrome Grand Casino',
      'evolution-immersive-roulette': 'Evolution Immersive Roulette',
      'evolution-lightning-roulette': 'Evolution Lightning Roulette',
      'evolution-roleta-ao-vivo': 'Evolution Roleta ao Vivo',
      'evolution-roleta-relampago': 'Evolution Roleta Relâmpago',
      'evolution-roulette': 'Evolution Roulette',
      'evolution-ruleta-automatica': 'Evolution Ruleta Automática',
      'evolution-ruleta-bola-rapida-en-vivo': 'Evolution Ruleta Bola Rápida en Vivo',
      'evolution-ruleta-en-espanol': 'Evolution Ruleta en Español',
      'evolution-ruleta-en-vivo': 'Evolution Ruleta en Vivo',
      'evolution-ruleta-relampago-en-vivo': 'Evolution Ruleta Relâmpago en Vivo',
      'evolution-speed-auto-roulette': 'Evolution Speed Auto Roulette',
      'evolution-speed-roulette': 'Evolution Speed Roulette',
      'evolution-vip-roulette': 'Evolution VIP Roulette',
      'evolution-xxxtreme-lightning-roulette': 'Evolution XXXtreme Lightning Roulette',
      
      // Pragmatic Play
      'pragmatic-auto-mega-roulette': 'Pragmatic Auto Mega Roulette',
      'pragmatic-auto-roulette': 'Pragmatic Auto Roulette',
      'pragmatic-brazilian-roulette': 'Pragmatic Roleta Brasileira',
      'pragmatic-german-roulette': 'Pragmatic German Roulette',
      'pragmatic-immersive-roulette-deluxe': 'Pragmatic Immersive Roulette Deluxe',
      'pragmatic-italian-mega-roulette': 'Pragmatic Italian Mega Roulette',
      'pragmatic-korean-roulette': 'Pragmatic Korean Roulette',
      'pragmatic-lucky-6-roulette': 'Pragmatic Lucky 6 Roulette',
      'pragmatic-mega-roulette': 'Pragmatic Mega Roulette',
      'pragmatic-mega-roulette-brazilian': 'Pragmatic Mega Roulette Brasileira',
      'pragmatic-powerup-roulette': 'Pragmatic PowerUp Roulette',
      'pragmatic-romanian-roulette': 'Pragmatic Romanian Roulette',
      'pragmatic-roulete-3': 'Pragmatic Roulette 3',
      'pragmatic-roulette-1': 'Pragmatic Roulette 1',
      'pragmatic-roulette-2': 'Pragmatic Roulette 2',
      'pragmatic-roulette-italia-tricolore': 'Pragmatic Roulette Italia Tricolore',
      'pragmatic-roulette-italian': 'Pragmatic Roulette Italian',
      'pragmatic-roulette-macao': 'Pragmatic Roulette Macao',
      'pragmatic-russian-roulette': 'Pragmatic Russian Roulette',
      'pragmatic-speed-auto-roulette': 'Pragmatic Speed Auto Roulette',
      'pragmatic-speed-roulette-1': 'Pragmatic Speed Roulette 1',
      'pragmatic-speed-roulette-2': 'Pragmatic Speed Roulette 2',
      'pragmatic-turkish-mega-roulette': 'Pragmatic Turkish Mega Roulette',
      'pragmatic-turkish-roulette': 'Pragmatic Turkish Roulette',
      'pragmatic-vietnamese-roulette': 'Pragmatic Vietnamese Roulette',
      'pragmatic-vip-auto-roulette': 'Pragmatic VIP Auto Roulette',
      'pragmatic-vip-roulette': 'Pragmatic VIP Roulette',
      
      // Mapeamentos legados para compatibilidade
      'pragmatic-brazilian': 'Pragmatic Roleta Brasileira',
      'evolution-immersive': 'Evolution Immersive Roulette',
      'evolution-live': 'Evolution Roleta ao Vivo',
      'evolution-lightning': 'Evolution Lightning Roulette',
      'playtech-quantum': 'Playtech Quantum Roulette',
      'authentic-gaming': 'Authentic Gaming Roulette',
      'evolution-auto': 'Evolution Auto Roulette',
      'pragmatic-speed': 'Pragmatic Speed Roulette'
    };

    const tables = uniqueTableIds.map(tableId => ({
      id: tableId,
      name: nameMapping[tableId] || `Roleta ${tableId}`
    }));

    // Usar preferências padrão do backend se disponíveis, senão usar fallback local
    let default_preferences;
    
    if (backendDefaultPreferences) {
       // Ajustar estrutura de dados do backend para o formato esperado pelo frontend
       default_preferences = {
         strategies: backendDefaultPreferences.selected_strategies || [],
         tables: backendDefaultPreferences.selected_tables || []
       };
       console.log('✅ Usando preferências padrão do backend SOFIA');
     } else {
      console.log('⚠️ Usando preferências padrão locais (fallback)');
      
      // Preferências padrão curadas (apenas as melhores estratégias e mesas mais populares)
      const curatedStrategies = [
        'As Dúzias (Atrasadas)',
        'Terminais que se Puxam',
        'Irmãos de Cores'
      ];
      
      // Forçar as roletas solicitadas como padrão
      const priorityTables = [
        'pragmatic-brazilian-roulette',    // Roleta Brasileira (Pragmatic Play)
        'pragmatic-mega-roulette',         // Mega Roulette (Pragmatic Play)
        'evolution-immersive-roulette',    // Immersive Roulette (Evolution)
        'evolution-roleta-ao-vivo'         // Roleta ao Vivo (Evolution)
      ];
      
      // Usar as roletas prioritárias se existirem, senão usar as primeiras 4 disponíveis
      const availableTableIds = tables.map(table => table.id);
      const curatedTables = priorityTables.filter(id => availableTableIds.includes(id));
      
      // Se não temos todas as 4 roletas prioritárias, completar com outras disponíveis
      if (curatedTables.length < 4) {
        const remainingTables = availableTableIds.filter(id => !priorityTables.includes(id));
        curatedTables.push(...remainingTables.slice(0, 4 - curatedTables.length));
      }
      
      // Se ainda não temos dados suficientes, usar as roletas padrão
      if (curatedTables.length === 0) {
        curatedTables.push(...priorityTables);
      }
      
      default_preferences = {
        strategies: curatedStrategies,
        tables: curatedTables
      };
    }

    return NextResponse.json({
      strategies,
      tables,
      default_preferences
    });
  } catch (error) {
    console.error('Erro na API de opções disponíveis:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}