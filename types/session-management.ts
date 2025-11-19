export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'conservative' | 'moderate' | 'aggressive' | 'custom';
  parameters: {
    maxBetAmount: number;
    stopLoss: number;
    takeProfit: number;
    riskPercentage: number;
    timeLimit?: number;
    maxConsecutiveLosses: number;
  };
  isActive: boolean;
  performance: {
    totalBets: number;
    winRate: number;
    totalProfit: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

export interface Session {
  id: string;
  name: string;
  strategy: Strategy;
  status: 'active' | 'paused' | 'stopped' | 'completed';
  startTime: Date;
  endTime?: Date;
  duration: number; // em minutos
  currentStats: {
    totalBets: number;
    winningBets: number;
    losingBets: number;
    currentProfit: number;
    currentDrawdown: number;
    consecutiveLosses: number;
  };
  settings: {
    autoStop: boolean;
    maxDuration?: number;
    profitTarget?: number;
    lossLimit?: number;
  };
  tables: string[];
  logs: SessionLog[];
}

export interface SessionLog {
  id: string;
  timestamp: Date;
  type: 'bet' | 'win' | 'loss' | 'system' | 'strategy';
  message: string;
  amount?: number;
  table?: string;
  metadata?: Record<string, any>;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  strategy: Omit<Strategy, 'id' | 'performance'>;
  defaultSettings: Session['settings'];
  tags: string[];
}

export interface SessionMetrics {
  activeSessions: number;
  totalSessions: number;
  averageSessionDuration: number;
  totalProfit: number;
  bestPerformingStrategy: string;
  worstPerformingStrategy: string;
  dailyStats: {
    date: string;
    sessions: number;
    profit: number;
    winRate: number;
  }[];
}