import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

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

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (pathname.startsWith('/checkout')) {
    return NextResponse.redirect(`https://pay.v1sofia.com${pathname}${search}`)
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
  matcher: ['/checkout/:path*', '/builder/:path*', '/strategy-builder/:path*', '/automation/:path*', '/betting/:path*', '/analytics/:path*', '/custom-signals/:path*', '/simulator/:path*', '/metrics/:path*']
}
