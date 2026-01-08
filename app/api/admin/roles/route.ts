import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware-enhanced';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { DEFAULT_ROLES } from '@/lib/auth-service';

export const runtime = 'nodejs'

// GET - Listar todas as roles
async function handleGet(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const includeUsers = url.searchParams.get('include_users') === 'true';

    let query = supabase
      .from('user_roles')
      .select('*')
      .order('level', { ascending: true });

    const { data: roles, error } = await query;

    if (error) {
      logger.error(`Erro ao buscar roles: ${error.message}`);
      return NextResponse.json(
        { error: 'Erro ao buscar roles' },
        { status: 500 }
      );
    }

    let responseData = roles || [];

    // Se solicitado, incluir contagem de usuários por role
    if (includeUsers) {
      const rolesWithUsers = await Promise.all(
        responseData.map(async (role) => {
          const { count } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', role.id);

          return {
            ...role,
            user_count: count || 0
          };
        })
      );
      responseData = rolesWithUsers;
    }

    return NextResponse.json({
      success: true,
      data: {
        roles: responseData,
        default_roles: DEFAULT_ROLES
      }
    });

  } catch (error) {
    logger.error(`Erro no endpoint de roles: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova role
async function handlePost(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, level, permissions } = body;

    // Validar dados obrigatórios
    if (!id || !name || level === undefined) {
      return NextResponse.json(
        { error: 'ID, nome e nível são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar se ID já existe
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('id', id)
      .single();

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role com este ID já existe' },
        { status: 400 }
      );
    }

    // Validar nível único
    const { data: existingLevel } = await supabase
      .from('user_roles')
      .select('id')
      .eq('level', level)
      .single();

    if (existingLevel) {
      return NextResponse.json(
        { error: 'Já existe uma role com este nível' },
        { status: 400 }
      );
    }

    // Criar role
    const { data: role, error } = await supabase
      .from('user_roles')
      .insert({
        id,
        name,
        description: description || '',
        level,
        permissions: permissions || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error(`Erro ao criar role: ${error.message || String(error)}`);
      return NextResponse.json(
        { error: 'Erro ao criar role' },
        { status: 500 }
      );
    }

    logger.info('Role criada com sucesso', {
      metadata: {
        roleId: role.id,
        name: role.name,
        level: role.level
      }
    });

    return NextResponse.json({
      success: true,
      data: role,
      message: 'Role criada com sucesso'
    });

  } catch (error) {
    logger.error(`Erro ao criar role: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar role
async function handlePut(req: NextRequest) {
  try {
    const body = await req.json();
    const { role_id, name, description, level, permissions } = body;

    if (!role_id) {
      return NextResponse.json(
        { error: 'ID da role é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se é uma role padrão (não pode ser editada)
    if (DEFAULT_ROLES[role_id]) {
      return NextResponse.json(
        { error: 'Roles padrão do sistema não podem ser editadas' },
        { status: 400 }
      );
    }

    // Verificar se role existe
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('id', role_id)
      .single();

    if (checkError || !existingRole) {
      return NextResponse.json(
        { error: 'Role não encontrada' },
        { status: 404 }
      );
    }

    // Se mudando o nível, verificar se não conflita
    if (level !== undefined && level !== existingRole.level) {
      const { data: conflictRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('level', level)
        .neq('id', role_id)
        .single();

      if (conflictRole) {
        return NextResponse.json(
          { error: 'Já existe uma role com este nível' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) updateData.level = level;
    if (permissions !== undefined) updateData.permissions = permissions;

    // Atualizar role
    const { data: role, error } = await supabase
      .from('user_roles')
      .update(updateData)
      .eq('id', role_id)
      .select()
      .single();

    if (error) {
      logger.error(`Erro ao atualizar role: ${error.message || String(error)}`);
      return NextResponse.json(
        { error: 'Erro ao atualizar role' },
        { status: 500 }
      );
    }

    logger.info('Role atualizada com sucesso', {
      metadata: {
        roleId: role.id,
        changes: updateData
      }
    });

    return NextResponse.json({
      success: true,
      data: role,
      message: 'Role atualizada com sucesso'
    });

  } catch (error) {
    logger.error(`Erro ao atualizar role: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar role
async function handleDelete(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const roleId = url.searchParams.get('role_id');

    if (!roleId) {
      return NextResponse.json(
        { error: 'ID da role é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se é uma role padrão (não pode ser deletada)
    if (DEFAULT_ROLES[roleId]) {
      return NextResponse.json(
        { error: 'Roles padrão do sistema não podem ser deletadas' },
        { status: 400 }
      );
    }

    // Verificar se existem usuários com esta role
    const { count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', roleId);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Não é possível deletar role. Existem ${count} usuário(s) com esta role.` },
        { status: 400 }
      );
    }

    // Verificar se role existe
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('id, name')
      .eq('id', roleId)
      .single();

    if (checkError || !existingRole) {
      return NextResponse.json(
        { error: 'Role não encontrada' },
        { status: 404 }
      );
    }

    // Deletar role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId);

    if (deleteError) {
      logger.error(`Erro ao deletar role: ${deleteError.message || String(deleteError)}`);
      return NextResponse.json(
        { error: 'Erro ao deletar role' },
        { status: 500 }
      );
    }

    logger.info('Role deletada com sucesso', {
      metadata: {
        roleId,
        name: existingRole.name
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Role deletada com sucesso'
    });

  } catch (error) {
    logger.error(`Erro ao deletar role: ${error instanceof Error ? error.message : String(error)}`);
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
// Admin Roles API - Endpoints para administração de roles do sistema (apenas admins)
// GET /api/admin/roles - Listar todas as roles do sistema
// POST /api/admin/roles - Criar nova role personalizada  
// PUT /api/admin/roles - Atualizar role personalizada
// DELETE /api/admin/roles - Deletar role personalizada