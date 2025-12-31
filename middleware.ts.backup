import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/public',
  '/affiliates',
]

const proOnlyPaths = [
  '/builder',
  '/strategy-builder',
  '/automation',
  '/betting',
  '/analytics',
  '/custom-signals',
  '/simulator',
  '/metrics',
]

function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith('/checkout')) return true
  for (const p of publicPaths) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true
  }
  return false
}

function isAssetOrApi(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  )
}

function devBypassEnabled(req: NextRequest): boolean {
  const devBypass = (process.env.NEXT_PUBLIC_AUTH_DEV_BYPASS === 'true' || process.env.AUTH_DEV_BYPASS === 'true')
  const headerBypass = req.headers.get('x-auth-dev-bypass') === '1'
  return devBypass || headerBypass
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  if (devBypassEnabled(req)) return true
  const access = req.cookies.get('sb-access-token')?.value
  const refresh = req.cookies.get('sb-refresh-token')?.value
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!access || !refresh || !url || !anon) return false
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${access}`,
        'apikey': anon,
      },
    })
    if (!res.ok) return false
    const data = await res.json().catch(() => null)
    return Boolean(data && data.id)
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (pathname.startsWith('/checkout')) {
    return NextResponse.redirect(`https://pay.v1sofia.com${pathname}${search}`)
  }

  if (isAssetOrApi(pathname) || isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  if (!(await isAuthenticated(req))) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const requiresPro = proOnlyPaths.some(p => pathname.startsWith(p))
  if (requiresPro) {
    const status = req.cookies.get('sofia_account_status')?.value || ''
    const isPro = status === 'premium' || status === 'pro'
    if (!isPro) {
      const url = req.nextUrl.clone()
      url.pathname = '/account/upgrade'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/(.*)']
}
