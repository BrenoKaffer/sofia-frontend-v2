import { NextRequest, NextResponse } from 'next/server';
import { WebSocketServer } from 'ws';
import { logger } from '@/lib/logger';
import { AuthService } from '@/lib/auth-service';

// Armazenar conexões WebSocket ativas
const connections = new Map<string, {
  ws: any;
  userId?: string;
  subscriptions: Set<string>;
  lastPing: number;
}>();

const isProd = process.env.NODE_ENV === 'production';

// Tipos de eventos WebSocket
export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'data' | 'error' | 'auth';
  channel?: string;
  data?: any;
  token?: string;
  timestamp?: number;
}

// Canais disponíveis
const CHANNELS = {
  ROULETTE_RESULTS: 'roulette_results',
  AI_SIGNALS: 'ai_signals',
  SYSTEM_STATUS: 'system_status',
  USER_NOTIFICATIONS: 'user_notifications',
  LIVE_METRICS: 'live_metrics'
} as const;

// Classe para gerenciar WebSocket
class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private dataGenerators: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDataGenerators();
  }

  // Inicializar geradores de dados mock
  private initializeDataGenerators() {
    // Gerador de resultados de roleta
    const rouletteGenerator = setInterval(() => {
      const mockResult = {
        tableId: `table_${Math.floor(Math.random() * 5) + 1}`,
        result: Math.floor(Math.random() * 37),
        timestamp: new Date().toISOString(),
        color: this.getRouletteColor(Math.floor(Math.random() * 37)),
        sequence: Math.floor(Math.random() * 1000000)
      };

      this.broadcast(CHANNELS.ROULETTE_RESULTS, mockResult);
    }, 3000); // A cada 3 segundos

    // Gerador de sinais de IA
    const aiSignalsGenerator = setInterval(() => {
      const strategies = ['martingale', 'fibonacci', 'paroli', 'labouchere'];
      const mockSignal = {
        strategy: strategies[Math.floor(Math.random() * strategies.length)],
        confidence: Math.floor(Math.random() * 100),
        recommendation: Math.random() > 0.5 ? 'bet' : 'wait',
        targetNumbers: Array.from({length: Math.floor(Math.random() * 5) + 1}, 
          () => Math.floor(Math.random() * 37)),
        timestamp: new Date().toISOString(),
        tableId: `table_${Math.floor(Math.random() * 5) + 1}`
      };

      this.broadcast(CHANNELS.AI_SIGNALS, mockSignal);
    }, 5000); // A cada 5 segundos

    // Gerador de métricas em tempo real
    const metricsGenerator = setInterval(() => {
      const mockMetrics = {
        activeUsers: Math.floor(Math.random() * 100) + 50,
        totalBets: Math.floor(Math.random() * 1000) + 500,
        winRate: Math.floor(Math.random() * 40) + 30,
        systemLoad: Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString()
      };

      this.broadcast(CHANNELS.LIVE_METRICS, mockMetrics);
    }, 2000); // A cada 2 segundos

    this.dataGenerators.set('roulette', rouletteGenerator);
    this.dataGenerators.set('ai_signals', aiSignalsGenerator);
    this.dataGenerators.set('metrics', metricsGenerator);
  }

  private getRouletteColor(number: number): string {
    if (number === 0) return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(number) ? 'red' : 'black';
  }

  // Broadcast para todos os clientes inscritos em um canal
  private broadcast(channel: string, data: any) {
    const message: WebSocketMessage = {
      type: 'data',
      channel,
      data,
      timestamp: Date.now()
    };

    connections.forEach((connection, connectionId) => {
      if (connection.subscriptions.has(channel)) {
        try {
          connection.ws.send(JSON.stringify(message));
        } catch (error) {
          logger.error(`Erro ao enviar mensagem WebSocket: ${error instanceof Error ? error.message : String(error)}`);
          this.removeConnection(connectionId);
        }
      }
    });
  }

  // Adicionar nova conexão
  addConnection(connectionId: string, ws: any) {
    connections.set(connectionId, {
      ws,
      subscriptions: new Set(),
      lastPing: Date.now()
    });

    logger.info('Nova conexão WebSocket', { metadata: { connectionId } });
  }

  // Remover conexão
  removeConnection(connectionId: string) {
    const connection = connections.get(connectionId);
    if (connection) {
      try {
        connection.ws.close();
      } catch (error) {
        // Ignorar erros ao fechar conexão
      }
      connections.delete(connectionId);
      logger.info('Conexão WebSocket removida', { metadata: { connectionId } });
    }
  }

  // Processar mensagem recebida
  async handleMessage(connectionId: string, message: WebSocketMessage) {
    const connection = connections.get(connectionId);
    if (!connection) return;

    try {
      switch (message.type) {
        case 'auth':
          await this.handleAuth(connectionId, message.token);
          break;

        case 'subscribe':
          if (message.channel && Object.values(CHANNELS).includes(message.channel as any)) {
            connection.subscriptions.add(message.channel);
            this.sendToConnection(connectionId, {
              type: 'data',
              channel: 'system',
              data: { message: `Inscrito no canal: ${message.channel}` }
            });
          }
          break;

        case 'unsubscribe':
          if (message.channel) {
            connection.subscriptions.delete(message.channel);
            this.sendToConnection(connectionId, {
              type: 'data',
              channel: 'system',
              data: { message: `Desinscrito do canal: ${message.channel}` }
            });
          }
          break;

        case 'ping':
          connection.lastPing = Date.now();
          this.sendToConnection(connectionId, { type: 'pong' });
          break;

        default:
          this.sendToConnection(connectionId, {
            type: 'error',
            data: { message: 'Tipo de mensagem não reconhecido' }
          });
      }
    } catch (error) {
      logger.error(`Erro ao processar mensagem WebSocket: ${error instanceof Error ? error.message : String(error)}`);
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Erro interno do servidor' }
      });
    }
  }

  // Autenticar conexão
  private async handleAuth(connectionId: string, token?: string) {
    const connection = connections.get(connectionId);
    if (!connection || !token) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Token de autenticação obrigatório' }
      });
      return;
    }

    try {
      const { user, error } = await AuthService.validateToken(token);

      if (error || !user) {
        this.sendToConnection(connectionId, {
          type: 'error',
          data: { message: 'Token inválido' }
        });
        return;
      }

      connection.userId = user.id;
      this.sendToConnection(connectionId, {
        type: 'data',
        channel: 'auth',
        data: { 
          message: 'Autenticado com sucesso',
          userId: user.id,
          availableChannels: Object.values(CHANNELS)
        }
      });

      logger.info('Conexão WebSocket autenticada', {
        userId: user.id,
        metadata: { connectionId }
      });

    } catch (error) {
      logger.error(`Erro na autenticação WebSocket: ${error instanceof Error ? error.message : String(error)}`);
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Erro na autenticação' }
      });
    }
  }

  // Enviar mensagem para conexão específica
  private sendToConnection(connectionId: string, message: WebSocketMessage) {
    const connection = connections.get(connectionId);
    if (connection) {
      try {
        connection.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Erro ao enviar mensagem: ${error instanceof Error ? error.message : String(error)}`);
        this.removeConnection(connectionId);
      }
    }
  }

  // Cleanup de conexões inativas
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1 minuto

      connections.forEach((connection, connectionId) => {
        if (now - connection.lastPing > timeout) {
          logger.info('Removendo conexão inativa', { metadata: { connectionId } });
          this.removeConnection(connectionId);
        }
      });
    }, 30000); // Verificar a cada 30 segundos
  }

  // Obter estatísticas
  getStats() {
    return {
      totalConnections: connections.size,
      authenticatedConnections: Array.from(connections.values())
        .filter(conn => conn.userId).length,
      channelSubscriptions: Array.from(connections.values())
        .reduce((acc, conn) => {
          conn.subscriptions.forEach(channel => {
            acc[channel] = (acc[channel] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>)
    };
  }
}

// Instância global do gerenciador (desabilitada em produção para evitar timers em Vercel)
const wsManager = !isProd ? new WebSocketManager() : null;
if (wsManager) {
  wsManager.startCleanup();
}

// GET - Informações sobre WebSocket
export async function GET() {
  try {
    const stats = wsManager ? wsManager.getStats() : {
      totalConnections: 0,
      authenticatedConnections: 0,
      channelSubscriptions: {}
    };
    
    return NextResponse.json({
      success: true,
      data: {
        websocket_url: process.env.NEXT_PUBLIC_WS_URL || process.env.SOFIA_BACKEND_WS_URL || '',
        available_channels: Object.values(CHANNELS),
        current_stats: stats,
        connection_info: {
          auth_required: true,
          ping_interval: 30000,
          timeout: 60000
        }
      },
      message: 'Informações do WebSocket'
    });

  } catch (error) {
    logger.error(`Erro ao obter informações do WebSocket: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Enviar mensagem para canal específico (admin only)
export async function POST(req: NextRequest) {
  try {
    if (!wsManager) {
      return NextResponse.json(
        { error: 'WebSocket manager desabilitado em produção' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { channel, data, target_user } = body;

    // Validar autenticação de admin
    const token = AuthService.extractToken(req);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação obrigatório' },
        { status: 401 }
      );
    }

    const { user, error } = await AuthService.validateToken(token);
    if (error || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const fullUser = await AuthService.getUserWithRole(user.id);
    if (!fullUser || fullUser.role?.level !== 100) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    // Validar canal
    if (!Object.values(CHANNELS).includes(channel)) {
      return NextResponse.json(
        { error: 'Canal inválido' },
        { status: 400 }
      );
    }

    // Enviar mensagem
    if (target_user) {
      // Enviar para usuário específico
      const targetConnection = Array.from(connections.entries())
        .find(([_, conn]) => conn.userId === target_user);
      
      if (targetConnection) {
        const [connectionId] = targetConnection;
        wsManager['sendToConnection'](connectionId, {
          type: 'data',
          channel,
          data,
          timestamp: Date.now()
        });
      }
    } else {
      // Broadcast para todos no canal
      wsManager['broadcast'](channel, data);
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso'
    });

  } catch (error) {
    logger.error(`Erro ao enviar mensagem WebSocket: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Documentação da API
// API Documentation removed for Next.js compatibility
// WebSocket API - Endpoints para gerenciamento de WebSocket em tempo real
// GET /api/websocket - Obter informações sobre WebSocket e estatísticas
// POST /api/websocket - Enviar mensagem para canal específico
