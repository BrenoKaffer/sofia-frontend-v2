/**
 * Cliente HTTP para comunicação com o Backend SOFIA
 * Conecta com o servidor Express.js do SOFIA em localhost:3001
 */

interface SofiaApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

interface SofiaRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

class SofiaBackendClient {
  private baseUrl: string;
  private wsUrl: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor() {
    // Usar variáveis de ambiente ou fallback para desenvolvimento
    const backendUrl = process.env.SOFIA_BACKEND_URL;
    const backendWsUrl = process.env.SOFIA_BACKEND_WS_URL;
    this.baseUrl = backendUrl ? backendUrl : '';
    this.wsUrl = backendWsUrl ? backendWsUrl : '';
    this.timeout = parseInt(process.env.SOFIA_API_TIMEOUT || '30000');
    this.retries = parseInt(process.env.SOFIA_API_RETRIES || '3');
    this.retryDelay = parseInt(process.env.SOFIA_API_RETRY_DELAY || '1000');
  }

  private async makeRequest<T>(
    endpoint: string,
    config: SofiaRequestConfig = {}
  ): Promise<SofiaApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      retries = this.retries
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    };

    // Adicionar token de autenticação se disponível
    const token = await this.getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
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
        console.log(`🔄 [SOFIA API] ${method} ${url} (tentativa ${attempt + 1}/${retries + 1})`);
        
        const response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ [SOFIA API] ${method} ${url} - Sucesso`);
        
        return {
          data,
          success: true,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ [SOFIA API] ${method} ${url} - Erro: ${lastError.message}`);
        
        // Não fazer retry em erros 4xx (exceto 429 - Rate Limit)
        if (error instanceof Error && error.message.includes('HTTP 4') && !error.message.includes('429')) {
          break;
        }

        // Aguardar antes do próximo retry (exponential backoff)
        if (attempt < retries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.log(`⏳ [SOFIA API] Aguardando ${delay}ms antes do próximo retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    clearTimeout(timeoutId);
    return {
      data: null as T,
      success: false,
      error: lastError.message,
      timestamp: new Date().toISOString()
    };
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Integração com Supabase para obter token
      if (typeof window !== 'undefined') {
        const { supabase } = await import('./supabase');
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
      }
      return null;
    } catch (error) {
      console.warn('Erro ao obter token de autenticação:', error);
      return null;
    }
  }

  // === HEALTH CHECK ===
  async healthCheck() {
    return this.makeRequest<{
      status: string;
      uptime: number;
      memory: any;
      version: string;
      services: Record<string, string>;
    }>('/api/public/system/health');
  }

  // === PROCESSAMENTO DE SPINS ===
  async sendSpinEvent(spinData: {
    number: number;
    table_id: string;
    timestamp?: string;
    color?: string;
    is_even?: boolean;
    is_high?: boolean;
    dozen?: string;
    column_type?: string;
  }) {
    return this.makeRequest('/new-spin-event', {
      method: 'POST',
      body: spinData
    });
  }

  // === KPIS E MÉTRICAS ===
  async getKpisEstrategias(params?: {
    strategy_name?: string;
    table_id?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const endpoint = `/api/kpis-estrategias${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // === HISTÓRICO DA ROLETA ===
  async getRouletteHistory(params?: {
    table_id?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    
    const endpoint = `/api/roulette-history${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // === HISTÓRICO DE SINAIS ===
  async getSignalsHistory(params?: {
    strategy_name?: string;
    table_id?: string;
    confidence_level?: string;
    is_validated?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    
    const endpoint = `/api/signals-history${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // === PREFERÊNCIAS DO USUÁRIO ===
  async getUserPreferences() {
    return this.makeRequest('/api/user-preferences');
  }

  async saveUserPreferences(preferences: Record<string, any>) {
    return this.makeRequest('/api/user-preferences', {
      method: 'POST',
      body: preferences
    });
  }

  // === OPÇÕES DISPONÍVEIS ===
  async getAvailableOptions() {
    return this.makeRequest('/api/available-options');
  }

  // === ESTRATÉGIAS ===
  async getAllStrategies() {
    return this.makeRequest('/api/all-strategies');
  }

  async getStrategyDescriptions(params?: {
    strategy?: string;
    category?: string;
    risk?: string;
    chips?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const endpoint = `/api/strategy-descriptions${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  // === MACHINE LEARNING ===
  async initializeML() {
    return this.makeRequest('/api/ml/initialize', {
      method: 'POST'
    });
  }

  async getMLPredictions(tableId: string, limit?: number) {
    const queryParams = new URLSearchParams();
    queryParams.append('table_id', tableId);
    if (limit) queryParams.append('limit', limit.toString());
    
    return this.makeRequest(`/api/ml/predictions?${queryParams}`);
  }

  async getMLStatus() {
    return this.makeRequest('/api/ml/status');
  }

  async retrainML() {
    return this.makeRequest('/api/ml/retrain', {
      method: 'POST'
    });
  }

  // === WEBSOCKET CONNECTION ===
  createWebSocketConnection(onMessage?: (data: any) => void, onError?: (error: Event) => void) {
    try {
      const ws = new WebSocket(this.wsUrl);
      
      ws.onopen = () => {
        console.log('✅ [SOFIA WebSocket] Conectado ao backend');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [SOFIA WebSocket] Mensagem recebida:', data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error('❌ [SOFIA WebSocket] Erro ao parsear mensagem:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ [SOFIA WebSocket] Erro de conexão:', error);
        if (onError) onError(error);
      };
      
      ws.onclose = () => {
        console.log('🔌 [SOFIA WebSocket] Conexão fechada');
      };
      
      return ws;
    } catch (error) {
      console.error('❌ [SOFIA WebSocket] Erro ao criar conexão:', error);
      return null;
    }
  }
}

// Instância singleton do cliente
export const sofiaBackendClient = new SofiaBackendClient();
export default sofiaBackendClient;