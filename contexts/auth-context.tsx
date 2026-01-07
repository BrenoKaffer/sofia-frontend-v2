'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getUserProfile } from '@/lib/user-profiles-integration';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  cpf?: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, cpf?: string, fullName?: string) => Promise<boolean>;
  logout: () => void;
  getToken: () => Promise<string | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const AUTH_DEV_BYPASS = process.env.NEXT_PUBLIC_AUTH_DEV_BYPASS === 'true';

  // Função para converter usuário do Supabase para o formato local, buscando dados atualizados do perfil
  const fetchAndConvertUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    let profileData = null;
    try {
      profileData = await getUserProfile(supabaseUser.id);
    } catch (e) {
      console.error('Error fetching user profile:', e);
      // Fallback silencioso para metadados de auth se o perfil não existir
    }

    return {
      id: supabaseUser.id,
      name: profileData?.full_name || supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'Usuário',
      email: profileData?.email || supabaseUser.email || '',
      avatar: supabaseUser.user_metadata?.avatar_url,
      cpf: profileData?.cpf || supabaseUser.user_metadata?.cpf,
      fullName: profileData?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name
    };
  };

  useEffect(() => {
    // Verificar sessão inicial
    const getInitialSession = async () => {
      try {
        // Se bypass ativo, simula usuário sem consultar Supabase
        if (AUTH_DEV_BYPASS) {
          setUser({
            id: 'dev-bypass-user',
            name: 'Dev Bypass',
            email: 'dev@local',
            avatar: undefined,
            cpf: undefined,
            fullName: 'Dev Bypass'
          });
          console.warn('[AUTH] Bypass de autenticação ATIVO no cliente');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userWithProfile = await fetchAndConvertUser(session.user);
          setUser(userWithProfile);
        }
      } catch (error) {
        console.error('Erro ao obter sessão inicial:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (AUTH_DEV_BYPASS) {
          setUser({
            id: 'dev-bypass-user',
            name: 'Dev Bypass',
            email: 'dev@local',
            avatar: undefined,
            cpf: undefined,
            fullName: 'Dev Bypass'
          });
          setIsLoading(false);
          return;
        }
        if (session?.user) {
          const userWithProfile = await fetchAndConvertUser(session.user);
          setUser(userWithProfile);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Use backend API to centralize auth logic and audit
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Erro no login:', data.message);
        if (data.message && (data.message.includes('incorretos') || data.message.includes('credentials'))) {
          toast.error('Credenciais inválidas. Verifique seu email e senha.');
        } else if (data.message && data.message.includes('not confirmed')) {
          toast.error('Por favor, confirme seu email antes de fazer login.');
        } else {
          toast.error(data.message || 'Erro ao fazer login');
        }
        setIsLoading(false);
        return false;
      }

      if (data.session) {
        // Set the session in the Supabase client
        const { error: sessionError } = await supabase.auth.setSession(data.session);
        
        if (sessionError) {
          console.error('Erro ao definir sessão no cliente:', sessionError);
          toast.error('Erro ao autenticar sessão localmente.');
          setIsLoading(false);
          return false;
        }

        if (data.user) {
          const userWithProfile = await fetchAndConvertUser(data.user);
          setUser(userWithProfile);
        }
        
        toast.success('Login realizado com sucesso! Bem-vindo de volta ao SOFIA!');
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error('Erro interno do servidor');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, cpf?: string, fullName?: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Use backend API instead of Supabase direct call to enforce backend logic and premium email templates
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          cpf, 
          fullName 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Erro no registro:', data.message);
        if (data.message && data.message.includes('already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
        } else {
          toast.error(data.message || 'Erro ao criar conta');
        }
        setIsLoading(false);
        return false;
      }

      toast.success(data.message || 'Conta criada com sucesso! Verifique seu email para confirmar a conta.');
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Erro no registro:', error);
      toast.error('Erro interno do servidor');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const getToken = React.useCallback(async (): Promise<string | null> => {
    try {
      if (AUTH_DEV_BYPASS) {
        return 'dev-bypass-token';
      }
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      toast.error('Não foi possível obter o token de acesso.');
      return null;
    }
  }, [AUTH_DEV_BYPASS]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, getToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}