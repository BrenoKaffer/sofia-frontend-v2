'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Clock,
  Activity,
  Shield,
  Zap,
  Settings,
  History
} from 'lucide-react';

interface ErrorRecoveryProps {
  isAutomationActive: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
  onReconnect: () => Promise<void>;
  onRestartAutomation: () => Promise<void>;
  onEmergencyStop: () => void;
}

interface RecoveryAttempt {
  id: string;
  timestamp: Date;
  errorType: string;
  recoveryAction: string;
  status: 'attempting' | 'success' | 'failed';
  duration?: number;
}

interface ErrorLog {
  id: string;
  timestamp: Date;
  errorType: string;
  errorMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export function ErrorRecoverySystem({
  isAutomationActive,
  connectionStatus,
  onReconnect,
  onRestartAutomation,
  onEmergencyStop
}: ErrorRecoveryProps) {
  const [autoRecoveryEnabled, setAutoRecoveryEnabled] = useState(true);
  const [recoveryAttempts, setRecoveryAttempts] = useState<RecoveryAttempt[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [lastRecoveryTime, setLastRecoveryTime] = useState<Date | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');

  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simular logs de erro para demonstração
  useEffect(() => {
    const simulateErrors = () => {
      const errorTypes = [
        'Connection Timeout',
        'Authentication Failed',
        'Bet Execution Failed',
        'Data Parsing Error',
        'Rate Limit Exceeded'
      ];

      const newError: ErrorLog = {
        id: `error-${Date.now()}`,
        timestamp: new Date(),
        errorType: errorTypes[Math.floor(Math.random() * errorTypes.length)],
        errorMessage: 'Erro simulado para demonstração do sistema de recuperação',
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        resolved: Math.random() > 0.3
      };

      setErrorLogs(prev => [newError, ...prev.slice(0, 9)]);
    };

    const interval = setInterval(simulateErrors, 15000);
    return () => clearInterval(interval);
  }, []);

  // Monitoramento de saúde do sistema
  useEffect(() => {
    const checkSystemHealth = () => {
      const recentErrors = errorLogs.filter(error =>
        new Date().getTime() - error.timestamp.getTime() < 5 * 60 * 1000 // últimos 5 minutos
      );

      const criticalErrors = recentErrors.filter(error => error.severity === 'critical').length;
      const highErrors = recentErrors.filter(error => error.severity === 'high').length;

      if (criticalErrors > 0 || consecutiveFailures >= 3) {
        setSystemHealth('critical');
      } else if (highErrors > 2 || consecutiveFailures >= 2) {
        setSystemHealth('warning');
      } else {
        setSystemHealth('healthy');
      }
    };

    healthCheckIntervalRef.current = setInterval(checkSystemHealth, 10000);
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [errorLogs, consecutiveFailures]);

  const executeRecoveryAction = useCallback(async (errorType: string): Promise<boolean> => {
    const recoveryId = `recovery-${Date.now()}`;
    const startTime = Date.now();

    const newAttempt: RecoveryAttempt = {
      id: recoveryId,
      timestamp: new Date(),
      errorType,
      recoveryAction: getRecoveryAction(errorType),
      status: 'attempting'
    };

    setRecoveryAttempts(prev => [newAttempt, ...prev.slice(0, 9)]);
    setIsRecovering(true);
    setRecoveryProgress(0);

    try {
      // Simular progresso de recuperação
      for (let i = 0; i <= 100; i += 10) {
        setRecoveryProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Executar ação de recuperação baseada no tipo de erro
      let success = false;
      switch (errorType) {
        case 'Connection Timeout':
        case 'Authentication Failed':
          await onReconnect();
          success = true;
          break;
        case 'Bet Execution Failed':
        case 'Data Parsing Error':
          await onRestartAutomation();
          success = true;
          break;
        case 'Rate Limit Exceeded':
          // Aguardar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 5000));
          success = true;
          break;
        default:
          success = Math.random() > 0.3; // Simular sucesso/falha
      }

      const duration = Date.now() - startTime;

      setRecoveryAttempts(prev => prev.map(attempt =>
        attempt.id === recoveryId
          ? { ...attempt, status: success ? 'success' : 'failed', duration }
          : attempt
      ));

      if (success) {
        setConsecutiveFailures(0);
        setLastRecoveryTime(new Date());
      } else {
        setConsecutiveFailures(prev => prev + 1);
      }

      return success;
    } catch (error) {
      const duration = Date.now() - startTime;
      setRecoveryAttempts(prev => prev.map(attempt =>
        attempt.id === recoveryId
          ? { ...attempt, status: 'failed', duration }
          : attempt
      ));
      setConsecutiveFailures(prev => prev + 1);
      return false;
    } finally {
      setIsRecovering(false);
      setRecoveryProgress(0);
    }
  }, [onReconnect, onRestartAutomation]);

  const getRecoveryAction = (errorType: string): string => {
    switch (errorType) {
      case 'Connection Timeout': return 'Reconectar ao servidor';
      case 'Authentication Failed': return 'Reautenticar credenciais';
      case 'Bet Execution Failed': return 'Reiniciar sistema de apostas';
      case 'Data Parsing Error': return 'Reiniciar processamento de dados';
      case 'Rate Limit Exceeded': return 'Aguardar e tentar novamente';
      default: return 'Ação de recuperação genérica';
    }
  };

  const handleManualRecovery = async (errorType: string) => {
    if (isRecovering) return;
    await executeRecoveryAction(errorType);
  };

  const handleEmergencyStop = () => {
    setAutoRecoveryEnabled(false);
    onEmergencyStop();
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current);
    }
  };

  const getHealthColor = () => {
    switch (systemHealth) {
      case 'healthy': return 'text-green-500 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'reconnecting': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Geral do Sistema */}
      <Card className={`border-2 ${getHealthColor()}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Sistema de Recuperação de Erros</CardTitle>
            </div>
            <Badge variant={systemHealth === 'healthy' ? 'default' : systemHealth === 'warning' ? 'secondary' : 'destructive'}>
              {systemHealth === 'healthy' ? 'Saudável' :
                systemHealth === 'warning' ? 'Atenção' : 'Crítico'}
            </Badge>
          </div>
          <CardDescription>
            Monitoramento e recuperação automática de falhas do sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status da Conexão */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center space-x-3">
              {getConnectionIcon()}
              <div>
                <p className="text-sm font-medium">Status da Conexão</p>
                <p className="text-xs text-gray-500">
                  {connectionStatus === 'connected' ? 'Conectado' :
                    connectionStatus === 'disconnected' ? 'Desconectado' : 'Reconectando...'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleManualRecovery('Connection Timeout')}
              disabled={isRecovering || connectionStatus === 'connected'}
            >
              Reconectar
            </Button>
          </div>

          {/* Configurações de Recuperação */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div>
              <p className="text-sm font-medium">Recuperação Automática</p>
              <p className="text-xs text-gray-500">Ativar recuperação automática de erros</p>
            </div>
            <Switch
              checked={autoRecoveryEnabled}
              onCheckedChange={setAutoRecoveryEnabled}
            />
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Falhas Consecutivas</p>
              <p className="text-lg font-semibold text-red-600">{consecutiveFailures}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Última Recuperação</p>
              <p className="text-lg font-semibold">
                {lastRecoveryTime ? lastRecoveryTime.toLocaleTimeString() : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Tentativas Hoje</p>
              <p className="text-lg font-semibold">{recoveryAttempts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso de Recuperação */}
      {isRecovering && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Executando Recuperação...</span>
                <span>{Math.round(recoveryProgress)}%</span>
              </div>
              <Progress value={recoveryProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Tentativas de Recuperação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Histórico de Recuperação</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recoveryAttempts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma tentativa de recuperação registrada
              </p>
            ) : (
              recoveryAttempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {attempt.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : attempt.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-blue-500 animate-spin" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{attempt.recoveryAction}</p>
                      <p className="text-xs text-gray-500">
                        {attempt.timestamp.toLocaleTimeString()}
                        {attempt.duration && ` • ${attempt.duration}ms`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    attempt.status === 'success' ? 'default' :
                      attempt.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {attempt.status === 'success' ? 'Sucesso' :
                      attempt.status === 'failed' ? 'Falhou' : 'Tentando...'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log de Erros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Log de Erros Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {errorLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum erro registrado
              </p>
            ) : (
              errorLogs.map((error) => (
                <div key={error.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={`h-4 w-4 ${error.severity === 'critical' ? 'text-red-500' :
                        error.severity === 'high' ? 'text-orange-500' :
                          error.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                    <div>
                      <p className="text-sm font-medium">{error.errorType}</p>
                      <p className="text-xs text-gray-500">
                        {error.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={
                      error.severity === 'critical' ? 'text-red-600' :
                        error.severity === 'high' ? 'text-orange-600' :
                          error.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }>
                      {error.severity.toUpperCase()}
                    </Badge>
                    {error.resolved && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação de Emergência */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Ações de Emergência</CardTitle>
          <CardDescription className="text-red-600">
            Use apenas em situações críticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              variant="destructive"
              onClick={handleEmergencyStop}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Parada de Emergência
            </Button>
            <Button
              variant="outline"
              onClick={() => handleManualRecovery('System Restart')}
              disabled={isRecovering}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reiniciar Sistema
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}