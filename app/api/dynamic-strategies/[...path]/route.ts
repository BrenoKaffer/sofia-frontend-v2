import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function buildBackendUrl(req: NextRequest, pathSegs: string[]) {
  const base = process.env.SOFIA_BACKEND_URL || 'http://localhost:3001'
  // Ensure we target the dynamic-strategies namespace
  const suffix = pathSegs.join('/')
  return `${base}/api/dynamic-strategies/${suffix}`
}

async function proxy(req: NextRequest, pathSegs: string[]) {
  const url = buildBackendUrl(req, pathSegs)
  const method = req.method

  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
  }

  let body: any = undefined
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await req.text()
    } catch {
      body = undefined
    }
  }

  const resp = await fetch(url, {
    method,
    headers,
    body,
  })

  const contentType = resp.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } else {
    const text = await resp.text()
    return new NextResponse(text, { status: resp.status })
  }
}

export async function GET(req: NextRequest, ctx: any) {
  const params = await ctx.params
  return proxy(req, params.path || [])
}
export async function POST(req: NextRequest, ctx: any) {
  const params = await ctx.params
  return proxy(req, params.path || [])
}
export async function PUT(req: NextRequest, ctx: any) {
  const params = await ctx.params
  return proxy(req, params.path || [])
}
export async function DELETE(req: NextRequest, ctx: any) {
  const params = await ctx.params
  return proxy(req, params.path || [])
}