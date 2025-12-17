/**
 * Utilitário para gerenciar estados de carregamento
 * Fornece feedback visual consistente durante operações assíncronas
 */

import { toast } from 'sonner';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  toastId?: string | number;
}

export class LoadingManager {
  private static instance: LoadingManager;
  private loadingStates: Map<string, LoadingState> = new Map();

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  /**
   * Inicia um estado de carregamento
   */
  startLoading(key: string, message: string = 'Carregando...'): void {
    const toastId = toast.loading(message);
    
    this.loadingStates.set(key, {
      isLoading: true,
      message,
      toastId: toastId,
    });
  }

  /**
   * Finaliza um estado de carregamento com sucesso
   */
  finishLoading(key: string, successMessage?: string): void {
    const state = this.loadingStates.get(key);
    
    if (state?.toastId) {
      toast.dismiss(state.toastId);
    }
    
    if (successMessage) {
      toast.success(successMessage);
    }
    
    this.loadingStates.delete(key);
  }

  /**
   * Finaliza um estado de carregamento com erro
   */
  errorLoading(key: string, errorMessage: string): void {
    const state = this.loadingStates.get(key);
    
    if (state?.toastId) {
      toast.dismiss(state.toastId);
    }
    
    toast.error(errorMessage);
    this.loadingStates.delete(key);
  }

  /**
   * Verifica se uma operação está carregando
   */
  isLoading(key: string): boolean {
    return this.loadingStates.get(key)?.isLoading ?? false;
  }

  /**
   * Limpa todos os estados de carregamento
   */
  clearAll(): void {
    this.loadingStates.forEach((state) => {
      if (state.toastId) {
        toast.dismiss(state.toastId);
      }
    });
    this.loadingStates.clear();
  }
}

// Instância singleton
export const loadingManager = LoadingManager.getInstance();

// Hook para usar em componentes React
export function useLoadingState(key: string) {
  const manager = LoadingManager.getInstance();
  
  return {
    isLoading: manager.isLoading(key),
    startLoading: (message?: string) => manager.startLoading(key, message),
    finishLoading: (successMessage?: string) => manager.finishLoading(key, successMessage),
    errorLoading: (errorMessage: string) => manager.errorLoading(key, errorMessage),
  };
}

// Constantes para chaves de carregamento
export const LOADING_KEYS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  DASHBOARD_LOAD: 'dashboard-load',
  USER_PROFILE: 'user-profile',
  SETTINGS_SAVE: 'settings-save',
} as const;