/**
 * Contexto global do SOFIA para gerenciar estado da aplicação
 * Inclui dados em tempo real, preferências do usuário e cache
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useRealTimeSignals, useRealTimeKPIs } from '@/hooks/use-real-time-data';
import { useErrorMonitoring, useApiMonitoring } from '@/hooks/use-error-monitoring';

// Interfaces para tipos específicos
interface SignalHistoryItem {
  id: string;
  strategy: string;
  table_id: string;
  confidence: number;
  prediction: number | string;
  timestamp: string;
  status: 'active' | 'completed' | 'expired';
  result?: number;
  profit?: number;
}

interface PerformanceDataItem {
  strategy: string;
  date: string;
  accuracy: number;
  roi: number;
  profit: number;
  signals_count: number;
}

interface RouletteHistoryItem {
  id: string;
  table_id: string;
  number: number;
  color: 'red' | 'black' | 'green';
  timestamp: string;
  spin_time: number;
}

interface SignalsHistoryFilters {
  strategy?: string;
  table_id?: string;
  start_date?: string;
  end_date?: string;
  status?: 'active' | 'completed' | 'expired';
  min_confidence?: number;
}

interface ApiResponseData {
  strategies?: string[];
  tables?: Table[];
}

// Tipos de dados
interface Signal {
  id: string;
  strategy: string;
  table_id: string;
  confidence: number;
  prediction: number | string;
  timestamp: string;
  status: 'active' | 'completed' | 'expired';
}

interface KPI {
  strategy: string;
  accuracy: number;
  roi: number;
  profit: number;
  signals_count: number;
  win_rate: number;
}

interface Table {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive';
  last_spin: number;
  last_update: string;
}

interface UserPreferences {
  selected_strategies: string[];
  selected_tables: string[];
  notification_settings: {
    sound_enabled: boolean;
    desktop_notifications: boolean;
    min_confidence: number;
  };
  dashboard_layout: {
    cards_order: string[];
    show_advanced_metrics: boolean;
  };
  dashboard_config?: {
    stats_cards_visible: boolean;
    live_signals_visible: boolean;
    performance_chart_visible: boolean;
    roulette_status_visible: boolean;
    recent_activity_visible: boolean;
  };
}

interface SofiaState {
  // Dados em tempo real
  signals: Signal[];
  kpis: KPI[];
  tables: Table[];
  
  // Configurações
  userPreferences: UserPreferences | null;
  availableStrategies: string[];
  availableTables: Table[];
  
  // Estado da aplicação
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
  
  // Cache
  cache: {
    signals_history: SignalHistoryItem[];
    performance_data: PerformanceDataItem[];
    roulette_history: RouletteHistoryItem[];
  };
}

// Ações do reducer
type SofiaAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'UPDATE_SIGNALS'; payload: Signal[] }
  | { type: 'UPDATE_KPIS'; payload: KPI[] }
  | { type: 'UPDATE_TABLES'; payload: Table[] }
  | { type: 'SET_USER_PREFERENCES'; payload: UserPreferences }
  | { type: 'SET_AVAILABLE_STRATEGIES'; payload: string[] }
  | { type: 'SET_AVAILABLE_TABLES'; payload: Table[] }
  | { type: 'UPDATE_CACHE'; payload: { key: keyof SofiaState['cache']; data: SignalHistoryItem[] | PerformanceDataItem[] | RouletteHistoryItem[] } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'SET_LAST_UPDATE'; payload: Date };

// Estado inicial
const initialState: SofiaState = {
  signals: [],
  kpis: [],
  tables: [],
  userPreferences: null,
  availableStrategies: [],
  availableTables: [],
  isLoading: false,
  isConnected: false,
  error: null,
  lastUpdate: null,
  cache: {
    signals_history: [],
    performance_data: [],
    roulette_history: []
  }
};

// Reducer
function sofiaReducer(state: SofiaState, action: SofiaAction): SofiaState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'UPDATE_SIGNALS':
      return { 
        ...state, 
        signals: action.payload, 
        lastUpdate: new Date(),
        error: null 
      };
    
    case 'UPDATE_KPIS':
      return { 
        ...state, 
        kpis: action.payload, 
        lastUpdate: new Date(),
        error: null 
      };
    
    case 'UPDATE_TABLES':
      return { 
        ...state, 
        tables: action.payload, 
        lastUpdate: new Date(),
        error: null 
      };
    
    case 'SET_USER_PREFERENCES':
      return { ...state, userPreferences: action.payload };
    
    case 'SET_AVAILABLE_STRATEGIES':
      return { ...state, availableStrategies: action.payload };
    
    case 'SET_AVAILABLE_TABLES':
      return { ...state, availableTables: action.payload };
    
    case 'UPDATE_CACHE':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: action.payload.data
        }
      };
    
    case 'CLEAR_CACHE':
      return {
        ...state,
        cache: {
          signals_history: [],
          performance_data: [],
          roulette_history: []
        }
      };
    
    case 'SET_LAST_UPDATE':
      return { ...state, lastUpdate: action.payload };
    
    default:
      return state;
  }
}

// Contexto
interface SofiaContextType {
  state: SofiaState;
  actions: {
    refreshData: () => Promise<void>;
    updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
    getSignalsHistory: (filters?: SignalsHistoryFilters) => Promise<SignalHistoryItem[]>;
    getRouletteHistory: (tableId?: string, limit?: number) => Promise<RouletteHistoryItem[]>;
    clearCache: () => void;
    setError: (error: string | null) => void;
  };
}

const SofiaContext = createContext<SofiaContextType | undefined>(undefined);

// Provider
interface SofiaProviderProps {
  children: ReactNode;
}

export function SofiaProvider({ children }: SofiaProviderProps) {
  const [state, dispatch] = useReducer(sofiaReducer, initialState);
  const { user } = useAuth();
  
  // Hooks de monitoramento de erros e API
  const { captureError, captureMessage } = useErrorMonitoring();
  const { trackApiCall } = useApiMonitoring();

  // Callbacks otimizados para evitar re-renders
  const handleSignalsData = useCallback((data: Signal[]) => {
    if (Array.isArray(data)) {
      dispatch({ type: 'UPDATE_SIGNALS', payload: data });
    }
  }, []);

  const handleKpisData = useCallback((data: KPI[]) => {
    if (Array.isArray(data)) {
      dispatch({ type: 'UPDATE_KPIS', payload: data });
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    // Capturar erro no Sentry
    captureError(error, {
      component: 'SofiaProvider',
      action: 'real-time-data'
    });
    dispatch({ type: 'SET_ERROR', payload: error.message });
  }, [captureError]);

  // Hooks para dados em tempo real
  const signalsRealTime = useRealTimeSignals({
    onData: handleSignalsData,
    onError: handleError
  });

  const kpisRealTime = useRealTimeKPIs({
    onData: handleKpisData,
    onError: handleError
  });

  // Atualizar estado de conexão
  useEffect(() => {
    dispatch({ 
      type: 'SET_CONNECTED', 
      payload: signalsRealTime.isConnected || kpisRealTime.isConnected 
    });
  }, [signalsRealTime.isConnected, kpisRealTime.isConnected]);

  // Atualizar estado de loading
  useEffect(() => {
    dispatch({ 
      type: 'SET_LOADING', 
      payload: signalsRealTime.isLoading || kpisRealTime.isLoading 
    });
  }, [signalsRealTime.isLoading, kpisRealTime.isLoading]);

  // Função para carregar dados iniciais (otimizada)
  const loadInitialData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Carregar opções disponíveis
      const optionsResponse = await trackApiCall(
        () => apiClient.getAvailableOptions(),
        'getAvailableOptions'
      );
      if (optionsResponse.success) {
        const { strategies, tables } = optionsResponse.data as ApiResponseData;
        dispatch({ type: 'SET_AVAILABLE_STRATEGIES', payload: strategies || [] });
        dispatch({ type: 'SET_AVAILABLE_TABLES', payload: tables || [] });
      }

      // Carregar preferências do usuário apenas se autenticado
      if (user) {
        const preferencesResponse = await trackApiCall(
          () => apiClient.getUserPreferences(),
          'getUserPreferences'
        );
        if (preferencesResponse.success) {
          dispatch({ type: 'SET_USER_PREFERENCES', payload: preferencesResponse.data as UserPreferences });
        }
      }

      // Carregar mesas públicas
      const tablesResponse = await trackApiCall(
        () => apiClient.getPublicTables(),
        'getPublicTables'
      );
      if (tablesResponse.success) {
        dispatch({ type: 'UPDATE_TABLES', payload: (tablesResponse.data as Table[]) || [] });
      }

    } catch (error) {
      captureError(error as Error, {
        component: 'SofiaProvider',
        action: 'loadInitialData'
      });
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados iniciais' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [trackApiCall, captureError, user]);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Ações do contexto (otimizadas)
  const actions = useMemo(() => ({
    refreshData: async () => {
      await loadInitialData();
      signalsRealTime.refresh();
      kpisRealTime.refresh();
    },

    updateUserPreferences: async (preferences: Partial<UserPreferences>) => {
      try {
        const currentPrefs = state.userPreferences || {
          selected_strategies: [],
          selected_tables: [],
          notification_settings: {
            sound_enabled: true,
            desktop_notifications: true,
            min_confidence: 70
          },
          dashboard_layout: {
            cards_order: [],
            show_advanced_metrics: false
          },
          dashboard_config: {
            stats_cards_visible: true,
            live_signals_visible: true,
            performance_chart_visible: true,
            roulette_status_visible: true,
            recent_activity_visible: true
          }
        };

        const updatedPrefs = { ...currentPrefs, ...preferences };
        
        const response = await trackApiCall(
          () => apiClient.updateUserPreferences(updatedPrefs),
          'updateUserPreferences'
        );
        if (response.success) {
          dispatch({ type: 'SET_USER_PREFERENCES', payload: updatedPrefs });
        } else {
          throw new Error(response.error || 'Erro ao atualizar preferências');
        }
      } catch (error) {
        captureError(error as Error, {
          component: 'SofiaProvider',
          action: 'updateUserPreferences',
          metadata: { preferences }
        });
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
        throw error;
      }
    },

    getSignalsHistory: async (filters: SignalsHistoryFilters = {}) => {
      try {
        const response = await trackApiCall(
          () => apiClient.getSignalsHistory(filters),
          'getSignalsHistory'
        );
        if (response.success) {
          const data = (response.data as SignalHistoryItem[]) || [];
          dispatch({ type: 'UPDATE_CACHE', payload: { key: 'signals_history', data } });
          return data;
        }
        throw new Error(response.error || 'Erro ao buscar histórico de sinais');
      } catch (error) {
        captureError(error as Error, {
          component: 'SofiaProvider',
          action: 'getSignalsHistory',
          metadata: { filters }
        });
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
        return [];
      }
    },

    getRouletteHistory: async (tableId?: string, limit = 100) => {
      try {
        const response = await trackApiCall(
          () => apiClient.getRouletteHistory(tableId, limit),
          'getRouletteHistory'
        );
        if (response.success) {
          const data = (response.data as RouletteHistoryItem[]) || [];
          dispatch({ type: 'UPDATE_CACHE', payload: { key: 'roulette_history', data } });
          return data;
        }
        throw new Error(response.error || 'Erro ao buscar histórico da roleta');
      } catch (error) {
        captureError(error as Error, {
          component: 'SofiaProvider',
          action: 'getRouletteHistory',
          metadata: { tableId, limit }
        });
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
        return [];
      }
    },

    clearCache: () => {
      dispatch({ type: 'CLEAR_CACHE' });
    },

    setError: (error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }
  }), [loadInitialData, signalsRealTime.refresh, kpisRealTime.refresh, state.userPreferences, trackApiCall, captureError]);

  // Context value otimizado
  const contextValue: SofiaContextType = useMemo(() => ({
    state,
    actions
  }), [state, actions]);

  return (
    <SofiaContext.Provider value={contextValue}>
      {children}
    </SofiaContext.Provider>
  );
}

// Hook para usar o contexto
export function useSofia() {
  const context = useContext(SofiaContext);
  if (context === undefined) {
    throw new Error('useSofia deve ser usado dentro de um SofiaProvider');
  }
  return context;
}

// Hooks específicos otimizados para facilitar o uso
export function useSofiaSignals() {
  const { state } = useSofia();
  return useMemo(() => state.signals, [state.signals]);
}

export function useSofiaKPIs() {
  const { state } = useSofia();
  return useMemo(() => state.kpis, [state.kpis]);
}

export function useSofiaTables() {
  const { state } = useSofia();
  return useMemo(() => state.tables, [state.tables]);
}

export function useSofiaPreferences() {
  const { state, actions } = useSofia();
  return useMemo(() => ({
    preferences: state.userPreferences,
    updatePreferences: actions.updateUserPreferences
  }), [state.userPreferences, actions.updateUserPreferences]);
}

export function useSofiaConnection() {
  const { state } = useSofia();
  return useMemo(() => ({
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate
  }), [state.isConnected, state.isLoading, state.error, state.lastUpdate]);
}