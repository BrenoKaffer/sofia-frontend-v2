import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/dashboard';
    const origin = requestUrl.origin;

    if (code) {
      // Create a Supabase client capable of exchanging the code
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
          }
        }
      );

      // Exchange the code for a session
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && session) {
        const cookieStore = cookies();
        // Match the maxAge from login page (7 days)
        const maxAge = 60 * 60 * 24 * 7; 

        // Manually set cookies as the middleware expects 'sb-access-token'
        // Note: In Next.js 15, cookies() is async, but we can treat the store as synchronous for set() 
        // if we are in an async context, or better await it if the types require.
        // Checking common usage in Next 13/14, cookies() returns a ReadonlyRequestCookies which has set().
        // In Next 15, it returns a Promise.
        
        // We'll try to await it just in case, but usually in older 15 versions it might be synchronous?
        // Let's assume it's a promise based on recent changes.
        const store = await Promise.resolve(cookieStore); 

        store.set('sb-access-token', session.access_token, {
          path: '/',
          maxAge,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        
        store.set('sb-refresh-token', session.refresh_token, {
          path: '/',
          maxAge,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });

        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${origin}/login?error=auth-code-error&message=${encodeURIComponent(error?.message || 'Erro de autenticação')}`);
      }
    }

    // If no code, redirect to login
    return NextResponse.redirect(`${origin}/login?error=no-code`);
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(new URL('/login?error=server-error', request.url));
  }
}
