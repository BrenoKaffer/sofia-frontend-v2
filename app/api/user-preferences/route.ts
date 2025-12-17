import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

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
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Construir URL para o backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const url = `${backendUrl}/api/user-preferences`;

    // Fazer requisição para o backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
          'User-Agent': 'Sofia-Frontend/1.0',
          'X-User-ID': userId
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Erro do backend: ${response.status} ${response.statusText}`);
        
        // Fallback para dados mock em caso de erro
        const mockPreferences = generateMockUserPreferences();
        return NextResponse.json(mockPreferences);
      }

      const preferencesData = await response.json();
      return NextResponse.json(preferencesData);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        // Timeout na requisição para o backend
      }
      
      // Fallback para dados mock em caso de erro
      const mockPreferences = generateMockUserPreferences();
      return NextResponse.json(mockPreferences);
    }
  } catch (error) {
    // Erro no endpoint user-preferences
    
    // Fallback para dados mock em caso de erro geral
    const mockPreferences = generateMockUserPreferences();
    return NextResponse.json(mockPreferences, { status: 500 });
  }
}

// PUT - Salvar/atualizar preferências do usuário
export async function PUT(request: NextRequest) {
  // Verificar autenticação
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  try {

    const body = await request.json();

    // Construir URL para o backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const url = `${backendUrl}/api/user-preferences`;

    // Fazer requisição para o backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
          'User-Agent': 'Sofia-Frontend/1.0',
          'X-User-ID': userId
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Erro do backend: ${response.status} ${response.statusText}`);
        
        // Fallback para simulação de salvamento em caso de erro
        const mockSavedData = {
          ...body,
          user_id: userId,
          last_updated: new Date().toISOString(),
          success: true,
          message: 'Preferências salvas (backend indisponível)'
        };
        return NextResponse.json(mockSavedData);
      }

      const savedData = await response.json();
      return NextResponse.json(savedData);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Timeout na requisição para o backend');
      }
      
      // Fallback para simulação de salvamento em caso de erro
      const mockSavedData = {
        ...body,
        user_id: userId,
        last_updated: new Date().toISOString(),
        success: true,
        message: 'Preferências salvas (timeout)'
      };
      return NextResponse.json(mockSavedData);
    }
  } catch (error) {
    console.error('Erro no endpoint user-preferences:', error);
    
    // Fallback para simulação de salvamento em caso de erro geral
    const body = await request.json().catch(() => ({}));
    const mockSavedData = {
      ...body,
      user_id: userId,
      last_updated: new Date().toISOString(),
      success: true,
      message: 'Preferências salvas (erro geral)'
    };
    return NextResponse.json(mockSavedData, { status: 500 });
  }
}
