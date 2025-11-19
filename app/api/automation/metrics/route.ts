import { NextResponse } from 'next/server'
import { USE_MOCKS, fetchBackend, safeJson, mocks } from '@/lib/backend-proxy'

export async function GET() {
  try {
    if (USE_MOCKS) {
      return NextResponse.json(mocks.automationMetrics)
    }

    const res = await fetchBackend('/api/automation/metrics', {
      headers: { 'Content-Type': 'application/json' }
    })

    if (!res.ok) {
      // Fallback para mocks em caso de falha do backend
      return NextResponse.json(mocks.automationMetrics, { status: 200 })
    }

    const data = (await safeJson(res)) || {}
    return NextResponse.json(data)
  } catch (err) {
    // Fallback para mocks em caso de exceção de rede
    return NextResponse.json(mocks.automationMetrics, { status: 200 })
  }
}