'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, 
  Play, 
  Pause, 
  Square, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface IframeMessage {
  type: string;
  data: any;
  timestamp: string;
  source: 'betting-iframe';
}

interface BettingState {
  isConnected: boolean;
  isActive: boolean;
  balance: number;
  lastBet?: {
    amount: number;
    numbers: number[];
    result?: 'win' | 'loss' | 'pending';
  };
  stats: {
    totalBets: number;
    wins: number;
    losses: number;
    netProfit: number;
  };
}

export default function IframeIntegration() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [bettingState, setBettingState] = useState<BettingState>({
    isConnected: false,
    isActive: false,
    balance: 0,
    stats: {
      totalBets: 0,
      wins: 0,
      losses: 0,
      netProfit: 0
    }
  });
  const [messages, setMessages] = useState<IframeMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Configurações do iframe
  const iframeConfig = {
    src: 'https://betgorillas.com/games/roulette',
    sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
    allow: 'camera; microphone; geolocation'
  };

  // Manipular mensagens do iframe
  const handleMessage = useCallback((event: MessageEvent) => {
    // Verificar origem por segurança
    if (!event.origin.includes('betgorillas.com')) {
      console.warn('Mensagem de origem não confiável:', event.origin);
      return;
    }

    try {
      const message: IframeMessage = {
        type: event.data.type || 'unknown',
        data: event.data.data || event.data,
        timestamp: new Date().toISOString(),
        source: 'betting-iframe'
      };

      setMessages(prev => [...prev.slice(-49), message]); // Manter últimas 50 mensagens

      // Processar diferentes tipos de mensagem
      switch (message.type) {
        case 'connection_status':
          setBettingState(prev => ({
            ...prev,
            isConnected: message.data.connected
          }));
          break;

        case 'balance_update':
          setBettingState(prev => ({
            ...prev,
            balance: message.data.balance
          }));
          break;

        case 'bet_placed':
          setBettingState(prev => ({
            ...prev,
            lastBet: {
              amount: message.data.amount,
              numbers: message.data.numbers,
              result: 'pending'
            },
            stats: {
              ...prev.stats,
              totalBets: prev.stats.totalBets + 1
            }
          }));
          break;

        case 'bet_result':
          setBettingState(prev => ({
            ...prev,
            lastBet: prev.lastBet ? {
              ...prev.lastBet,
              result: message.data.won ? 'win' : 'loss'
            } : undefined,
            stats: {
              ...prev.stats,
              wins: prev.stats.wins + (message.data.won ? 1 : 0),
              losses: prev.stats.losses + (message.data.won ? 0 : 1),
              netProfit: prev.stats.netProfit + (message.data.profit || 0)
            }
          }));
          break;

        case 'automation_status':
          setBettingState(prev => ({
            ...prev,
            isActive: message.data.active
          }));
          break;

        case 'error':
          setError(message.data.message || 'Erro desconhecido');
          break;

        default:
          console.log('Mensagem não processada:', message);
      }

    } catch (error) {
      console.error('Erro ao processar mensagem do iframe:', error);
      setError('Erro ao processar mensagem do iframe');
    }
  }, []);

  // Enviar mensagem para o iframe
  const sendMessage = useCallback((type: string, data: any = {}) => {
    if (iframeRef.current?.contentWindow) {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString(),
        source: 'sofia-dashboard'
      };

      iframeRef.current.contentWindow.postMessage(message, '*');
      console.log('Mensagem enviada para iframe:', message);
    }
  }, []);

  // Configurar listeners
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Manipular carregamento do iframe
  const handleIframeLoad = () => {
    setIsLoaded(true);
    setError(null);
    
    // Enviar configuração inicial
    setTimeout(() => {
      sendMessage('init', {
        mode: 'automation',
        settings: {
          maxBetAmount: 5.00,
          minBetAmount: 0.50,
          autoPlay: false
        }
      });
    }, 2000);
  };

  // Controles de automação
  const startAutomation = () => {
    sendMessage('start_automation');
  };

  const stopAutomation = () => {
    sendMessage('stop_automation');
  };

  const pauseAutomation = () => {
    sendMessage('pause_automation');
  };

  const refreshConnection = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setIsLoaded(false);
      setBettingState(prev => ({ ...prev, isConnected: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Status e Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Integração BetGorillas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant={bettingState.isConnected ? "default" : "secondary"}>
                {bettingState.isConnected ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Conectado</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Desconectado</>
                )}
              </Badge>
              
              <Badge variant={bettingState.isActive ? "default" : "outline"}>
                {bettingState.isActive ? (
                  <><Play className="h-3 w-3 mr-1" /> Ativo</>
                ) : (
                  <><Pause className="h-3 w-3 mr-1" /> Pausado</>
                )}
              </Badge>
              
              <Badge variant="outline">
                Saldo: R$ {bettingState.balance.toFixed(2)}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={startAutomation}
                disabled={!bettingState.isConnected || bettingState.isActive}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-1" />
                Iniciar
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={pauseAutomation}
                disabled={!bettingState.isActive}
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={stopAutomation}
                disabled={!bettingState.isActive}
              >
                <Square className="h-4 w-4 mr-1" />
                Parar
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={refreshConnection}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{bettingState.stats.totalBets}</div>
              <div className="text-sm text-muted-foreground">Total Apostas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{bettingState.stats.wins}</div>
              <div className="text-sm text-muted-foreground">Vitórias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{bettingState.stats.losses}</div>
              <div className="text-sm text-muted-foreground">Derrotas</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${bettingState.stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {bettingState.stats.netProfit.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Lucro Líquido</div>
            </div>
          </div>

          {/* Última Aposta */}
          {bettingState.lastBet && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Última Aposta:</span>
                <Badge variant={
                  bettingState.lastBet.result === 'win' ? 'default' :
                  bettingState.lastBet.result === 'loss' ? 'destructive' : 'secondary'
                }>
                  {bettingState.lastBet.result === 'pending' ? 'Pendente' :
                   bettingState.lastBet.result === 'win' ? 'Vitória' : 'Derrota'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Números: {bettingState.lastBet.numbers.join(', ')} • 
                Valor: R$ {bettingState.lastBet.amount.toFixed(2)}
              </div>
            </div>
          )}

          {/* Alertas */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Iframe Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Interface de Apostas
            {!isLoaded && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <iframe
              ref={iframeRef}
              src={iframeConfig.src}
              sandbox={iframeConfig.sandbox}
              allow={iframeConfig.allow}
              onLoad={handleIframeLoad}
              className="w-full h-[600px] border rounded-lg"
              title="BetGorillas Roulette"
            />
            
            {!isLoaded && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando interface...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log de Mensagens (Debug) */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Log de Mensagens (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {messages.slice(-10).map((msg, index) => (
                <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                  <span className="text-blue-600">{msg.type}</span>: {JSON.stringify(msg.data)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}