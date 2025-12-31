import { NextResponse } from 'next/server'
import { USE_MOCKS, fetchBackend, safeJson } from '@/lib/backend-proxy'

const fallback = {
  summary: {
    totalRiskScore: 35,
    volatility: 0.22,
    drawdownRisk: 0.12,
    liquidityRisk: 0.05,
    systemHealth: 'healthy',
  },
  tableRisks: {
    A1: { riskScore: 42, volatility: 0.18, sharpeRatio: 1.2 },
    B7: { riskScore: 28, volatility: 0.12, sharpeRatio: 1.8 },
    C3: { riskScore: 65, volatility: 0.25, sharpeRatio: 0.9 },
  },
  recommendations: [
    { id: 'rec1', message: 'Reduzir exposição na mesa C3 (volatilidade alta)', severity: 'high' },
    { id: 'rec2', message: 'Aumentar stake em B7 (Sharpe > 1.5)', severity: 'low' },
    { id: 'rec3', message: 'Aplicar stop loss mais conservador em A1', severity: 'medium' },
  ],
}

export async function GET() {
  try {
    if (USE_MOCKS) return NextResponse.json(fallback)

    const res = await fetchBackend('/api/automation/risk-metrics', {
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) return NextResponse.json(fallback, { status: 200 })
    const data = (await safeJson(res)) || fallback
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(fallback, { status: 200 })
  }
}