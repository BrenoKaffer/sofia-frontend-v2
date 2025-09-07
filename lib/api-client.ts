/**
 * Cliente HTTP para consumo das APIs do SOFIA
 * Centraliza todas as chamadas de API com tratamento de erro e retry logic
 */

interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

class ApiClient {
  private baseUrl: string;
  private publicBaseUrl: string;
  private apiKey?: string;
  private defaultTimeout = 10000;
  private defaultRetries = 3;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    this.publicBaseUrl = process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'http://localhost:3001/api/public';
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY;
  }

  private async makeRequest<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries
    } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Adicionar API Key se disponível
    if (this.apiKey && url.includes('/public/')) {
      requestHeaders['X-API-Key'] = this.apiKey;
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: controller.signal
    };

    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    let lastError: Error = new Error('Erro desconhecido');

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          data,
          success: true
        };
      } catch (error) {
        lastError = error as Error;
        
        // Não fazer retry em erros 4xx (exceto 429 - Rate Limit)
        if (error instanceof Error && error.message.includes('HTTP 4') && !error.message.includes('429')) {
          break;
        }

        // Aguardar antes do próximo retry (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    clearTimeout(timeoutId);
    return {
      data: null as T,
      success: false,
      error: lastError.message
    };
  }

  // === APIs Principais do Backend ===

  /**
   * Buscar KPIs de performance das estratégias
   */
  async getKpisEstrategias(tableId?: string) {
    const params = tableId ? `?table_id=${tableId}` : '';
    return this.makeRequest(`${this.baseUrl}/kpis-estrategias${params}`);
  }

  /**
   * Buscar histórico de giros da roleta
   */
  async getRouletteHistory(tableId?: string, limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (tableId) params.append('table_id', tableId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    return this.makeRequest(`${this.baseUrl}/roulette-history?${params}`);
  }

  /**
   * Buscar sinais recentes
   */
  async getRecentSignals(tableId?: string, limit = 20, confidenceMin?: number) {
    const params = new URLSearchParams();
    if (tableId) params.append('table_id', tableId);
    params.append('limit', limit.toString());
    if (confidenceMin) params.append('confidence_min', confidenceMin.toString());
    
    return this.makeRequest(`${this.baseUrl}/signals/recent?${params}`);
  }

  /**
   * Buscar atributos de sinais (para filtros)
   */
  async getSignalAttributes() {
    return this.makeRequest(`${this.baseUrl}/signal-attributes`);
  }

  /**
   * Buscar preferências do usuário
   */
  async getUserPreferences() {
    return this.makeRequest(`${this.baseUrl}/user-preferences`, {
      headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    });
  }

  /**
   * Salvar/atualizar preferências do usuário
   */
  async updateUserPreferences(preferences: {
    selected_strategies?: string[];
    selected_tables?: string[];
    notification_settings?: any;
    dashboard_layout?: any;
  }) {
    return this.makeRequest(`${this.baseUrl}/user-preferences`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.getAuthToken()}` },
      body: preferences
    });
  }

  /**
   * Buscar configurações disponíveis
   */
  async getAvailableOptions() {
    return this.makeRequest(`${this.baseUrl}/available-options`);
  }

  /**
   * Buscar histórico de sinais com filtros
   */
  async getSignalsHistory(filters: {
    table_id?: string;
    strategy?: string;
    confidence_min?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    return this.makeRequest(`${this.baseUrl}/signals/history?${params}`);
  }

  // === API Pública ===

  /**
   * Listar sinais recentes (API Pública)
   */
  async getPublicSignals(tableId?: string, limit = 20, confidence?: number) {
    const params = new URLSearchParams();
    if (tableId) params.append('table_id', tableId);
    params.append('limit', limit.toString());
    if (confidence) params.append('confidence', confidence.toString());
    
    return this.makeRequest(`${this.publicBaseUrl}/signals?${params}`);
  }

  /**
   * Detalhes de um sinal específico (API Pública)
   */
  async getPublicSignalDetails(signalId: string) {
    return this.makeRequest(`${this.publicBaseUrl}/signals/${signalId}`);
  }

  /**
   * Listar mesas disponíveis (API Pública)
   */
  async getPublicTables() {
    return this.makeRequest(`${this.publicBaseUrl}/tables`);
  }

  /**
   * Status de uma mesa específica (API Pública)
   */
  async getPublicTableStatus(tableId: string) {
    return this.makeRequest(`${this.publicBaseUrl}/tables/${tableId}/status`);
  }

  /**
   * Últimos spins de uma mesa (API Pública)
   */
  async getPublicTableSpins(tableId: string) {
    return this.makeRequest(`${this.publicBaseUrl}/tables/${tableId}/spins`);
  }

  /**
   * Estatísticas gerais do sistema (API Pública)
   */
  async getPublicGeneralStats() {
    return this.makeRequest(`${this.publicBaseUrl}/stats/general`);
  }

  /**
   * Performance das estratégias (API Pública)
   */
  async getPublicStrategiesStats(tableId?: string, period?: string) {
    const params = new URLSearchParams();
    if (tableId) params.append('table_id', tableId);
    if (period) params.append('period', period);
    
    return this.makeRequest(`${this.publicBaseUrl}/stats/strategies?${params}`);
  }

  /**
   * Predições recentes (API Pública)
   */
  async getPublicRecentPredictions(tableId?: string, type?: string, limit = 10) {
    const params = new URLSearchParams();
    if (tableId) params.append('table_id', tableId);
    if (type) params.append('type', type);
    params.append('limit', limit.toString());
    
    return this.makeRequest(`${this.publicBaseUrl}/predictions/recent?${params}`);
  }

  /**
   * Solicitar nova predição (API Pública)
   */
  async requestPublicPrediction(data: {
    table_id: string;
    spins: number[];
    prediction_type: string;
  }) {
    return this.makeRequest(`${this.publicBaseUrl}/predictions/request`, {
      method: 'POST',
      body: data
    });
  }

  /**
   * Listar estratégias disponíveis (API Pública)
   */
  async getPublicStrategies() {
    return this.makeRequest(`${this.publicBaseUrl}/strategies`);
  }

  /**
   * Performance de uma estratégia (API Pública)
   */
  async getPublicStrategyPerformance(strategyId: string, period?: string, tableId?: string) {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (tableId) params.append('table_id', tableId);
    
    return this.makeRequest(`${this.publicBaseUrl}/strategies/${strategyId}/performance?${params}`);
  }

  /**
   * Health check da API (API Pública)
   */
  async getPublicSystemHealth() {
    return this.makeRequest(`${this.publicBaseUrl}/system/health`);
  }

  /**
   * Estatísticas de uso da API (API Pública)
   */
  async getPublicSystemUsage() {
    return this.makeRequest(`${this.publicBaseUrl}/system/usage`);
  }

  /**
   * Buscar descrições de estratégias
   */
  async getStrategyDescriptions(filters: {
    strategy?: string;
    category?: string;
    risk?: string;
    chips?: number;
  } = {}) {
    const params = new URLSearchParams();
    if (filters.strategy) params.append('strategy', filters.strategy);
    if (filters.category) params.append('category', filters.category);
    if (filters.risk) params.append('risk', filters.risk);
    if (filters.chips) params.append('chips', filters.chips.toString());
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/strategy-descriptions${queryString ? `?${queryString}` : ''}`;
    return this.makeRequest(url);
  }

  // === Métodos Auxiliares ===

  /**
   * Obter token de autenticação (implementar conforme sistema de auth)
   */
  private getAuthToken(): string {
    // TODO: Implementar lógica de obtenção do token
    // Pode ser do localStorage, cookies, context, etc.
    return localStorage.getItem('auth_token') || '';
  }

  /**
   * Definir API Key
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Definir URLs base
   */
  setBaseUrls(baseUrl: string, publicBaseUrl: string) {
    this.baseUrl = baseUrl;
    this.publicBaseUrl = publicBaseUrl;
  }
}

// Instância singleton do cliente API
export const apiClient = new ApiClient();

// Exportar tipos para uso em outros arquivos
export type { ApiResponse, RequestConfig };