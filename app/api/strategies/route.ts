import { NextResponse } from 'next/server'
import { CURRENT_SCHEMA_VERSION } from '../../config/builderSpec'

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
  schemaVersion: string
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

export async function GET() {
  const { strategies } = getStore()
  return NextResponse.json({ strategies })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
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

    // Proteção: impedir salvar ou atualizar objetos marcados como template
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
      nodes: s.nodes as StrategyNode[],
      connections: s.connections as Connection[],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const store = getStore()
    const existingIdx = store.strategies.findIndex(x => x.id === record.id)
    if (existingIdx >= 0) {
      // Atualiza registro existente
      record.createdAt = store.strategies[existingIdx].createdAt
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