import { NextResponse, NextRequest } from 'next/server'
import { CURRENT_SCHEMA_VERSION } from '../../config/builderSpec'

// Store compartilhado com /api/automation/strategies
interface StrategyRecord {
  schemaVersion: string
  id: string
  name: string
  description?: string
  status: 'active' | 'paused'
  nodes: any[]
  connections: any[]
  createdAt: number
  updatedAt: number
  deleted?: boolean
  deletedAt?: number
}
interface Store { strategies: StrategyRecord[] }
function getStore(): Store {
  const g = globalThis as any
  if (!g.__SOFIA_STRATEGIES__) {
    g.__SOFIA_STRATEGIES__ = { strategies: [] } as Store
  }
  return g.__SOFIA_STRATEGIES__ as Store
}

export async function GET(request: NextRequest) {
  const store = getStore()
  const url = new URL(request.url)
  const onlyActive = url.searchParams.get('status') === 'active'
  const version = url.searchParams.get('schemaVersion') || CURRENT_SCHEMA_VERSION
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  let list = store.strategies
  if (onlyActive) list = list.filter(s => s.status === 'active')
  if (version) list = list.filter(s => s.schemaVersion === version)
  if (!includeDeleted) list = list.filter(s => !s.deleted)
  return NextResponse.json({ ok: true, strategies: list })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const s = body as Partial<StrategyRecord>

    if (!s.name || !Array.isArray(s.nodes) || !Array.isArray(s.connections)) {
      return NextResponse.json({ error: 'Invalid payload: name, nodes, connections are required' }, { status: 400 })
    }

    // Validação de schemaVersion
    if (!s.schemaVersion) {
      return NextResponse.json({ error: 'schemaVersion is required' }, { status: 400 })
    }
    if (s.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return NextResponse.json({
        error: `Incompatible schema version. Expected: ${CURRENT_SCHEMA_VERSION}, received: ${s.schemaVersion}`
      }, { status: 400 })
    }

    // Proteção: impedir salvar/atualizar payloads marcados como template
    if ((s as any).source === 'template' || (s as any).locked === true) {
      return NextResponse.json({ error: 'Templates não podem ser salvos/alterados diretamente. Duplique para editar.' }, { status: 403 })
    }

    const id = s.id ?? `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const record: StrategyRecord = {
      schemaVersion: s.schemaVersion!,
      id,
      name: s.name!,
      description: s.description || '',
      status: (s.status as any) === 'active' ? 'active' : 'paused',
      nodes: s.nodes as any[],
      connections: s.connections as any[],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false
    }

    const store = getStore()
    const existingIdx = store.strategies.findIndex(x => x.id === record.id)
    if (existingIdx >= 0) {
      // Atualiza registro existente
      record.createdAt = store.strategies[existingIdx].createdAt
      record.deleted = false
      record.deletedAt = undefined
      store.strategies[existingIdx] = record
      return NextResponse.json({ ok: true, strategy: record }, { status: 200 })
    } else {
      // Cria novo registro
      store.strategies.push(record)
      return NextResponse.json({ ok: true, strategy: record }, { status: 201 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const incoming = body as Partial<StrategyRecord>

    if (!incoming.id) {
      return NextResponse.json({ error: 'id is required for update' }, { status: 400 })
    }
    if (!incoming.name || !Array.isArray(incoming.nodes) || !Array.isArray(incoming.connections)) {
      return NextResponse.json({ error: 'Invalid payload: name, nodes, connections are required' }, { status: 400 })
    }

    const store = getStore()
    const idx = store.strategies.findIndex(x => x.id === incoming.id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated: StrategyRecord = {
      schemaVersion: incoming.schemaVersion || store.strategies[idx].schemaVersion,
      id: store.strategies[idx].id,
      name: incoming.name!,
      description: incoming.description || '',
      status: (incoming.status as any) === 'active' ? 'active' : 'paused',
      nodes: incoming.nodes as any[],
      connections: incoming.connections as any[],
      createdAt: store.strategies[idx].createdAt,
      updatedAt: Date.now(),
      deleted: false,
      deletedAt: undefined
    }

    store.strategies[idx] = updated
    return NextResponse.json({ ok: true, strategy: updated })
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let id = new URL(request.url).searchParams.get('id') || undefined
    if (!id) {
      try {
        const body = await request.json()
        id = (body as any)?.id
      } catch {}
    }
    if (!id) {
      return NextResponse.json({ error: 'id is required for delete' }, { status: 400 })
    }

    const store = getStore()
    const idx = store.strategies.findIndex(x => x.id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Soft delete
    store.strategies[idx] = {
      ...store.strategies[idx],
      status: 'paused',
      deleted: true,
      deletedAt: Date.now(),
      updatedAt: Date.now()
    }

    return NextResponse.json({ ok: true, deletedId: id })
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}