'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function TestAlertsPage() {
  const generateErrorLog = async () => {
    try {
      await logger.error('Teste de erro crítico', {
        component: 'TestAlerts',
        userId: 'test-user-123',
        action: 'test_error_generation',
        metadata: {
          timestamp: new Date().toISOString(),
          severity: 'high'
        }
      });
      
      console.log('Log de erro gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar log:', error);
    }
  };

  const generateMultipleErrors = async () => {
    for (let i = 1; i <= 6; i++) {
      await logger.error(`Erro em lote #${i}`, {
        component: 'BatchTest',
        userId: 'batch-user-456',
        action: 'batch_error_generation',
        metadata: {
          batchNumber: i,
          timestamp: new Date().toISOString()
        }
      }, new Error(`Erro simulado em lote #${i}`));
      
      // Pequeno delay entre os logs
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('6 logs de erro gerados em sequência');
  };

  const generateWarningLog = async () => {
    try {
      await logger.warn('Teste de aviso', {
        component: 'TestAlerts',
        userId: 'test-user-123',
        action: 'test_warning_generation',
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('Log de aviso gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar log:', error);
    }
  };

  const generateInfoLog = async () => {
    try {
      await logger.info('Teste de informação', {
        component: 'TestAlerts',
        userId: 'test-user-123',
        action: 'test_info_generation',
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('Log de informação gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar log:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teste de Alertas</h1>
          <p className="text-muted-foreground">
            Use os botões abaixo para gerar logs de teste e verificar o sistema de alertas.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logs Individuais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={generateErrorLog}
                variant="destructive"
                className="w-full"
              >
                Gerar Log de Erro
              </Button>
              
              <Button 
                onClick={generateWarningLog}
                variant="outline"
                className="w-full"
              >
                Gerar Log de Aviso
              </Button>
              
              <Button 
                onClick={generateInfoLog}
                variant="secondary"
                className="w-full"
              >
                Gerar Log de Info
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teste de Threshold</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={generateMultipleErrors}
                variant="destructive"
                className="w-full"
              >
                Gerar 6 Erros (Teste de Threshold)
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Este botão gera 6 logs de erro em sequência para testar o sistema de alertas por threshold.
                O padrão é 5 erros em 10 minutos.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instruções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. <strong>Gerar Log de Erro:</strong> Cria um log de erro individual que aparecerá nos alertas.</p>
              <p>2. <strong>Gerar 6 Erros:</strong> Cria múltiplos erros para testar o sistema de threshold de alertas.</p>
              <p>3. <strong>Verificar Alertas:</strong> Observe o ícone de sino no header para ver os alertas.</p>
              <p>4. <strong>Som:</strong> Se habilitado nas configurações, você ouvirá sons de notificação.</p>
              <p>5. <strong>Notificações:</strong> Se permitidas pelo navegador, você verá notificações do sistema.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}