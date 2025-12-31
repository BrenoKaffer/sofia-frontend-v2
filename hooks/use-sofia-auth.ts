'use client';

import { useAuth } from '@/contexts/auth-context';

/**
 * Hook personalizado para autenticação da SOFIA
 * Fornece uma interface unificada para autenticação em toda a aplicação
 */
export function useSofiaAuth() {
  const { user: sofiaUser, login, register, logout, isLoading, getToken } = useAuth();

  return {
    // Dados do usuário
    user: sofiaUser,
    
    // Estados de carregamento
    isLoading,
    isAuthenticated: !!sofiaUser,
    
    // Funções de autenticação
    login,
    register,
    logout,
    
    // Token de autenticação
    getToken,
    
    // Dados específicos da SOFIA
    userProfile: {
      id: sofiaUser?.id || '',
      name: sofiaUser?.name || '',
      email: sofiaUser?.email || '',
      avatar: sofiaUser?.avatar || '',
      cpf: sofiaUser?.cpf || '',
      fullName: sofiaUser?.fullName || ''
    },
    
    // Verificações de permissão
    hasPermission: (permission: string) => {
      // Implementar lógica de permissões baseada no usuário
      // Por enquanto, retorna true para todos os usuários autenticados
      return !!sofiaUser;
    },
    
    // Atualizar perfil do usuário
    updateProfile: async (data: { cpf?: string; fullName?: string }) => {
      if (!sofiaUser) return false;
      
      try {
        // Implementar lógica de atualização de perfil
        // Por enquanto, retorna true como mock
        return true;
      } catch (error) {
        return false;
      }
    }
  };
}

/**
 * Hook para verificar se o usuário está autenticado
 * Útil para componentes que precisam apenas verificar o status de autenticação
 */
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useSofiaAuth();
  return { isAuthenticated, isLoading };
}

/**
 * Hook para obter apenas os dados do perfil do usuário
 * Útil para componentes que precisam apenas dos dados do usuário
 */
export function useUserProfile() {
  const { userProfile, isLoading } = useSofiaAuth();
  return { userProfile, isLoading };
}

// Re-exportar useAuth do contexto para compatibilidade
export { useAuth } from '@/contexts/auth-context';