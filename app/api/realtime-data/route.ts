import { NextRequest, NextResponse } from 'next/server'
import { USE_MOCKS, fetchBackend, safeJson, mocks } from '@/lib/backend-proxy'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'signals'
  const limitParam = parseInt(searchParams.get('limit') || '10', 10)
  const limit = isNaN(limitParam) ? 10 : Math.min(Math.max(limitParam, 1), 100)
  const tableId = searchParams.get('table_id') || ''

  if (USE_MOCKS) {
    if (type === 'kpis') return NextResponse.json({ data: mocks.realtimeKpis(limit) })
    return NextResponse.json({ data: mocks.realtimeSignals(limit) })
  }

  try {
    if (type === 'kpis') {
      const qs = new URLSearchParams()
      if (tableId) qs.append('table_id', tableId)
      const url = `/api/kpis-estrategias${qs.toString() ? `?${qs}` : ''}`
      const res = await fetchBackend(url, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) return NextResponse.json({ data: mocks.realtimeKpis(limit) }, { status: 200 })
      const data = await safeJson(res)
      return NextResponse.json({ data })
    }

    // default: signals
    const qs = new URLSearchParams()
    if (tableId) qs.append('table_id', tableId)
    qs.append('limit', String(limit))
    const url = `/api/signals/recent?${qs}`
    const res = await fetchBackend(url, { headers: { 'Content-Type': 'application/json' } })
    if (!res.ok) return NextResponse.json({ data: mocks.realtimeSignals(limit) }, { status: 200 })
    const data = await safeJson(res)
    return NextResponse.json({ data })
  } catch (err) {
    // Fallback para mock em caso de exceção
    if (type === 'kpis') return NextResponse.json({ data: mocks.realtimeKpis(limit) }, { status: 200 })
    return NextResponse.json({ data: mocks.realtimeSignals(limit) }, { status: 200 })
  }
}
