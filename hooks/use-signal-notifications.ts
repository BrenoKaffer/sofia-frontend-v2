'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePushNotifications, SignalNotification } from '@/lib/push-notifications';
import { toast } from 'sonner';

interface Signal {
  id: string;
  strategy_id: string;
  table_id: string;
  confidence: number;
  created_at: string;
  expires_at?: string;
  type?: string;
}

interface NotificationPreferences {
  enabled: boolean;
  signals: boolean;
  system: boolean;
  sound: boolean;
  vibration: boolean;
  minConfidence: number;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  strategies: string[];
}

const defaultPreferences: NotificationPreferences = {
  enabled: false,
  signals: true,
  system: true,
  sound: true,
  vibration: true,
  minConfidence: 75,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  strategies: ['Fibonacci', 'Martingale', 'Paroli']
};

export function useSignalNotifications() {
  const {
    isSupported,
    permission,
    isInitialized,
    initialize,
    showSignalNotification,
    showSystemNotification
  } = usePushNotifications();

  const preferencesRef = useRef<NotificationPreferences>(defaultPreferences);
  const processedSignalsRef = useRef<Set<string>>(new Set());
  const lastNotificationTimeRef = useRef<number>(0);

  // Carregar preferências do localStorage
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem('notification-preferences');
        if (saved) {
          const parsed = JSON.parse(saved);
          preferencesRef.current = { ...defaultPreferences, ...parsed };
        }
      } catch (error) {
        console.error('Erro ao carregar preferências de notificação:', error);
      }
    };

    loadPreferences();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'notification-preferences') {
        loadPreferences();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Inicializar notificações automaticamente se habilitadas
  useEffect(() => {
    const initializeIfEnabled = async () => {
      if (preferencesRef.current.enabled && isSupported && !isInitialized) {
        try {
          await initialize();
        } catch (error) {
          console.error('Erro ao inicializar notificações:', error);
        }
      }
    };

    initializeIfEnabled();
  }, [isSupported, isInitialized, initialize]);

  // Verificar se está no horário silencioso
  const isQuietHours = useCallback((): boolean => {
    const preferences = preferencesRef.current;
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Verificar se o período cruza a meia-noite
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }, []);

  // Verificar se deve notificar baseado nas preferências
  const shouldNotify = useCallback((signal: Signal): boolean => {
    const preferences = preferencesRef.current;
    
    // Verificações básicas
    if (!preferences.enabled || !preferences.signals) return false;
    if (permission !== 'granted') return false;
    if (isQuietHours()) return false;
    
    // Verificar confiança mínima
    if (signal.confidence < preferences.minConfidence) return false;
    
    // Verificar estratégia
    if (!preferences.strategies.includes(signal.strategy_id)) return false;
    
    // Verificar se já foi processado
    if (processedSignalsRef.current.has(signal.id)) return false;
    
    // Throttling - máximo 1 notificação por minuto
    const now = Date.now();
    if (now - lastNotificationTimeRef.current < 60000) return false;
    
    return true;
  }, [permission, isQuietHours]);

  // Processar novo sinal
  const processSignal = useCallback(async (signal: Signal) => {
    if (!shouldNotify(signal)) return;

    try {
      // Determinar tipo de notificação baseado na confiança
      let type: SignalNotification['type'] = 'pattern_detected';
      if (signal.confidence >= 90) {
        type = 'high_confidence';
      } else if (signal.confidence >= 75) {
        type = 'pattern_detected';
      }

      const notificationData: SignalNotification = {
        strategy: signal.strategy_id,
        table: signal.table_id,
        confidence: signal.confidence,
        type,
        expiresAt: signal.expires_at
      };

      await showSignalNotification(notificationData);
      
      // Marcar como processado
      processedSignalsRef.current.add(signal.id);
      lastNotificationTimeRef.current = Date.now();
      
      // Limpar sinais antigos do cache (manter apenas os últimos 100)
      if (processedSignalsRef.current.size > 100) {
        const signalsArray = Array.from(processedSignalsRef.current);
        const toKeep = signalsArray.slice(-50);
        processedSignalsRef.current = new Set(toKeep);
      }

      // Notificação enviada para sinal
    } catch (error) {
      // Erro ao enviar notificação de sinal
    }
  }, [shouldNotify, showSignalNotification]);

  // Processar lista de sinais
  const processSignals = useCallback(async (signals: Signal[]) => {
    if (!Array.isArray(signals) || signals.length === 0) return;

    // Processar apenas sinais novos (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentSignals = signals.filter(signal => {
      const signalTime = new Date(signal.created_at);
      return signalTime > fiveMinutesAgo;
    });

    // Processar sinais em ordem de confiança (maior primeiro)
    const sortedSignals = recentSignals.sort((a, b) => b.confidence - a.confidence);
    
    for (const signal of sortedSignals) {
      await processSignal(signal);
    }
  }, [processSignal]);

  // Notificação de sistema
  const notifySystem = useCallback(async (title: string, message: string) => {
    const preferences = preferencesRef.current;
    
    if (!preferences.enabled || !preferences.system) return;
    if (permission !== 'granted') return;
    if (isQuietHours()) return;

    try {
      await showSystemNotification(title, message);
      // Notificação de sistema enviada
    } catch (error) {
      // Erro ao enviar notificação de sistema
    }
  }, [permission, isQuietHours, showSystemNotification]);

  // Notificação de conexão perdida
  const notifyConnectionLost = useCallback(async () => {
    await notifySystem(
      'Conexão Perdida',
      'A conexão com o servidor foi perdida. Tentando reconectar...'
    );
  }, [notifySystem]);

  // Notificação de conexão restaurada
  const notifyConnectionRestored = useCallback(async () => {
    await notifySystem(
      'Conexão Restaurada',
      'A conexão com o servidor foi restaurada com sucesso!'
    );
  }, [notifySystem]);

  // Notificação de alta atividade
  const notifyHighActivity = useCallback(async (count: number) => {
    await notifySystem(
      'Alta Atividade Detectada',
      `${count} novos sinais detectados nos últimos minutos!`
    );
  }, [notifySystem]);

  // Limpar cache de sinais processados
  const clearProcessedSignals = useCallback(() => {
    processedSignalsRef.current.clear();
    console.log('🧹 Cache de sinais processados limpo');
  }, []);

  // Status das notificações
  const getNotificationStatus = useCallback(() => {
    const preferences = preferencesRef.current;
    return {
      enabled: preferences.enabled,
      permission,
      isSupported,
      isInitialized,
      isQuietHours: isQuietHours(),
      processedCount: processedSignalsRef.current.size,
      preferences
    };
  }, [permission, isSupported, isInitialized, isQuietHours]);

  return {
    // Funções principais
    processSignal,
    processSignals,
    notifySystem,
    notifyConnectionLost,
    notifyConnectionRestored,
    notifyHighActivity,
    
    // Utilitários
    clearProcessedSignals,
    getNotificationStatus,
    
    // Status
    isSupported,
    permission,
    isInitialized
  };
}