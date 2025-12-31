/**
 * Cliente HTTP para consumo das APIs do SOFIA
 * Centraliza todas as chamadas de API com tratamento de erro e retry logic
 * Integrado com sistema de autenticação personalizado (client-side)
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
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private publicBaseUrl: string;
  private apiKey?: string;
  private defaultTimeout = 10000;
  private defaultRetries = 3;

  constructor() {
    // Configuração: preferir URLs definidas via env, com fallback para rotas internas /api
    const explicitApiBase = process.env.NEXT_PUBLIC_API_BASE_URL; // e.g., http://localhost:3002/api
    const sofiaBackendUrl = process.env.SOFIA_BACKEND_URL; // e.g., http://localhost:3001

    if (explicitApiBase) {
      this.baseUrl = explicitApiBase;
      // Se terminar com /api, usar /api/public; caso contrário, anexar /public
      this.publicBaseUrl = explicitApiBase.endsWith('/api')
        ? `${explicitApiBase}/public`
        : `${explicitApiBase}/public`;
    } else if (sofiaBackendUrl) {
      this.baseUrl = `${sofiaBackendUrl}/api`;
      this.publicBaseUrl = `${sofiaBackendUrl}/api/public`;
    } else {
      // Fallback para roteamento interno do Next.js em desenvolvimento
      this.baseUrl = `/api`;
      this.publicBaseUrl = `/api/public`;
    }
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

    // Adicionar API Key se disponível para endpoints públicos
    if (this.apiKey && url.includes('/public/')) {
      requestHeaders['X-API-Key'] = this.apiKey;
    }

    // Adicionar token de autenticação para endpoints privados
    if (!url.includes('/public/')) {
      const token = await this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
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
  async getKpisEstrategias(tableId?: string, strategyName?: string, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (tableId) params.append('table_id', tableId);
    if (strategyName) params.append('strategy_name', strategyName);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    
    const queryString = params.toString();
    return this.makeRequest(`${this.baseUrl}/kpis-estrategias${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Buscar histórico de giros da roleta
   */
  async getRouletteHistory(tableId?: string, limit = 50, offset = 0, dateFrom?: string, dateTo?: string) {
    const params = new URLSearchParams();
    if (tableId) params.append('table_id', tableId);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    
    return this.makeRequest(`${this.baseUrl}/roulette-history?${params}`);
  }

  /**
   * Buscar status das roletas
   */
  async getRouletteStatus(tableId?: string) {
    const params = new URLSearchParams();
    if (tableId) params.append('table_id', tableId);
    const queryString = params.toString();
    return this.makeRequest(`${this.baseUrl}/roulette-status${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Buscar sinais recentes (histórico de sinais)
   */
  async getRecentSignals(tableId?: string, limit = 20, confidenceMin?: number) {
    const params = new URLSearchParams();
    if (tableId) params.append('table_id', tableId);
    params.append('limit', limit.toString());
    if (confidenceMin) params.append('confidence_level', confidenceMin.toString());
    
    return this.makeRequest(`${this.baseUrl}/signals-history?${params}`);
  }

  /**
   * Buscar sinais recentes do backend (rota específica /signals/recent)
   */
  async getSignalsRecent(tableId?: string, limit = 20, confidenceMin?: number) {
    const params = new URLSearchParams();
    if (tableId) params.append('table_id', tableId);
    params.append('limit', limit.toString());
    if (confidenceMin) params.append('confidence_min', confidenceMin.toString());
    return this.makeRequest(`${this.baseUrl}/signals/recent?${params.toString()}`);
  }

  // Método para buscar sinais de IA
  async getAISignals(params: {
    limit?: number;
    table_id?: string;
    strategy?: string;
    confidence_threshold?: number;
  } = {}) {
    const urlParams = new URLSearchParams();
    
    if (params.limit) urlParams.append('limit', params.limit.toString());
    if (params.table_id) urlParams.append('table_id', params.table_id);
    if (params.strategy) urlParams.append('strategy', params.strategy);
    if (params.confidence_threshold) urlParams.append('confidence_threshold', params.confidence_threshold.toString());
    
    const url = `/ai-signals${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
    return this.makeRequest(url, { method: 'GET' });
  }







  // Método para processar spin da roleta
  async processSpin(spinData: any) {
    return this.makeRequest('/process-spin', {
      method: 'POST',
      body: JSON.stringify(spinData)
    });
  }

  // === MÉTODOS DE AUTENTICAÇÃO ===

  // Login
  async login(credentials: {
    email: string;
    password: string;
    remember_me?: boolean;
  }): Promise<any> {
    return this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: credentials,
      skipAuth: true // Login não precisa de auth
    });
  }

  // Logout
  async logout(): Promise<any> {
    return this.makeRequest('/api/auth/logout', {
      method: 'POST'
    });
  }

  // Registro
  async register(userData: {
    email: string;
    password: string;
    confirm_password: string;
    name?: string;
  }): Promise<any> {
    return this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: userData,
      skipAuth: true // Registro não precisa de auth
    });
  }

  // Verificar sessão
  async checkSession(): Promise<any> {
    return this.makeRequest('/api/auth/session', {
      method: 'GET'
    });
  }

  // === MÉTODOS DE ADMINISTRAÇÃO DE USUÁRIOS ===

  // Listar usuários (admin)
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.role) queryParams.set('role', params.role);

    const url = `${this.baseUrl}/admin/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.makeRequest(url);
  }

  // Criar usuário (admin)
  async createUser(userData: {
    email: string;
    password: string;
    name?: string;
    role_id?: string;
  }): Promise<any> {
    return this.makeRequest(`${this.baseUrl}/admin/users`, {
      method: 'POST',
      body: userData
    });
  }

  // Atualizar usuário (admin)
  async updateUser(userData: {
    user_id: string;
    name?: string;
    role_id?: string;
    is_active?: boolean;
  }): Promise<any> {
    return this.makeRequest(`${this.baseUrl}/admin/users`, {
      method: 'PUT',
      body: userData
    });
  }

  // Deletar usuário (admin)
  async deleteUser(userId: string): Promise<any> {
    return this.makeRequest(`${this.baseUrl}/admin/users?user_id=${userId}`, {
      method: 'DELETE'
    });
  }

  // === MÉTODOS DE ADMINISTRAÇÃO DE ROLES ===

  // Listar roles (admin)
  async getRoles(includeUsers = false): Promise<any> {
    const url = `${this.baseUrl}/admin/roles${includeUsers ? '?include_users=true' : ''}`;
    return this.makeRequest(url);
  }

  // Criar role (admin)
  async createRole(roleData: {
    id: string;
    name: string;
    description?: string;
    level: number;
    permissions?: string[];
  }): Promise<any> {
    return this.makeRequest(`${this.baseUrl}/admin/roles`, {
      method: 'POST',
      body: roleData
    });
  }

  // Atualizar role (admin)
  async updateRole(roleData: {
    role_id: string;
    name?: string;
    description?: string;
    level?: number;
    permissions?: string[];
  }): Promise<any> {
    return this.makeRequest(`${this.baseUrl}/admin/roles`, {
      method: 'PUT',
      body: roleData
    });
  }

  // Deletar role (admin)
  async deleteRole(roleId: string): Promise<any> {
    return this.makeRequest(`${this.baseUrl}/admin/roles?role_id=${roleId}`, {
      method: 'DELETE'
    });
  }

  // ===== WEBSOCKET =====
  
  // Obter informações do WebSocket
  async getWebSocketInfo(): Promise<ApiResponse<{
    websocket_url: string;
    available_channels: string[];
    current_stats: any;
    connection_info: any;
  }>> {
    return this.makeRequest(`${this.baseUrl}/websocket`);
  }

  // Enviar mensagem via WebSocket (admin only)
  async sendWebSocketMessage(data: {
    channel: string;
    data: any;
    target_user?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest(`${this.baseUrl}/websocket`, {
      method: 'POST',
      body: data
    });
  }

  // Broadcast para todos os usuários conectados (admin only)
  async broadcastMessage(channel: string, data: any): Promise<ApiResponse<{ message: string }>> {
    return this.sendWebSocketMessage({ channel, data });
  }

  // Enviar notificação para usuário específico (admin only)
  async sendUserNotification(userId: string, notification: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    action?: { label: string; url: string };
  }): Promise<ApiResponse<{ message: string }>> {
    return this.sendWebSocketMessage({
      channel: 'user_notifications',
      data: {
        id: `notif_${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
      },
      target_user: userId
    });
  }

  // Enviar alerta do sistema (admin only)
  async sendSystemAlert(alert: {
    level: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    affectedSystems?: string[];
  }): Promise<ApiResponse<{ message: string }>> {
    return this.sendWebSocketMessage({
      channel: 'system_status',
      data: {
        id: `alert_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'alert',
        ...alert
      }
    });
  }

  /**
   * Buscar todas as estratégias disponíveis
   */
  async getAllStrategies() {
    return this.makeRequest(`${this.baseUrl}/all-strategies`);
  }



  /**
   * Buscar opções disponíveis (mesas, estratégias, etc.)
   */
  async getAvailableOptions() {
    return this.makeRequest(`${this.baseUrl}/available-options`);
  }

  /**
   * Resolver seleção de números (neighbors, setorDominante, etc.)
   * input: payload de contexto ou sinal do Builder/estratégia
   * spinsHistory: opcional, histórico de giros; se ausente, usar table_id
   */
  async resolveActionSelection(input: any, spinsHistory?: any[], options?: { table_id?: string; limit?: number }) {
    const body = {
      input,
      spinsHistory,
      table_id: options?.table_id,
      limit: options?.limit
    };
    return this.makeRequest(`${this.baseUrl}/action-resolver`, {
      method: 'POST',
      body
    });
  }

  /**
   * Buscar preferências do usuário
   */
  async getUserPreferences() {
    return this.makeRequest(`${this.baseUrl}/user-preferences`);
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
      method: 'POST',
      body: preferences
    });
  }

  /**
   * Buscar histórico de sinais com filtros
   */
  async getSignalsHistory(filters: {
    table_id?: string;
    strategy_name?: string;
    confidence_level?: number;
    is_validated?: boolean;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    return this.makeRequest(`${this.baseUrl}/signals-history?${params}`);
  }

  // === Processamento de Spins ===

  /**
   * Enviar novo spin da roleta para processamento
   */
  async processNewSpin(spinData: {
    number: number;
    table_id: string;
    timestamp?: string;
    color?: string;
    sector?: string;
  }) {
    return this.makeRequest('/new-spin-event', {
      method: 'POST',
      body: JSON.stringify(spinData)
    });
  }

  /**
   * Buscar histórico da roleta com filtros avançados
   */
  async getRouletteHistoryAdvanced(filters: {
    table_id?: string;
    limit?: number;
    offset?: number;
    date_from?: string;
    date_to?: string;
    number_filter?: number;
    color_filter?: string;
  } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    return this.makeRequest(`${this.baseUrl}/roulette-history-advanced?${params}`);
  }

  // === APIs de Machine Learning ===

  /**
   * Inicializar sistema de Machine Learning
   */
  async initializeML() {
    return this.makeRequest(`${this.baseUrl}/ml/initialize`, {
      method: 'POST'
    });
  }

  /**
   * Buscar predições do sistema ML
   */
  async getMLPredictions(tableId: string, limit = 10) {
    const params = new URLSearchParams();
    params.append('table_id', tableId);
    params.append('limit', limit.toString());
    
    return this.makeRequest(`${this.baseUrl}/ml/predictions?${params}`);
  }

  /**
   * Buscar status do sistema ML
   */
  async getMLStatus() {
    return this.makeRequest(`${this.baseUrl}/ml/status`);
  }

  /**
   * Retreinar sistema ML
   */
  async retrainML() {
    return this.makeRequest(`${this.baseUrl}/ml/retrain`, {
      method: 'POST'
    });
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
   * Health check direto do sistema
   */
  async getSystemHealth() {
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
   * Obter token de autenticação do sistema personalizado (client-side only)
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // Para uso no cliente (Client Components)
      if (typeof window !== 'undefined') {
        // Buscar token do localStorage ou contexto de autenticação
        const token = localStorage.getItem('auth_token');
        return token;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter token de autenticação:', error);
      return null;
    }
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

  // Métodos públicos para HTTP
  async get<T>(url: string, config?: Omit<RequestConfig, 'method'>) {
    return this.makeRequest<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.makeRequest<T>(url, { ...config, method: 'POST', body });
  }

  async put<T>(url: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.makeRequest<T>(url, { ...config, method: 'PUT', body });
  }

  async delete<T>(url: string, config?: Omit<RequestConfig, 'method'>) {
    return this.makeRequest<T>(url, { ...config, method: 'DELETE' });
  }
}

// Instância singleton do cliente API
export const apiClient = new ApiClient();

// Exportar tipos para uso em outros arquivos
export type { ApiResponse, RequestConfig };
export type { ApiClient };