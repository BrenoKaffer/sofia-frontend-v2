/**
 * Componente de exemplo mostrando como integrar e usar as APIs do SOFIA
 * Este arquivo serve como referência para implementação
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Target,
  Clock
} from 'lucide-react';

// Importar hooks e contextos
import { useSofia, useSofiaSignals, useSofiaKPIs, useSofiaConnection } from '@/contexts/sofia-context';
import { useRealTimeData } from '@/hooks/use-real-time-data';
import { apiClient } from '@/lib/api-client';

// Componente principal de exemplo
export function ApiIntegrationExample() {
  const { state, actions } = useSofia();
  const signals = useSofiaSignals();
  const kpis = useSofiaKPIs();
  const { isConnected, isLoading, error, lastUpdate } = useSofiaConnection();
  
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [manualData, setManualData] = useState<any>(null);
  const [isManualLoading, setIsManualLoading] = useState(false);

  // Exemplo de uso do hook de dados em tempo real personalizado
  const customRealTimeData = useRealTimeData({
    dataType: 'signals',
    pollingInterval: 10000,
    onData: (data) => {
      console.log('Dados customizados recebidos:', data);
    },
    onError: (error) => {
      console.error('Erro nos dados customizados:', error);
    },
    autoStart: false // Não iniciar automaticamente
  });

  // Função para buscar dados manualmente
  const fetchManualData = async () => {
    setIsManualLoading(true);
    try {
      // Exemplo de múltiplas chamadas de API
      const [signalsResponse, kpisResponse, tablesResponse] = await Promise.all([
        apiClient.getRecentSignals(selectedTable, 10, 70),
        apiClient.getKpisEstrategias(selectedTable),
        apiClient.getPublicTables()
      ]);

      setManualData({
        signals: signalsResponse.data,
        kpis: kpisResponse.data,
        tables: tablesResponse.data
      });
    } catch (error) {
      actions.setError('Erro ao buscar dados manuais');
    } finally {
      setIsManualLoading(false);
    }
  };

  // Função para testar API pública
  const testPublicAPI = async () => {
    try {
      const healthResponse = await apiClient.getPublicSystemHealth();
      const usageResponse = await apiClient.getPublicSystemUsage();
      
      console.log('Health Check:', healthResponse.data);
      console.log('Usage Stats:', usageResponse.data);
    } catch (error) {
      console.error('Erro na API pública:', error);
    }
  };

  // Função para atualizar preferências
  const updatePreferences = async () => {
    try {
      await actions.updateUserPreferences({
        selected_strategies: ['Fibonacci', 'Martingale'],
        selected_tables: [selectedTable],
        notification_settings: {
          sound_enabled: true,
          desktop_notifications: true,
          min_confidence: 75
        }
      });
      alert('Preferências atualizadas com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar preferências');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Exemplo de Integração com APIs SOFIA</h1>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="default" className="gap-1">
              <Wifi className="h-3 w-3" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" />
              Desconectado
            </Badge>
          )}
          {lastUpdate && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {lastUpdate.toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="realtime" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realtime">Dados em Tempo Real</TabsTrigger>
          <TabsTrigger value="manual">Chamadas Manuais</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="public">API Pública</TabsTrigger>
        </TabsList>

        {/* Aba de Dados em Tempo Real */}
        <TabsContent value="realtime" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sinais em Tempo Real */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sinais em Tempo Real ({signals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {signals.slice(0, 5).map((signal, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{signal.strategy}</span>
                        <p className="text-sm text-muted-foreground">{signal.table_id}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={signal.confidence > 80 ? 'default' : 'secondary'}>
                          {signal.confidence}%
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {new Date(signal.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {signals.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum sinal disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* KPIs em Tempo Real */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  KPIs em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {kpis.slice(0, 5).map((kpi, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{kpi.strategy}</span>
                        <p className="text-sm text-muted-foreground">
                          {kpi.signals_count} sinais
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={kpi.roi > 1.5 ? 'default' : 'secondary'}>
                          ROI: {kpi.roi}x
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {kpi.accuracy}% precisão
                        </p>
                      </div>
                    </div>
                  ))}
                  {kpis.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum KPI disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controles de Dados Customizados */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Customizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => customRealTimeData.start()}
                  disabled={customRealTimeData.isActive}
                >
                  Iniciar Dados Customizados
                </Button>
                <Button 
                  onClick={() => customRealTimeData.stop()}
                  disabled={!customRealTimeData.isActive}
                  variant="outline"
                >
                  Parar
                </Button>
                <Button 
                  onClick={() => customRealTimeData.refresh()}
                  disabled={!customRealTimeData.isActive}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Badge variant={customRealTimeData.isConnected ? 'default' : 'secondary'}>
                  {customRealTimeData.isConnected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Chamadas Manuais */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar Dados Manualmente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecionar mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.availableTables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={fetchManualData}
                  disabled={isManualLoading}
                >
                  {isManualLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4 mr-2" />
                  )}
                  Buscar Dados
                </Button>
              </div>

              {manualData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Sinais</h4>
                      <p className="text-2xl font-bold">{manualData.signals?.length || 0}</p>
                    </div>
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">KPIs</h4>
                      <p className="text-2xl font-bold">{manualData.kpis?.length || 0}</p>
                    </div>
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Mesas</h4>
                      <p className="text-2xl font-bold">{manualData.tables?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Preferências */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Preferências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Preferências Atuais:</h4>
                  {state.userPreferences ? (
                    <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(state.userPreferences, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma preferência carregada</p>
                  )}
                </div>
                <Button onClick={updatePreferences}>
                  Atualizar Preferências de Exemplo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de API Pública */}
        <TabsContent value="public" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testar API Pública</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={testPublicAPI}>
                  Testar Health Check e Usage
                </Button>
                <p className="text-sm text-muted-foreground">
                  Verifique o console do navegador para ver os resultados
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botões de Ação Global */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Globais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={actions.refreshData} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar Todos os Dados
            </Button>
            <Button onClick={actions.clearCache} variant="outline">
              Limpar Cache
            </Button>
            <Button 
              onClick={() => actions.setError(null)} 
              variant="outline"
              disabled={!error}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Limpar Erro
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ApiIntegrationExample;