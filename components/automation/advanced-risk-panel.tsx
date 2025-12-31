import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Target,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';
import { RiskMetrics, AdvancedMetrics, RiskAlert } from '@/types/risk-metrics';

interface AdvancedRiskPanelProps {
  riskMetrics: RiskMetrics;
  advancedMetrics: AdvancedMetrics;
  riskAlerts: RiskAlert[];
}

export function AdvancedRiskPanel({ riskMetrics, advancedMetrics, riskAlerts }: AdvancedRiskPanelProps) {
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'Alto';
    if (score >= 40) return 'Médio';
    return 'Baixo';
  };

  const formatNumber = (value: number, decimals = 2) => {
    return Number.isFinite(value) ? value.toFixed(decimals) : '0.00';
  };

  const formatPercentage = (value: number) => {
    return `${formatNumber(value)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Alertas de Risco
          </h3>
          {riskAlerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                  Score: {alert.riskScore}
                </Badge>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Overall Risk Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Resumo de Risco Geral
          </CardTitle>
          <CardDescription>
            Análise consolidada de risco do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getRiskColor(riskMetrics.overallRiskScore)}`}>
                {formatNumber(riskMetrics.overallRiskScore)}
              </div>
              <div className="text-sm text-muted-foreground">Score de Risco</div>
              <Badge variant="outline" className="mt-1">
                {getRiskLevel(riskMetrics.overallRiskScore)}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(riskMetrics.expectedReturn)}
              </div>
              <div className="text-sm text-muted-foreground">Retorno Esperado</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(riskMetrics.sharpeRatio)}
              </div>
              <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatPercentage(riskMetrics.maxDrawdown)}
              </div>
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Métricas Avançadas de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">ROI</span>
                <span className={`text-sm font-bold ${advancedMetrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(advancedMetrics.roi)}
                </span>
              </div>
              <Progress value={Math.min(Math.abs(advancedMetrics.roi), 100)} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Hit Rate</span>
                <span className="text-sm font-bold text-blue-600">
                  {formatPercentage(advancedMetrics.hitRate)}
                </span>
              </div>
              <Progress value={advancedMetrics.hitRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profit Factor</span>
                <span className="text-sm font-bold text-purple-600">
                  {formatNumber(advancedMetrics.profitFactor)}
                </span>
              </div>
              <Progress value={Math.min(advancedMetrics.profitFactor * 20, 100)} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uso do Bankroll</span>
                <span className="text-sm font-bold text-orange-600">
                  {formatPercentage(advancedMetrics.bankrollUsage)}
                </span>
              </div>
              <Progress value={advancedMetrics.bankrollUsage} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Sequência de Vitórias</span>
                <span className="text-sm font-bold text-green-600">
                  {advancedMetrics.winStreak}
                </span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Sequência de Perdas</span>
                <span className="text-sm font-bold text-red-600">
                  {advancedMetrics.lossStreak}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk by Table */}
      {Object.keys(riskMetrics.tableRisks).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Risco por Mesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(riskMetrics.tableRisks).map(([tableId, risk]) => (
                <div key={tableId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Mesa {tableId}</div>
                    <div className="text-sm text-muted-foreground">
                      Volatilidade: {formatPercentage(risk.volatility)} | 
                      Sharpe: {formatNumber(risk.sharpeRatio)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getRiskColor(risk.riskScore)}`}>
                      {formatNumber(risk.riskScore)}
                    </div>
                    <Badge variant="outline">
                      {getRiskLevel(risk.riskScore)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Recommendations */}
      {riskMetrics.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recomendações de Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskMetrics.recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Indicadores de Saúde do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {formatNumber(riskMetrics.volatility)}
              </div>
              <div className="text-sm text-muted-foreground">Volatilidade</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {formatPercentage(riskMetrics.valueAtRisk)}
              </div>
              <div className="text-sm text-muted-foreground">VaR 95%</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {advancedMetrics.totalBets}
              </div>
              <div className="text-sm text-muted-foreground">Total de Apostas</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                R$ {formatNumber(advancedMetrics.totalProfit)}
              </div>
              <div className="text-sm text-muted-foreground">Lucro Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}