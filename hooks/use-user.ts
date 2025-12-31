/**
 * Hook personalizado para gerenciar estado do usuário
 * Implementação com Supabase Auth
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Interface para o usuário (compatível com Clerk)
export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  emailAddresses?: Array<{ emailAddress: string }>;
  imageUrl?: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

// Interface para o retorno do hook
export interface UseUserReturn {
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

/**
 * Converte usuário do Supabase para formato compatível com Clerk
 */
function convertSupabaseUser(supabaseUser: SupabaseUser): User {
  const fullName = supabaseUser.user_metadata?.full_name || '';
  const [firstName, ...lastNameParts] = fullName.split(' ');
  const lastName = lastNameParts.join(' ');

  return {
    id: supabaseUser.id,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    emailAddresses: supabaseUser.email ? [{ emailAddress: supabaseUser.email }] : [],
    imageUrl: supabaseUser.user_metadata?.avatar_url,
    email: supabaseUser.email,
    user_metadata: supabaseUser.user_metadata,
  };
}

/**
 * Hook personalizado para gerenciar estado do usuário
 * Implementação com Supabase Auth
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(convertSupabaseUser(session.user));
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    getInitialSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(convertSupabaseUser(session.user));
        } else {
          setUser(null);
        }
        setIsLoaded(true);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoaded,
    isSignedIn: !!user,
  };
}

/**
 * Hook para autenticação
 * Implementação com Supabase Auth
 */
export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, metadata?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  };

  return {
    userId: user?.id,
    user,
    isLoaded,
    isSignedIn,
    signOut,
    signInWithEmail,
    signUpWithEmail,
  };
}