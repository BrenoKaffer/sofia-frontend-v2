import { NextRequest, NextResponse } from 'next/server'
import { USE_MOCKS, fetchBackend, safeJson, mocks } from '@/lib/backend-proxy'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Se habilitado, responde com mock diretamente
  if (USE_MOCKS) {
    return NextResponse.json(mocks.availableOptions)
  }

  const url = '/api/available-options'
  try {
    const res = await fetchBackend(url, { headers: { 'Content-Type': 'application/json' } })
    if (!res.ok) {
      // Fallback para mock se backend falhar
      return NextResponse.json(mocks.availableOptions, { status: 200 })
    }
    const data = await safeJson(res)
    return NextResponse.json(data)
  } catch (err) {
    // Fallback para mock se houver exceção de rede
    return NextResponse.json(mocks.availableOptions, { status: 200 })
  }
}
