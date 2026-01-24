import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth-server'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase admin credentials are not configured')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const url = new URL(request.url)
    const tableId = url.searchParams.get('table_id')

    let query = supabase
      .from('strategy_instances')
      .select('id,user_id,table_id,strategy_slug,enabled,params,created_at,updated_at')
      .eq('user_id', userId)

    if (tableId) {
      query = query.eq('table_id', tableId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, instances: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const tableId = String((body as any).table_id || '').trim()
    const strategySlug = String((body as any).strategy_slug || (body as any).slug || '').trim()
    const enabled = typeof (body as any).enabled === 'boolean' ? (body as any).enabled : true
    const params = (body as any).params && typeof (body as any).params === 'object' ? (body as any).params : null

    if (!tableId) {
      return NextResponse.json({ error: 'table_id is required' }, { status: 400 })
    }
    if (!strategySlug) {
      return NextResponse.json({ error: 'strategy_slug is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('strategy_instances')
      .insert({
        user_id: userId,
        table_id: tableId,
        strategy_slug: strategySlug,
        enabled,
        params
      })
      .select('id,user_id,table_id,strategy_slug,enabled,params,created_at,updated_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, instance: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const id = String((body as any).id || '').trim()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const update: any = {}

    if (typeof (body as any).table_id === 'string') {
      const tableId = String((body as any).table_id).trim()
      if (!tableId) {
        return NextResponse.json({ error: 'table_id cannot be empty' }, { status: 400 })
      }
      update.table_id = tableId
    }

    if (typeof (body as any).strategy_slug === 'string') {
      const strategySlug = String((body as any).strategy_slug).trim()
      if (!strategySlug) {
        return NextResponse.json({ error: 'strategy_slug cannot be empty' }, { status: 400 })
      }
      update.strategy_slug = strategySlug
    }

    if (typeof (body as any).enabled === 'boolean') {
      update.enabled = (body as any).enabled
    }

    if ((body as any).params && typeof (body as any).params === 'object') {
      update.params = (body as any).params
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('strategy_instances')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id,user_id,table_id,strategy_slug,enabled,params,created_at,updated_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, instance: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let id = new URL(request.url).searchParams.get('id') || ''
    if (!id) {
      const body = await request.json().catch(() => null)
      if (body && typeof body === 'object' && (body as any).id) {
        id = String((body as any).id || '').trim()
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('strategy_instances')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, deletedId: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

