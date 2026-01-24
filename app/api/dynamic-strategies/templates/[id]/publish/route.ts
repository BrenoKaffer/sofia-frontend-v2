import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth-server'
import { compileBuilderToJS } from '@/lib/builder-compiler'

export const runtime = 'nodejs'

const BACKEND_BASE = process.env.SOFIA_BACKEND_URL || 'http://localhost:3001/api'

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

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const apiKey = process.env.BACKEND_API_KEY || ''
    if (!apiKey || apiKey.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: 'BACKEND_API_KEY ausente ou inválida',
        details: 'Defina BACKEND_API_KEY no ambiente para publicar templates.'
      }, { status: 500 })
    }

    const { id: rawId } = await ctx.params
    const id = String(rawId || '').trim()
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do template é obrigatório' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const anyBody = body as any
    const rawSlug = anyBody && typeof anyBody.strategySlug === 'string' ? anyBody.strategySlug : ''
    const customSlug = rawSlug.trim()

    const supabase = getSupabaseAdmin()

    const { data: tpl, error } = await supabase
      .from('strategy_templates')
      .select('id,user_id,name,description,builder_payload,is_published,published_strategy_slug')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    if (!tpl) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    const builderPayload: any = (tpl as any).builder_payload
    if (!builderPayload || typeof builderPayload !== 'object') {
      return NextResponse.json({ success: false, error: 'builder_payload ausente ou inválido' }, { status: 400 })
    }

    const nodes = Array.isArray(builderPayload.nodes) ? builderPayload.nodes : []
    const connections = Array.isArray(builderPayload.connections) ? builderPayload.connections : []
    if (!nodes.length || !connections.length) {
      return NextResponse.json({ success: false, error: 'Template sem nós ou conexões para publicar' }, { status: 400 })
    }

    const strategySlug = customSlug || `user_${userId}_template_${tpl.id}`

    const payloadForCompile = {
      ...builderPayload,
      name: strategySlug,
      description: (tpl as any).description || (tpl as any).name || 'Template do Builder',
      schemaVersion: builderPayload.schemaVersion || builderPayload.schema_version
    }

    const jsCode = compileBuilderToJS(payloadForCompile)
    if (!jsCode || typeof jsCode !== 'string' || jsCode.length < 10) {
      return NextResponse.json({ success: false, error: 'Falha ao compilar template para JS' }, { status: 500 })
    }

    const filename = `${strategySlug}.strategy.js`

    const form = new FormData()
    const blob = new Blob([jsCode], { type: 'application/javascript' })
    form.append('strategy', blob, filename)
    form.append('name', strategySlug)
    form.append('version', '1.0.0')
    form.append('description', (tpl as any).description || '')

    const uploadUrl = `${BACKEND_BASE}/dynamic-strategies/upload`

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'SOFIA-Frontend/1.0',
        'X-User-ID': userId
      },
      body: form
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: 'Falha no upload para backend',
        details: data
      }, { status: res.status })
    }

    await supabase
      .from('strategy_templates')
      .update({
        is_published: true,
        published_strategy_slug: strategySlug
      })
      .eq('id', id)
      .eq('user_id', userId)

    return NextResponse.json({ success: true, strategySlug, backend: data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno' }, { status: 500 })
  }
}
