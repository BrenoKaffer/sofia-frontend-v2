/**
 * Cliente da API para sistema de apostas automáticas
 */

export interface BettingSession {
  sessionId: string;
  config: BettingConfig;
  status: 'initialized' | 'active' | 'paused' | 'stopped' | 'error';
  createdAt: string;
  stats: SessionStats;
}

export interface BettingConfig {
  strategy?: 'conservative' | 'aggressive' | 'balanced';
  maxBetAmount?: number;
  minBetAmount?: number;
  maxDailyLoss?: number;
  maxSessionLoss?: number;
  maxConsecutiveLosses?: number;
  sessionDuration?: number;
  safety?: SafetyConfig;
  betting?: AutoBettingConfig;
}

export interface SafetyConfig {
  maxBetAmount: number;
  minBetAmount: number;
  maxDailyLoss: number;
  maxSessionLoss: number;
  maxConsecutiveLosses: number;
  sessionDuration: number;
}

export interface AutoBettingConfig {
  strategy: string;
  baseAmount: number;
  multiplier: number;
  targetNumbers: number[];
}

export interface SessionStats {
  messagesReceived: number;
  messagesSent: number;
  betsPlaced: number;
  errors: number;
  totalBets: number;
  wins: number;
  losses: number;
  netProfit: number;
}

export interface BetRequest {
  numbers: number[];
  amount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SystemStats {
  activeSessions: number;
  totalSessions: number;
  messageRates: Array<{
    sessionId: string;
    messagesPerMinute: number;
  }>;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  bridge: boolean;
  uptime: number;
}

class BettingApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string = '/api/betting') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fazer requisição HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`[BettingAPI] Erro na requisição ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Criar nova sessão de automação
   */
  async createSession(config: BettingConfig = {}): Promise<ApiResponse<{ sessionId: string }>> {
    return this.request<{ sessionId: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * Enviar mensagem para uma sessão
   */
  async sendMessage(
    sessionId: string,
    type: string,
    data: any = {}
  ): Promise<ApiResponse> {
    return this.request(`/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ type, data }),
    });
  }

  /**
   * Obter status de uma sessão
   */
  async getSessionStatus(sessionId: string): Promise<ApiResponse> {
    return this.request(`/sessions/${sessionId}/status`);
  }

  /**
   * Terminar uma sessão
   */
  async terminateSession(sessionId: string): Promise<ApiResponse> {
    return this.request(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Iniciar automação
   */
  async startAutomation(
    sessionId: string,
    config: Partial<BettingConfig> = {}
  ): Promise<ApiResponse> {
    return this.request(`/sessions/${sessionId}/start`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * Parar automação
   */
  async stopAutomation(
    sessionId: string,
    reason: string = 'user_request'
  ): Promise<ApiResponse> {
    return this.request(`/sessions/${sessionId}/stop`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Pausar automação
   */
  async pauseAutomation(sessionId: string): Promise<ApiResponse> {
    return this.request(`/sessions/${sessionId}/pause`, {
      method: 'POST',
    });
  }

  /**
   * Fazer aposta manual
   */
  async placeBet(sessionId: string, bet: BetRequest): Promise<ApiResponse> {
    return this.request(`/sessions/${sessionId}/bet`, {
      method: 'POST',
      body: JSON.stringify(bet),
    });
  }

  /**
   * Atualizar configuração da sessão
   */
  async updateConfig(
    sessionId: string,
    config: Partial<BettingConfig>
  ): Promise<ApiResponse> {
    return this.request(`/sessions/${sessionId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * Obter estatísticas do sistema
   */
  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    return this.request<SystemStats>('/stats');
  }

  /**
   * Verificar saúde do sistema
   */
  async getHealth(): Promise<ApiResponse<HealthStatus>> {
    return this.request<HealthStatus>('/health');
  }
}

// Hook React para usar a API de apostas
import { useState, useEffect, useCallback } from 'react';

export function useBettingApi() {
  const [client] = useState(() => new BettingApiClient());
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Criar nova sessão
   */
  const createSession = useCallback(async (config: BettingConfig = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await client.createSession(config);
      
      if (response.success && response.data) {
        setCurrentSession(response.data.sessionId);
        return response.data.sessionId;
      } else {
        throw new Error(response.error || 'Falha ao criar sessão');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  /**
   * Terminar sessão atual
   */
  const terminateSession = useCallback(async () => {
    if (!currentSession) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.terminateSession(currentSession);
      
      if (response.success) {
        setCurrentSession(null);
      } else {
        throw new Error(response.error || 'Falha ao terminar sessão');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, currentSession]);

  /**
   * Iniciar automação
   */
  const startAutomation = useCallback(async (config: Partial<BettingConfig> = {}) => {
    if (!currentSession) {
      throw new Error('Nenhuma sessão ativa');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.startAutomation(currentSession, config);
      
      if (!response.success) {
        throw new Error(response.error || 'Falha ao iniciar automação');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, currentSession]);

  /**
   * Parar automação
   */
  const stopAutomation = useCallback(async (reason: string = 'user_request') => {
    if (!currentSession) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.stopAutomation(currentSession, reason);
      
      if (!response.success) {
        throw new Error(response.error || 'Falha ao parar automação');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, currentSession]);

  /**
   * Pausar automação
   */
  const pauseAutomation = useCallback(async () => {
    if (!currentSession) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.pauseAutomation(currentSession);
      
      if (!response.success) {
        throw new Error(response.error || 'Falha ao pausar automação');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, currentSession]);

  /**
   * Fazer aposta manual
   */
  const placeBet = useCallback(async (bet: BetRequest) => {
    if (!currentSession) {
      throw new Error('Nenhuma sessão ativa');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.placeBet(currentSession, bet);
      
      if (!response.success) {
        throw new Error(response.error || 'Falha ao fazer aposta');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, currentSession]);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    client,
    currentSession,
    isLoading,
    error,
    createSession,
    terminateSession,
    startAutomation,
    stopAutomation,
    pauseAutomation,
    placeBet,
    clearError,
  };
}

export default BettingApiClient;