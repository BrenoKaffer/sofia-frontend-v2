import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// GET - Obter logs com filtros opcionais
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const level = searchParams.get('level');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const context = searchParams.get('context');
    const search = searchParams.get('search');
    const searchInDetails = searchParams.get('searchInDetails') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Construir query base
    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Aplicar filtros
    if (level && level !== 'all') {
      query = query.eq('level', level.toUpperCase());
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (context) {
      query = query.eq('context', context);
    }
    
    if (search) {
      if (searchInDetails) {
        // Buscar na mensagem OU nos detalhes/metadata (case insensitive)
        query = query.or(`message.ilike.%${search}%,metadata.cs.{"${search}"}`)
      } else {
        // Buscar apenas na mensagem (case insensitive)
        query = query.ilike('message', `%${search}%`);
      }
    }
    
    // Primeiro, obter o total de registros (sem paginação)
    const countQuery = supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true });
    
    // Aplicar os mesmos filtros para a contagem
    if (level && level !== 'all') {
      countQuery.eq('level', level.toUpperCase());
    }
    if (startDate) {
      countQuery.gte('created_at', startDate);
    }
    if (endDate) {
      countQuery.lte('created_at', endDate);
    }
    if (userId) {
      countQuery.eq('user_id', userId);
    }
    if (context) {
      countQuery.eq('context', context);
    }
    if (search) {
      if (searchInDetails) {
        countQuery.or(`message.ilike.%${search}%,metadata.cs.{"${search}"}`)
      } else {
        countQuery.ilike('message', `%${search}%`);
      }
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      throw countError;
    }
    
    // Aplicar paginação na query principal
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Retornar dados com informações de paginação
    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
    
  } catch (error) {
    console.error('Erro ao obter logs:', error);
    return NextResponse.json(
      { error: 'Erro ao obter logs', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// POST - Criar novo log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos obrigatórios
    if (!body.level || !body.message) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: level, message' },
        { status: 400 }
      );
    }

    // Validar nível do log
    const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
    if (!validLevels.includes(body.level.toLowerCase())) {
      return NextResponse.json(
        { error: `Nível inválido. Use: ${validLevels.join(', ')}` },
        { status: 400 }
      );
    }

    // Preparar dados do log
    const logData = {
      level: body.level.toLowerCase(),
      message: body.message,
      context: body.context || null,
      source: body.source || null,
      user_id: body.user_id || null,
      session_id: body.session_id || null,
      metadata: body.metadata || body.details || {},
      // stack_trace: body.stack_trace || null,
      // request_id: body.request_id || null,
      // version: body.version || null,
      ip_address: body.ip_address || null,
      user_agent: body.user_agent || null,
    };

    const { data, error } = await supabase
      .from('system_logs')
      .insert([logData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar log:', error);
      return NextResponse.json(
        { error: 'Erro ao criar log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      log: data,
      message: 'Log criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro interno ao criar log:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Limpar logs
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan'); // Data em ISO string
    const level = searchParams.get('level');
    const context = searchParams.get('context');

    let query = supabase.from('system_logs').delete();

    // Se não especificar filtros, não permitir deletar tudo
    if (!olderThan && !level && !context) {
      return NextResponse.json(
        { error: 'Especifique pelo menos um filtro para deletar logs' },
        { status: 400 }
      );
    }

    // Aplicar filtros
    if (olderThan) {
      query = query.lt('created_at', olderThan);
    }

    if (level) {
      query = query.eq('level', level);
    }

    if (context) {
      query = query.eq('context', context);
    }

    const { error, count } = await query;

    if (error) {
      console.error('Erro ao deletar logs:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar logs', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: count || 0,
      message: `${count || 0} logs deletados com sucesso`
    });

  } catch (error) {
    console.error('Erro interno ao deletar logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
