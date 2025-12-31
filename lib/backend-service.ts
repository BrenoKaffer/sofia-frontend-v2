/**
 * Serviço centralizado para comunicação com o Backend SOFIA
 * Substitui gradualmente os dados mock por APIs reais
 */

interface BackendConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  apiKey?: string;
}

interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    returned_count: number;
    items_per_page: number;
  };
}

class BackendService {
  private config: BackendConfig;
  private isBackendAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 segundos
  private internalBaseUrl: string = '';

  constructor() {
    this.config = {
      baseUrl: process.env.SOFIA_BACKEND_URL || '',
      timeout: parseInt(process.env.SOFIA_API_TIMEOUT || '15000'),
      retries: parseInt(process.env.SOFIA_API_RETRIES || '3'),
      retryDelay: parseInt(process.env.SOFIA_API_RETRY_DELAY || '1000'),
      apiKey: process.env.BACKEND_API_KEY
    };
    // Fallback para rotas internas do Next.js em desenvolvimento se baseUrl não estiver definido
    if (!this.config.baseUrl) {
      this.config.baseUrl = '';
    }
    this.internalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  }

  /**
   * Verifica se o backend está disponível
   */
  private async checkBackendHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Cache do health check por 30 segundos
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isBackendAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.baseUrl}/api/system/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.isBackendAvailable = response.ok;
      this.lastHealthCheck = now;

      if (this.isBackendAvailable) {
        console.log('✅ Backend SOFIA disponível');
      }

      return this.isBackendAvailable;
    } catch (error) {
      console.log('⚠️ Backend SOFIA não disponível, usando fallback');
      this.isBackendAvailable = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Obtém token de autenticação
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // Tentar obter token do Supabase primeiro
      if (typeof window !== 'undefined') {
        const { supabase } = await import('./supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          return session.access_token;
        }
      }
      
      // Fallback para API Key se configurada
      return this.config.apiKey || null;
    } catch (error) {
      console.warn('Erro ao obter token de autenticação:', error);
      return this.config.apiKey || null;
    }
  }

  /**
   * Faz uma requisição para o backend com retry automático
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const isAvailable = await this.checkBackendHealth();
    const candidates: string[] = [];
    if (isAvailable && this.config.baseUrl) {
      candidates.push(this.config.baseUrl);
    }
    if (this.internalBaseUrl) {
      candidates.push(this.internalBaseUrl);
    }
    if (typeof window !== 'undefined') {
      candidates.push('');
    }

    let lastError: Error | null = null;

    for (const base of candidates) {
      const url = `${base}${endpoint}`;
      for (let attempt = 1; attempt <= this.config.retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
          const authToken = await this.getAuthToken();
          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'SOFIA-Frontend/1.0',
              ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
              ...options.headers
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          return data;
        } catch (error) {
          lastError = error as Error;
          if (attempt < this.config.retries) {
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
          }
        }
      }
    }

    throw lastError || new Error('Backend não disponível e fallback indisponível');
  }

  // === SINAIS ===

  /**
   * Busca sinais recentes do backend
   */
  async getRecentSignals(params: {
    table_id?: string;
    limit?: number;
    confidence_min?: number;
  } = {}): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params.table_id) queryParams.append('table_id', params.table_id);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.confidence_min) queryParams.append('confidence_min', params.confidence_min.toString());

    const endpoint = `/api/signals/recent${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  /**
   * Busca histórico de sinais do backend
   */
  async getSignalsHistory(params: {
    table_id?: string;
    strategy?: string;
    confidence_min?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    const endpoint = `/api/signals/history${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // === KPIs ===

  /**
   * Busca KPIs de estratégias do backend
   */
  async getKpisEstrategias(tableId?: string): Promise<ApiResponse> {
    const params = tableId ? `?table_id=${tableId}` : '';
    return this.makeRequest(`/api/kpis-estrategias${params}`);
  }

  // === HISTÓRICO DE ROLETA ===

  /**
   * Busca histórico de giros da roleta
   */
  async getRouletteHistory(params: {
    table_id?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    const endpoint = `/api/roulette-history${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // === STATUS DAS ROLETAS ===

  /**
   * Busca status das roletas
   */
  async getRouletteStatus(): Promise<ApiResponse> {
    return this.makeRequest('/api/roulette-status');
  }

  // === PREFERÊNCIAS DO USUÁRIO ===

  /**
   * Busca preferências do usuário
   */
  async getUserPreferences(): Promise<ApiResponse> {
    return this.makeRequest('/api/user-preferences');
  }

  /**
   * Salva preferências do usuário
   */
  async saveUserPreferences(preferences: any): Promise<ApiResponse> {
    return this.makeRequest('/api/user-preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  }

  // === OPÇÕES DISPONÍVEIS ===

  /**
   * Busca opções disponíveis (estratégias, mesas, etc.)
   */
  async getAvailableOptions(): Promise<ApiResponse> {
    return this.makeRequest('/api/available-options');
  }

  // === DESCRIÇÕES DE ESTRATÉGIAS ===

  /**
   * Busca descrições das estratégias
   */
  async getStrategyDescriptions(params: {
    strategy?: string;
    category?: string;
    risk?: string;
    chips?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    const endpoint = `/api/strategy-descriptions${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // === MESAS DE ROLETA ===

  /**
   * Busca lista de mesas de roleta
   */
  async getRouletteTables(): Promise<ApiResponse> {
    return this.makeRequest('/api/roulette-tables');
  }

  // === UTILITÁRIOS ===

  /**
   * Verifica saúde do backend
   */
  async healthCheck(): Promise<any> {
    return this.makeRequest('/health', {
      method: 'GET'
    });
  }

  /**
   * Verifica se o backend está disponível (método público)
   */
  async isAvailable(): Promise<boolean> {
    return this.checkBackendHealth();
  }

  /**
   * Força uma nova verificação de saúde do backend
   */
  async forceHealthCheck(): Promise<boolean> {
    this.lastHealthCheck = 0;
    return this.checkBackendHealth();
  }

  /**
   * Obtém configurações atuais
   */
  getConfig(): BackendConfig {
    return { ...this.config };
  }
}

// Instância singleton
export const backendService = new BackendService();

// Tipos para exportação
export type { ApiResponse, BackendConfig };
