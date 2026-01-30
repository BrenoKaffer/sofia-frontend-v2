/**
 * Autenticação server-side com Supabase
 * Sistema de autenticação usando Supabase Auth
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User, Session } from './supabase'

// Interface para o retorno da autenticação
export interface AuthReturn {
  userId: string | null;
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
}

/**
 * Cria um cliente Supabase para uso no servidor
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignore errors in middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore errors in middleware
          }
        },
      },
    }
  )
}

/**
 * Função de autenticação server-side
 * Verifica a sessão atual do usuário no Supabase
 */
export async function auth(): Promise<AuthReturn> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return {
        userId: null,
        user: null,
        session: null,
        isAuthenticated: false
      }
    }
    
    return {
      userId: session.user.id,
      user: session.user as User,
      session: session as Session,
      isAuthenticated: true
    }
  } catch (error) {
    console.error('Auth error:', error)
    return {
      userId: null,
      user: null,
      session: null,
      isAuthenticated: false
    }
  }
}

/**
 * Middleware de autenticação para verificar se o usuário está autenticado
 */
export function requireAuth(handler: Function) {
  return async (request: Request, context?: any) => {
    const { isAuthenticated } = await auth()
    
    if (!isAuthenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return handler(request, context)
  }
}

/**
 * Função para obter o ID do usuário atual
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

/**
 * Função para obter o usuário atual
 */
export async function getCurrentUser(): Promise<User | null> {
  const { user } = await auth()
  return user
}

/**
 * Função para obter a sessão atual
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { session } = await auth()
  return session
}
