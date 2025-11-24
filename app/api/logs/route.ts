import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getSupabaseSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseSafe();
    if (!supabase) {
      return NextResponse.json({ success: true, data: [], total: 0, disabled: true }, { status: 200 });
    }
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
      .select('*', { count: 'estimated' })
      .order('created_at', { ascending: false });

    if (level) query = query.eq('level', level.toLowerCase());
    if (context) query = query.eq('context', context);
    if (userId) query = query.eq('user_id', userId);
    if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
    if (endDate) query = query.lte('created_at', new Date(endDate).toISOString());

    if (search) {
      const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
      if (searchInDetails) {
        const orFilters = [`message.ilike.%${escaped}%`, `metadata::text.ilike.%${escaped}%`];
        query = query.or(orFilters.join(','));
      } else {
        query = query.ilike('message', `%${escaped}%`);
      }
    }

    const rangeStart = offset;
    const rangeEnd = offset + limit - 1;
    query = query.range(rangeStart, rangeEnd);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    const normalized = (data || []).map((row: any) => ({
      ...row,
      details: row.details ?? row.metadata ?? {},
    }));
    return NextResponse.json({ success: true, data: normalized, total: count || 0 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseSafe();
    const body = await request.json();
    const sessionId = request.headers.get('x-session-id') || body.session_id || null;
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || null;
    const userAgent = request.headers.get('user-agent') || null;

    // Inserção com colunas garantidamente existentes no banco atual
    const log = {
      level: (body.level || 'info').toLowerCase(),
      message: body.message || '',
      context: body.context || null,
      source: body.source || 'frontend',
      user_id: body.user_id || null,
      session_id: sessionId,
      metadata: body.details || body.metadata || {}
      // Campos como environment, version, ip_address, user_agent, request_id, stack_trace
      // não são incluídos para evitar erro quando não existem na schema atual
    };

    if (!log.message) {
      return NextResponse.json({ success: false, error: 'message é obrigatório' }, { status: 400 });
    }
    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Logs desabilitados (env ausente).', log: { id: null } }, { status: 202 });
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseSafe();
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan');
    const cutoffIso = olderThan ? new Date(olderThan).toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Logs desabilitados (env ausente). Nenhum item removido.' });
    }

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
