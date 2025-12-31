import { EventEmitter } from 'events';
import { AbstractBettingProvider } from './base-provider';
import { IframeBettingProvider } from './providers/iframe-provider';
import { WebAutomationProvider } from './providers/web-automation-provider';
import { 
  BettingCredentials, 
  BetRequest, 
  BetResult, 
  AutomationConfig, 
  BettingSession,
  AutomationMetrics,
  AutomationEvent
} from './types';

export class SmartBettingEngine extends EventEmitter {
  private providers: Map<string, AbstractBettingProvider> = new Map();
  private activeProvider: AbstractBettingProvider | null = null;
  private config: AutomationConfig;
  private session: BettingSession | null = null;
  private credentials: BettingCredentials | null = null;
  private metrics: AutomationMetrics;
  private isRunning = false;
  private retryAttempts = 0;
  private maxRetries = 3;
  private startTime: Date;

  constructor(config: AutomationConfig) {
    super();
    this.config = config;
    this.startTime = new Date();
    this.metrics = this.initializeMetrics();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Registrar provedores em ordem de prioridade
    const iframeProvider = new IframeBettingProvider();
    const webProvider = new WebAutomationProvider();

    this.registerProvider(iframeProvider);
    this.registerProvider(webProvider);

    // Configurar listeners para eventos dos provedores
    [iframeProvider, webProvider].forEach(provider => {
      provider.addEventListener((event) => {
        switch (event.type) {
          case 'session_start':
            this.handleProviderEvent('connected', provider);
            break;
          case 'session_end':
            this.handleProviderEvent('disconnected', provider);
            break;
          case 'error':
            this.handleProviderEvent('error', provider, event.data.error);
            break;
          case 'bet_placed':
            this.handleProviderEvent('betPlaced', provider, event.data);
            break;
        }
      });
    });
  }

  private initializeMetrics(): AutomationMetrics {
    return {
      sessionsToday: 0,
      totalProfit: 0,
      winRate: 0,
      averageBetTime: 0,
      errorRate: 0,
      uptime: 0,
      lastUpdate: new Date()
    };
  }

  public registerProvider(provider: AbstractBettingProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`Provider registrado: ${provider.name} (prioridade: ${provider.priority})`);
  }

  public async start(credentials: BettingCredentials): Promise<void> {
    if (this.isRunning) {
      throw new Error('Engine já está em execução');
    }

    try {
      this.credentials = credentials;
      this.isRunning = true;
      this.session = this.createSession(credentials);
      
      // Tentar conectar com o melhor provedor disponível
      await this.connectToBestProvider(credentials);
      
      this.emit('started', { session: this.session });
      console.log('SmartBettingEngine iniciado com sucesso');
      
    } catch (error) {
      this.isRunning = false;
      this.session = null;
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      this.isRunning = false;
      
      if (this.activeProvider) {
        await this.activeProvider.disconnect();
        this.activeProvider = null;
      }

      if (this.session) {
        this.session.endTime = new Date();
        this.session.status = 'stopped';
      }

      this.emit('stopped', { session: this.session, metrics: this.metrics });
      console.log('SmartBettingEngine parado');
      
    } catch (error) {
      console.error('Erro ao parar engine:', error);
      throw error;
    }
  }

  public async placeBet(betData: BetRequest): Promise<BetResult> {
    if (!this.isRunning || !this.activeProvider) {
      throw new Error('Engine não está ativo ou não há provedor conectado');
    }

    const startTime = Date.now();
    this.retryAttempts = 0;

    try {
      const result = await this.executeBetWithFallback(betData);
      
      // Atualizar métricas
      this.updateMetrics(result, Date.now() - startTime);
      
      // Atualizar sessão
      if (this.session) {
        this.session.totalBets++;
        if (result.success) {
          this.session.totalWon += result.profit || 0;
          this.session.profit += result.profit || 0;
        }
        this.session.totalWagered += betData.totalAmount;
        
        // Update win rate
        this.session.winRate = this.session.totalBets > 0 
          ? (this.session.totalWon > 0 ? 1 : 0) / this.session.totalBets * 100 
          : 0;
      }

      this.emit('betCompleted', result);
      return result;
      
    } catch (error) {
      const errorResult: BetResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
        executionTime: Date.now() - startTime
      };
      
      this.updateMetrics(errorResult, Date.now() - startTime);
      this.emit('betFailed', errorResult);
      
      throw error;
    }
  }

  private async executeBetWithFallback(betData: BetRequest): Promise<BetResult> {
    while (this.retryAttempts < this.maxRetries) {
      try {
        if (!this.activeProvider) {
          throw new Error('Nenhum provedor ativo');
        }

        const result = await this.activeProvider.placeBet(betData);
        
        if (result.success) {
          this.retryAttempts = 0; // Reset contador em caso de sucesso
          return result;
        } else {
          throw new Error(result.error || 'Falha na execução da aposta');
        }
        
      } catch (error) {
        console.error(`Tentativa ${this.retryAttempts + 1} falhou:`, error);
        this.retryAttempts++;
        
        if (this.retryAttempts >= this.maxRetries) {
          // Tentar trocar de provedor
          const switched = await this.switchToNextProvider();
          if (switched) {
            this.retryAttempts = 0; // Reset contador após trocar provedor
            continue;
          } else {
            throw new Error(`Falha após ${this.maxRetries} tentativas e sem provedores alternativos`);
          }
        }
        
        // Aguardar antes da próxima tentativa
        await this.delay(1000 * this.retryAttempts);
      }
    }

    throw new Error('Máximo de tentativas excedido');
  }

  private async connectToBestProvider(credentials: BettingCredentials): Promise<void> {
    // Ordenar provedores por prioridade
    const sortedProviders = Array.from(this.providers.values())
      .sort((a, b) => a.priority - b.priority);

    for (const provider of sortedProviders) {
      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.log(`Provider ${provider.name} não está disponível`);
          continue;
        }

        console.log(`Tentando conectar com ${provider.name}...`);
        await provider.connect(credentials);
        
        this.activeProvider = provider;
        console.log(`Conectado com sucesso ao ${provider.name}`);
        
        this.emit('providerConnected', { provider: provider.name });
        return;
        
      } catch (error) {
        console.error(`Falha ao conectar com ${provider.name}:`, error);
        continue;
      }
    }

    throw new Error('Não foi possível conectar com nenhum provedor');
  }

  private async switchToNextProvider(): Promise<boolean> {
    if (!this.activeProvider || !this.session) return false;

    console.log(`Tentando trocar do provedor ${this.activeProvider.name}...`);

    // Desconectar provedor atual
    try {
      await this.activeProvider.disconnect();
    } catch (error) {
      console.error('Erro ao desconectar provedor atual:', error);
    }

    const currentProvider = this.activeProvider;
    this.activeProvider = null;

    // Encontrar próximo provedor disponível
    const sortedProviders = Array.from(this.providers.values())
      .filter(p => p.name !== currentProvider.name)
      .sort((a, b) => a.priority - b.priority);

    for (const provider of sortedProviders) {
      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) continue;

        if (!this.credentials) {
          throw new Error('Credenciais não disponíveis');
        }

        console.log(`Tentando conectar com ${provider.name}...`);
        await provider.connect(this.credentials);
        
        this.activeProvider = provider;
        
        console.log(`Trocado com sucesso para ${provider.name}`);
        this.emit('providerSwitched', { 
          from: currentProvider.name, 
          to: provider.name 
        });
        
        return true;
        
      } catch (error) {
        console.error(`Falha ao conectar com ${provider.name}:`, error);
        continue;
      }
    }

    console.error('Não foi possível trocar para nenhum provedor alternativo');
    return false;
  }

  private createSession(credentials: BettingCredentials): BettingSession {
    return {
      id: `session_${Date.now()}`,
      startTime: new Date(),
      endTime: undefined,
      totalBets: 0,
      totalWagered: 0,
      totalWon: 0,
      profit: 0,
      winRate: 0,
      strategy: 'default',
      tableId: 'default',
      status: 'active'
    };
  }

  private updateMetrics(result: BetResult, executionTime: number): void {
    // Update session count (simplified - could be more sophisticated)
    this.metrics.sessionsToday++;
    
    // Update total profit (includes both gains and losses)
    this.metrics.totalProfit += result.profit || 0;
    
    // Update average bet time
    this.metrics.averageBetTime = 
      (this.metrics.averageBetTime * (this.metrics.sessionsToday - 1) + executionTime) / 
      this.metrics.sessionsToday;

    // Update win rate (simplified calculation)
    const successCount = result.success ? 1 : 0;
    this.metrics.winRate = 
      (this.metrics.winRate * (this.metrics.sessionsToday - 1) + (successCount * 100)) / 
      this.metrics.sessionsToday;

    // Update error rate
    const errorCount = result.success ? 0 : 1;
    this.metrics.errorRate = 
      (this.metrics.errorRate * (this.metrics.sessionsToday - 1) + (errorCount * 100)) / 
      this.metrics.sessionsToday;

    // Update uptime (time since engine started)
    this.metrics.uptime = Date.now() - this.startTime.getTime();
    
    // Update last update timestamp
    this.metrics.lastUpdate = new Date();
  }

  private handleProviderEvent(eventType: string, provider: AbstractBettingProvider, data?: any): void {
    const event: AutomationEvent = {
      type: eventType as any,
      timestamp: new Date(),
      data: {
        ...data,
        provider: provider.name
      }
    };

    this.emit('providerEvent', event);

    // Lógica específica por tipo de evento
    switch (eventType) {
      case 'error':
        console.error(`Erro no provider ${provider.name}:`, data);
        if (this.activeProvider === provider && this.isRunning) {
          // Tentar trocar de provedor em caso de erro crítico
          this.switchToNextProvider().catch(console.error);
        }
        break;
        
      case 'disconnected':
        if (this.activeProvider === provider) {
          this.activeProvider = null;
          if (this.isRunning) {
            // Tentar reconectar ou trocar de provedor
            this.switchToNextProvider().catch(console.error);
          }
        }
        break;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Getters públicos
  public get isActive(): boolean {
    return this.isRunning;
  }

  public get currentProvider(): string | null {
    return this.activeProvider?.name || null;
  }

  public get currentSession(): BettingSession | null {
    return this.session;
  }

  public get currentMetrics(): AutomationMetrics {
    return { ...this.metrics };
  }

  async getProviderStatus(): Promise<any[]> {
    const statusPromises = Array.from(this.providers.values()).map(async (provider) => {
      const status = await provider.getStatus();
      return {
        name: provider.name,
        priority: provider.priority,
        isActive: this.activeProvider === provider,
        isConnected: status.connected
      };
    });

    return Promise.all(statusPromises);
  }

  // Métodos de configuração
  public updateConfig(newConfig: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  public setMaxRetries(retries: number): void {
    this.maxRetries = Math.max(1, retries);
  }

  // Método para forçar troca de provedor (útil para testes)
  public async forceProviderSwitch(): Promise<boolean> {
    if (!this.isRunning) return false;
    return await this.switchToNextProvider();
  }

  // Método para obter logs detalhados
  public getDetailedStatus(): any {
    return {
      isRunning: this.isRunning,
      activeProvider: this.currentProvider,
      session: this.session,
      metrics: this.metrics,
      providers: this.getProviderStatus(),
      retryAttempts: this.retryAttempts,
      maxRetries: this.maxRetries
    };
  }
}