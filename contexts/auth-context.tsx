'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  const supabase = createClientComponentClient();

  // Função para converter usuário do Supabase para o formato local
  const convertSupabaseUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'Usuário',
      email: supabaseUser.email || '',
      avatar: supabaseUser.user_metadata?.avatar_url,
      cpf: supabaseUser.user_metadata?.cpf,
      fullName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name
    };
  };

  useEffect(() => {
    // Verificar sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(convertSupabaseUser(session.user));
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
        if (session?.user) {
          setUser(convertSupabaseUser(session.user));
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Credenciais inválidas. Verifique seu email e senha.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor, confirme seu email antes de fazer login.');
        } else {
          toast.error(error.message || 'Erro ao fazer login');
        }
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        setUser(convertSupabaseUser(data.user));
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || name,
            name: name,
            cpf: cpf
          }
        }
      });

      if (error) {
        console.error('Erro no registro:', error);
        if (error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado. Tente fazer login.');
        } else if (error.message.includes('Password should be at least 6 characters')) {
          toast.error('A senha deve ter pelo menos 6 caracteres.');
        } else {
          toast.error(error.message || 'Erro ao criar conta');
        }
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        // Não definir o usuário imediatamente se precisar de confirmação de email
        if (data.user.email_confirmed_at) {
          setUser(convertSupabaseUser(data.user));
          toast.success('Cadastro realizado com sucesso! Bem-vindo ao SOFIA!');
        } else {
          toast.success('Conta criada com sucesso! Verifique seu email para confirmar a conta.');
        }
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
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

  const getToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      toast.error('Não foi possível obter o token de acesso.');
      return null;
    }
  };

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