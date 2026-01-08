'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  register: (name: string, email: string, password: string, cpf?: string, fullName?: string, confirmPassword?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggingOutRef = React.useRef(false);
  const AUTH_DEV_BYPASS = process.env.NEXT_PUBLIC_AUTH_DEV_BYPASS === 'true';

  // Função para converter usuário do Supabase para o formato local, buscando dados atualizados do perfil
  const fetchAndConvertUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    let profileData = null;
    try {
      profileData = await getUserProfile(supabaseUser.id);
      console.log('Dados do perfil sincronizados:', profileData);
    } catch (e: any) {
      // Tentar recuperar criando o perfil automaticamente
      // Suprimir toast de erro de permissão pois o sistema tentará corrigir
      const isPermissionError = e.message && (e.message.includes('permission') || e.message.includes('policy'));
      if (!isPermissionError) {
        // Logar outros erros que não sejam de permissão/RLS
        console.error('Error fetching user profile:', e);
      } else {
        console.warn('Perfil não encontrado ou erro de permissão (RLS). Tentando criar perfil via RPC...');
      }

      try {
        await supabase.rpc('insert_user_profile_on_registration', {
          p_user_id: supabaseUser.id,
          p_full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuário',
          p_cpf: supabaseUser.user_metadata?.cpf || '',
          p_email: supabaseUser.email || ''
        });
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', supabaseUser.id)
          .single();
        profileData = data || null;
      } catch (createErr: any) {
        console.error('Error creating user profile:', createErr);
        // Só mostrar erro se a recuperação falhar também
        if (isPermissionError) {
           toast.error('Erro ao sincronizar perfil. Algumas funcionalidades podem estar limitadas.');
        }
      }
    }

    // Prioridade: Perfil (DB) > Metadata (Auth) > Fallback
    const name = profileData?.full_name || profileData?.name || supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'Usuário';
    const cpf = profileData?.cpf || supabaseUser.user_metadata?.cpf;
    const avatar = profileData?.avatar_url || profileData?.avatar || supabaseUser.user_metadata?.avatar_url;

    return {
      id: supabaseUser.id,
      name: name,
      email: profileData?.email || supabaseUser.email || '',
      avatar: avatar,
      cpf: cpf,
      fullName: name
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
        if (isLoggingOutRef.current) return;
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
      console.log('Tentando login via API...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.warn('Falha ao analisar resposta JSON da API de login:', e);
        data = { message: 'Erro de comunicação com o servidor' };
      }

      if (!response.ok) {
        console.warn(`API de login retornou erro ${response.status}:`, data.message);
        throw new Error(data.message || `Erro ${response.status}`);
      }

      if (data.session) {
        const { error: sessionError } = await supabase.auth.setSession(data.session);
        
        if (sessionError) {
          console.error('Erro ao definir sessão no cliente:', sessionError);
          throw sessionError;
        }

        if (data.user) {
          const userWithProfile = await fetchAndConvertUser(data.user);
          setUser(userWithProfile);
        }
        
        toast.success('Login realizado com sucesso! Bem-vindo de volta ao SOFIA!');
        setIsLoading(false);
        return true;
      }
    } catch (apiError) {
      console.warn('Falha no login via API, tentando fallback direto via Supabase Client:', apiError);
      
      try {
        // Fallback: Login direto via Supabase Client
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          console.error('Erro no login (fallback):', error.message);
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Credenciais inválidas. Verifique seu email e senha.');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Por favor, confirme seu email antes de fazer login.');
          } else {
            toast.error('Erro ao fazer login: ' + error.message);
          }
          setIsLoading(false);
          return false;
        }

        if (data.session) {
            if (data.user) {
              const userWithProfile = await fetchAndConvertUser(data.user);
              setUser(userWithProfile);
            }

            // Garantir que os cookies sejam definidos para o middleware
            if (typeof window !== 'undefined') {
              const maxAge = 60 * 60 * 24 * 7; // 7 dias
              document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; samesite=lax`;
              document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${maxAge}; samesite=lax`;
            }
            
            toast.success('Login realizado com sucesso! (Modo Fallback)');
            router.push('/dashboard');
            setIsLoading(false);
            return true;
          }
      } catch (fallbackError) {
        console.error('Erro fatal no login:', fallbackError);
        toast.error('Não foi possível realizar o login. Tente novamente mais tarde.');
      }
    }

    setIsLoading(false);
    return false;
  };

  const register = async (name: string, email: string, password: string, cpf?: string, fullName?: string, confirmPassword?: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Use relative path to ensure we hit the Next.js API Routes in the same origin
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          cpf, 
          fullName,
          confirm_password: confirmPassword
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
    // Marcar que estamos fazendo logout para evitar atualizações de estado que quebrem a UI
    isLoggingOutRef.current = true;
    
    try {
      // 1. Chamar rota de logout do servidor para limpar cookies
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        console.warn('Erro ao chamar API de logout:', e);
      }

      // 2. Logout no cliente Supabase
      // Isso dispararia onAuthStateChange, mas o ref isLoggingOutRef vai prevenir o setUser(null)
      await supabase.auth.signOut();
      
      // 3. Limpar cookies manualmente no cliente para garantir
      if (typeof document !== 'undefined') {
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }

      // 4. Redirecionar via hard refresh
      // Não chamamos setUser(null) aqui propositalmente para manter a UI estável até o refresh
      toast.success('Logout realizado com sucesso!');
      
      // Usar window.location.href para garantir um reset completo do estado
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
      window.location.href = '/login';
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
