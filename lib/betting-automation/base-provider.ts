import { 
  BaseBettingProvider, 
  BettingCredentials, 
  BetRequest, 
  BetResult, 
  ProviderStatus,
  AutomationEvent,
  AutomationEventHandler
} from './types';

export abstract class AbstractBettingProvider implements BaseBettingProvider {
  abstract name: string;
  abstract priority: number;
  
  protected isConnected = false;
  protected lastError: string | null = null;
  protected credentials: BettingCredentials | null = null;
  protected eventHandlers: AutomationEventHandler[] = [];
  protected metrics = {
    totalBets: 0,
    successfulBets: 0,
    totalResponseTime: 0,
    lastBetTime: 0
  };

  // Métodos abstratos que devem ser implementados
  abstract isAvailable(): Promise<boolean>;
  abstract doConnect(credentials: BettingCredentials): Promise<void>;
  abstract doDisconnect(): Promise<void>;
  abstract doPlaceBet(betData: BetRequest): Promise<BetResult>;

  // Implementação base com logging e error handling
  async connect(credentials: BettingCredentials): Promise<void> {
    try {
      this.credentials = credentials;
      await this.doConnect(credentials);
      this.isConnected = true;
      this.lastError = null;
      
      this.emitEvent({
        type: 'session_start',
        data: { provider: this.name, siteUrl: credentials.siteUrl },
        timestamp: new Date()
      });
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Erro desconhecido';
      this.isConnected = false;
      
      this.emitEvent({
        type: 'error',
        data: { provider: this.name, error: this.lastError },
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.doDisconnect();
      this.isConnected = false;
      
      this.emitEvent({
        type: 'session_end',
        data: { provider: this.name, metrics: this.getMetrics() },
        timestamp: new Date()
      });
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Erro ao desconectar';
      throw error;
    }
  }

  async placeBet(betData: BetRequest): Promise<BetResult> {
    if (!this.isConnected) {
      throw new Error(`Provider ${this.name} não está conectado`);
    }

    const startTime = Date.now();
    
    try {
      this.emitEvent({
        type: 'bet_placed',
        data: { provider: this.name, betData },
        timestamp: new Date()
      });

      const result = await this.doPlaceBet(betData);
      const executionTime = Date.now() - startTime;
      
      // Atualizar métricas
      this.metrics.totalBets++;
      if (result.success) {
        this.metrics.successfulBets++;
      }
      this.metrics.totalResponseTime += executionTime;
      this.metrics.lastBetTime = Date.now();

      // Adicionar tempo de execução ao resultado
      result.executionTime = executionTime;

      this.emitEvent({
        type: 'bet_result',
        data: { provider: this.name, result },
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.lastError = error instanceof Error ? error.message : 'Erro na aposta';
      
      this.emitEvent({
        type: 'error',
        data: { provider: this.name, error: this.lastError, betData },
        timestamp: new Date()
      });

      return {
        success: false,
        error: this.lastError,
        timestamp: new Date(),
        executionTime
      };
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    const isAvailable = await this.isAvailable();
    const successRate = this.metrics.totalBets > 0 
      ? (this.metrics.successfulBets / this.metrics.totalBets) * 100 
      : 0;
    const avgResponseTime = this.metrics.totalBets > 0 
      ? this.metrics.totalResponseTime / this.metrics.totalBets 
      : 0;

    return {
      name: this.name,
      available: isAvailable,
      connected: this.isConnected,
      lastError: this.lastError || undefined,
      priority: this.priority,
      responseTime: avgResponseTime,
      successRate
    };
  }

  getLastError(): string | null {
    return this.lastError;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  // Sistema de eventos
  addEventListener(handler: AutomationEventHandler): void {
    this.eventHandlers.push(handler);
  }

  removeEventListener(handler: AutomationEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  protected emitEvent(event: AutomationEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Erro no event handler:', error);
      }
    });
  }

  // Utilitários para implementações
  protected async waitForElement(selector: string, timeout = 10000): Promise<void> {
    // Implementação base - pode ser sobrescrita
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkElement = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout aguardando elemento: ${selector}`));
          return;
        }
        
        // Lógica específica será implementada em cada provider
        setTimeout(checkElement, 100);
      };
      checkElement();
    });
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected validateBetData(betData: BetRequest): void {
    if (!betData.selections || betData.selections.length === 0) {
      throw new Error('Nenhuma seleção de aposta fornecida');
    }

    if (betData.totalAmount <= 0) {
      throw new Error('Valor da aposta deve ser maior que zero');
    }

    for (const selection of betData.selections) {
      if (selection.amount <= 0) {
        throw new Error('Valor da seleção deve ser maior que zero');
      }
    }
  }
}