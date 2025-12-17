import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  WebSocketClient, 
  WebSocketChannel, 
  ConnectionState, 
  WEBSOCKET_CHANNELS,
  getWebSocketClient 
} from '@/lib/websocket-client';
import { logger } from '@/lib/logger';

// Tipos para o hook
export interface UseWebSocketOptions {
  token?: string;
  autoConnect?: boolean;
  channels?: WebSocketChannel[];
}

export interface UseWebSocketReturn {
  // Estado da conexão
  connectionState: ConnectionState;
  isConnected: boolean;
  isAuthenticated: boolean;
  
  // Métodos de controle
  connect: (token?: string) => Promise<void>;
  disconnect: () => void;
  // Comandos
  sendAutomationCommand: (command: string, data?: any) => boolean;
  
  // Gerenciamento de canais
  subscribe: (channel: WebSocketChannel, callback: (data: any) => void) => () => void;
  unsubscribe: (channel: WebSocketChannel, callback?: (data: any) => void) => void;
  
  // Dados recebidos
  lastMessage: any;
  channelData: Record<string, any>;
  
  // Estatísticas
  reconnectAttempts: number;
  subscriptions: string[];
}

// Hook principal
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { token, autoConnect = true, channels = [] } = options;
  
  // Estados
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [channelData, setChannelData] = useState<Record<string, any>>({});
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  // Refs
  const clientRef = useRef<WebSocketClient | null>(null);
  const subscribersRef = useRef<Map<string, (data: any) => void>>(new Map());
  const unsubscribeFunctionsRef = useRef<Map<string, () => void>>(new Map());

  // Inicializar cliente
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = getWebSocketClient({ token });
      
      // Configurar listeners de eventos
      const onStateChange = () => {
        setConnectionState(clientRef.current!.getState());
        setSubscriptions(clientRef.current!.getSubscriptions());
      };

      const onConnect = () => {
        logger.info('WebSocket conectado via hook');
        setReconnectAttempts(0);
        onStateChange();
      };

      const onDisconnect = () => {
        logger.info('WebSocket desconectado via hook');
        onStateChange();
      };

      const onAuthenticated = () => {
        logger.info('WebSocket autenticado via hook');
        onStateChange();
        
        // Re-inscrever em canais após autenticação
        subscribersRef.current.forEach((callback, channel) => {
          const unsubscribe = clientRef.current!.subscribe(channel as WebSocketChannel, callback);
          unsubscribeFunctionsRef.current.set(channel, unsubscribe);
        });
      };

      const onError = (error: any) => {
        logger.error('Erro no WebSocket via hook:', { metadata: { error } });
        setReconnectAttempts(prev => prev + 1);
      };

      // Adicionar listeners
      clientRef.current.on('connect', onConnect);
      clientRef.current.on('disconnect', onDisconnect);
      clientRef.current.on('authenticated', onAuthenticated);
      clientRef.current.on('error', onError);

      // Cleanup function
      return () => {
        if (clientRef.current) {
          clientRef.current.off('connect', onConnect);
          clientRef.current.off('disconnect', onDisconnect);
          clientRef.current.off('authenticated', onAuthenticated);
          clientRef.current.off('error', onError);
        }
      };
    }
  }, [token]);

  // Auto-conectar se solicitado
  useEffect(() => {
    if (autoConnect && clientRef.current && connectionState === ConnectionState.DISCONNECTED) {
      clientRef.current.connect(token).catch(error => {
        logger.error('Erro na auto-conexão:', { metadata: { error } });
      });
    }
  }, [autoConnect, token, connectionState]);

  // Inscrever-se em canais iniciais
  useEffect(() => {
    if (channels.length > 0 && clientRef.current && connectionState === ConnectionState.AUTHENTICATED) {
      channels.forEach(channel => {
        if (!subscribersRef.current.has(channel)) {
          const callback = (data: any) => {
            setLastMessage({ channel, data, timestamp: Date.now() });
            setChannelData(prev => ({ ...prev, [channel]: data }));
          };
          
          subscribersRef.current.set(channel, callback);
          const unsubscribe = clientRef.current!.subscribe(channel, callback);
          unsubscribeFunctionsRef.current.set(channel, unsubscribe);
        }
      });
    }
  }, [channels, connectionState]);

  // Métodos de controle
  const connect = useCallback(async (connectToken?: string) => {
    if (clientRef.current) {
      try {
        await clientRef.current.connect(connectToken || token);
      } catch (error) {
        logger.error('Erro ao conectar via hook:', { metadata: { error } });
        throw error;
      }
    }
  }, [token]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      // Limpar todas as inscrições
      unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFunctionsRef.current.clear();
      subscribersRef.current.clear();
      
      clientRef.current.disconnect();
      setChannelData({});
      setLastMessage(null);
    }
  }, []);

  // Enviar comandos de automação
  const sendAutomationCommand = useCallback((command: string, data?: any) => {
    if (!clientRef.current) {
      return false;
    }
    return clientRef.current.sendAutomationCommand(command, data);
  }, []);

  // Gerenciamento de canais
  const subscribe = useCallback((channel: WebSocketChannel, callback: (data: any) => void) => {
    if (!clientRef.current) {
      throw new Error('Cliente WebSocket não inicializado');
    }

    // Wrapper para callback que atualiza estados
    const wrappedCallback = (data: any) => {
      setLastMessage({ channel, data, timestamp: Date.now() });
      setChannelData(prev => ({ ...prev, [channel]: data }));
      callback(data);
    };

    subscribersRef.current.set(channel, wrappedCallback);
    
    let unsubscribe: (() => void) | null = null;
    
    if (connectionState === ConnectionState.AUTHENTICATED) {
      unsubscribe = clientRef.current.subscribe(channel, wrappedCallback);
      unsubscribeFunctionsRef.current.set(channel, unsubscribe);
    }

    // Retornar função de cleanup
    return () => {
      subscribersRef.current.delete(channel);
      const existingUnsubscribe = unsubscribeFunctionsRef.current.get(channel);
      if (existingUnsubscribe) {
        existingUnsubscribe();
        unsubscribeFunctionsRef.current.delete(channel);
      }
      
      // Remover dados do canal
      setChannelData(prev => {
        const newData = { ...prev };
        delete newData[channel];
        return newData;
      });
    };
  }, [connectionState]);

  const unsubscribe = useCallback((channel: WebSocketChannel, callback?: (data: any) => void) => {
    if (clientRef.current) {
      const unsubscribeFunc = unsubscribeFunctionsRef.current.get(channel);
      if (unsubscribeFunc) {
        unsubscribeFunc();
        unsubscribeFunctionsRef.current.delete(channel);
      }
      
      subscribersRef.current.delete(channel);
      
      // Remover dados do canal
      setChannelData(prev => {
        const newData = { ...prev };
        delete newData[channel];
        return newData;
      });
    }
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      // Limpar todas as inscrições ao desmontar
      unsubscribeFunctionsRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFunctionsRef.current.clear();
      subscribersRef.current.clear();
    };
  }, []);

  return {
    // Estado da conexão
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.AUTHENTICATED,
    isAuthenticated: connectionState === ConnectionState.AUTHENTICATED,
    
    // Métodos de controle
    connect,
    disconnect,
    
    // Comandos
    sendAutomationCommand,
    
    // Gerenciamento de canais
    subscribe,
    unsubscribe,
    
    // Dados recebidos
    lastMessage,
    channelData,
    
    // Estatísticas
    reconnectAttempts,
    subscriptions
  };
}

// Hook específico para dados de roleta
export function useRouletteData() {
  const { subscribe, channelData, isAuthenticated } = useWebSocket();
  const [rouletteResults, setRouletteResults] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = subscribe(WEBSOCKET_CHANNELS.ROULETTE_RESULTS, (data) => {
        setRouletteResults(prev => [data, ...prev.slice(0, 49)]); // Manter últimos 50 resultados
      });

      return unsubscribe;
    }
  }, [isAuthenticated, subscribe]);

  return {
    currentResult: channelData[WEBSOCKET_CHANNELS.ROULETTE_RESULTS],
    recentResults: rouletteResults,
    isConnected: isAuthenticated
  };
}

// Hook específico para sinais de IA
export function useAISignals() {
  const { subscribe, channelData, isAuthenticated } = useWebSocket();
  const [signals, setSignals] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = subscribe(WEBSOCKET_CHANNELS.AI_SIGNALS, (data) => {
        setSignals(prev => [data, ...prev.slice(0, 19)]); // Manter últimos 20 sinais
      });

      return unsubscribe;
    }
  }, [isAuthenticated, subscribe]);

  return {
    currentSignal: channelData[WEBSOCKET_CHANNELS.AI_SIGNALS],
    recentSignals: signals,
    isConnected: isAuthenticated
  };
}

// Hook específico para métricas em tempo real
export function useLiveMetrics() {
  const { subscribe, channelData, isAuthenticated } = useWebSocket();

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = subscribe(WEBSOCKET_CHANNELS.LIVE_METRICS, () => {
        // Dados já são atualizados automaticamente em channelData
      });

      return unsubscribe;
    }
  }, [isAuthenticated, subscribe]);

  return {
    metrics: channelData[WEBSOCKET_CHANNELS.LIVE_METRICS],
    isConnected: isAuthenticated
  };
}

// Hook para notificações do usuário
export function useUserNotifications() {
  const { subscribe, isAuthenticated } = useWebSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = subscribe(WEBSOCKET_CHANNELS.USER_NOTIFICATIONS, (data) => {
        setNotifications(prev => [data, ...prev]);
      });

      return unsubscribe;
    }
  }, [isAuthenticated, subscribe]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    clearAll,
    isConnected: isAuthenticated
  };
}