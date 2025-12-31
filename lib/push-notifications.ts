// Serviço de notificações push
import { useState, useEffect } from 'react';
export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: any;
}

export interface SignalNotification {
  strategy: string;
  table: string;
  confidence: number;
  type: 'high_confidence' | 'pattern_detected' | 'system_alert';
  expiresAt?: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.checkSupport();
    this.updatePermissionStatus();
  }

  private checkSupport(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      this.isSupported = false;
      return;
    }

    this.isSupported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
  }

  private updatePermissionStatus(): void {
    if (this.isSupported && typeof Notification !== 'undefined') {
      this.permission = Notification.permission;
    }
  }

  // Verificar se notificações são suportadas
  public isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // Obter status da permissão
  public getPermissionStatus(): NotificationPermission {
    this.updatePermissionStatus();
    return this.permission;
  }

  // Solicitar permissão para notificações
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notificações não são suportadas neste navegador');
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      throw error;
    }
  }

  // Registrar service worker
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported) {
      throw new Error('Service Worker não é suportado');
    }

    // Evitar registro do Service Worker em ambiente de desenvolvimento (com opção para habilitar via flag)
    const enableDevSW = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_SW_DEV === 'true';
    if (process.env.NODE_ENV !== 'production' && !enableDevSW) {
      console.warn('Service Worker desativado em desenvolvimento (defina NEXT_PUBLIC_ENABLE_SW_DEV=true para habilitar).');
      throw new Error('Service Worker desativado em desenvolvimento');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado com sucesso:', registration);
      return registration;
    } catch (error) {
      console.error('Falha ao registrar o Service Worker:', error);
      throw error;
    }
  }
  

  private async waitForServiceWorkerActivation(registration: ServiceWorkerRegistration): Promise<void> {
    return new Promise((resolve) => {
      if (registration.active) {
        resolve();
        return;
      }

      const worker = registration.installing || registration.waiting;
      if (worker) {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Inicializar serviço completo
  public async initialize(): Promise<boolean> {
    try {
      if (!this.isSupported) {
        console.warn('Notificações push não são suportadas');
        return false;
      }

      // Registrar service worker
      await this.registerServiceWorker();

      // Verificar permissão
      if (this.permission === 'default') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          console.warn('Permissão para notificações negada');
          return false;
        }
      } else if (this.permission === 'denied') {
        console.warn('Permissão para notificações foi negada anteriormente');
        return false;
      }

      console.log('Serviço de notificações inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
      return false;
    }
  }

  // Enviar notificação local
  public async showNotification(data: NotificationData): Promise<void> {
    if (this.permission !== 'granted') {
      throw new Error('Permissão para notificações não concedida');
    }

    if (!this.registration) {
      throw new Error('Service Worker não registrado');
    }

    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-72x72.png',
      data: {
        url: data.url || '/dashboard',
        ...data.data
      },
      requireInteraction: true,
      silent: false
    };

    await this.registration.showNotification(data.title, options);
  }

  // Notificação específica para sinais
  public async showSignalNotification(signal: SignalNotification): Promise<void> {
    const title = `🎯 Novo Sinal - ${signal.strategy}`;
    const body = `Mesa ${signal.table} • Confiança: ${signal.confidence}%`;
    
    let icon = '/icon-192x192.png';
    if (signal.confidence >= 90) {
      icon = '/icon-high-confidence.png';
    } else if (signal.confidence >= 75) {
      icon = '/icon-medium-confidence.png';
    }

    await this.showNotification({
      title,
      body,
      icon,
      url: '/dashboard',
      data: {
        type: 'signal',
        strategy: signal.strategy,
        table: signal.table,
        confidence: signal.confidence,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Notificação de sistema
  public async showSystemNotification(title: string, message: string): Promise<void> {
    await this.showNotification({
      title: `🔔 ${title}`,
      body: message,
      icon: '/icon-system.png',
      url: '/dashboard'
    });
  }

  // Limpar todas as notificações
  public async clearAllNotifications(): Promise<void> {
    if (!this.registration) return;

    const notifications = await this.registration.getNotifications();
    notifications.forEach(notification => notification.close());
  }

  // Verificar se há notificações ativas
  public async getActiveNotifications(): Promise<Notification[]> {
    if (!this.registration) return [];
    return await this.registration.getNotifications();
  }

  // Desregistrar service worker
  public async unregister(): Promise<boolean> {
    if (!this.registration) return true;

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      return result;
    } catch (error) {
      console.error('Erro ao desregistrar Service Worker:', error);
      return false;
    }
  }
}

// Instância singleton
export const pushNotificationService = new PushNotificationService();

// Hook para React
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsSupported(pushNotificationService.isNotificationSupported());
    setPermission(pushNotificationService.getPermissionStatus());
  }, []);

  const initialize = async (): Promise<boolean> => {
    const success = await pushNotificationService.initialize();
    setIsInitialized(success);
    setPermission(pushNotificationService.getPermissionStatus());
    return success;
  };

  const requestPermission = async (): Promise<NotificationPermission> => {
    const newPermission = await pushNotificationService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  };

  const showSignalNotification = async (signal: SignalNotification): Promise<void> => {
    await pushNotificationService.showSignalNotification(signal);
  };

  const showSystemNotification = async (title: string, message: string): Promise<void> => {
    await pushNotificationService.showSystemNotification(title, message);
  };

  return {
    isSupported,
    permission,
    isInitialized,
    initialize,
    requestPermission,
    showSignalNotification,
    showSystemNotification,
    clearAll: pushNotificationService.clearAllNotifications.bind(pushNotificationService),
    getActive: pushNotificationService.getActiveNotifications.bind(pushNotificationService)
  };
}
