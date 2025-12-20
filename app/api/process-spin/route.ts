import { NextRequest, NextResponse } from 'next/server';
import { backendIntegration } from '@/lib/backend-integration';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🎰 Iniciando processamento de spin...');
    
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const body = await request.json();
    const { 
      number, 
      color, 
      table_id, 
      timestamp, 
      strategies = [], 
      user_id 
    } = body;

    // Validar dados obrigatórios
    if (number === undefined || !color || !table_id) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: number, color, table_id' },
        { status: 400 }
      );
    }

    // Validar número da roleta (0-36)
    if (number < 0 || number > 36) {
      return NextResponse.json(
        { error: 'Número deve estar entre 0 e 36' },
        { status: 400 }
      );
    }

    // Validar cor
    const validColors = ['red', 'black', 'green'];
    if (!validColors.includes(color)) {
      return NextResponse.json(
        { error: 'Cor deve ser: red, black ou green' },
        { status: 400 }
      );
    }

    console.log(`🎯 Processando spin: ${number} (${color}) na mesa ${table_id}`);

    // Processar spin através do backend integration
    const result = await backendIntegration.processSpin({
      number,
      color,
      table_id,
      timestamp: timestamp || new Date().toISOString(),
      strategies,
      user_id
    });

    console.log('✅ Spin processado com sucesso');

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Spin processado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao processar spin:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Documentação da API
// API Documentation removed for Next.js compatibility
// Process Spin API - Endpoint para processar spins da roleta e analisar estratégias
// POST /api/process-spin - Processa um spin da roleta e analisa estratégias
