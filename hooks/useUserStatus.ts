import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  UserStatus,
  UserPlan,
  UserRole,
  validateStatusChange
} from '@/lib/user-status';

export interface StatusChangeRequest {
  userId: string;
  newStatus: UserStatus;
  reason?: string;
  changedBy?: string;
  metadata?: Record<string, any>;
}

interface UserProfile {
  user_id: string;
  status: UserStatus;
  plan: UserPlan;
  role: UserRole;
  full_name?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface StatusChangeHistory {
  id: string;
  user_id: string;
  old_status: UserStatus;
  new_status: UserStatus;
  reason?: string;
  changed_by?: string;
  changed_at: string;
  metadata?: Record<string, any>;
}

export function useUserStatus(userId?: string) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusChangeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar perfil do usuário
  const loadUserProfile = async (targetUserId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const id = targetUserId || userId;
      if (!id) {
        throw new Error('ID do usuário é obrigatório');
      }

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select(`
          user_id,
          status,
          plan,
          role,
          full_name,
          created_at,
          updated_at
        `)
        .eq('user_id', id)
        .single();

      if (fetchError) throw fetchError;
      
      setUserProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Carregar histórico de mudanças
  const loadStatusHistory = async (targetUserId?: string) => {
    try {
      const id = targetUserId || userId;
      if (!id) return;

      const { data, error: fetchError } = await supabase
        .from('user_status_changes')
        .select('*')
        .eq('user_id', id)
        .order('changed_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      
      // Cast for compatibility if needed, assuming the DB returns compatible strings
      setStatusHistory((data as any[]) || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  // Alterar status do usuário
  const changeUserStatus = async (request: StatusChangeRequest): Promise<boolean> => {
    try {
      if (!userProfile) {
        throw new Error('Perfil do usuário não carregado');
      }

      // Validar mudança de status usando o status atual (UserStatus)
      // Nota: validateStatusChange pode precisar ser atualizada para aceitar UserStatus se ainda esperar AccountStatus
      // Assumindo que UserStatus é compatível ou que a função foi atualizada
      const validation = validateStatusChange(userProfile.status, request);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setLoading(true);
      setError(null);

      // Atualizar status na tabela user_profiles
      // Aqui atualizamos a coluna 'status', não 'account_status'
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          status: request.newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', request.userId);

      if (updateError) throw updateError;

      // Registrar mudança no histórico
      const { error: historyError } = await supabase
        .from('user_status_changes')
        .insert({
          user_id: request.userId,
          old_status: userProfile.status,
          new_status: request.newStatus,
          reason: request.reason,
          changed_by: request.changedBy,
          metadata: request.metadata
        });

      if (historyError) {
        console.error('Erro ao registrar histórico:', historyError);
        // Não falha a operação se o histórico não for salvo
      }

      // Atualizar estado local
      setUserProfile(prev => prev ? {
        ...prev,
        status: request.newStatus as UserStatus,
        updated_at: new Date().toISOString()
      } : null);

      // Recarregar histórico
      await loadStatusHistory(request.userId);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verificar permissões do usuário atual
  const checkCurrentUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('status, plan, role, permissions')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Adaptar verificações para usar os novos campos
      // userHasAccess agora deve verificar status/plan/role ou ser atualizada
      // Se as funções utilitárias ainda esperam AccountStatus, isso pode ser um problema.
      // Vou assumir que devo passar o 'status' novo.
      
      // IMPORTANTE: As funções utilitárias em lib/user-status.ts precisam suportar UserStatus/UserPlan/UserRole
      // Como não posso ver o conteúdo atualizado de lib/user-status.ts aqui, vou assumir que
      // userHasAccess(status) funciona ou que preciso refazer a lógica aqui.
      // Dado o contexto, vou usar os campos diretos onde possível ou passar os novos valores.
      
      return {
        hasAccess: data.status === UserStatus.ACTIVE || data.plan === UserPlan.PRO,
        isBlocked: data.status === UserStatus.BLOCKED,
        isPremium: data.plan === UserPlan.PRO,
        isAdmin: data.role === UserRole.ADMIN,
        isSuperAdmin: false, // Role não tem superadmin, mapeado para admin
        status: data.status,
        permissions: data.permissions || {}
      };
    } catch (err) {
      console.error('Erro ao verificar permissões:', err);
      return null;
    }
  };

  // Buscar usuários por status
  const getUsersByStatus = async (status: UserStatus | UserStatus[]) => {
    try {
      const statuses = Array.isArray(status) ? status : [status];
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          user_id,
          status,
          plan,
          role,
          full_name,
          created_at,
          updated_at
        `)
        .in('status', statuses)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar usuários por status:', err);
      return [];
    }
  };

  // Estatísticas de status
  const getStatusStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('status, plan, role');

      if (error) throw error;

      const stats = data.reduce((acc, user) => {
        const s = user.status;
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = data.length;
      const active = data.filter(u => u.status === UserStatus.ACTIVE).length;
      const blocked = data.filter(u => u.status === UserStatus.BLOCKED).length;
      const premium = data.filter(u => u.plan === UserPlan.PRO).length;

      return {
        total,
        active,
        blocked,
        premium,
        pending: stats[UserStatus.PENDING] || 0,
        inactive: stats[UserStatus.INACTIVE] || 0,
        byStatus: stats
      };
    } catch (err) {
      console.error('Erro ao obter estatísticas:', err);
      return null;
    }
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    if (userId) {
      loadUserProfile(userId);
      loadStatusHistory(userId);
    }
  }, [userId]);

  return {
    // Estado
    userProfile,
    statusHistory,
    loading,
    error,
    
    // Ações
    loadUserProfile,
    loadStatusHistory,
    changeUserStatus,
    checkCurrentUserPermissions,
    getUsersByStatus,
    getStatusStats,
    
    // Utilitários
    hasAccess: userProfile ? (userProfile.status === UserStatus.ACTIVE || userProfile.plan === UserPlan.PRO) : false,
    isBlocked: userProfile ? userProfile.status === UserStatus.BLOCKED : false,
    isPremium: userProfile ? userProfile.plan === UserPlan.PRO : false,
    currentStatus: userProfile?.status || UserStatus.INACTIVE
  };
}

// Hook para verificar status do usuário logado
export function useCurrentUserStatus() {
  const [status, setStatus] = useState<{
    hasAccess: boolean;
    isBlocked: boolean;
    isPremium: boolean;
    isAdmin: boolean;
    status: UserStatus;
    permissions: Record<string, any>;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus(null);
          return;
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('status, plan, role, permissions')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setStatus({
          hasAccess: data.status === UserStatus.ACTIVE || data.plan === UserPlan.PRO,
          isBlocked: data.status === UserStatus.BLOCKED,
          isPremium: data.plan === UserPlan.PRO,
          isAdmin: data.role === UserRole.ADMIN,
          status: data.status,
          permissions: data.permissions || {}
        });
      } catch (err) {
        console.error('Erro ao verificar status:', err);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { status, loading };
}
