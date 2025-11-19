import { NextResponse } from 'next/server'
import { USE_MOCKS, fetchBackend, safeJson } from '@/lib/backend-proxy'

const fallback = {
  sharpeRatio: 1.45,
  sortinoRatio: 1.8,
  expectedReturn: 0.12,
  var95: -0.08,
  cvar95: -0.12,
  maxDrawdown: -0.15,
  avgWin: 12.5,
  avgLoss: -8.3,
  profitFactor: 1.6,
  avgResponseTime: 120,
  queueSize: 3,
  cpuUsage: 0.35,
  memoryUsage: 0.41,
  bankrollUsage: 0.22,
  winStreak: 4,
  lossStreak: 2,
}

export async function GET() {
  try {
    if (USE_MOCKS) return NextResponse.json(fallback)

    const res = await fetchBackend('/api/automation/advanced-metrics', {
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) return NextResponse.json(fallback, { status: 200 })
    const data = (await safeJson(res)) || fallback
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(fallback, { status: 200 })
  }
}