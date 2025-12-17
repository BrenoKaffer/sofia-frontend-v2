/**
 * Cliente HTTP para consumo das APIs do SOFIA (Server-side)
 * Para uso em Server Components e API Routes
 * Integrado com sistema de autenticação personalizado server-side
 */

import { auth } from '@/lib/auth-server';

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

class ApiClientServer {
  private baseUrl: string;
  private publicBaseUrl: string;
  private apiKey?: string;
  private defaultTimeout = 10000;
  private defaultRetries = 3;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    this.publicBaseUrl = process.env.NEXT_PUBLIC_PUBLIC_API_URL || '/api/public';
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

  /**
   * Obter token de autenticação do sistema personalizado (server-side)
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const authResult = await auth();
      if (authResult && authResult.isAuthenticated && authResult.session) {
        return authResult.session.access_token;
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter token de autenticação:', error);
      return null;
    }
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
    
    return this.makeRequest(`${this.baseUrl}/recent-signals?${params}`);
  }

  /**
   * Buscar preferências do usuário
   */
  async getUserPreferences() {
    return this.makeRequest(`${this.baseUrl}/user-preferences`);
  }

  /**
   * Atualizar preferências do usuário
   */
  async updateUserPreferences(preferences: any) {
    return this.makeRequest(`${this.baseUrl}/user-preferences`, {
      method: 'PUT',
      body: preferences
    });
  }
}

// Instância singleton do cliente API server
export const apiClientServer = new ApiClientServer();

// Exportar tipos para uso em outros arquivos
export type { ApiResponse, RequestConfig };