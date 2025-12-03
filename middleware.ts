import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (pathname.startsWith('/checkout')) {
    return NextResponse.redirect(`https://pay.v1sofia.com${pathname}${search}`)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/checkout/:path*']
}

