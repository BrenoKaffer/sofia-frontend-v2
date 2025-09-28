import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Durante o build, as variáveis podem não estar disponíveis
// Só lança erro se não estivermos em build time
if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined') {
  throw new Error('Missing Supabase environment variables')
}

// Valores padrão para build time
const defaultUrl = supabaseUrl || 'https://placeholder.supabase.co'
const defaultKey = supabaseAnonKey || 'placeholder-key'

// Cliente para uso no browser (client-side)
export const supabase = createBrowserClient(
  defaultUrl,
  defaultKey
)

// Cliente para uso no servidor (server-side)
export const createServerClient = () => {
  return createClient(
    defaultUrl,
    defaultKey
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