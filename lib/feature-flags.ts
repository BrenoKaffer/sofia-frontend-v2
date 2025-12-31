'use client';

import { useState, useEffect } from 'react';

/**
 * Sistema de Feature Flags
 * Permite controlar funcionalidades de forma granular e segura
 */

// Tipos de feature flags
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environment?: 'development' | 'staging' | 'production' | 'all';
  userGroups?: string[];
  rolloutPercentage?: number;
}

// Definição das feature flags disponíveis
export const FEATURE_FLAGS = {
  // Modo MVP: oculta funcionalidades não essenciais temporariamente
  MVP_MODE: 'mvp_mode',
  // Autenticação e Segurança
  ENHANCED_AUTH_FLOW: 'enhanced_auth_flow',
  TWO_FACTOR_AUTH: 'two_factor_auth',
  BIOMETRIC_LOGIN: 'biometric_login',
  
  // Dashboard e UI
  DASHBOARD_OPTIMIZATION: 'dashboard_optimization',
  LAZY_LOADING: 'lazy_loading',
  REAL_TIME_UPDATES: 'real_time_updates',
  DARK_MODE: 'dark_mode',
  
  // Funcionalidades Avançadas
  AI_RECOMMENDATIONS: 'ai_recommendations',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  EXPORT_FEATURES: 'export_features',
  
  // Desenvolvimento e Debug
  DEBUG_MODE: 'debug_mode',
  PERFORMANCE_MONITORING: 'performance_monitoring',
  ERROR_TRACKING: 'error_tracking'
} as const;

// Configuração padrão das feature flags
const defaultFlags: Record<string, boolean> = {
  // Modo MVP habilitado por padrão; pode ser desativado via env
  [FEATURE_FLAGS.MVP_MODE]: (process.env.NEXT_PUBLIC_MVP_MODE ?? 'false') === 'true',
  // Autenticação - habilitadas por padrão para melhor UX
  [FEATURE_FLAGS.ENHANCED_AUTH_FLOW]: true,
  [FEATURE_FLAGS.TWO_FACTOR_AUTH]: false,
  [FEATURE_FLAGS.BIOMETRIC_LOGIN]: false,
  
  // Dashboard - otimizações habilitadas
  [FEATURE_FLAGS.DASHBOARD_OPTIMIZATION]: true,
  [FEATURE_FLAGS.LAZY_LOADING]: true,
  [FEATURE_FLAGS.REAL_TIME_UPDATES]: true,
  [FEATURE_FLAGS.DARK_MODE]: false,
  
  // Funcionalidades avançadas - desabilitadas por padrão
  [FEATURE_FLAGS.AI_RECOMMENDATIONS]: false,
  [FEATURE_FLAGS.ADVANCED_ANALYTICS]: false,
  [FEATURE_FLAGS.EXPORT_FEATURES]: true,
  
  // Debug - apenas em desenvolvimento
  [FEATURE_FLAGS.DEBUG_MODE]: process.env.NODE_ENV === 'development',
  [FEATURE_FLAGS.PERFORMANCE_MONITORING]: true,
  [FEATURE_FLAGS.ERROR_TRACKING]: true
};

class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: Record<string, boolean>;

  private constructor() {
    this.flags = { ...defaultFlags };
  }

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  isEnabled(flagKey: string): boolean {
    return this.flags[flagKey] ?? false;
  }

  enable(flagKey: string): void {
    this.flags[flagKey] = true;
  }

  disable(flagKey: string): void {
    this.flags[flagKey] = false;
  }

  getFlag(flagKey: string): boolean {
    return this.isEnabled(flagKey);
  }

  getAllFlags(): Record<string, boolean> {
    return { ...this.flags };
  }

  setFlags(newFlags: Record<string, boolean>): void {
    this.flags = { ...this.flags, ...newFlags };
  }
}

// Hook para usar feature flags em componentes React
export function useFeatureFlag(flagKey: string): boolean {
  const [isEnabled, setIsEnabled] = useState(() => 
    FeatureFlagManager.getInstance().isEnabled(flagKey)
  );

  useEffect(() => {
    const manager = FeatureFlagManager.getInstance();
    setIsEnabled(manager.isEnabled(flagKey));
  }, [flagKey]);

  return isEnabled;
}

// Hook para usar múltiplas feature flags
export function useFeatureFlags(flagKeys: string[]): Record<string, boolean> {
  const [flags, setFlags] = useState(() => {
    const manager = FeatureFlagManager.getInstance();
    return flagKeys.reduce((acc, key) => {
      acc[key] = manager.isEnabled(key);
      return acc;
    }, {} as Record<string, boolean>);
  });

  useEffect(() => {
    const manager = FeatureFlagManager.getInstance();
    const newFlags = flagKeys.reduce((acc, key) => {
      acc[key] = manager.isEnabled(key);
      return acc;
    }, {} as Record<string, boolean>);
    setFlags(newFlags);
  }, [flagKeys]);

  return flags;
}

// Utilitário para habilitar todas as flags de desenvolvimento
export function enableAllDevFlags(): void {
  if (process.env.NODE_ENV === 'development') {
    const manager = FeatureFlagManager.getInstance();
    Object.keys(FEATURE_FLAGS).forEach(key => {
      manager.enable(FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS]);
    });
  }
}