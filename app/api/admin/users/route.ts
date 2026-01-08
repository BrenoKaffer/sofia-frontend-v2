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
      .from('user_profiles')
      .select(`
        user_id,
        email,
        full_name,
        role,
        created_at,
        status
      `, { count: 'exact' });

    // Aplicar filtros
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    // Aplicar paginação
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: profiles, error, count } = await query;

    if (error) {
      logger.error(`Erro ao buscar usuários: ${error.message || String(error)}`);
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      );
    }

    // Mapear para o formato esperado pelo frontend
    const users = profiles?.map(p => ({
        id: p.user_id,
        email: p.email,
        name: p.full_name,
        role_id: p.role,
        created_at: p.created_at,
        last_login: null,
        is_active: p.status === 'active',
        user_roles: { name: p.role }
    })) || [];

    // Calcular estatísticas
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: {
        users: users,
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

    // Criar registro na tabela user_profiles
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: authUser.user.id,
        email,
        full_name: name || email.split('@')[0],
        role: role_id,
        created_at: new Date().toISOString(),
        status: 'active'
      }, { onConflict: 'user_id' })
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
        userId: user.user_id,
        email: user.email,
        role: user.role
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.user_id,
        email: user.email,
        name: user.full_name,
        role_id: user.role,
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
    if (name !== undefined) updateData.full_name = name;
    if (role_id !== undefined) updateData.role = role_id;
    if (is_active !== undefined) updateData.status = is_active ? 'active' : 'inactive';

    // Atualizar usuário em user_profiles
    const { data: user, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user_id)
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
        userId: user.user_id,
        changes: updateData
      }
    });

    return NextResponse.json({
      success: true,
      data: {
          id: user.user_id,
          email: user.email,
          name: user.full_name,
          role_id: user.role,
          created_at: user.created_at,
          is_active: user.status === 'active'
      },
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

    // Verificar se usuário existe em user_profiles
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('user_id, email')
      .eq('user_id', userId)
      .single();

    if (checkError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Deletar do Supabase Auth (Cascade irá remover do user_profiles e outras tabelas)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      logger.error(`Erro ao deletar usuário do Auth: ${authDeleteError.message || String(authDeleteError)}`);
       return NextResponse.json(
        { error: 'Erro ao deletar usuário' },
        { status: 500 }
      );
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
