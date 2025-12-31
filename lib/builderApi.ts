export type PriorityString = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
export type ConfidenceString = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High'

const base = '/api/dynamic-strategies'

export async function listStrategies() {
  const res = await fetch(`${base}`, { method: 'GET', cache: 'no-store' })
  const json = await res.json()
  return json
}

export async function createStrategy(params: {
  name: string
  description?: string
  category?: string
  author?: string
  minSpins?: number
  maxNumbers?: number
  confidence?: number | ConfidenceString
  priority?: number | PriorityString
}) {
  const res = await fetch(`${base}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Falha ao criar estratégia')
  return json
}

export async function updateConfig(name: string, cfg: {
  enabled?: boolean
  priority?: number | PriorityString
  confidence_weight?: number
  max_tables?: number
  description?: string
}) {
  const res = await fetch(`${base}/${encodeURIComponent(name)}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Falha ao atualizar configuração')
  return json
}

export async function toggleStrategy(name: string, enabled: boolean, reason?: string) {
  const res = await fetch(`${base}/${encodeURIComponent(name)}/toggle`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled, reason }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Falha ao alternar estratégia')
  return json
}

export async function deleteStrategy(filename: string) {
  const res = await fetch(`${base}/${encodeURIComponent(filename)}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Falha ao remover estratégia')
  return json
}

export async function exportConfig() {
  const res = await fetch(`${base}/config/export`, { method: 'GET', cache: 'no-store' })
  const json = await res.json()
  return json
}