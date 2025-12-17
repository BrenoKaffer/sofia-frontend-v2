import { NextRequest, NextResponse } from 'next/server'
import { compileBuilderToJS } from '@/lib/builder-compiler'
import { auth } from '@/lib/auth-server'

export const runtime = 'nodejs'
const CURRENT_SCHEMA_VERSION = 'v1'

const BACKEND_BASE = process.env.SOFIA_BACKEND_URL || 'http://localhost:3001/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ success: false, error: 'Payload inválido' }, { status: 400 })
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
        details: 'Defina BACKEND_API_KEY no ambiente para publicar estratégias.'
      }, { status: 500 })
    }

    // Unificar formatos aceitos: { builder, meta } OU { name, description, nodes, connections, ... }
    let payload: any
    if (body?.builder && body?.meta?.name) {
      payload = {
        ...body.builder,
        name: body.meta.name,
        description: body.meta.description || 'Estratégia criada via Builder',
        version: body.meta.version || '1.0.0',
        schemaVersion: body.schemaVersion || body.builder?.schemaVersion
      }
    } else {
      payload = {
        name: body.name || 'Estrategia_Sem_Nome',
        description: body.description || 'Estratégia criada via Builder',
        version: body.version || '1.0.0',
        selectionMode: body.selectionMode,
        gating: body.gating,
        nodes: Array.isArray(body.nodes) ? body.nodes : [],
        connections: Array.isArray(body.connections) ? body.connections : [],
        schemaVersion: body.schemaVersion
      }
    }

    if (!Array.isArray(payload.nodes) || !Array.isArray(payload.connections)) {
      return NextResponse.json({ success: false, error: 'nodes e connections são obrigatórios' }, { status: 400 })
    }

    // Validar schemaVersion
    if (!payload.schemaVersion || payload.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return NextResponse.json({
        success: false,
        error: 'schemaVersion incompatível',
        details: `Esperado ${CURRENT_SCHEMA_VERSION}, recebido ${payload.schemaVersion || 'undefined'}`
      }, { status: 400 })
    }

    // Sanitização de nome
    const filenameBase = String(payload.name || 'Estrategia_Sem_Nome').trim()
    if (!filenameBase || filenameBase.length > 128) {
      return NextResponse.json({ success: false, error: 'Nome de estratégia inválido' }, { status: 400 })
    }

    const jsCode = compileBuilderToJS(payload)
    if (!jsCode || typeof jsCode !== 'string' || jsCode.length < 10) {
      return NextResponse.json({ success: false, error: 'Falha ao compilar estratégia para JS' }, { status: 500 })
    }

    const filename = `${filenameBase.replace(/[^a-z0-9-_]/gi, '_')}.strategy.js`

    const form = new FormData()
    const blob = new Blob([jsCode], { type: 'application/javascript' })
    form.append('strategy', blob, filename)

    // Campos adicionais
    form.append('name', filenameBase)
    form.append('version', payload.version || '1.0.0')
    form.append('description', payload.description || '')

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
      return NextResponse.json({ success: false, error: 'Falha no upload para backend', details: data }, { status: res.status })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    methods: ['POST'],
    CURRENT_SCHEMA_VERSION,
    description: 'Compila builder em JS e publica no backend',
    input: {
      builder: 'graph spec',
      meta: '{ name, version?, description? }',
      alternative: '{ name, description, nodes, connections, selectionMode?, gating?, schemaVersion }'
    },
    guardrails: {
      selectionMode: ['automatic', 'hybrid'],
      gating: {
        maxNumbersAuto: '[1,36]',
        maxNumbersHybrid: '[1,36]',
        minManualHybrid: '[1,36]',
        excludeZero: 'boolean'
      },
      schemaVersion: 'deve ser igual ao CURRENT_SCHEMA_VERSION'
    },
    telemetry_fields: ['logicTrace', 'graphWiring', 'gatingApplied', 'decisionTrace'],
    output: { success: 'boolean', data: 'backend response' }
  })
}

// Nota: não exportar utilitários adicionais a partir de rotas.
// Next.js Route Handlers só permitem exports de metadados (ex: runtime)
// e handlers HTTP (GET/POST/PUT/DELETE/OPTIONS, etc.).
