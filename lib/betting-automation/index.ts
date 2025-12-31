// Tipos e interfaces principais
export * from './types';

// Classe base para provedores
export { AbstractBettingProvider } from './base-provider';

// Provedores específicos
export { IframeBettingProvider } from './providers/iframe-provider';
export { WebAutomationProvider } from './providers/web-automation-provider';

// Motor principal
export { SmartBettingEngine } from './smart-betting-engine';

// Utilitários e helpers
export { BettingAutomationManager } from './automation-manager';

// Re-exportar tipos mais usados para conveniência
export type {
  BettingCredentials,
  BetRequest,
  BetResult,
  AutomationConfig,
  BettingSession,
  AutomationMetrics
} from './types';