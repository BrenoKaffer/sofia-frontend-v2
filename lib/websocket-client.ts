import { logger } from './logger';

// Tipos para WebSocket
export interface WebSocketMessage {
  type:
    | 'subscribe'
    | 'unsubscribe'
    | 'ping'
    | 'pong'
    | 'data'
    | 'error'
    | 'auth'
    | 'automation_command';
  channel?: string;
  data?: any;
  token?: string;
  timestamp?: number;
  // Campos para comandos de automação
  command?: string;
}

export interface WebSocketConfig {
  url?: string;
  token?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

export interface ChannelSubscription {
  channel: string;
  callback: (data: any) => void;
}

// Canais disponíveis
export const WEBSOCKET_CHANNELS = {
  ROULETTE_RESULTS: 'roulette_results',
  AI_SIGNALS: 'ai_signals',
  SYSTEM_STATUS: 'system_status',
  USER_NOTIFICATIONS: 'user_notifications',
  LIVE_METRICS: 'live_metrics',
  AUTOMATION_NOTIFICATIONS: 'automation_notifications',
  BETTING_UPDATES: 'betting_updates',
  SESSION_EVENTS: 'session_events'
} as const;

export type WebSocketChannel = typeof WEBSOCKET_CHANNELS[keyof typeof WEBSOCKET_CHANNELS];

// Estados da conexão
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  ERROR = 'error'
}

// Classe principal do cliente WebSocket
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: config.url || this.getDefaultUrl(),
      token: config.token || '',
      autoReconnect: config.autoReconnect ?? true,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      pingInterval: config.pingInterval || 30000
    };

    // Inicializar listeners de eventos
    Object.values(['connect', 'disconnect', 'error', 'authenticated']).forEach(event => {
      this.eventListeners.set(event, new Set());
    });
  }

  private getDefaultUrl(): string {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_WS_URL || process.env.SOFIA_BACKEND_WS_URL || '';
    const envUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.SOFIA_BACKEND_WS_URL;
    if (envUrl) return envUrl as string;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/websocket`;
  }

  // Conectar ao WebSocket
  async connect(token?: string): Promise<void> {
    if (token) {
      this.config.token = token;
    }

    if (this.state === ConnectionState.CONNECTING || this.state === ConnectionState.CONNECTED) {
      return;
    }

    this.setState(ConnectionState.CONNECTING);

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
      
      // Aguardar conexão
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout na conexão WebSocket'));
        }, 10000);

        this.ws!.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        this.ws!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });

    } catch (error) {
      logger.error('Erro ao conectar WebSocket:', undefined, error as Error);
      this.setState(ConnectionState.ERROR);
      
      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
      
      throw error;
    }
  }

  // Configurar handlers de eventos
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      logger.info('WebSocket conectado');
      this.setState(ConnectionState.CONNECTED);
      this.reconnectAttempts = 0;
      this.emit('connect', {});
      
      // Autenticar se token disponível
      if (this.config.token) {
        this.authenticate(this.config.token);
      }

      // Iniciar ping
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        logger.error('Erro ao processar mensagem WebSocket:', undefined, error as Error);
      }
    };

    this.ws.onclose = (event) => {
      logger.info('WebSocket desconectado', { metadata: { code: event.code, reason: event.reason } });
      this.setState(ConnectionState.DISCONNECTED);
      this.stopPing();
      this.emit('disconnect', { code: event.code, reason: event.reason });

      if (this.config.autoReconnect && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      logger.error('Erro no WebSocket:', undefined, error as unknown as Error);
      this.setState(ConnectionState.ERROR);
      this.emit('error', error);
    };
  }

  // Processar mensagens recebidas
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'data':
        if (message.channel) {
          this.notifySubscribers(message.channel, message.data);
        }
        break;

      case 'pong':
        // Resposta ao ping - conexão ativa
        break;

      case 'error':
        logger.error('Erro do servidor WebSocket:', message.data);
        this.emit('error', message.data);
        break;

      default:
        // Mensagens de sistema (auth, etc.)
        if (message.channel === 'auth' && message.data?.message === 'Autenticado com sucesso') {
          this.setState(ConnectionState.AUTHENTICATED);
          this.emit('authenticated', message.data);
        }
        break;
    }
  }

  // Autenticar conexão
  private authenticate(token: string): void {
    this.send({
      type: 'auth',
      token
    });
  }

  // Enviar mensagem
  private send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn('Tentativa de envio com WebSocket não conectado');
    }
  }

  // Enviar comando de automação
  public sendAutomationCommand(command: string, data?: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isAuthenticated()) {
      this.send({ type: 'automation_command', command, data, timestamp: Date.now() });
      return true;
    }
    logger.warn('Não foi possível enviar comando de automação: WebSocket não autenticado ou desconectado');
    return false;
  }

  // Inscrever-se em canal
  subscribe(channel: WebSocketChannel, callback: (data: any) => void): () => void {
    // Adicionar callback à lista de subscribers
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(callback);

    // Enviar comando de inscrição se conectado
    if (this.state === ConnectionState.AUTHENTICATED) {
      this.send({
        type: 'subscribe',
        channel
      });
    }

    // Retornar função de unsubscribe
    return () => {
      this.unsubscribe(channel, callback);
    };
  }

  // Cancelar inscrição
  unsubscribe(channel: WebSocketChannel, callback?: (data: any) => void): void {
    const subscribers = this.subscriptions.get(channel);
    if (!subscribers) return;

    if (callback) {
      subscribers.delete(callback);
      
      // Se não há mais subscribers, cancelar inscrição no servidor
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
        
        if (this.state === ConnectionState.AUTHENTICATED) {
          this.send({
            type: 'unsubscribe',
            channel
          });
        }
      }
    } else {
      // Remover todos os subscribers do canal
      this.subscriptions.delete(channel);
      
      if (this.state === ConnectionState.AUTHENTICATED) {
        this.send({
          type: 'unsubscribe',
          channel
        });
      }
    }
  }

  // Notificar subscribers de um canal
  private notifySubscribers(channel: string, data: any): void {
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Erro no callback do subscriber:', undefined, error as Error);
        }
      });
    }
  }

  // Gerenciar estado da conexão
  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      logger.info('Estado WebSocket alterado', { metadata: { from: oldState, to: newState } });
    }
  }

  // Agendar reconexão
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.error('Máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info('Agendando reconexão', { 
      metadata: { 
        attempt: this.reconnectAttempts, 
        delay 
      }
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Iniciar ping periódico
  private startPing(): void {
    this.stopPing();
    
    this.pingTimer = setInterval(() => {
      if (this.state === ConnectionState.AUTHENTICATED) {
        this.send({ type: 'ping' });
      }
    }, this.config.pingInterval);
  }

  // Parar ping
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  // Adicionar listener de evento
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(callback);
    
    return () => {
      this.off(event, callback);
    };
  }

  // Remover listener de evento
  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // Emitir evento
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Erro no listener de evento:', undefined, error as Error);
        }
      });
    }
  }

  // Desconectar
  disconnect(): void {
    this.config.autoReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPing();
    
    if (this.ws) {
      this.ws.close(1000, 'Desconexão solicitada pelo cliente');
      this.ws = null;
    }
    
    this.setState(ConnectionState.DISCONNECTED);
  }

  // Getters
  getState(): ConnectionState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED || this.state === ConnectionState.AUTHENTICATED;
  }

  isAuthenticated(): boolean {
    return this.state === ConnectionState.AUTHENTICATED;
  }

  getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // Atualizar token
  updateToken(token: string): void {
    this.config.token = token;
    
    if (this.state === ConnectionState.CONNECTED) {
      this.authenticate(token);
    }
  }
}

// Instância singleton para uso global
let globalWebSocketClient: WebSocketClient | null = null;

export function getWebSocketClient(config?: WebSocketConfig): WebSocketClient {
  if (!globalWebSocketClient) {
    globalWebSocketClient = new WebSocketClient(config);
  }
  return globalWebSocketClient;
}

// Hook para React (se necessário)
export function useWebSocket(config?: WebSocketConfig) {
  const client = getWebSocketClient(config);
  
  return {
    client,
    connect: (token?: string) => client.connect(token),
    disconnect: () => client.disconnect(),
    subscribe: (channel: WebSocketChannel, callback: (data: any) => void) => 
      client.subscribe(channel, callback),
    unsubscribe: (channel: WebSocketChannel, callback?: (data: any) => void) => 
      client.unsubscribe(channel, callback),
    isConnected: () => client.isConnected(),
    isAuthenticated: () => client.isAuthenticated(),
    getState: () => client.getState(),
    on: (event: string, callback: (data: any) => void) => client.on(event, callback),
    off: (event: string, callback: (data: any) => void) => client.off(event, callback)
  };
}
