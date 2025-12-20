import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { backendIntegration } from '@/lib/backend-integration';

export const runtime = 'nodejs';

/**
 * Endpoint: GET /api/user/preferences
 * Retorna preferências do usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('👤 Buscando preferências do usuário:', userId);

    // Buscar preferências usando o serviço de integração
    const result = await backendIntegration.getUserPreferences(userId);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar preferências do usuário',
        details: result.message
      }, { status: 500 });
    }

    console.log('✅ Preferências do usuário obtidas');

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message || 'Preferências obtidas com sucesso'
    });

  } catch (error) {
    console.error('Erro no endpoint de preferências do usuário:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Endpoint: PUT /api/user/preferences
 * Atualiza preferências do usuário autenticado
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const preferences = await request.json();

    // Validar dados básicos
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Dados de preferências inválidos'
      }, { status: 400 });
    }

    console.log('👤 Atualizando preferências do usuário:', userId);

    // Atualizar preferências usando o serviço de integração
    const result = await backendIntegration.updateUserPreferences(preferences);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao atualizar preferências do usuário',
        details: result.message
      }, { status: 500 });
    }

    console.log('✅ Preferências do usuário atualizadas');

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message || 'Preferências atualizadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar preferências do usuário:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Endpoint OPTIONS para informações da API
 */
export async function OPTIONS() {
  return NextResponse.json({
    methods: ['GET', 'PUT'],
    description: 'Endpoint para gerenciar preferências do usuário',
    authentication: 'required',
    endpoints: {
      GET: {
        description: 'Obter preferências do usuário atual',
        response_format: {
          data: 'object - Preferências do usuário',
          success: 'boolean - Status da operação',
          message: 'string - Mensagem opcional'
        }
      },
      PUT: {
        description: 'Atualizar preferências do usuário atual',
        request_body: {
          theme: 'string - Tema da interface (light, dark)',
          notifications: 'boolean - Habilitar notificações',
          auto_bet: 'boolean - Apostas automáticas',
          sound_enabled: 'boolean - Sons habilitados',
          language: 'string - Idioma (pt-BR, en-US)',
          timezone: 'string - Fuso horário'
        },
        response_format: {
          data: 'object - Preferências atualizadas',
          success: 'boolean - Status da operação',
          message: 'string - Mensagem opcional'
        }
      }
    }
  });
}
