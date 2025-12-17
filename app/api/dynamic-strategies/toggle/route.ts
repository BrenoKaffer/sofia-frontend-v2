import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-server'

export const runtime = 'nodejs'

const BACKEND_BASE = process.env.SOFIA_BACKEND_URL || 'http://localhost:3001/api'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const name = body?.name || request.nextUrl.searchParams.get('name')
    const enabled = body?.enabled
    const reason = body?.reason || 'Activated via Frontend Builder'

    if (!name || typeof enabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Parâmetros inválidos: name e enabled são obrigatórios' }, { status: 400 })
    }

    // Autenticação obrigatória
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const apiKey = process.env.BACKEND_API_KEY || ''
    if (!apiKey || apiKey.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: 'BACKEND_API_KEY ausente ou inválida',
        details: 'Defina BACKEND_API_KEY no ambiente para publicar/toggle estratégias.'
      }, { status: 500 })
    }

    // Sanitização de nome
    const safeName = String(name).trim()
    if (!safeName || safeName.length > 128) {
      return NextResponse.json({ success: false, error: 'Nome de estratégia inválido' }, { status: 400 })
    }

    const url = `${BACKEND_BASE}/dynamic-strategies/${encodeURIComponent(safeName)}/toggle`

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SOFIA-Frontend/1.0',
        'Authorization': `Bearer ${apiKey}`,
        'X-User-ID': userId
      },
      body: JSON.stringify({ enabled, reason })
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Falha ao alternar estratégia no backend', details: data }, { status: res.status })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    methods: ['PUT'],
    description: 'Ativa/Desativa estratégia dinâmica no backend',
    input: { name: 'string', enabled: 'boolean', reason: 'string?' },
    output: { success: 'boolean', data: 'backend response' }
  })
}
