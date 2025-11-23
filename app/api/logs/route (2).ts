import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase usando service role (server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// GET /api/logs — lista logs com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const level = searchParams.get('level');
    const context = searchParams.get('context');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const searchInDetails = searchParams.get('searchInDetails') === 'true';

    let query = supabase
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (level) query = query.eq('level', level.toUpperCase());
    if (context) query = query.eq('context', context);
    if (userId) query = query.eq('user_id', userId);
    if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
    if (endDate) query = query.lte('created_at', new Date(endDate).toISOString());

    if (search) {
      // Buscar em mensagem e opcionalmente em details
      const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const orFilters = [
        `message.ilike.%${escaped}%`
      ];
      if (searchInDetails) {
        orFilters.push(`details::text.ilike.%${escaped}%`);
      }
      query = query.or(orFilters.join(','));
    }

    // Paginação
    const rangeStart = offset;
    const rangeEnd = offset + limit - 1;
    query = query.range(rangeStart, rangeEnd);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [], total: count || 0 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// POST /api/logs — cria um novo log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = request.headers.get('x-session-id') || body.session_id || null;
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || null;
    const userAgent = request.headers.get('user-agent') || null;

    const log = {
      level: (body.level || 'INFO').toUpperCase(),
      message: body.message || '',
      context: body.context || null,
      source: body.source || 'frontend',
      user_id: body.user_id || null,
      session_id: sessionId,
      details: body.details || body.metadata || {},
      stack_trace: body.stack_trace || null,
      request_id: body.request_id || null,
      environment: body.environment || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
      version: body.version || process.env.NEXT_PUBLIC_APP_VERSION || null,
      ip_address: ip,
      user_agent: userAgent
    };

    if (!log.message) {
      return NextResponse.json({ success: false, error: 'message é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('system_logs')
      .insert([log])
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Log criado', log: { id: data?.id } }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// DELETE /api/logs — remove logs mais antigos que a data informada
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan');
    const cutoffIso = olderThan ? new Date(olderThan).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count: toDeleteCount, error: countError } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffIso);

    if (countError) {
      return NextResponse.json({ success: false, error: countError.message }, { status: 500 });
    }

    const { error: deleteError } = await supabase
      .from('system_logs')
      .delete()
      .lt('created_at', cutoffIso);

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Logs deletados: ${toDeleteCount || 0}` });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}