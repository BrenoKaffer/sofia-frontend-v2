import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Em desenvolvimento, não devemos quebrar o app se variáveis do Supabase faltarem.
// Em vez de lançar erro no cliente, usamos placeholders e registramos um aviso.
const isBrowser = typeof window !== 'undefined'
const isDevEnv = process.env.NODE_ENV !== 'production'
const devBypass = (process.env.NEXT_PUBLIC_AUTH_DEV_BYPASS === 'true') || (process.env.AUTH_DEV_BYPASS === 'true')

if ((!supabaseUrl || !supabaseAnonKey) && isBrowser) {
  if (isDevEnv || devBypass) {
    // Aviso leve em desenvolvimento/bypass
    console.warn('[Supabase] Variáveis públicas ausentes. Usando credenciais placeholder no cliente para evitar falhas em dev.')
  } else {
    // Em produção, ainda evitamos quebrar hard aqui para permitir renderização básica,
    // mas registramos um erro claro para facilitar diagnóstico.
    console.error('[Supabase] Variáveis públicas ausentes. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
}

// Valores padrão (placeholders) quando variáveis não estão definidas
const defaultUrl = supabaseUrl || 'https://placeholder.supabase.co'
const defaultKey = supabaseAnonKey || 'placeholder-key'

// Singleton getter for browser client
export const getSupabaseClient = (): SupabaseClient => {
  if (typeof window === 'undefined') {
    return createClient(defaultUrl, defaultKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  }

  const globalAny = globalThis as unknown as { __sofiaSupabaseClient?: SupabaseClient }

  if (!globalAny.__sofiaSupabaseClient) {
    globalAny.__sofiaSupabaseClient = createBrowserClient(defaultUrl, defaultKey, {
      auth: {
        detectSessionInUrl: false, // Desabilitado para evitar conflito com processamento manual em /auth/callback
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return globalAny.__sofiaSupabaseClient
}

// Export singleton instance for direct use
export const supabase = getSupabaseClient()

// Cliente para uso no servidor (server-side)
export const createServerClient = () => {
  return createClient(
    defaultUrl,
    defaultKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
}

// Tipos de usuário
export interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
  app_metadata?: {
    provider?: string
    providers?: string[]
  }
}

// Tipos de sessão
export interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: User
}
