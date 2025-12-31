'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getAlertSound } from '@/lib/alert-sound';

export interface LogAlert {
  id: string;
  level: string;
  message: string;
  context: string;
  user_id?: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface AlertSettings {
  enabled: boolean;
  errorThreshold: number; // Número de erros em X minutos para disparar alerta
  timeWindow: number; // Janela de tempo em minutos
  notificationSound: boolean;
  emailNotifications: boolean;
}

export function useLogAlerts() {
  const [alerts, setAlerts] = useState<LogAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<AlertSettings>({
    enabled: false,
    errorThreshold: 5,
    timeWindow: 10,
    notificationSound: true,
    emailNotifications: false,
  });

  // Buscar alertas não reconhecidos
  const fetchUnacknowledgedAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('level', 'ERROR')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const alertsData: LogAlert[] = data.map(log => ({
        id: log.id,
        level: log.level,
        message: log.message,
        context: log.context,
        user_id: log.user_id,
        timestamp: log.created_at,
        acknowledged: log.acknowledged || false,
      }));

      setAlerts(alertsData);
      setUnreadCount(alertsData.length);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    }
  }, []);

  // Verificar se deve disparar alerta baseado no threshold
  const checkErrorThreshold = useCallback(async () => {
    if (!settings.enabled) return;

    try {
      const timeAgo = new Date();
      timeAgo.setMinutes(timeAgo.getMinutes() - settings.timeWindow);

      const { data, error } = await supabase
        .from('logs')
        .select('id')
        .eq('level', 'ERROR')
        .gte('created_at', timeAgo.toISOString());

      if (error) throw error;

      if (data && data.length >= settings.errorThreshold) {
        // Disparar notificação
        if (settings.notificationSound && 'Notification' in window) {
          new Notification('Alerta de Sistema', {
            body: `${data.length} erros detectados nos últimos ${settings.timeWindow} minutos`,
            icon: '/favicon.ico',
          });
        }

        // Tocar som se habilitado
        if (settings.notificationSound) {
          const alertSound = getAlertSound();
          alertSound.playAlertSequence().catch(() => {
            // Fallback para beep simples
            alertSound.playAlertBeep();
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar threshold de erros:', error);
    }
  }, [settings]);

  // Marcar alerta como reconhecido
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('logs')
        .update({ acknowledged: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao reconhecer alerta:', error);
    }
  }, []);

  // Marcar todos os alertas como reconhecidos
  const acknowledgeAllAlerts = useCallback(async () => {
    try {
      const alertIds = alerts.map(alert => alert.id);
      
      const { error } = await supabase
        .from('logs')
        .update({ acknowledged: true })
        .in('id', alertIds);

      if (error) throw error;

      setAlerts([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao reconhecer todos os alertas:', error);
    }
  }, [alerts]);

  // Atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<AlertSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    localStorage.setItem('logAlertSettings', JSON.stringify({ ...settings, ...newSettings }));
  }, [settings]);

  // Configurar listener em tempo real
  useEffect(() => {
    // Carregar configurações salvas
    const savedSettings = localStorage.getItem('logAlertSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Se alertas estiverem desativados, não configurar listeners nem buscar dados
    if (!settings.enabled) {
      return;
    }

    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Buscar alertas iniciais
    fetchUnacknowledgedAlerts();

    // Configurar listener em tempo real para novos logs de erro
    const channel = supabase
      .channel('log-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'logs',
          filter: 'level=eq.ERROR',
        },
        (payload) => {
          const newLog = payload.new as any;
          const newAlert: LogAlert = {
            id: newLog.id,
            level: newLog.level,
            message: newLog.message,
            context: newLog.context,
            user_id: newLog.user_id,
            timestamp: newLog.created_at,
            acknowledged: false,
          };

          setAlerts(prev => [newAlert, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Tocar som de notificação para novo alerta
          if (settings.notificationSound) {
            const alertSound = getAlertSound();
            alertSound.playNotificationSound();
          }

          // Verificar threshold
          checkErrorThreshold();
        }
      )
      .subscribe();

    // Verificar threshold periodicamente
    const interval = setInterval(checkErrorThreshold, 60000); // A cada minuto

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchUnacknowledgedAlerts, checkErrorThreshold]);

  return {
    alerts,
    unreadCount,
    settings,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    updateSettings,
    refreshAlerts: fetchUnacknowledgedAlerts,
  };
}