'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  StopCircle, 
  Play, 
  Pause, 
  RefreshCw, 
  Power, 
  AlertTriangle, 
  Shield, 
  Zap,
  Settings,
  Activity,
  DollarSign,
  Clock,
  Target
} from 'lucide-react';

interface QuickControlsProps {
  isSystemActive: boolean;
  emergencyStopActive: boolean;
  activeSessions: number;
  totalProfit: number;
  onEmergencyStop: () => void;
  onSystemToggle: () => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
  onRestartSystem: () => void;
}

interface SystemStatus {
  cpu: number;
  memory: number;
  network: number;
  queueSize: number;
  responseTime: number;
}

export function QuickControls({
  isSystemActive = false,
  emergencyStopActive = false,
  activeSessions = 0,
  totalProfit = 0,
  onEmergencyStop = () => {},
  onSystemToggle = () => {},
  onPauseAll = () => {},
  onResumeAll = () => {},
  onRestartSystem = () => {}
}: Partial<QuickControlsProps>) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    cpu: 0,
    memory: 0,
    network: 0,
    queueSize: 0,
    responseTime: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');
  const [actionCooldown, setActionCooldown] = useState(0);

  // Simular métricas do sistema
  useEffect(() => {
    if (!isSystemActive) return;

    const interval = setInterval(() => {
      setSystemStatus({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        network: Math.random() * 100,
        queueSize: Math.floor(Math.random() * 50),
        responseTime: Math.floor(Math.random() * 1000) + 100
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSystemActive]);

  // Cooldown para ações
  useEffect(() => {
    if (actionCooldown > 0) {
      const timer = setTimeout(() => {
        setActionCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [actionCooldown]);

  // Executar ação com feedback
  const executeAction = useCallback(async (action: string, callback: () => void) => {
    if (actionCooldown > 0) return;

    setIsLoading(true);
    setLastAction(action);
    
    try {
      await callback();
      setActionCooldown(3); // 3 segundos de cooldown
    } catch (error) {
      console.error(`Erro ao executar ${action}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [actionCooldown]);

  // Obter cor baseada no status
  const getStatusColor = (value: number, thresholds = { warning: 70, danger: 90 }) => {
    if (value >= thresholds.danger) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-4">
      {/* Botão de Emergência */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-800 flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Controles de Emergência</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              variant="destructive"
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4"
              onClick={() => executeAction('Parada de Emergência', onEmergencyStop)}
              disabled={emergencyStopActive || isLoading}
            >
              <StopCircle className="h-6 w-6 mr-2" />
              {emergencyStopActive ? 'SISTEMA PARADO' : 'PARADA DE EMERGÊNCIA'}
            </Button>
            
            {emergencyStopActive && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  Sistema em parada de emergência. Todas as operações foram interrompidas.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controles Rápidos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Controles Rápidos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={isSystemActive ? "destructive" : "default"}
              onClick={() => executeAction('Toggle Sistema', onSystemToggle)}
              disabled={isLoading || actionCooldown > 0}
              className="flex items-center justify-center space-x-2"
            >
              <Power className="h-4 w-4" />
              <span>{isSystemActive ? 'Desligar' : 'Ligar'}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => executeAction('Pausar Todas', onPauseAll)}
              disabled={!isSystemActive || isLoading || actionCooldown > 0}
              className="flex items-center justify-center space-x-2"
            >
              <Pause className="h-4 w-4" />
              <span>Pausar Todas</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => executeAction('Retomar Todas', onResumeAll)}
              disabled={!isSystemActive || isLoading || actionCooldown > 0}
              className="flex items-center justify-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Retomar Todas</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => executeAction('Reiniciar Sistema', onRestartSystem)}
              disabled={isLoading || actionCooldown > 0}
              className="flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Reiniciar</span>
            </Button>
          </div>

          {actionCooldown > 0 && (
            <div className="mt-3 text-sm text-gray-600 text-center">
              Próxima ação disponível em {actionCooldown}s
            </div>
          )}

          {lastAction && (
            <div className="mt-3 text-sm text-green-600 text-center">
              ✓ {lastAction} executado com sucesso
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status do Sistema */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Status do Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Métricas Principais */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sessões Ativas:</span>
                <Badge variant={activeSessions > 0 ? "default" : "secondary"}>
                  {activeSessions}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Lucro Total:</span>
                <span className={`font-medium ${(Number(totalProfit ?? 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {Number(totalProfit ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Métricas de Performance */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU</span>
                  <span className={getStatusColor(systemStatus.cpu)}>
                    {systemStatus.cpu.toFixed(1)}%
                  </span>
                </div>
                <Progress value={systemStatus.cpu} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memória</span>
                  <span className={getStatusColor(systemStatus.memory)}>
                    {systemStatus.memory.toFixed(1)}%
                  </span>
                </div>
                <Progress value={systemStatus.memory} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Rede</span>
                  <span className={getStatusColor(systemStatus.network, { warning: 80, danger: 95 })}>
                    {systemStatus.network.toFixed(1)}%
                  </span>
                </div>
                <Progress value={systemStatus.network} className="h-2" />
              </div>
            </div>

            <Separator />

            {/* Métricas Operacionais */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-gray-600">Fila</div>
                  <div className="font-medium">{systemStatus.queueSize} apostas</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-gray-600">Resposta</div>
                  <div className="font-medium">{systemStatus.responseTime}ms</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas do Sistema */}
      {isSystemActive && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Sistema Ativo</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Monitoramento automático em execução. Use os controles com cuidado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente Separator (caso não exista)
const Separator = ({ className = "" }: { className?: string }) => (
  <div className={`border-t border-gray-200 ${className}`} />
);