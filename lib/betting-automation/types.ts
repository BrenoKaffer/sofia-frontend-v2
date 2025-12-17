// Tipos e interfaces para o sistema de automação de apostas
export interface BettingCredentials {
  siteUrl: string;
  username: string;
  password: string;
  siteType: 'bet365' | 'betfair' | 'betano' | 'sportingbet' | 'other';
  additionalData?: Record<string, any>;
}

export interface BetSelection {
  type: 'number' | 'color' | 'dozen' | 'column' | 'even_odd' | 'high_low';
  value: string | number;
  amount: number;
}

export interface BetRequest {
  tableId: string;
  selections: BetSelection[];
  totalAmount: number;
  strategy: string;
  confidence: number;
  maxLoss?: number;
  stopOnWin?: boolean;
  metadata?: Record<string, any>;
}

export interface BetResult {
  success: boolean;
  betId?: string;
  winningNumber?: number;
  winningColor?: 'red' | 'black' | 'green';
  payout?: number;
  profit?: number;
  error?: string;
  timestamp: Date;
  executionTime: number;
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  connected: boolean;
  lastError?: string;
  priority: number;
  responseTime?: number;
  successRate?: number;
}

export interface AutomationConfig {
  enabled: boolean;
  provider: 'puppeteer' | 'iframe' | 'extension' | 'auto';
  maxBetAmount: number;
  maxLossPerSession: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  cooldownBetween: number; // ms
  retryAttempts: number;
  enableNotifications: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface BettingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  profit: number;
  winRate: number;
  strategy: string;
  tableId: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
}

export interface AutomationMetrics {
  sessionsToday: number;
  totalProfit: number;
  winRate: number;
  averageBetTime: number;
  errorRate: number;
  uptime: number;
  lastUpdate: Date;
}

export abstract class BaseBettingProvider {
  abstract name: string;
  abstract priority: number;
  
  abstract isAvailable(): Promise<boolean>;
  abstract connect(credentials: BettingCredentials): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract placeBet(betData: BetRequest): Promise<BetResult>;
  abstract getStatus(): Promise<ProviderStatus>;
  abstract getLastError(): string | null;
}

export interface BettingProviderFactory {
  createProvider(type: string): BaseBettingProvider;
  getAvailableProviders(): string[];
}

export interface AutomationEvent {
  type: 'bet_placed' | 'bet_result' | 'session_start' | 'session_end' | 'error' | 'warning';
  data: any;
  timestamp: Date;
  sessionId?: string;
}

export type AutomationEventHandler = (event: AutomationEvent) => void;