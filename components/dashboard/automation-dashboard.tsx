'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Globe, 
  Zap, 
  Shield, 
  Play, 
  Pause, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Activity,
  Eye,
  EyeOff,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Monitor,
  Chrome,
  StopCircle,
  Power,
  Gauge,
  BarChart3,
  Users,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';

// Interfaces
interface AutomationSession {
  id: string;
  tableId: string;
  strategy: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
  provider: string;
  startTime: string;
  stats: {
    totalBets: number;
    wins: number;
    losses: number;
    profit: number;
    winRate: number;
  };
}

interface BettingProvider {
  id: string;
  name: string;
  type: 'api' | 'puppeteer' | 'iframe';
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  priority: number;
  capabilities: {
    maxStake: number;
    minStake: number;
    supportsConcurrentBets: boolean;
    executionSpeed: 'fast' | 'medium' | 'slow';
    reliability: 'high' | 'medium' | 'low';
  };
  stats: {
    totalBets: number;
    successRate: number;
    avgResponseTime: number;
  };
}

interface AutomationConfig {
  maxConcurrentSessions: number;
  defaultStake: number;
  maxStake: number;
  stopLossLimit: number;
  takeProfitLimit: number;
  maxConsecutiveLosses: number;
  betDelay: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  autoRestart: boolean;
  emergencyStop: boolean;
}

interface SystemStatus {
  isInitialized: boolean;
  isRunning: boolean;
  connectedProviders: string[];
  activeSessions: number;
  queueSize: number;
  totalProfit: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  lastUpdate: Date;
}

interface AutomationDashboardProps {
  tableId?: string;
  suggestedBets?: (string | number)[];
  strategyName?: string;
  systemStatus?: SystemStatus;
  onStatusChange?: (status: SystemStatus) => void;
}

export function AutomationDashboard({
  tableId = 'default',
  suggestedBets = [],
  strategyName = 'Default Strategy',
  systemStatus: externalStatus,
  onStatusChange
}: AutomationDashboardProps) {
  // Estados principais
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(
    externalStatus || {
      isInitialized: false,
      isRunning: false,
      connectedProviders: [],
      activeSessions: 0,
      queueSize: 0,
      totalProfit: 0,
      systemHealth: 'healthy',
      lastUpdate: new Date()
    }
  );

  // Sync with external status
  useEffect(() => {
    if (externalStatus) {
      setSystemStatus(externalStatus);
    }
  }, [externalStatus]);

  const [isSystemActive, setIsSystemActive] = useState(false);
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Estados de configuração
  const [config, setConfig] = useState<AutomationConfig>({
    maxConcurrentSessions: 3,
    defaultStake: 5,
    maxStake: 50,
    stopLossLimit: 100,
    takeProfitLimit: 200,
    maxConsecutiveLosses: 5,
    betDelay: 3000,
    riskLevel: 'moderate',
    autoRestart: true,
    emergencyStop: false
  });

  // Estados de dados
  const [sessions, setSessions] = useState<AutomationSession[]>([]);
  const [providers, setProviders] = useState<BettingProvider[]>([
    {
      id: 'api-primary',
      name: 'API Primary',
      type: 'api',
      status: 'disconnected',
      priority: 1,
      capabilities: {
        maxStake: 1000,
        minStake: 1,
        supportsConcurrentBets: true,
        executionSpeed: 'fast',
        reliability: 'high'
      },
      stats: {
        totalBets: 0,
        successRate: 0,
        avgResponseTime: 0
      }
    },
    {
      id: 'puppeteer-betgorillas',
      name: 'BetGorillas (Puppeteer)',
      type: 'puppeteer',
      status: 'disconnected',
      priority: 2,
      capabilities: {
        maxStake: 500,
        minStake: 1,
        supportsConcurrentBets: false,
        executionSpeed: 'slow',
        reliability: 'medium'
      },
      stats: {
        totalBets: 0,
        successRate: 0,
        avgResponseTime: 0
      }
    },
    {
      id: 'iframe-fallback',
      name: 'iFrame Fallback',
      type: 'iframe',
      status: 'disconnected',
      priority: 3,
      capabilities: {
        maxStake: 100,
        minStake: 1,
        supportsConcurrentBets: false,
        executionSpeed: 'medium',
        reliability: 'low'
      },
      stats: {
        totalBets: 0,
        successRate: 0,
        avgResponseTime: 0
      }
    }
  ]);

  const [systemMetrics, setSystemMetrics] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalBets: 0,
    totalProfit: 0,
    systemUptime: '00:00:00',
    queueSize: 0,
    avgResponseTime: 0
  });

  const [logs, setLogs] = useState<Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
    source: string;
  }>>([]);

  // Refs
  const logEndRef = useRef<HTMLDivElement>(null);

  // Função para adicionar logs
  const addLog = useCallback((message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info', source: string = 'system') => {
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      source
    };
    
    setLogs(prev => [...prev.slice(-99), newLog]); // Manter apenas os últimos 100 logs
  }, []);

  // Auto-scroll dos logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Inicializar sistema de automação
  const initializeSystem = useCallback(async () => {
    try {
      addLog('🚀 Inicializando sistema de automação...', 'info');
      
      const response = await fetch('/api/automation/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        throw new Error('Falha ao inicializar sistema');
      }

      const result = await response.json();
      
      if (result.success) {
        setIsSystemActive(true);
        addLog('✅ Sistema de automação inicializado com sucesso', 'success');
        
        // Conectar provedores
        await connectProviders();
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }

    } catch (error) {
      addLog(`❌ Erro ao inicializar sistema: ${error}`, 'error');
    }
  }, [config, addLog]);

  // Conectar provedores
  const connectProviders = useCallback(async () => {
    for (const provider of providers) {
      try {
        addLog(`🔌 Conectando ${provider.name}...`, 'info', provider.id);
        
        setProviders(prev => prev.map(p => 
          p.id === provider.id ? { ...p, status: 'connecting' } : p
        ));

        const response = await fetch(`/api/automation/providers/${provider.id}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (result.success) {
          setProviders(prev => prev.map(p => 
            p.id === provider.id ? { ...p, status: 'connected' } : p
          ));
          addLog(`✅ ${provider.name} conectado`, 'success', provider.id);
        } else {
          throw new Error(result.error || 'Falha na conexão');
        }

      } catch (error) {
        setProviders(prev => prev.map(p => 
          p.id === provider.id ? { ...p, status: 'error' } : p
        ));
        addLog(`❌ Erro ao conectar ${provider.name}: ${error}`, 'error', provider.id);
      }
    }
  }, [providers, addLog]);

  // Parar sistema (emergência)
  const emergencyStopSystem = useCallback(async () => {
    try {
      addLog('🚨 PARADA DE EMERGÊNCIA ATIVADA', 'warning');
      
      setEmergencyStop(true);
      setIsSystemActive(false);

      const response = await fetch('/api/automation/emergency-stop', {
        method: 'POST'
      });

      if (response.ok) {
        addLog('✅ Sistema parado com segurança', 'success');
        setSessions([]);
      } else {
        addLog('⚠️ Erro na parada de emergência - verificar manualmente', 'error');
      }

    } catch (error) {
      addLog(`❌ Erro na parada de emergência: ${error}`, 'error');
    }
  }, [addLog]);

  // Iniciar sessão de automação
  const startAutomationSession = useCallback(async () => {
    if (!isSystemActive) {
      addLog('❌ Sistema não está ativo', 'error');
      return;
    }

    try {
      addLog(`🎯 Iniciando sessão para ${strategyName}...`, 'info');

      const response = await fetch('/api/automation/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          strategy: strategyName,
          suggestedBets,
          config: {
            stake: config.defaultStake,
            maxStake: config.maxStake,
            stopLoss: config.stopLossLimit,
            takeProfit: config.takeProfitLimit
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        const newSession: AutomationSession = {
          id: result.sessionId,
          tableId,
          strategy: strategyName,
          status: 'active',
          provider: result.provider,
          startTime: new Date().toISOString(),
          stats: {
            totalBets: 0,
            wins: 0,
            losses: 0,
            profit: 0,
            winRate: 0
          }
        };

        setSessions(prev => [...prev, newSession]);
        addLog(`✅ Sessão ${result.sessionId} iniciada`, 'success');
      } else {
        throw new Error(result.error || 'Falha ao iniciar sessão');
      }

    } catch (error) {
      addLog(`❌ Erro ao iniciar sessão: ${error}`, 'error');
    }
  }, [isSystemActive, tableId, strategyName, suggestedBets, config, addLog]);

  // Parar sessão específica
  const stopSession = useCallback(async (sessionId: string) => {
    try {
      addLog(`🛑 Parando sessão ${sessionId}...`, 'info');

      const response = await fetch(`/api/automation/sessions/${sessionId}/stop`, {
        method: 'POST'
      });

      if (response.ok) {
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, status: 'stopped' } : s
        ));
        addLog(`✅ Sessão ${sessionId} parada`, 'success');
      } else {
        throw new Error('Falha ao parar sessão');
      }

    } catch (error) {
      addLog(`❌ Erro ao parar sessão: ${error}`, 'error');
    }
  }, [addLog]);

  // Atualizar métricas do sistema
  useEffect(() => {
    if (!isSystemActive) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/automation/metrics');
        if (response.ok) {
          const metrics = await response.json();
          setSystemMetrics(metrics);
        }
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isSystemActive]);

  // Renderizar status do provedor
  const renderProviderStatus = (provider: BettingProvider) => {
    const statusColors = {
      connected: 'bg-green-500',
      disconnected: 'bg-gray-500',
      connecting: 'bg-yellow-500',
      error: 'bg-red-500'
    };

    const statusIcons = {
      connected: <Wifi className="h-4 w-4" />,
      disconnected: <WifiOff className="h-4 w-4" />,
      connecting: <RefreshCw className="h-4 w-4 animate-spin" />,
      error: <AlertTriangle className="h-4 w-4" />
    };

    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${statusColors[provider.status]}`} />
          <div>
            <div className="font-medium">{provider.name}</div>
            <div className="text-sm text-gray-500">
              {provider.type.toUpperCase()} • Prioridade {provider.priority}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {statusIcons[provider.status]}
          <Badge variant={provider.status === 'connected' ? 'default' : 'secondary'}>
            {provider.status}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header de Controle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>Sistema de Automação SOFIA</span>
              </CardTitle>
              <CardDescription>
                Controle unificado de automação de apostas
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isSystemActive ? 'default' : 'secondary'}>
                {isSystemActive ? 'ATIVO' : 'INATIVO'}
              </Badge>
              {isSystemActive && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={emergencyStopSystem}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  EMERGÊNCIA
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {!isSystemActive ? (
              <Button onClick={initializeSystem} className="bg-green-600 hover:bg-green-700">
                <Power className="h-4 w-4 mr-2" />
                Inicializar Sistema
              </Button>
            ) : (
              <Button onClick={startAutomationSession}>
                <Play className="h-4 w-4 mr-2" />
                Nova Sessão
              </Button>
            )}
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Activity className="h-4 w-4" />
              <span>Sessões Ativas: {systemMetrics.activeSessions}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>Lucro Total: R$ {Number(systemMetrics.totalProfit ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Controle */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="providers">Provedores</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Métricas do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Uptime:</span>
                    <span className="text-sm font-mono">{systemMetrics.systemUptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fila:</span>
                    <span className="text-sm">{systemMetrics.queueSize} apostas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Resp. Média:</span>
                    <span className="text-sm">{systemMetrics.avgResponseTime}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Configuração Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Aposta Padrão:</span>
                    <span className="text-sm">R$ {config.defaultStake}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Stop Loss:</span>
                    <span className="text-sm">R$ {config.stopLossLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Risco:</span>
                    <Badge variant="outline" className="text-xs">
                      {config.riskLevel}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status dos Provedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {providers.map(provider => (
                    <div key={provider.id} className="flex items-center justify-between">
                      <span className="text-sm">{provider.name}:</span>
                      <div className={`w-2 h-2 rounded-full ${
                        provider.status === 'connected' ? 'bg-green-500' :
                        provider.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sessões Ativas */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma sessão ativa</p>
                    <p className="text-sm">Inicie uma nova sessão para começar a automação</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              sessions.map(session => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{session.strategy}</CardTitle>
                        <CardDescription>
                          Mesa: {session.tableId} • Provedor: {session.provider}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stopSession(session.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Apostas</div>
                        <div className="font-medium">{session.stats.totalBets}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Vitórias</div>
                        <div className="font-medium text-green-600">{session.stats.wins}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Derrotas</div>
                        <div className="font-medium text-red-600">{session.stats.losses}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Taxa de Acerto</div>
                        <div className="font-medium">{session.stats.winRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Lucro</div>
                        <div className={`font-medium ${session.stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {session.stats.profit.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Provedores */}
        <TabsContent value="providers" className="space-y-4">
          <div className="space-y-4">
            {providers.map(provider => renderProviderStatus(provider))}
          </div>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logs do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-1">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start space-x-2 text-sm font-mono">
                      <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                      <span className={`shrink-0 ${
                        log.level === 'error' ? 'text-red-600' :
                        log.level === 'warning' ? 'text-yellow-600' :
                        log.level === 'success' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="text-gray-500 shrink-0">[{log.source}]</span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}