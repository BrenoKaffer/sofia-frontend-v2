import { NextRequest, NextResponse } from 'next/server';

// Configuração do Backend SOFIA
const SOFIA_BACKEND_URL = 'http://localhost:3001/api';

interface UserPreferences {
  strategies: string[];
  tables: string[];
  dashboard_config?: {
    stats_cards_visible: boolean;
    live_signals_visible: boolean;
    performance_chart_visible: boolean;
    roulette_status_visible: boolean;
    recent_activity_visible: boolean;
  };
}

// MOCK DATA: Função para gerar preferências do usuário simuladas
function generateMockUserPreferences() {
  return {
    user_id: 'mock_user_123',
    strategies: [
      'Hot Numbers AI',
      'Pattern Recognition',
      'Color Sequence',
      'Fibonacci Analysis',
      'Statistical Model'
    ],
    tables: [
      'pragmatic-brazilian-roulette',
      'pragmatic-mega-roulette',
      'evolution-immersive-roulette',
      'evolution-roleta-ao-vivo'
    ],
    notifications: {
      email_enabled: true,
      push_enabled: true,
      signal_alerts: true,
      win_notifications: true,
      loss_notifications: false
    },
    display_settings: {
      theme: 'dark',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      number_format: 'decimal'
    },
    risk_management: {
      max_bet_amount: 1000,
      daily_loss_limit: 5000,
      session_time_limit: 240, // minutos
      auto_stop_on_target: true,
      target_profit: 2000
    },
    dashboard_config: {
      stats_cards_visible: true,
      live_signals_visible: true,
      performance_chart_visible: true,
      roulette_status_visible: true,
      recent_activity_visible: true
    },
    last_updated: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias atrás
  };
}

// GET - Buscar preferências do usuário
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Iniciando API de preferências do usuário...');
    
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    // Buscar preferências do backend SOFIA
    console.log('🔍 Buscando preferências do backend SOFIA...');
    
    const response = await fetch(`${SOFIA_BACKEND_URL}/user-preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      console.error('❌ Erro ao buscar preferências do backend:', response.status, response.statusText);
      console.log('⚠️ Usando preferências mock (fallback)');
      
      // MOCK DATA: Fallback com dados simulados para desenvolvimento
      const mockPreferences = generateMockUserPreferences();
      return NextResponse.json(mockPreferences);
    }

    const preferencesData = await response.json();
    console.log('✅ Preferências recebidas do backend SOFIA:', preferencesData);
    
    console.log('🎯 Mesas monitoradas definidas:', preferencesData.tables || []);

    return NextResponse.json(preferencesData);
  } catch (error) {
    console.error('Erro ao buscar preferências do usuário:', error);
    console.log('⚠️ Usando preferências mock (fallback devido a erro)');
    
    // MOCK DATA: Fallback com dados simulados em caso de erro
    const mockPreferences = generateMockUserPreferences();
    return NextResponse.json(mockPreferences);
  }
}

// PUT - Salvar/atualizar preferências do usuário
export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 Iniciando salvamento de preferências do usuário...');
    
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 Dados recebidos para salvar:', body);

    // Salvar preferências no backend SOFIA
    console.log('💾 Salvando preferências no backend SOFIA...');
    
    const response = await fetch(`${SOFIA_BACKEND_URL}/user-preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('❌ Erro ao salvar preferências no backend:', response.status, response.statusText);
      console.log('⚠️ Simulando salvamento com dados mock (fallback)');
      
      // MOCK DATA: Simular salvamento bem-sucedido
      const mockSavedData = {
        ...body,
        user_id: 'mock_user_123',
        last_updated: new Date().toISOString(),
        success: true,
        message: 'Preferências salvas com sucesso (modo mock)'
      };
      return NextResponse.json(mockSavedData);
    }

    const savedData = await response.json();
    console.log('✅ Preferências salvas no backend SOFIA:', savedData);

    return NextResponse.json(savedData);
  } catch (error) {
    console.error('Erro ao salvar preferências do usuário:', error);
    console.log('⚠️ Simulando salvamento com dados mock (fallback devido a erro)');
    
    // MOCK DATA: Simular salvamento bem-sucedido em caso de erro
    const body = await request.json().catch(() => ({}));
    const mockSavedData = {
      ...body,
      user_id: 'mock_user_123',
      last_updated: new Date().toISOString(),
      success: true,
      message: 'Preferências salvas com sucesso (modo mock - erro capturado)'
    };
    return NextResponse.json(mockSavedData);
  }
}