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

async function seedCoreTemplates(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const core = [
    { name: 'Conexão de Cores SOFIA', slug: 'conexao-de-cores-sofia', description: 'Estratégia baseada em padrões de cores na roleta' },
    { name: 'Puxador de Terminais', slug: 'puxador-de-terminais', description: 'Estratégia de análise de terminais' },
    { name: 'Estrategia de Irmãos', slug: 'estrategia-de-irmaos', description: 'Estratégia baseada em números irmãos na roleta' },
    { name: 'Estratégia de Espelho', slug: 'estrategia-de-espelho', description: 'Estratégia baseada em padrões de espelho' },
    { name: 'Estratégia de Ausência', slug: 'estrategia-de-ausencia', description: 'Estratégia baseada em ausência de eventos' },
    { name: 'Estratégia de Alternância', slug: 'estrategia-de-alternancia', description: 'Estratégia baseada em alternância de padrões' },
    { name: 'Estratégia de Setor Dominante', slug: 'estrategia-de-setor-dominante', description: 'Estratégia baseada em setor dominante' },
    { name: 'Estratégia Padrão do Dia', slug: 'estrategia-padrao-do-dia', description: 'Estratégia baseada em padrões do dia' },
  ]

  const slugs = core.map(c => c.slug)
  const { data: existing, error: existingError } = await supabase
    .from('strategy_templates')
    .select('published_strategy_slug')
    .eq('user_id', 'system')
    .in('published_strategy_slug', slugs)

  if (existingError) {
    throw new Error(existingError.message)
  }

  const existingSlugs = new Set((existing || []).map((x: any) => String(x?.published_strategy_slug || '').trim()).filter(Boolean))
  const missing = core.filter(c => !existingSlugs.has(c.slug))

  if (missing.length === 0) return

  const nowPayloadBase = {
    schemaVersion: '1.0.0',
    nodes: [],
    connections: [],
    selectionMode: 'automatic',
    gating: { enabled: false },
    metadata: { origin: 'official', author: { displayName: 'SOFIA' } }
  }

  const rows = missing.map(c => ({
    user_id: 'system',
    name: c.name,
    description: c.description,
    builder_payload: nowPayloadBase,
    is_published: true,
    published_strategy_slug: c.slug
  }))

  const { error: insertError } = await supabase.from('strategy_templates').insert(rows)
  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    await seedCoreTemplates(supabase)
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (id) {
      const { data, error } = await supabase
        .from('strategy_templates')
        .select('id,user_id,name,description,builder_payload,is_published,published_strategy_slug,created_at,updated_at')
        .eq('id', id)
        .or(`user_id.eq.${userId},user_id.eq.system`)
        .maybeSingle()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!data) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      return NextResponse.json({ ok: true, template: data })
    }

    const { data, error } = await supabase
      .from('strategy_templates')
      .select('id,user_id,name,description,builder_payload,is_published,published_strategy_slug,created_at,updated_at')
      .or(`user_id.eq.${userId},user_id.eq.system`)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, templates: data || [] })
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

    const anyBody = body as any
    let name = String(anyBody.name || '').trim()
    let description = typeof anyBody.description === 'string' ? anyBody.description : ''
    let builderPayload = anyBody.builder_payload

    if (anyBody.type === 'sofia_strategy_template' && anyBody.graph && typeof anyBody.graph === 'object') {
      const graph = anyBody.graph
      const rawNodes = Array.isArray(graph.nodes) ? graph.nodes : []
      const rawConnections = Array.isArray(graph.connections) ? graph.connections : []
      builderPayload = {
        schemaVersion: String(anyBody.schemaVersion || graph.schemaVersion || '1.0.0'),
        nodes: rawNodes,
        connections: rawConnections,
        selectionMode: graph.selectionMode,
        gating: graph.gating,
        metadata: (anyBody.metadata && typeof anyBody.metadata === 'object') ? anyBody.metadata : undefined
      }
      if (!name) {
        name = String(anyBody.name || 'Template importado').trim()
      }
      if (!description && typeof anyBody.description === 'string') {
        description = anyBody.description
      }
    }

    if (anyBody.author && typeof anyBody.author === 'object') {
      const existingMeta = (builderPayload && typeof builderPayload === 'object' && (builderPayload as any).metadata && typeof (builderPayload as any).metadata === 'object')
        ? (builderPayload as any).metadata
        : {}
      builderPayload = {
        ...(builderPayload || {}),
        metadata: {
          ...existingMeta,
          author: anyBody.author
        }
      }
    }

    if (Array.isArray(anyBody.tags)) {
      const existingMeta = (builderPayload && typeof builderPayload === 'object' && (builderPayload as any).metadata && typeof (builderPayload as any).metadata === 'object')
        ? (builderPayload as any).metadata
        : {}
      builderPayload = {
        ...(builderPayload || {}),
        metadata: {
          ...existingMeta,
          tags: anyBody.tags
        }
      }
    }

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (!builderPayload || typeof builderPayload !== 'object') {
      return NextResponse.json({ error: 'builder_payload is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('strategy_templates')
      .insert({
        user_id: userId,
        name,
        description,
        builder_payload: builderPayload,
        is_published: false,
        published_strategy_slug: null
      })
      .select('id,user_id,name,description,builder_payload,is_published,published_strategy_slug,created_at,updated_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, template: data }, { status: 201 })
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
    if (typeof (body as any).name === 'string') {
      const name = String((body as any).name).trim()
      if (!name) {
        return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
      }
      update.name = name
    }
    if (typeof (body as any).description === 'string') {
      update.description = (body as any).description
    }
    if ((body as any).builder_payload && typeof (body as any).builder_payload === 'object') {
      update.builder_payload = (body as any).builder_payload
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('strategy_templates')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id,user_id,name,description,builder_payload,is_published,published_strategy_slug,created_at,updated_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, template: data })
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
      .from('strategy_templates')
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
