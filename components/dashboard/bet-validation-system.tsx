'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  TrendingDown, 
  Clock, 
  Target,
  Zap,
  Activity
} from 'lucide-react';

interface BetValidationProps {
  betAmount: number;
  betType: string;
  selectedNumbers: number[];
  currentBalance: number;
  maxBetLimit: number;
  stopLossLimit: number;
  takeProfitLimit: number;
  consecutiveLossesLimit: number;
  currentConsecutiveLosses: number;
  currentProfit: number;
  isAutomationActive: boolean;
  onValidationComplete: (isValid: boolean, errors: string[]) => void;
}

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'checking' | 'passed' | 'failed';
  errorMessage?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function BetValidationSystem({
  betAmount,
  betType,
  selectedNumbers,
  currentBalance,
  maxBetLimit,
  stopLossLimit,
  takeProfitLimit,
  consecutiveLossesLimit,
  currentConsecutiveLosses,
  currentProfit,
  isAutomationActive,
  onValidationComplete
}: BetValidationProps) {
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([
    {
      id: 'balance-check',
      name: 'Verificação de Saldo',
      description: 'Verificar se há saldo suficiente para a aposta',
      status: 'pending',
      severity: 'critical'
    },
    {
      id: 'bet-limit-check',
      name: 'Limite de Aposta',
      description: 'Verificar se a aposta não excede o limite máximo',
      status: 'pending',
      severity: 'high'
    },
    {
      id: 'stop-loss-check',
      name: 'Stop Loss',
      description: 'Verificar se o stop loss não foi atingido',
      status: 'pending',
      severity: 'critical'
    },
    {
      id: 'take-profit-check',
      name: 'Take Profit',
      description: 'Verificar se o take profit foi atingido',
      status: 'pending',
      severity: 'medium'
    },
    {
      id: 'consecutive-losses-check',
      name: 'Perdas Consecutivas',
      description: 'Verificar limite de perdas consecutivas',
      status: 'pending',
      severity: 'high'
    },
    {
      id: 'bet-type-validation',
      name: 'Tipo de Aposta',
      description: 'Validar se o tipo de aposta é válido',
      status: 'pending',
      severity: 'medium'
    },
    {
      id: 'numbers-validation',
      name: 'Números Selecionados',
      description: 'Validar números selecionados para a aposta',
      status: 'pending',
      severity: 'medium'
    },
    {
      id: 'automation-status',
      name: 'Status da Automação',
      description: 'Verificar se a automação está ativa e funcionando',
      status: 'pending',
      severity: 'low'
    }
  ]);

  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'validating' | 'passed' | 'failed'>('idle');

  const validateRule = useCallback(async (rule: ValidationRule): Promise<ValidationRule> => {
    // Simular delay de validação
    await new Promise(resolve => setTimeout(resolve, 300));

    let updatedRule = { ...rule };
    
    switch (rule.id) {
      case 'balance-check':
        if (currentBalance >= betAmount) {
          updatedRule.status = 'passed';
        } else {
          updatedRule.status = 'failed';
          updatedRule.errorMessage = `Saldo insuficiente. Necessário: R$ ${betAmount.toFixed(2)}, Disponível: R$ ${currentBalance.toFixed(2)}`;
        }
        break;

      case 'bet-limit-check':
        if (betAmount <= maxBetLimit) {
          updatedRule.status = 'passed';
        } else {
          updatedRule.status = 'failed';
          updatedRule.errorMessage = `Aposta excede o limite máximo de R$ ${maxBetLimit.toFixed(2)}`;
        }
        break;

      case 'stop-loss-check':
        if (currentProfit > -Math.abs(stopLossLimit)) {
          updatedRule.status = 'passed';
        } else {
          updatedRule.status = 'failed';
          updatedRule.errorMessage = `Stop loss atingido. Perda atual: R$ ${Math.abs(currentProfit).toFixed(2)}`;
        }
        break;

      case 'take-profit-check':
        if (currentProfit < takeProfitLimit) {
          updatedRule.status = 'passed';
        } else {
          updatedRule.status = 'failed';
          updatedRule.errorMessage = `Take profit atingido. Lucro atual: R$ ${currentProfit.toFixed(2)}`;
        }
        break;

      case 'consecutive-losses-check':
        if (currentConsecutiveLosses < consecutiveLossesLimit) {
          updatedRule.status = 'passed';
        } else {
          updatedRule.status = 'failed';
          updatedRule.errorMessage = `Limite de perdas consecutivas atingido: ${currentConsecutiveLosses}/${consecutiveLossesLimit}`;
        }
        break;

      case 'bet-type-validation':
        const validBetTypes = ['straight', 'split', 'street', 'corner', 'line', 'dozen', 'column', 'red', 'black', 'even', 'odd', 'low', 'high'];
        if (validBetTypes.includes(betType.toLowerCase())) {
          updatedRule.status = 'passed';
        } else {
          updatedRule.status = 'failed';
          updatedRule.errorMessage = `Tipo de aposta inválido: ${betType}`;
        }
        break;

      case 'numbers-validation':
        if (selectedNumbers.length > 0 && selectedNumbers.every(num => num >= 0 && num <= 36)) {
          updatedRule.status = 'passed';
        } else {
          updatedRule.status = 'failed';
          updatedRule.errorMessage = 'Números selecionados são inválidos ou não foram especificados';
        }
        break;

      case 'automation-status':
        if (isAutomationActive) {
          updatedRule.status = 'passed';
        } else {
          updatedRule.status = 'failed';
          updatedRule.errorMessage = 'Automação não está ativa';
        }
        break;

      default:
        updatedRule.status = 'failed';
        updatedRule.errorMessage = 'Regra de validação desconhecida';
    }

    return updatedRule;
  }, [betAmount, betType, selectedNumbers, currentBalance, maxBetLimit, stopLossLimit, takeProfitLimit, consecutiveLossesLimit, currentConsecutiveLosses, currentProfit, isAutomationActive]);

  const runValidation = useCallback(async () => {
    setIsValidating(true);
    setValidationProgress(0);
    setOverallStatus('validating');

    const updatedRules: ValidationRule[] = [];
    const errors: string[] = [];

    for (let i = 0; i < validationRules.length; i++) {
      const rule = validationRules[i];
      const validatedRule = await validateRule(rule);
      updatedRules.push(validatedRule);
      
      if (validatedRule.status === 'failed') {
        errors.push(validatedRule.errorMessage || `Falha na validação: ${validatedRule.name}`);
      }

      setValidationRules([...updatedRules, ...validationRules.slice(i + 1)]);
      setValidationProgress(((i + 1) / validationRules.length) * 100);
    }

    const criticalFailures = updatedRules.filter(rule => 
      rule.status === 'failed' && (rule.severity === 'critical' || rule.severity === 'high')
    );

    const isValid = criticalFailures.length === 0;
    setOverallStatus(isValid ? 'passed' : 'failed');
    setIsValidating(false);

    onValidationComplete(isValid, errors);
  }, [validationRules, validateRule, onValidationComplete]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking': return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'passed': return 'border-green-500 bg-green-50';
      case 'failed': return 'border-red-500 bg-red-50';
      case 'validating': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={`w-full ${getOverallStatusColor()}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Sistema de Validação de Apostas</CardTitle>
          </div>
          <Badge variant={overallStatus === 'passed' ? 'default' : overallStatus === 'failed' ? 'destructive' : 'secondary'}>
            {overallStatus === 'passed' ? 'Aprovado' : 
             overallStatus === 'failed' ? 'Rejeitado' : 
             overallStatus === 'validating' ? 'Validando...' : 'Aguardando'}
          </Badge>
        </div>
        <CardDescription>
          Verificação automática de segurança antes da execução da aposta
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informações da Aposta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Valor da Aposta</p>
            <p className="text-lg font-semibold text-green-600">R$ {betAmount.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Saldo Atual</p>
            <p className="text-lg font-semibold">R$ {currentBalance.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Tipo de Aposta</p>
            <p className="text-lg font-semibold">{betType}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Números</p>
            <p className="text-lg font-semibold">{selectedNumbers.join(', ')}</p>
          </div>
        </div>

        <Separator />

        {/* Progresso da Validação */}
        {isValidating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso da Validação</span>
              <span>{Math.round(validationProgress)}%</span>
            </div>
            <Progress value={validationProgress} className="w-full" />
          </div>
        )}

        {/* Lista de Regras de Validação */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Regras de Validação</h4>
          <div className="space-y-2">
            {validationRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(rule.status)}
                  <div>
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-gray-500">{rule.description}</p>
                    {rule.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{rule.errorMessage}</p>
                    )}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={getSeverityColor(rule.severity)}
                >
                  {rule.severity.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        {overallStatus === 'failed' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              A aposta foi rejeitada devido a falhas críticas na validação. Verifique os erros acima antes de tentar novamente.
            </AlertDescription>
          </Alert>
        )}

        {overallStatus === 'passed' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Todas as validações passaram com sucesso. A aposta está aprovada para execução.
            </AlertDescription>
          </Alert>
        )}

        {/* Botão de Validação */}
        <div className="flex justify-center">
          <Button 
            onClick={runValidation}
            disabled={isValidating}
            className="w-full md:w-auto"
          >
            {isValidating ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Executar Validação
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}