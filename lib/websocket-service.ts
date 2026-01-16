import { backendService } from './backend-service';

export interface WebSocketMessage {
  type: 'signal' | 'kpi' | 'roulette_status' | 'error' | 'ping' | 'pong';
  data?: any;
  timestamp?: number;
  id?: string;
}

export interface WebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private lastPingTime = 0;

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.SOFIA_BACKEND_WS_URL || '',
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000
    };
  }

  /**
   * Conecta ao WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      if (!this.config.url || this.config.url.trim() === '') {
        console.warn('WebSocket URL não configurada. Pulando conexão.');
        this.isConnecting = false;
        this.emit('error', new Error('WEBSOCKET_URL_MISSING'));
        return;
      }
      // Obter token de autenticação
      const authToken = await this.getAuthToken();
      const wsUrl = authToken 
        ? `${this.config.url}?token=${encodeURIComponent(authToken)}`
        : this.config.url;

      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Desconexão solicitada');
      this.ws = null;
    }
    
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  /**
   * Envia mensagem via WebSocket
   */
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...message,
        timestamp: Date.now(),
        id: this.generateId()
      }));
    } else {
      console.warn('WebSocket não está conectado. Mensagem não enviada:', message);
    }
  }

  /**
   * Adiciona listener para tipo de mensagem
   */
  on(type: string, callback: (data: any) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  /**
   * Remove listener
   */
  off(type: string, callback: (data: any) => void): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.delete(callback);
      if (typeListeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Obtém status da conexão
   */
  getStatus(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined') {
        const { supabase } = await import('./supabase');
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
      }
      return null;
    } catch (error) {
      console.warn('Erro ao obter token para WebSocket:', error);
      return null;
    }
  }

  private handleOpen(): void {
    console.log('WebSocket conectado');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.emit('connected', null);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Responder a ping com pong
      if (message.type === 'ping') {
        this.send({ type: 'pong' });
        return;
      }

      // Processar pong
      if (message.type === 'pong') {
        const latency = Date.now() - this.lastPingTime;
        this.emit('latency', latency);
        return;
      }

      // Emitir mensagem para listeners
      this.emit(message.type, message.data);
      this.emit('message', message);

    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket desconectado:', event.code, event.reason);
    this.isConnecting = false;
    this.clearTimers();
    this.emit('disconnected', { code: event.code, reason: event.reason });
    
    // Tentar reconectar se não foi fechamento intencional
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('Erro no WebSocket:', event);
    this.isConnecting = false;
    this.emit('error', event);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido');
      this.emit('max_reconnect_attempts', null);
      return;
    }

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000
    );

    console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.lastPingTime = Date.now();
        this.send({ type: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private emit(type: string, data: any): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro no listener ${type}:`, error);
        }
      });
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Instância singleton
export const websocketService = new WebSocketService();
