import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, WebSocketMessage } from '@/lib/websocket-service';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (event: { code: number; reason: string }) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  status: string;
  latency: number | null;
  connect: () => void;
  disconnect: () => void;
  send: (message: WebSocketMessage) => void;
  subscribe: (type: string, callback: (data: any) => void) => () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
    onMessage
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [latency, setLatency] = useState<number | null>(null);
  
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Atualizar status da conexão
  const updateConnectionStatus = useCallback(() => {
    const connected = websocketService.isConnected();
    const currentStatus = websocketService.getStatus();
    
    setIsConnected(connected);
    setStatus(currentStatus);
  }, []);

  // Conectar
  const connect = useCallback(() => {
    websocketService.connect();
  }, []);

  // Desconectar
  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  // Enviar mensagem
  const send = useCallback((message: WebSocketMessage) => {
    websocketService.send(message);
  }, []);

  // Subscrever a tipo de mensagem
  const subscribe = useCallback((type: string, callback: (data: any) => void) => {
    websocketService.on(type, callback);
    
    // Retornar função de cleanup
    return () => {
      websocketService.off(type, callback);
    };
  }, []);

  useEffect(() => {
    // Listeners para eventos de conexão
    const handleConnect = () => {
      updateConnectionStatus();
      optionsRef.current.onConnect?.();
    };

    const handleDisconnect = (event: { code: number; reason: string }) => {
      updateConnectionStatus();
      optionsRef.current.onDisconnect?.(event);
    };

    const handleError = (error: Event) => {
      updateConnectionStatus();
      optionsRef.current.onError?.(error);
    };

    const handleMessage = (message: WebSocketMessage) => {
      optionsRef.current.onMessage?.(message);
    };

    const handleLatency = (latencyMs: number) => {
      setLatency(latencyMs);
    };

    // Registrar listeners
    websocketService.on('connected', handleConnect);
    websocketService.on('disconnected', handleDisconnect);
    websocketService.on('error', handleError);
    websocketService.on('message', handleMessage);
    websocketService.on('latency', handleLatency);

    // Conectar automaticamente se solicitado
    if (autoConnect) {
      connect();
    }

    // Atualizar status inicial
    updateConnectionStatus();

    // Cleanup
    return () => {
      websocketService.off('connected', handleConnect);
      websocketService.off('disconnected', handleDisconnect);
      websocketService.off('error', handleError);
      websocketService.off('message', handleMessage);
      websocketService.off('latency', handleLatency);
    };
  }, [autoConnect, connect, updateConnectionStatus]);

  return {
    isConnected,
    status,
    latency,
    connect,
    disconnect,
    send,
    subscribe
  };
}

// Hook específico para sinais em tempo real
export function useRealtimeSignals() {
  const [signals, setSignals] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { isConnected, subscribe } = useWebSocket({
    autoConnect: true
  });

  useEffect(() => {
    const unsubscribe = subscribe('signal', (data) => {
      setSignals(prev => {
        // Adicionar novo sinal e manter apenas os últimos 50
        const updated = [data, ...prev].slice(0, 50);
        return updated;
      });
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, [subscribe]);

  return {
    signals,
    lastUpdate,
    isConnected
  };
}

// Hook específico para KPIs em tempo real
export function useRealtimeKPIs() {
  const [kpis, setKpis] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { isConnected, subscribe } = useWebSocket({
    autoConnect: true
  });

  useEffect(() => {
    const unsubscribe = subscribe('kpi', (data) => {
      setKpis(data);
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, [subscribe]);

  return {
    kpis,
    lastUpdate,
    isConnected
  };
}

// Hook específico para status das roletas em tempo real
export function useRealtimeRouletteStatus() {
  const [rouletteStatus, setRouletteStatus] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { isConnected, subscribe } = useWebSocket({
    autoConnect: true
  });

  useEffect(() => {
    const unsubscribe = subscribe('roulette_status', (data) => {
      setRouletteStatus(data);
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, [subscribe]);

  return {
    rouletteStatus,
    lastUpdate,
    isConnected
  };
}