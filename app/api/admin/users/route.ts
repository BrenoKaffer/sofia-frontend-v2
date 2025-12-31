import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware-enhanced';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { DEFAULT_ROLES } from '@/lib/auth-service';

export const runtime = 'nodejs'

// GET - Listar todos os usuários (apenas admin)
async function handleGet(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';

    const offset = (page - 1) * limit;

    // Construir query
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role_id,
        created_at,
        last_login,
        is_active,
        user_roles (
          id,
          name,
          level
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role_id', role);
    }

    // Aplicar paginação
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: users, error, count } = await query;

    if (error) {
      logger.error(`Erro ao buscar usuários: ${error.message || String(error)}`);
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      );
    }

    // Calcular estatísticas
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error(`Erro no endpoint de usuários: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário (apenas admin)
async function handlePost(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, role_id = 'user', password } = body;

    // Validar dados obrigatórios
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar role
    if (!DEFAULT_ROLES[role_id]) {
      return NextResponse.json(
        { error: 'Role inválida' },
        { status: 400 }
      );
    }

    // Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: name || email.split('@')[0]
      },
      email_confirm: true
    });

    if (authError) {
      logger.error(`Erro ao criar usuário no Auth: ${authError.message || String(authError)}`);
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + authError.message },
        { status: 400 }
      );
    }

    // Criar registro na tabela users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        name: name || email.split('@')[0],
        role_id,
        created_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      logger.error(`Erro ao criar registro do usuário: ${userError.message || String(userError)}`);
      
      // Tentar deletar usuário do Auth se falhou na criação do registro
      await supabase.auth.admin.deleteUser(authUser.user.id);
      
      return NextResponse.json(
        { error: 'Erro ao criar registro do usuário' },
        { status: 500 }
      );
    }

    logger.info('Usuário criado com sucesso', {
      metadata: {
        userId: user.id,
        email: user.email,
        role: role_id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        created_at: user.created_at
      },
      message: 'Usuário criado com sucesso'
    });

  } catch (error) {
    logger.error(`Erro ao criar usuário: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário (apenas admin)
async function handlePut(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, name, role_id, is_active } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Validar role se fornecida
    if (role_id && !DEFAULT_ROLES[role_id]) {
      return NextResponse.json(
        { error: 'Role inválida' },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Atualizar usuário
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      logger.error(`Erro ao atualizar usuário: ${error.message || String(error)}`);
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    logger.info('Usuário atualizado com sucesso', {
      metadata: {
        userId: user.id,
        changes: updateData
      }
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Usuário atualizado com sucesso'
    });

  } catch (error) {
    logger.error(`Erro ao atualizar usuário: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário (apenas admin)
async function handleDelete(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (checkError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Deletar do banco de dados
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      logger.error(`Erro ao deletar usuário do banco: ${deleteError.message || String(deleteError)}`);
      return NextResponse.json(
        { error: 'Erro ao deletar usuário' },
        { status: 500 }
      );
    }

    // Deletar do Supabase Auth
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      logger.warn(`Erro ao deletar usuário do Auth (usuário já removido do banco): ${authDeleteError.message || String(authDeleteError)}`);
    }

    logger.info('Usuário deletado com sucesso', {
      metadata: {
        userId,
        email: existingUser.email
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    logger.error(`Erro ao deletar usuário: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Aplicar middleware de admin e exportar handlers
export const GET = withAdminAuth(handleGet);
export const POST = withAdminAuth(handlePost);
export const PUT = withAdminAuth(handlePut);
export const DELETE = withAdminAuth(handleDelete);

// OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Documentação da API
// Admin Users API - Endpoints para administração de usuários (apenas admins)
// GET /api/admin/users - Listar usuários com paginação e filtros
// POST /api/admin/users - Criar novo usuário
// PUT /api/admin/users - Atualizar usuário existente
// DELETE /api/admin/users - Deletar usuário