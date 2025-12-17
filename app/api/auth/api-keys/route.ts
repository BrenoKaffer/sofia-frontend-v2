import { NextRequest, NextResponse } from 'next/server';
import { edgeApiAuth, requireAuth } from '@/lib/api-auth-server';

export const dynamic = 'force-dynamic';

// GET: Listar API Keys do usuário
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const apiKeys = await edgeApiAuth.getUserApiKeys(authResult.userId!);
    
    // Remover dados sensíveis antes de retornar
    const safeApiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      permissions: key.permissions,
      expires_at: key.expires_at,
      last_used_at: key.last_used_at,
      created_at: key.created_at,
      is_active: key.is_active
    }));

    return NextResponse.json({
      success: true,
      data: safeApiKeys
    });

  } catch (error: any) {
    console.error('Erro ao listar API Keys:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST: Criar nova API Key
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, permissions = [], expiresInDays } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Nome da API Key é obrigatório' },
        { status: 400 }
      );
    }

    // Validar permissões
    const validPermissions = [
      'signals:read',
      'signals:write', 
      'kpis:read',
      'history:read',
      'realtime:read',
      'admin'
    ];

    const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: `Permissões inválidas: ${invalidPermissions.join(', ')}` },
        { status: 400 }
      );
    }

    const { key, keyData } = await edgeApiAuth.generateApiKey(
      authResult.userId!,
      name,
      permissions,
      expiresInDays
    );

    return NextResponse.json({
      success: true,
      data: {
        key, // Retorna a chave apenas uma vez
        keyInfo: {
          id: keyData.id,
          name: keyData.name,
          permissions: keyData.permissions,
          expires_at: keyData.expires_at,
          created_at: keyData.created_at
        }
      }
    });

  } catch (error: any) {
    console.error('Erro ao criar API Key:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE: Revogar API Key
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json(
        { error: 'ID da API Key é obrigatório' },
        { status: 400 }
      );
    }

    const success = await edgeApiAuth.revokeApiKey(keyId, authResult.userId!);

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao revogar API Key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API Key revogada com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao revogar API Key:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
