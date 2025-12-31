'use client';

import { useIntelligentCache, usePresetCache, cacheHookUtils } from '@/hooks/use-intelligent-cache';
import { apiCache, cacheUtils } from './api-cache';

// Tipos para dados da roleta
export interface RouletteNumber {
  number: number;
  color: 'red' | 'black' | 'green';
  timestamp: number;
}

export interface RouletteStats {
  totalSpins: number;
  redCount: number;
  blackCount: number;
  greenCount: number;
  hotNumbers: number[];
  coldNumbers: number[];
  lastUpdate: number;
}

export interface RouletteSignal {
  id: string;
  number: number;
  confidence: number;
  strategy: string;
  timestamp: number;
  bets: number;
  expectedReturn: number;
}

export interface RouletteSession {
  id: string;
  startTime: number;
  endTime?: number;
  totalBets: number;
  totalWins: number;
  profit: number;
  numbers: RouletteNumber[];
}

/**
 * Sistema de cache especializado para dados da roleta
 */
export class RouletteCache {
  private static instance: RouletteCache;
  private realtimeUpdateInterval: NodeJS.Timeout | null = null;
  private subscribers = new Set<(data: any) => void>();

  static getInstance(): RouletteCache {
    if (!RouletteCache.instance) {
      RouletteCache.instance = new RouletteCache();
    }
    return RouletteCache.instance;
  }

  /**
   * Inicia atualizações em tempo real
   */
  startRealtimeUpdates(interval = 5000) {
    if (this.realtimeUpdateInterval) {
      clearInterval(this.realtimeUpdateInterval);
    }

    this.realtimeUpdateInterval = setInterval(() => {
      this.updateRealtimeData();
    }, interval);
  }

  /**
   * Para atualizações em tempo real
   */
  stopRealtimeUpdates() {
    if (this.realtimeUpdateInterval) {
      clearInterval(this.realtimeUpdateInterval);
      this.realtimeUpdateInterval = null;
    }
  }

  /**
   * Atualiza dados em tempo real
   */
  private async updateRealtimeData() {
    try {
      // Invalidar caches de dados em tempo real
      cacheUtils.invalidateRealtime();
      
      // Notificar subscribers
      this.notifySubscribers({ type: 'realtime_update', timestamp: Date.now() });
    } catch (error) {
      console.error('Erro ao atualizar dados em tempo real:', error);
    }
  }

  /**
   * Subscrever a atualizações
   */
  subscribe(callback: (data: any) => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notificar subscribers
   */
  private notifySubscribers(data: any) {
    this.subscribers.forEach(callback => callback(data));
  }

  /**
   * Pré-carregar dados críticos
   */
  async preloadCriticalData() {
    const criticalKeys = [
      'roulette/current-session',
      'roulette/live-signals',
      'roulette/stats/recent'
    ];

    const promises = criticalKeys.map(async (key) => {
      try {
        // Simular fetch - em produção seria uma chamada real à API
        const data = await this.fetchRouletteData(key);
        cacheHookUtils.preload(key, data, { ttl: 30000, tags: ['critical'] });
      } catch (error) {
        console.warn(`Falha ao pré-carregar ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Simula fetch de dados da roleta
   */
  private async fetchRouletteData(key: string): Promise<any> {
    // Em produção, isso seria uma chamada real à API
    await new Promise(resolve => setTimeout(resolve, 100));
    
    switch (key) {
      case 'roulette/current-session':
        return {
          id: 'session-' + Date.now(),
          startTime: Date.now() - 3600000,
          totalBets: 150,
          totalWins: 45,
          profit: 2500
        };
      
      case 'roulette/live-signals':
        return Array.from({ length: 5 }, (_, i) => ({
          id: `signal-${i}`,
          number: Math.floor(Math.random() * 37),
          confidence: 70 + Math.random() * 30,
          strategy: ['Fibonacci', 'Martingale', 'D\'Alembert'][i % 3],
          timestamp: Date.now() - i * 60000,
          bets: Math.floor(Math.random() * 50) + 10,
          expectedReturn: Math.random() * 1000 + 500
        }));
      
      case 'roulette/stats/recent':
        return {
          totalSpins: 1000,
          redCount: 480,
          blackCount: 470,
          greenCount: 50,
          hotNumbers: [7, 23, 17, 32, 5],
          coldNumbers: [13, 0, 28, 9, 21],
          lastUpdate: Date.now()
        };
      
      default:
        return null;
    }
  }

  /**
   * Limpar cache específico da roleta
   */
  clearRouletteCache() {
    cacheUtils.invalidateRealtime();
    cacheUtils.invalidateHistorical();
    apiCache.invalidateByTags(['roulette', 'signals', 'stats']);
  }

  /**
   * Obter estatísticas do cache da roleta
   */
  getRouletteStats() {
    return {
      ...cacheUtils.getStats(),
      realtimeActive: this.realtimeUpdateInterval !== null,
      subscribersCount: this.subscribers.size
    };
  }
}

// Instância singleton
export const rouletteCache = RouletteCache.getInstance();

/**
 * Hooks especializados para dados da roleta
 */

// Hook para sessão atual
export function useCurrentSession() {
  return usePresetCache(
    'roulette/current-session',
    () => rouletteCache['fetchRouletteData']('roulette/current-session'),
    'realtime',
    {
      refreshInterval: 10000,
      backgroundRefresh: true,
      onError: (error) => console.error('Erro ao carregar sessão:', error)
    }
  );
}

// Hook para sinais ao vivo
export function useLiveSignals() {
  return usePresetCache(
    'roulette/live-signals',
    () => rouletteCache['fetchRouletteData']('roulette/live-signals'),
    'realtime',
    {
      refreshInterval: 5000,
      backgroundRefresh: true,
      maxRetries: 5,
      onError: (error) => console.error('Erro ao carregar sinais:', error)
    }
  );
}

// Hook para estatísticas recentes
export function useRecentStats() {
  return usePresetCache(
    'roulette/stats/recent',
    () => rouletteCache['fetchRouletteData']('roulette/stats/recent'),
    'historical',
    {
      refreshInterval: 30000,
      backgroundRefresh: true,
      onError: (error) => console.error('Erro ao carregar estatísticas:', error)
    }
  );
}

// Hook para números históricos
export function useHistoricalNumbers(limit = 100) {
  return useIntelligentCache(
    `roulette/numbers/historical/${limit}`,
    async () => {
      // Simular fetch de números históricos
      await new Promise(resolve => setTimeout(resolve, 200));
      return Array.from({ length: limit }, (_, i) => ({
        number: Math.floor(Math.random() * 37),
        color: ['red', 'black', 'green'][Math.floor(Math.random() * 3)] as 'red' | 'black' | 'green',
        timestamp: Date.now() - i * 60000
      }));
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutos
      tags: ['historical', 'numbers'],
      staleWhileRevalidate: true,
      refreshInterval: 60000, // 1 minuto
      backgroundRefresh: true
    }
  );
}

// Hook para estratégias ativas
export function useActiveStrategies() {
  return usePresetCache(
    'roulette/strategies/active',
    async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
      return [
        { id: '1', name: 'Fibonacci Avançado', active: true, profit: 1250 },
        { id: '2', name: 'Martingale Modificado', active: true, profit: 890 },
        { id: '3', name: 'D\'Alembert Plus', active: false, profit: -200 }
      ];
    },
    'strategies',
    {
      refreshInterval: 15000,
      backgroundRefresh: true
    }
  );
}

/**
 * Utilitários para cache da roleta
 */
export const rouletteCacheUtils = {
  // Inicializar sistema de cache
  initialize: async () => {
    await rouletteCache.preloadCriticalData();
    rouletteCache.startRealtimeUpdates();
  },
  
  // Finalizar sistema de cache
  cleanup: () => {
    rouletteCache.stopRealtimeUpdates();
  },
  
  // Forçar atualização de todos os dados
  forceRefresh: () => {
    rouletteCache.clearRouletteCache();
  },
  
  // Obter estatísticas completas
  getStats: () => rouletteCache.getRouletteStats(),
  
  // Subscrever a atualizações
  subscribe: (callback: (data: any) => void) => rouletteCache.subscribe(callback)
};

// Inicializar automaticamente no cliente
if (typeof window !== 'undefined') {
  // Aguardar um pouco antes de inicializar para evitar problemas de hidratação
  setTimeout(() => {
    rouletteCacheUtils.initialize().catch(console.error);
  }, 1000);
  
  // Cleanup ao descarregar a página
  window.addEventListener('beforeunload', () => {
    rouletteCacheUtils.cleanup();
  });
}