import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  AccountStatus, 
  StatusChangeRequest, 
  validateStatusChange,
  userHasAccess,
  userIsBlocked,
  userIsPremium,
  userIsAdmin,
  userIsSuperAdmin
} from '@/lib/user-status';

interface UserProfile {
  user_id: string;
  account_status: AccountStatus;
  full_name?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface StatusChangeHistory {
  id: string;
  user_id: string;
  old_status: AccountStatus;
  new_status: AccountStatus;
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
          account_status,
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
      
      setStatusHistory(data || []);
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

      // Validar mudança de status
      const validation = validateStatusChange(userProfile.account_status, request);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setLoading(true);
      setError(null);

      // Atualizar status na tabela user_profiles
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          account_status: request.newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', request.userId);

      if (updateError) throw updateError;

      // Registrar mudança no histórico
      const { error: historyError } = await supabase
        .from('user_status_changes')
        .insert({
          user_id: request.userId,
          old_status: userProfile.account_status,
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
        account_status: request.newStatus,
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
        .select('account_status, permissions')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return {
        hasAccess: userHasAccess(data.account_status),
        isBlocked: userIsBlocked(data.account_status),
        isPremium: userIsPremium(data.account_status),
        isAdmin: userIsAdmin(data.account_status),
        isSuperAdmin: userIsSuperAdmin(data.account_status),
        status: data.account_status,
        permissions: data.permissions || {}
      };
    } catch (err) {
      console.error('Erro ao verificar permissões:', err);
      return null;
    }
  };

  // Buscar usuários por status
  const getUsersByStatus = async (status: AccountStatus | AccountStatus[]) => {
    try {
      const statuses = Array.isArray(status) ? status : [status];
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          user_id,
          account_status,
          full_name,
          created_at,
          updated_at
        `)
        .in('account_status', statuses)
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
        .select('account_status');

      if (error) throw error;

      const stats = data.reduce((acc, user) => {
        const status = user.account_status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: data.length,
        active: userHasAccess('active') ? (stats.active || 0) + (stats.free || 0) + (stats.premium || 0) + (stats.trial || 0) : 0,
        blocked: (stats.blocked || 0) + (stats.suspended || 0) + (stats.banned || 0),
        premium: (stats.premium || 0) + (stats.trial || 0),
        pending: stats.pending || 0,
        inactive: stats.inactive || 0,
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
    hasAccess: userProfile ? userHasAccess(userProfile.account_status) : false,
    isBlocked: userProfile ? userIsBlocked(userProfile.account_status) : false,
    isPremium: userProfile ? userIsPremium(userProfile.account_status) : false,
    currentStatus: userProfile?.account_status || AccountStatus.FREE
  };
}

// Hook para verificar status do usuário logado
export function useCurrentUserStatus() {
  const [status, setStatus] = useState<{
    hasAccess: boolean;
    isBlocked: boolean;
    isPremium: boolean;
    status: AccountStatus;
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
          .select('account_status, permissions')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setStatus({
          hasAccess: userHasAccess(data.account_status),
          isBlocked: userIsBlocked(data.account_status),
          isPremium: userIsPremium(data.account_status),
          status: data.account_status,
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