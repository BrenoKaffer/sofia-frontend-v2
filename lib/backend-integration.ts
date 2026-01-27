/**
 * Serviço de Integração com Backend SOFIA
 * Implementa fallback para dados mock quando o backend não está disponível
 */

import { apiClient } from './api-client';
import { sendFallbackAlertEmail } from './email';

interface BackendStatus {
  isAvailable: boolean;
  lastCheck: number;
  error?: string;
}

class BackendIntegration {
  private status: BackendStatus = {
    isAvailable: false,
    lastCheck: 0
  };
  
  private checkInterval = 30000; // 30 segundos
  private useMockFallback = process.env.USE_MOCK_DATA === 'true';
  private fallbackActive = false;
  private lastFallbackAlertAt = 0;
  private fallbackAlertMinIntervalMs = 15 * 60 * 1000;

  private triggerFallbackAlert(reason: string, error?: unknown) {
    if (!this.useMockFallback) return;

    const now = Date.now();
    if (now - this.lastFallbackAlertAt < this.fallbackAlertMinIntervalMs) {
      this.fallbackActive = true;
      return;
    }

    if (!this.fallbackActive) {
      this.fallbackActive = true;
    }

    this.lastFallbackAlertAt = now;

    const backendUrl =
      process.env.SOFIA_BACKEND_URL ||
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:3001';

    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : this.status.error || undefined;

    void sendFallbackAlertEmail({
      reason,
      error: errorMessage || null,
      backendUrl,
      occurredAt: new Date(now).toISOString(),
    }).catch((err) => {
      console.warn('Falha ao enviar email de fallback:', err);
    });
  }

  constructor() {
    this.checkBackendHealth();
    // Verificar saúde do backend periodicamente
    setInterval(() => this.checkBackendHealth(), this.checkInterval);
  }

  /**
   * Verifica se o backend está disponível
   */
  async checkBackendHealth(): Promise<boolean> {
    const wasAvailable = this.status.isAvailable;
    try {
      const response = await apiClient.getSystemHealth();
      this.status = {
        isAvailable: response.success,
        lastCheck: Date.now(),
        error: response.error
      };
      
      if (response.success) {
        if (!wasAvailable) {
          this.fallbackActive = false;
        }
        console.log('✅ Backend SOFIA conectado com sucesso');
      } else {
        this.triggerFallbackAlert('Health check falhou', response.error);
      }
      
      return response.success;
    } catch (error) {
      this.status = {
        isAvailable: false,
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      console.warn('⚠️ Backend SOFIA não disponível, usando dados mock:', error);
      this.triggerFallbackAlert('Backend SOFIA indisponível (exceção no health check)', error);
      return false;
    }
  }

  /**
   * Buscar KPIs com fallback para mock
   */
  async getKPIs(tableId?: string, strategyName?: string, dateFrom?: string, dateTo?: string) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getKpisEstrategias(tableId, strategyName, dateFrom, dateTo);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar KPIs do backend, usando mock:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockKPIs(), 'Erro ao buscar KPIs');
  }



  /**
   * Buscar sinais de IA com fallback para mock
   */
  async getAISignals(tableId?: string, signalType = 'all', confidence = 0.7, limit = 10) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getAISignals({
          table_id: tableId,
          strategy: signalType,
          confidence_threshold: confidence,
          limit: limit
        });
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar sinais de IA do backend, usando mock:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockAISignals(tableId, signalType, confidence, limit), 'Erro ao buscar sinais de IA');
  }

  /**
   * Buscar sinais recentes com fallback para mock
   */
  async getRecentSignals(tableId?: string, limit = 20, confidenceMin?: number) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getRecentSignals(tableId, limit, confidenceMin);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar sinais do backend, usando mock:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockSignals(limit), 'Erro ao buscar sinais recentes');
  }

  /**
   * Buscar estratégias disponíveis com fallback para mock
   */
  async getAllStrategies() {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getAllStrategies();
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar estratégias do backend, usando mock:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockStrategies(), 'Erro ao buscar estratégias disponíveis');
  }



  /**
   * Salvar preferências do usuário
   */
  async updateUserPreferences(preferences: any) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.updateUserPreferences(preferences);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao salvar preferências no backend:', error);
      }
    }

    // Simular sucesso para desenvolvimento
    return {
      success: true,
      data: preferences,
      message: 'Preferências salvas localmente (modo mock)'
    };
  }

  /**
   * Buscar descrições das estratégias com fallback para mock
   */
  async getStrategyDescriptions(strategy?: string, category?: string, risk?: string, chips?: number) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getStrategyDescriptions({ strategy, category, risk, chips });
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar descrições das estratégias do backend, usando mock:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockStrategyDescriptions(), 'Erro ao buscar descrições das estratégias');
  }

  /**
   * Buscar opções disponíveis com fallback para mock
   */
  async getAvailableOptions() {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getAvailableOptions();
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar opções disponíveis do backend, usando mock:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockAvailableOptions(), 'Erro ao buscar opções disponíveis');
  }

  /**
   * Processar novo spin da roleta
   */
  async processNewSpin(spinData: any) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.processNewSpin(spinData);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao processar spin no backend:', error);
      }
    }

    // Simular processamento para desenvolvimento
    return {
      success: true,
      data: { processed: true, signals_generated: Math.floor(Math.random() * 3) },
      message: 'Spin processado localmente (modo mock)'
    };
  }

  /**
   * Buscar histórico da roleta com fallback para mock
   */
  async getRouletteHistory(tableId?: string, limit = 50, offset = 0, dateFrom?: string, dateTo?: string) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getRouletteHistory(tableId, limit, offset, dateFrom, dateTo);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar histórico da roleta do backend, usando mock:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockRouletteHistory(limit, offset), 'Erro ao buscar histórico da roleta');
  }

  /**
   * Buscar predições do sistema ML com fallback para mock
   */
  async getMLPredictions(tableId: string, limit = 10) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getMLPredictions(tableId, limit);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar predições ML do backend, usando mock:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockMLPredictions(limit), 'Erro ao buscar predições de ML');
  }

  /**
   * Buscar status do sistema ML com fallback para mock
   */
  async getMLStatus() {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getMLStatus();
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar status ML do backend, usando mock:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockMLStatus(), 'Erro ao buscar status do ML');
  }

  // === FUNÇÃO AUXILIAR PARA FALLBACK ===
  
  private handleMockFallback<T>(mockMethod: () => T, errorMessage: string): T {
    if (this.useMockFallback) {
      this.triggerFallbackAlert(errorMessage);
      return mockMethod();
    }
    throw new Error(`${errorMessage} - Backend indisponível e dados mock desabilitados`);
  }

  // === MÉTODOS MOCK ===

  private getMockKPIs() {
    return {
      success: true,
      data: {
        total_signals: 1247,
        successful_signals: 892,
        success_rate: 71.5,
        total_profit: 15420.50,
        avg_confidence: 78.3,
        strategies_performance: [
          { name: 'Irmãos SOFIA', success_rate: 73.2, profit: 4250.30 },
          { name: 'Puxador de Terminais SOFIA', success_rate: 69.8, profit: 3890.20 },
          { name: 'Espelhos SOFIA', success_rate: 75.1, profit: 4180.75 }
        ]
      },
      message: 'Dados mock - KPIs'
    };
  }

  private getMockRouletteHistory(limit: number, offset: number) {
    const mockSpins = Array.from({ length: limit }, (_, i) => ({
      id: offset + i + 1,
      number: Math.floor(Math.random() * 37),
      color: ['red', 'black', 'green'][Math.floor(Math.random() * 3)],
      timestamp: new Date(Date.now() - (i * 30000)).toISOString(),
      table_id: 'pragmatic-brazilian-roulette'
    }));

    return {
      success: true,
      data: mockSpins,
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: 100,
        total_items: 5000,
        returned_count: limit,
        items_per_page: limit
      },
      message: 'Dados mock - Histórico da roleta'
    };
  }

  private getMockSignals(limit: number) {
    const strategies = ['Irmãos de Cores', 'Terminais Pull', 'Espelho', 'Onda'];
    const mockSignals = Array.from({ length: limit }, (_, i) => ({
      id: i + 1,
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      confidence: Math.floor(Math.random() * 30) + 70,
      prediction: Math.floor(Math.random() * 37),
      timestamp: new Date(Date.now() - (i * 60000)).toISOString(),
      table_id: 'pragmatic-brazilian-roulette',
      is_validated: Math.random() > 0.3
    }));

    return {
      success: true,
      data: mockSignals,
      message: 'Dados mock - Sinais recentes'
    };
  }

  private getMockStrategies() {
    return {
      success: true,
      data: [
        'Irmãos de Cores',
        'Terminais Pull',
        'Espelho',
        'Onda',
        'As Dúzias (Atrasadas)',
        'Terminais que se Puxam',
        'Os Opostos',
        'Cavalo/Linha',
        'Sequência de Números',
        'Padrão Fibonacci'
      ],
      message: 'Dados mock - Estratégias disponíveis'
    };
  }

  private getMockUserPreferences() {
    return {
      success: true,
      data: {
        selected_strategies: ['Irmãos de Cores', 'Terminais Pull'],
        selected_tables: ['pragmatic-brazilian-roulette'],
        notification_settings: {
          email: true,
          push: true,
          sound: true
        },
        dashboard_layout: {
          show_kpis: true,
          show_signals: true,
          show_history: true
        }
      },
      message: 'Dados mock - Preferências do usuário'
    };
  }

  private getMockUserPreferencesById(userId: string) {
    return {
      success: true,
      data: {
        user_id: userId,
        selected_strategies: ['Irmãos de Cores', 'Terminais Pull'],
        selected_tables: ['pragmatic-brazilian-roulette'],
        notification_settings: {
          email: true,
          push: true,
          sound: true
        },
        dashboard_layout: {
          show_kpis: true,
          show_signals: true,
          show_history: true
        },
        betting: {
          max_bet: 100,
          min_bet: 1,
          auto_bet: false
        },
        display: {
          theme: 'dark',
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo'
        },
        updated_at: new Date().toISOString()
      },
      message: 'Dados mock - Preferências do usuário'
    };
  }

  private getMockUpdatePreferences(userId: string, preferences: any) {
    return {
      success: true,
      data: {
        user_id: userId,
        preferences: {
          ...preferences,
          updated_at: new Date().toISOString()
        }
      },
      message: 'Preferências atualizadas com sucesso (modo mock)'
    };
  }

  private getMockSpinProcessing(spinData: any) {
    const { number, color, table_id, strategies = [] } = spinData;
    
    // Simular análise de estratégias
    const strategyResults = strategies.map((strategy: string) => ({
      strategy,
      hit: Math.random() > 0.5,
      confidence: Math.random() * 100,
      recommendation: Math.random() > 0.7 ? 'bet' : 'wait',
      next_numbers: this.generateMockPredictions()
    }));

    return {
      success: true,
      data: {
        spin_id: `spin_${Date.now()}`,
        number,
        color,
        table_id,
        timestamp: new Date().toISOString(),
        strategies: strategyResults,
        statistics: {
          total_spins: Math.floor(Math.random() * 1000) + 100,
          hot_numbers: [7, 23, 17, 32, 5],
          cold_numbers: [13, 26, 0, 34, 3],
          recent_colors: ['red', 'black', 'red', 'red', 'black']
        },
        ai_analysis: {
          pattern_detected: Math.random() > 0.6,
          confidence: Math.random() * 100,
          recommendation: 'Aguardar próximo spin para confirmação de padrão'
        }
      },
      message: 'Spin processado com sucesso (modo mock)'
    };
  }

  private generateMockPredictions() {
    const predictions = [];
    for (let i = 0; i < 5; i++) {
      predictions.push({
        number: Math.floor(Math.random() * 37),
        probability: Math.random() * 100,
        confidence: Math.random() * 100
      });
    }
    return predictions.sort((a, b) => b.probability - a.probability);
  }

  private getMockProcessNewSpin(spinData: any) {
    return {
      success: true,
      data: {
        processed: true,
        spin_id: `spin_${Date.now()}`,
        predictions: {
          next_number_probability: Math.random(),
          hot_numbers: [7, 23, 17],
          cold_numbers: [2, 35, 14],
          pattern_detected: Math.random() > 0.7
        },
        timestamp: new Date().toISOString()
      },
      message: 'Spin processado com sucesso (mock)'
    };
  }

  private getMockStrategyDescriptions() {
    return {
      success: true,
      data: {
        'Irmãos SOFIA': {
          description: 'Estratégia baseada em gatilhos de irmãos (11, 22, 33) e vizinhos na roda',
          category: 'Números',
          risk: 'Médio',
          chips: '2-5',
          success_rate: 73.2,
          details: 'Ativa quando um número irmão aparece na janela recente e sugere um conjunto derivado'
        },
        'Puxador de Terminais SOFIA': {
          description: 'Estratégia focada em padrões de terminais (último dígito) em sequência recente',
          category: 'Números',
          risk: 'Alto',
          chips: '3-8',
          success_rate: 69.8,
          details: 'Deriva números por padrões de terminal e pode incluir vizinhos na roda'
        },
        'Espelhos SOFIA': {
          description: 'Estratégia baseada no número espelho (oposto diametral) do último giro',
          category: 'Posição',
          risk: 'Baixo',
          chips: '1-3',
          success_rate: 75.1,
          details: 'Deriva o espelho do último número e pode incluir vizinhos por raio'
        }
      },
      message: 'Dados mock - Descrições das estratégias'
    };
  }

  private getMockAvailableOptions() {
    return {
      success: true,
      data: {
        tables: [
          { id: 'pragmatic-brazilian-roulette', name: 'Pragmatic Brazilian Roulette', status: 'active' },
          { id: 'evolution-auto-roulette', name: 'Evolution Auto Roulette', status: 'active' },
          { id: 'playtech-premium-roulette', name: 'Playtech Premium Roulette', status: 'maintenance' }
        ],
        strategies: [
          'sofia-conexao-cores-v1',
          'sofia-irmaos-v1',
          'sofia-espelhos-v1',
          'sofia-ondas-v1',
          'sofia-puxador-terminais-v1',
          'sofia-duzias-atrasadas-v1',
          'sofia-terminais-que-se-puxam-v1',
          'sofia-opostos-v1',
          'sofia-cavalo-linha-v1',
          'sofia-sequencia-numeros-v1',
          'sofia-fibonacci-v1'
        ],
        confidence_levels: [60, 65, 70, 75, 80, 85, 90, 95],
        time_ranges: ['1h', '6h', '12h', '24h', '7d', '30d']
      },
      message: 'Dados mock - Opções disponíveis'
    };
  }

  private getMockMLPredictions(limit: number) {
    const predictions = Array.from({ length: limit }, (_, i) => ({
      id: i + 1,
      predicted_number: Math.floor(Math.random() * 37),
      confidence: Math.floor(Math.random() * 30) + 70,
      model_version: '2.1.0',
      features_used: ['last_10_spins', 'color_pattern', 'sector_analysis'],
      timestamp: new Date(Date.now() - (i * 120000)).toISOString(),
      table_id: 'pragmatic-brazilian-roulette'
    }));

    return {
      success: true,
      data: predictions,
      message: 'Dados mock - Predições ML'
    };
  }

  private getMockMLStatus() {
    return {
      success: true,
      data: {
        status: 'active',
        model_version: '2.1.0',
        last_training: '2024-01-15T10:30:00Z',
        accuracy: 78.5,
        predictions_today: 1247,
        successful_predictions: 892,
        models: {
          number_predictor: { status: 'active', accuracy: 76.2 },
          color_predictor: { status: 'active', accuracy: 82.1 },
          sector_predictor: { status: 'active', accuracy: 74.8 }
        },
        training_data: {
          total_spins: 125000,
          last_update: '2024-01-15T10:30:00Z',
          quality_score: 94.2
        }
      },
      message: 'Dados mock - Status do sistema ML'
    };
  }

  private getMockAISignals(tableId?: string, signalType?: string, confidence?: number, limit?: number) {
    const signalTypes = ['number', 'color', 'sector', 'pattern'];
    const mockSignals = Array.from({ length: limit || 10 }, (_, i) => ({
      id: i + 1,
      type: signalType === 'all' ? signalTypes[Math.floor(Math.random() * signalTypes.length)] : signalType,
      confidence: Math.max(confidence || 0.7, Math.random()),
      prediction: {
        number: Math.floor(Math.random() * 37),
        color: ['red', 'black', 'green'][Math.floor(Math.random() * 3)],
        sector: ['1-12', '13-24', '25-36'][Math.floor(Math.random() * 3)]
      },
      timestamp: new Date(Date.now() - (i * 30000)).toISOString(),
      table_id: tableId || 'pragmatic-brazilian-roulette',
      ai_model: 'neural_network_v2.1',
      features_analyzed: ['pattern_recognition', 'statistical_analysis', 'trend_detection']
    }));

    return {
      success: true,
      data: mockSignals,
      message: 'Dados mock - Sinais de IA'
    };
  }

  /**
   * Buscar status do backend
   */
  async getBackendStatus() {
    try {
      const startTime = Date.now();
      const response = await apiClient.getSystemHealth();
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          status: 'healthy',
          response_time: responseTime,
          version: (response.data as any)?.version || '1.0.0',
          uptime: (response.data as any)?.uptime || 'unknown'
        },
        message: 'Backend operacional'
      };
    } catch (error) {
      console.error('Backend não está respondendo:', error);
      return {
        success: false,
        data: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        message: 'Backend indisponível'
      };
    }
  }

  /**
   * Buscar preferências do usuário com fallback para mock
   */
  async getUserPreferences(userId: string) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getUserPreferences();
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar preferências do usuário do backend, usando mock:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockUserPreferencesById(userId), 'Erro ao buscar preferências do usuário por ID');
  }



  /**
   * Processar spin da roleta
   */
  async processSpin(spinData: any) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.processSpin(spinData);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao processar spin no backend:', error);
      }
    }

    // Fallback para processamento mock
    return this.getMockSpinProcessing(spinData);
  }

  /**
   * Obter status atual do backend
   */
  getStatus(): BackendStatus {
    return { ...this.status };
  }

  /**
   * Forçar verificação de saúde do backend
   */
  async forceHealthCheck(): Promise<boolean> {
    return this.checkBackendHealth();
  }

  /**
   * Método para login
   */
  async login(credentials: {
    email: string;
    password: string;
    remember_me?: boolean;
  }) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.login(credentials);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro no login do backend:', error);
      }
    }

    // Simular login para desenvolvimento
    return {
      success: true,
      data: {
        user: {
          id: 'user_123',
          email: credentials.email,
          name: 'Usuário Teste',
          role: 'user'
        },
        token: 'mock_token_123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Login realizado com sucesso (modo mock)'
    };
  }

  /**
   * Método para logout
   */
  async logout() {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.logout();
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro no logout do backend:', error);
      }
    }

    // Simular logout para desenvolvimento
    return {
      success: true,
      message: 'Logout realizado com sucesso (modo mock)'
    };
  }

  /**
   * Método para registro
   */
  async register(userData: {
    email: string;
    password: string;
    confirm_password: string;
    name?: string;
  }) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.register(userData);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro no registro do backend:', error);
      }
    }

    // Simular registro para desenvolvimento
    return {
      success: true,
      data: {
        user: {
          id: 'user_' + Date.now(),
          email: userData.email,
          name: userData.name || 'Novo Usuário',
          role: 'user'
        },
        token: 'mock_token_' + Date.now(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Registro realizado com sucesso (modo mock)'
    };
  }

  /**
   * Método para verificar status da sessão
   */
  async checkSession() {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.checkSession();
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao verificar sessão do backend:', error);
      }
    }

    // Simular verificação de sessão para desenvolvimento
    return {
      success: true,
      data: {
        authenticated: true,
        user: {
          id: 'user_123',
          email: 'usuario@teste.com',
          name: 'Usuário Teste',
          role: 'user'
        }
      },
      message: 'Sessão válida (modo mock)'
    };
  }

  /**
   * Métodos para administração de usuários (apenas admin)
   */
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getUsers(params);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar usuários do backend:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockUsers(params), 'Erro ao buscar usuários');
  }

  async createUser(userData: {
    email: string;
    password: string;
    name?: string;
    role_id?: string;
  }) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.createUser(userData);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao criar usuário no backend:', error);
      }
    }

    // Simular criação para desenvolvimento
    return {
      success: true,
      data: {
        user: {
          id: 'user_' + Date.now(),
          email: userData.email,
          name: userData.name || 'Novo Usuário',
          role_id: userData.role_id || 'user',
          created_at: new Date().toISOString()
        }
      },
      message: 'Usuário criado com sucesso (modo mock)'
    };
  }

  async updateUser(userData: {
    user_id: string;
    name?: string;
    role_id?: string;
    is_active?: boolean;
  }) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.updateUser(userData);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao atualizar usuário no backend:', error);
      }
    }

    // Simular atualização para desenvolvimento
    return {
      success: true,
      data: {
        user: {
          id: userData.user_id,
          name: userData.name,
          role_id: userData.role_id,
          is_active: userData.is_active,
          updated_at: new Date().toISOString()
        }
      },
      message: 'Usuário atualizado com sucesso (modo mock)'
    };
  }

  async deleteUser(userId: string) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.deleteUser(userId);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao deletar usuário no backend:', error);
      }
    }

    // Simular deleção para desenvolvimento
    return {
      success: true,
      message: 'Usuário deletado com sucesso (modo mock)'
    };
  }

  /**
   * Métodos para administração de roles (apenas admin)
   */
  async getRoles(includeUsers = false) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.getRoles(includeUsers);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao buscar roles do backend:', error);
      }
    }

    // Fallback para dados mock (apenas se configurado)
    return this.handleMockFallback(() => this.getMockRoles(includeUsers), 'Erro ao buscar roles');
  }

  async createRole(roleData: {
    id: string;
    name: string;
    description?: string;
    level: number;
    permissions?: string[];
  }) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.createRole(roleData);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao criar role no backend:', error);
      }
    }

    // Simular criação para desenvolvimento
    return {
      success: true,
      data: {
        role: {
          ...roleData,
          created_at: new Date().toISOString()
        }
      },
      message: 'Role criada com sucesso (modo mock)'
    };
  }

  async updateRole(roleData: {
    role_id: string;
    name?: string;
    description?: string;
    level?: number;
    permissions?: string[];
  }) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.updateRole(roleData);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao atualizar role no backend:', error);
      }
    }

    // Simular atualização para desenvolvimento
    return {
      success: true,
      data: {
        role: {
          ...roleData,
          updated_at: new Date().toISOString()
        }
      },
      message: 'Role atualizada com sucesso (modo mock)'
    };
  }

  async deleteRole(roleId: string) {
    if (this.status.isAvailable) {
      try {
        const response = await apiClient.deleteRole(roleId);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.warn('Erro ao deletar role no backend:', error);
      }
    }

    // Simular deleção para desenvolvimento
    return {
      success: true,
      message: 'Role deletada com sucesso (modo mock)'
    };
  }

  // === MÉTODOS MOCK ADICIONAIS ===

  private getMockUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const mockUsers = [
      {
        id: 'user_1',
        email: 'admin@sofia.com',
        name: 'Administrador',
        role_id: 'admin',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'user_2',
        email: 'usuario@sofia.com',
        name: 'Usuário Teste',
        role_id: 'user',
        is_active: true,
        created_at: '2024-01-02T00:00:00Z'
      },
      {
        id: 'user_3',
        email: 'premium@sofia.com',
        name: 'Usuário Premium',
        role_id: 'premium',
        is_active: true,
        created_at: '2024-01-03T00:00:00Z'
      }
    ];

    let filteredUsers = mockUsers;

    if (params?.search) {
      filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(params.search!.toLowerCase()) ||
        user.email.toLowerCase().includes(params.search!.toLowerCase())
      );
    }

    if (params?.role) {
      filteredUsers = filteredUsers.filter(user => user.role_id === params.role);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedUsers,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(filteredUsers.length / limit),
        total_items: filteredUsers.length,
        returned_count: paginatedUsers.length,
        items_per_page: limit
      },
      message: 'Dados mock - Usuários'
    };
  }

  private getMockRoles(includeUsers = false) {
    const mockRoles = [
      {
        id: 'admin',
        name: 'Administrador',
        description: 'Acesso total ao sistema',
        level: 100,
        permissions: ['all'],
        users: includeUsers ? [{ id: 'user_1', name: 'Administrador' }] : undefined
      },
      {
        id: 'premium',
        name: 'Usuário Premium',
        description: 'Acesso a recursos premium',
        level: 50,
        permissions: ['view_signals', 'view_strategies', 'view_history', 'premium_features'],
        users: includeUsers ? [{ id: 'user_3', name: 'Usuário Premium' }] : undefined
      },
      {
        id: 'user',
        name: 'Usuário',
        description: 'Acesso básico ao sistema',
        level: 10,
        permissions: ['view_signals', 'view_strategies'],
        users: includeUsers ? [{ id: 'user_2', name: 'Usuário Teste' }] : undefined
      }
    ];

    return {
      success: true,
      data: mockRoles,
      message: 'Dados mock - Roles'
    };
  }
}

// Instância singleton
export const backendIntegration = new BackendIntegration();

// Tipos para exportação
export type { BackendStatus };
