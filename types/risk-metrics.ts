export interface RiskMetrics {
  // Métricas gerais de risco
  overallRiskScore: number;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  valueAtRisk: number; // VaR 95%
  
  // Métricas por mesa
  tableRisks: Record<string, TableRiskMetrics>;
  
  // Métricas por estratégia
  strategyRisks: Record<string, StrategyRiskMetrics>;
  
  // Recomendações
  recommendations: string[];
  
  // Timestamp da última atualização
  lastUpdate: Date;
}

export interface TableRiskMetrics {
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface StrategyRiskMetrics {
  accuracyRisk: number;
  confidenceRisk: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AdvancedMetrics {
  // Métricas de performance
  roi: number;
  hitRate: number;
  profitFactor: number;
  winStreak: number;
  lossStreak: number;
  
  // Métricas de risco
  bankrollUsage: number;
  consecutiveLosses: number;
  
  // Métricas de sistema
  totalBets: number;
  totalProfit: number;
  averageBet: number;
  systemUptime: number;
  
  // Análise temporal
  hourlyPerformance: Record<string, number>;
  dailyPerformance: Record<string, number>;
  
  // Timestamp
  timestamp: Date;
}

export interface RiskAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  riskScore: number;
  timestamp: Date;
  acknowledged: boolean;
}