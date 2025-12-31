import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-server'

// Tipos compatíveis com o Builder
type NodeType = 'trigger' | 'condition' | 'logic' | 'signal'

interface StrategyNode {
  id: string
  type: NodeType
  subtype?: string
  position: { x: number; y: number }
  data: {
    label: string
    conditionType?: string
    config: Record<string, any>
  }
}

interface Connection {
  id: string
  source: string
  target: string
  type: 'success' | 'failure' | 'condition'
}

interface StrategyRecord {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused'
  nodes: StrategyNode[]
  connections: Connection[]
  createdAt: number
  updatedAt: number
}

interface Store { strategies: StrategyRecord[] }

function getStore(): Store {
  const g = globalThis as any
  if (!g.__SOFIA_STRATEGIES__) {
    g.__SOFIA_STRATEGIES__ = { strategies: [] } as Store
  }
  return g.__SOFIA_STRATEGIES__ as Store
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const store = getStore()
  const s = store.strategies.find(x => x.id === id)
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ strategy: s })
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params

    // Autenticação obrigatória
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const incoming = body as Partial<StrategyRecord>

    if (!incoming.name || !Array.isArray(incoming.nodes) || !Array.isArray(incoming.connections)) {
      return NextResponse.json({ error: 'Invalid payload: name, nodes, connections are required' }, { status: 400 })
    }

    const store = getStore()
    const idx = store.strategies.findIndex(x => x.id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated: StrategyRecord = {
      id,
      name: incoming.name!,
      description: incoming.description || '',
      status: (incoming.status as any) === 'active' ? 'active' : 'paused',
      nodes: incoming.nodes as StrategyNode[],
      connections: incoming.connections as Connection[],
      createdAt: store.strategies[idx].createdAt,
      updatedAt: Date.now()
    }

    store.strategies[idx] = updated

    // Também alterna a estratégia no backend dinâmico, sem alterar a UI
    let backendToggle: any = null
    try {
      const BACKEND_BASE = process.env.SOFIA_BACKEND_URL || 'http://localhost:3001/api'
      const apiKey = process.env.BACKEND_API_KEY || ''
      if (!apiKey || apiKey.trim().length < 10) {
        backendToggle = { success: false, error: 'BACKEND_API_KEY ausente ou inválida' }
      } else {
        const toggleUrl = `${BACKEND_BASE}/dynamic-strategies/${encodeURIComponent(updated.name)}/toggle`
        const res = await fetch(toggleUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SOFIA-Frontend/1.0',
            'Authorization': `Bearer ${apiKey}`,
            'X-User-ID': userId
          },
          body: JSON.stringify({ enabled: updated.status === 'active', reason: 'Toggle via frontend /api/strategies PUT' })
        })
        backendToggle = await res.json().catch(() => ({}))
      }
    } catch (err: any) {
      backendToggle = { success: false, error: err?.message || 'Erro ao alternar no backend' }
    }

    return NextResponse.json({ ok: true, strategy: updated, backendToggle })
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  // Autenticação obrigatória
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const store = getStore()
  const before = store.strategies.length
  store.strategies = store.strategies.filter(x => x.id !== id)
  const removed = store.strategies.length < before
  return NextResponse.json({ ok: removed })
}