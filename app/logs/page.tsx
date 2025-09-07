'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Copy, Trash2, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  source: string;
  details?: string;
}

const mockLogs: LogEntry[] = [];

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [filter, setFilter] = useState({
    type: '',
    source: '',
    search: ''
  });

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = () => {
    const logText = logs
      .map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] [${log.source}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
  };

  const filteredLogs = logs.filter(log => {
    if (filter.type && log.type !== filter.type) return false;
    if (filter.source && log.source !== filter.source) return false;
    if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-primary" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getLogBadgeStyle = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'success': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-urbanist font-bold tracking-tight">Logs do Sistema</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as atividades e padrões gerados pelo sistema
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={copyLogs}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={clearLogs}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-urbanist">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar nos logs..."
                    className="pl-10"
                    value={filter.search}
                    onChange={(e) => setFilter({...filter, search: e.target.value})}
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={filter.type} onValueChange={(value) => setFilter({...filter, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" className="font-plus-jakarta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-plus-jakarta">Todos os tipos</SelectItem>
                    <SelectItem value="info" className="font-plus-jakarta">Informação</SelectItem>
                    <SelectItem value="warning" className="font-plus-jakarta">Aviso</SelectItem>
                    <SelectItem value="error" className="font-plus-jakarta">Erro</SelectItem>
                    <SelectItem value="success" className="font-plus-jakarta">Sucesso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={filter.source} onValueChange={(value) => setFilter({...filter, source: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fonte" className="font-plus-jakarta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-plus-jakarta">Todas as fontes</SelectItem>
                    <SelectItem value="strategy-service" className="font-plus-jakarta">Estratégias</SelectItem>
                    <SelectItem value="signal-service" className="font-plus-jakarta">Padrões</SelectItem>
                    <SelectItem value="roulette-service" className="font-plus-jakarta">Roletas</SelectItem>
                    <SelectItem value="data-processor" className="font-plus-jakarta">Processador</SelectItem>
                    <SelectItem value="auth-service" className="font-plus-jakarta">Autenticação</SelectItem>
                    <SelectItem value="monitoring-service" className="font-plus-jakarta">Monitoramento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="list">
          <TabsList className="mb-4">
            <TabsTrigger value="list" className="font-plus-jakarta">Lista</TabsTrigger>
            <TabsTrigger value="realtime" className="font-plus-jakarta">Tempo Real</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px] rounded-md border">
                  <div className="p-4 space-y-4">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <div key={log.id} className="flex flex-col space-y-2 p-3 rounded-lg border bg-card/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getLogIcon(log.type)}
                              <Badge variant="outline" className={getLogBadgeStyle(log.type)}>
                                {log.type.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{log.source}</Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {log.timestamp}
                            </div>
                          </div>
                          <p className="text-sm font-plus-jakarta">{log.message}</p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded font-plus-jakarta">
                              {log.details}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Info className="h-8 w-8 mb-2" />
                        <p className="font-plus-jakarta">Nenhum log encontrado com os filtros atuais</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="realtime" className="mt-0">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <div className="animate-pulse-slow">
                    <Clock className="h-12 w-12 mb-4" />
                  </div>
                  <h3 className="text-lg font-urbanist font-medium mb-2">Monitoramento em Tempo Real</h3>
                  <p className="text-center max-w-md font-plus-jakarta">
                    Esta visualização mostrará os logs do sistema em tempo real à medida que são gerados.
                    Funcionalidade será implementada em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}