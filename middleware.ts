import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const publicPaths = [
  '/login',
  '/register',
  '/terms',
  '/email-confirmation',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/security-check',
  '/public',
  '/affiliates',
]

const proOnlyPaths = [
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
  const { pathname } = req.nextUrl

  // if (pathname.startsWith('/checkout')) {
  //   return NextResponse.redirect(`https://pay.v1sofia.com${pathname}${search}`)
  // }

  if (isAssetOrApi(pathname) || isPublicRoute(pathname)) {
    // Permitir acesso a reset-password mesmo autenticado (pode estar trocando senha de outra conta)
    if (pathname === '/reset-password') return NextResponse.next()

    // Se o usuário estiver autenticado e tentar acessar login ou register, redirecionar para dashboard
    if ((pathname === '/login' || pathname === '/register') && (await isAuthenticated(req) || req.nextUrl.searchParams.get('action') === 'logout')) {
      // Se houver parâmetro action=logout, permitir acesso e limpar cookies
      if (req.nextUrl.searchParams.get('action') === 'logout') {
        const response = NextResponse.next();
        // Limpar cookies de autenticação do Supabase
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        // Tentar limpar com domínio raiz se possível (embora middleware tenha limitações com domínios)
        // A melhor aposta é limpar o path e o default
        
        // Limpar cookies da aplicação
        response.cookies.delete('sofia_status');
        response.cookies.delete('sofia_plan');
        response.cookies.delete('sofia_role');
        
        // Limpar cookies legados ou alternativos
        response.cookies.delete('supabase-auth-token');
        
        // Adicionar header para forçar expiração no navegador
        response.headers.append('Set-Cookie', 'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
        response.headers.append('Set-Cookie', 'sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
        
        return response;
      }

      const url = req.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (!(await isAuthenticated(req))) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Criar resposta base
  const response = NextResponse.next();

  // Adicionar headers anti-cache para rotas protegidas
  if (!isPublicRoute(pathname) && !isAssetOrApi(pathname)) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
  }

  // Obter cookies de perfil (New Schema)
  const profile = {
    status: req.cookies.get('sofia_status')?.value,
    plan: req.cookies.get('sofia_plan')?.value,
    role: req.cookies.get('sofia_role')?.value,
  }

  // Verificar se o usuário está ativo (se houver info)
  if (profile.status && profile.status !== 'active') {
    // Se temos status novo e não é active, redirecionar ou bloquear?
    // Por enquanto, vamos deixar passar se não for rota protegida, 
    // mas idealmente deveríamos bloquear tudo.
    // O auth-service já barra no login, mas o middleware pega acesso direto.
  }

  if (pathname.startsWith('/admin')) {
    let isAdmin = false;

    // 1. Check Role (New Schema)
    if (profile.role === 'admin' || profile.role === 'superadmin') {
      isAdmin = true;
    }

    if (!isAdmin) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  const requiresPro = proOnlyPaths.some(p => pathname.startsWith(p))
  if (requiresPro) {
    let isPro = false;

    // 1. Check Plan/Role (New Schema)
    if (profile.plan === 'pro') isPro = true;
    if (profile.role === 'admin' || profile.role === 'superadmin') isPro = true;

    if (!isPro) {
      // Client-side will handle the upgrade modal
      // const url = req.nextUrl.clone()
      // url.pathname = '/dashboard' // Redirect to dashboard instead of missing upgrade page
      // return NextResponse.redirect(url)
    }
  }

  return response;
}

export const config = {
  matcher: ['/(.*)']
}
