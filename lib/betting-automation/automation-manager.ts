import { SmartBettingEngine } from './smart-betting-engine';
import { 
  BettingCredentials, 
  BetRequest, 
  BetResult, 
  AutomationConfig,
  BettingSession,
  AutomationMetrics
} from './types';

export class BettingAutomationManager {
  private static instance: BettingAutomationManager | null = null;
  private engine: SmartBettingEngine | null = null;
  private defaultConfig: AutomationConfig;

  private constructor() {
    this.defaultConfig = {
      enabled: false,
      provider: 'iframe',
      maxBetAmount: 100,
      maxLossPerSession: 1000,
      stopLossPercentage: 20,
      takeProfitPercentage: 50,
      cooldownBetween: 1000,
      retryAttempts: 3,
      enableNotifications: true,
      logLevel: 'info'
    };
  }

  public static getInstance(): BettingAutomationManager {
    if (!BettingAutomationManager.instance) {
      BettingAutomationManager.instance = new BettingAutomationManager();
    }
    return BettingAutomationManager.instance;
  }

  public async initialize(config?: Partial<AutomationConfig>): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    this.engine = new SmartBettingEngine(finalConfig);
    
    // Configurar listeners para eventos importantes
    this.setupEventListeners();
    
    console.log('BettingAutomationManager inicializado');
  }

  public async startAutomation(credentials: BettingCredentials): Promise<void> {
    if (!this.engine) {
      throw new Error('Manager não foi inicializado. Chame initialize() primeiro.');
    }

    if (this.engine.isActive) {
      throw new Error('Automação já está ativa');
    }

    try {
      await this.engine.start(credentials);
      console.log('Automação de apostas iniciada');
    } catch (error) {
      console.error('Erro ao iniciar automação:', error);
      throw error;
    }
  }

  public async stopAutomation(): Promise<void> {
    if (!this.engine) {
      throw new Error('Manager não foi inicializado');
    }

    if (!this.engine.isActive) {
      console.log('Automação já está parada');
      return;
    }

    try {
      await this.engine.stop();
      console.log('Automação de apostas parada');
    } catch (error) {
      console.error('Erro ao parar automação:', error);
      throw error;
    }
  }

  public async placeBet(betData: BetRequest): Promise<BetResult> {
    if (!this.engine) {
      throw new Error('Manager não foi inicializado');
    }

    if (!this.engine.isActive) {
      throw new Error('Automação não está ativa');
    }

    // Validar limites de risco antes de executar
    this.validateRiskLimits(betData);

    try {
      const result = await this.engine.placeBet(betData);
      
      // Verificar limites pós-execução
      this.checkPostExecutionLimits(result);
      
      return result;
    } catch (error) {
      console.error('Erro ao executar aposta:', error);
      throw error;
    }
  }

  public isActive(): boolean {
    return this.engine?.isActive || false;
  }

  public getCurrentProvider(): string | null {
    return this.engine?.currentProvider || null;
  }

  public getCurrentSession(): BettingSession | null {
    return this.engine?.currentSession || null;
  }

  public getMetrics(): AutomationMetrics | null {
    return this.engine?.currentMetrics || null;
  }

  public getDetailedStatus(): any {
    if (!this.engine) {
      return { initialized: false };
    }

    return {
      initialized: true,
      ...this.engine.getDetailedStatus()
    };
  }

  public updateConfig(config: Partial<AutomationConfig>): void {
    if (!this.engine) {
      throw new Error('Manager não foi inicializado');
    }

    this.engine.updateConfig(config);
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  public async forceProviderSwitch(): Promise<boolean> {
    if (!this.engine) {
      throw new Error('Manager não foi inicializado');
    }

    return await this.engine.forceProviderSwitch();
  }

  private setupEventListeners(): void {
    if (!this.engine) return;

    this.engine.on('started', (data) => {
      console.log('Automação iniciada:', data);
      this.notifyEvent('automation_started', data);
    });

    this.engine.on('stopped', (data) => {
      console.log('Automação parada:', data);
      this.notifyEvent('automation_stopped', data);
    });

    this.engine.on('betCompleted', (result) => {
      console.log('Aposta concluída:', result);
      this.notifyEvent('bet_completed', result);
    });

    this.engine.on('betFailed', (result) => {
      console.error('Aposta falhou:', result);
      this.notifyEvent('bet_failed', result);
    });

    this.engine.on('providerConnected', (data) => {
      console.log('Provider conectado:', data);
      this.notifyEvent('provider_connected', data);
    });

    this.engine.on('providerSwitched', (data) => {
      console.log('Provider trocado:', data);
      this.notifyEvent('provider_switched', data);
    });

    this.engine.on('providerEvent', (event) => {
      console.log('Evento do provider:', event);
      this.notifyEvent('provider_event', event);
    });
  }

  private validateRiskLimits(betData: BetRequest): void {
    const config = this.defaultConfig;
    const metrics = this.getMetrics();

    // Verificar valor máximo da aposta
    if (betData.totalAmount > config.maxBetAmount) {
      throw new Error(`Valor da aposta (${betData.totalAmount}) excede o limite máximo (${config.maxBetAmount})`);
    }

    // Verificar perda máxima por sessão (usando totalProfit negativo como proxy para perda)
    if (metrics && metrics.totalProfit < -config.maxLossPerSession) {
      throw new Error(`Limite de perda por sessão atingido (${config.maxLossPerSession})`);
    }

    // Verificar perdas consecutivas (implementação simplificada)
    // Em uma implementação real, você manteria um histórico das últimas apostas
    if (metrics && metrics.errorRate > 80) { // 80% de erro como proxy para perdas consecutivas
      throw new Error('Muitas perdas consecutivas detectadas. Parando por segurança.');
    }
  }

  private checkPostExecutionLimits(result: BetResult): void {
    const config = this.defaultConfig;
    const metrics = this.getMetrics();

    if (!metrics) return;

    // Verificar stop loss (usando totalProfit negativo como proxy para perda)
    const totalLoss = Math.abs(Math.min(0, metrics.totalProfit));
    const totalGain = Math.max(0, metrics.totalProfit);
    const totalLossPercentage = totalLoss > 0 ? (totalLoss / (totalGain + totalLoss)) * 100 : 0;
    if (totalLossPercentage >= config.stopLossPercentage) {
      console.warn(`Stop loss atingido (${totalLossPercentage}%). Considere parar a automação.`);
      this.notifyEvent('stop_loss_reached', { percentage: totalLossPercentage });
    }

    // Verificar limite de perda por sessão
    if (totalLoss >= config.maxLossPerSession) {
      console.warn('Limite de perda por sessão atingido. Parando automação.');
      this.stopAutomation().catch(console.error);
      this.notifyEvent('session_loss_limit_reached', { totalLoss });
    }
  }

  private notifyEvent(eventType: string, data: any): void {
    // Emitir evento customizado que pode ser capturado pela UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('betting-automation-event', {
        detail: { type: eventType, data, timestamp: new Date() }
      }));
    }

    // Log para desenvolvimento
    console.log(`[BettingAutomation] ${eventType}:`, data);
  }

  // Métodos utilitários para integração com a UI
  public getProviderOptions(): Array<{ value: string; label: string; priority: number }> {
    if (!this.engine) return [];

    const status = this.engine.getProviderStatus();
    return Object.values(status).map((provider: any) => ({
      value: provider.name,
      label: this.getProviderDisplayName(provider.name),
      priority: provider.priority
    }));
  }

  private getProviderDisplayName(providerName: string): string {
    const displayNames: Record<string, string> = {
      'IframeProvider': 'Iframe (Recomendado)',
      'WebAutomation': 'Automação Web (Puppeteer)',
      'ExtensionProvider': 'Extensão do Navegador',
      'ManualProvider': 'Manual'
    };

    return displayNames[providerName] || providerName;
  }

  public async testConnection(credentials: BettingCredentials): Promise<{ success: boolean; provider?: string; error?: string }> {
    try {
      // Criar engine temporário para teste
      const testEngine = new SmartBettingEngine(this.defaultConfig);
      
      await testEngine.start(credentials);
      const provider = testEngine.currentProvider;
      await testEngine.stop();

      return { success: true, provider: provider || undefined };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Método para limpar recursos
  public dispose(): void {
    if (this.engine?.isActive) {
      this.engine.stop().catch(console.error);
    }
    
    this.engine = null;
    BettingAutomationManager.instance = null;
  }
}