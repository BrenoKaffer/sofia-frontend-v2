'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Copy, Trash2, AlertTriangle, Info, CheckCircle, Clock, RefreshCw, Filter, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { logger, LogLevel, LogEntry, SystemLogEntry, LogLevelString } from '@/lib/logger';
import { ExportDialog } from '@/components/logs/export-dialog';

// Interface específica para a UI que inclui id
interface UILogEntry extends Omit<LogEntry, 'level'> {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  source?: string;
  details?: string;
}

// Função para converter LogEntry do sistema para o formato da interface
const convertSystemLogToUILog = (systemLog: SystemLogEntry, index: number): UILogEntry => {
  const logLevelToType: Record<string, 'error' | 'warning' | 'info'> = {
    'ERROR': 'error' as const,
    'WARN': 'warning' as const,
    'INFO': 'info' as const,
    'DEBUG': 'info' as const,
  };

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(',', '');
  };

  const getSource = (context?: any): string => {
    if (context?.component) {
      return context.component.toLowerCase().replace(/\s+/g, '-');
    }
    return 'system';
  };

  const getDetails = (context?: any): string | undefined => {
    const details: string[] = [];
    
    if (context?.action) {
      details.push(`Ação: ${context.action}`);
    }
    
    if (context?.metadata) {
      const metadata = context.metadata;
      Object.entries(metadata).forEach(([key, value]) => {
        if (typeof value === 'object') {
          details.push(`${key}: ${JSON.stringify(value)}`);
        } else {
          details.push(`${key}: ${value}`);
        }
      });
    }
    
    return details.length > 0 ? details.join(' | ') : undefined;
  };

  return {
    id: `${Date.now()}-${index}`,
    timestamp: formatTimestamp(systemLog.timestamp),
    type: logLevelToType[systemLog.level],
    message: systemLog.message,
    source: getSource(systemLog.context),
    details: getDetails(systemLog.context),
  };
};

export default function LogsPage() {
  const [logs, setLogs] = useState<UILogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para filtros avançados
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    context: '',
    level: 'all',
    search: '',
    timeRange: 'all', // novo: intervalo predefinido
    searchInDetails: false // novo: buscar nos detalhes
  });
  const [availableContexts, setAvailableContexts] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<{[key: string]: typeof filters}>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Estado para busca em tempo real
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [pageSize, setPageSize] = useState(50); // logs por página

  const loadLogs = useCallback(async (filterParams = filters, page = currentPage) => {
    setIsLoading(true);
    try {
      // Aplicar intervalos de tempo predefinidos
      let adjustedFilters = { ...filterParams };
      if (filterParams.timeRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (filterParams.timeRange) {
          case '1h':
            startDate.setHours(now.getHours() - 1);
            break;
          case '24h':
            startDate.setDate(now.getDate() - 1);
            break;
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        }
        
        adjustedFilters.startDate = startDate.toISOString().slice(0, 16);
        adjustedFilters.endDate = now.toISOString().slice(0, 16);
      }
      
      // Construir parâmetros de consulta para a API
      const queryParams = new URLSearchParams();
      
      if (adjustedFilters.level && adjustedFilters.level !== 'all') {
        queryParams.append('level', adjustedFilters.level);
      }
      if (adjustedFilters.startDate) {
        queryParams.append('startDate', adjustedFilters.startDate);
      }
      if (adjustedFilters.endDate) {
        queryParams.append('endDate', adjustedFilters.endDate);
      }
      if (adjustedFilters.userId) {
        queryParams.append('userId', adjustedFilters.userId);
      }
      if (adjustedFilters.context) {
        queryParams.append('context', adjustedFilters.context);
      }
      if (adjustedFilters.search) {
        queryParams.append('search', adjustedFilters.search);
        if (adjustedFilters.searchInDetails) {
          queryParams.append('searchInDetails', 'true');
        }
      }
      
      // Adicionar parâmetros de paginação
      const offset = (page - 1) * pageSize;
      queryParams.append('limit', pageSize.toString());
      queryParams.append('offset', offset.toString());
      
      // Fazer requisição para API com filtros e paginação
      const response = await fetch(`/api/logs?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar logs da API');
      }
      
      const result = await response.json();
      const databaseLogs = result.data || result; // suportar tanto formato paginado quanto simples
      const total = result.total || databaseLogs.length;
      setSystemLogs(databaseLogs);
      
      // Atualizar informações de paginação
      setTotalLogs(total);
      setTotalPages(Math.ceil(total / pageSize));
      setCurrentPage(page);
      
      // Converter logs do banco para o formato da UI
      const convertedLogs = databaseLogs.map((log: SystemLogEntry, index: number) => ({
        id: log.id || `log-${index}`,
        timestamp: new Date(log.created_at || '').toLocaleString('pt-BR').replace(',', ''),
        type: log.level.toLowerCase() as 'info' | 'warning' | 'error' | 'success',
        message: log.message,
        source: log.context || 'Sistema',
        details: log.details ? JSON.stringify(log.details) : undefined
      })); // Não reverter aqui pois a API já ordena por data decrescente
      setLogs(convertedLogs);
      
      // Extrair contextos e usuários únicos para os filtros (apenas na primeira página)
      if (page === 1) {
        const contexts = Array.from(new Set(databaseLogs.map((log: SystemLogEntry) => log.context).filter(Boolean))) as string[];
        const users = Array.from(new Set(databaseLogs.map((log: SystemLogEntry) => log.user_id).filter(Boolean))) as string[];
        setAvailableContexts(contexts);
        setAvailableUsers(users);
      }
      
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      // Fallback para logs locais se houver erro
       const localLogs = logger.getLogs();
       const convertedLogs = localLogs.map((log, index) => ({
         id: `log-${index}`,
         timestamp: log.timestamp.toLocaleString().replace(',', ''),
         type: LogLevelString[log.level].toLowerCase() as 'info' | 'warning' | 'error' | 'success',
         message: log.message,
         source: typeof log.context === 'string' ? log.context : (log.context?.component || 'Sistema'),
         details: log.context ? JSON.stringify(log.context) : undefined
       })).reverse();
       setLogs(convertedLogs);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Carregar logs na inicialização
  useEffect(() => {
    loadLogs();
  }, []);

  // Atualizar contagem de filtros ativos
  useEffect(() => {
    const count = Object.entries(filters).filter(([key, value]) => {
      if (key === 'level' && value === 'all') return false;
      if (key === 'timeRange' && value === 'all') return false;
      if (key === 'searchInDetails') return false; // não conta como filtro ativo
      return value !== '' && value !== false;
    }).length;
    setActiveFiltersCount(count);
  }, [filters]);

  // Busca em tempo real com debounce
  useEffect(() => {
    // Limpar timeout anterior se existir
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    // Criar novo timeout para busca
    const timeout = setTimeout(() => {
      // Executar busca automaticamente após 500ms de inatividade
      loadLogs(filters, 1);
    }, 500);

    setSearchDebounce(timeout);

    // Cleanup function
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [filters.search, filters.searchInDetails]);

  // Aplicar filtros avançados automaticamente quando mudarem
  useEffect(() => {
    // Aplicar filtros automaticamente quando mudarem (exceto busca)
    loadLogs(filters, 1);
  }, [filters.level, filters.timeRange, filters.context, filters.userId, filters.startDate, filters.endDate]);

  const clearLogs = async () => {
    try {
      await logger.clearDatabaseLogs();
      logger.clearLogs(); // Também limpar logs locais
      setLogs([]);
      setSystemLogs([]);
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      // Fallback para limpeza local apenas
      logger.clearLogs();
      setLogs([]);
      setSystemLogs([]);
    }
   };

   const copyLogs = () => {
    const logText = logs
      .map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] [${log.source}] ${log.message}`)
      .join('\n');
    
    navigator.clipboard.writeText(logText);
  };

  // Funções para manipular filtros
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCheckboxChange = (key: string, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    setCurrentPage(1); // Resetar para primeira página
    loadLogs(filters, 1);
  };

  const clearFilters = () => {
    const clearedFilters = {
      startDate: '',
      endDate: '',
      userId: '',
      context: '',
      level: 'all',
      search: '',
      timeRange: 'all',
      searchInDetails: false
    };
    setFilters(clearedFilters);
    setCurrentPage(1); // Resetar para primeira página
    loadLogs(clearedFilters, 1);
  };

  // Funções de navegação de páginas
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadLogs(filters, page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  // Funções para filtros salvos
  const saveCurrentFilters = (name: string) => {
    if (name.trim()) {
      setSavedFilters(prev => ({
        ...prev,
        [name]: { ...filters }
      }));
      // Salvar no localStorage
      localStorage.setItem('savedLogFilters', JSON.stringify({
        ...savedFilters,
        [name]: { ...filters }
      }));
    }
  };

  const loadSavedFilters = (name: string) => {
    const saved = savedFilters[name];
    if (saved) {
      setFilters(saved);
      loadLogs(saved);
    }
  };

  const deleteSavedFilters = (name: string) => {
    const updated = { ...savedFilters };
    delete updated[name];
    setSavedFilters(updated);
    localStorage.setItem('savedLogFilters', JSON.stringify(updated));
  };

  // Carregar filtros salvos do localStorage na inicialização
  useEffect(() => {
    const saved = localStorage.getItem('savedLogFilters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar filtros salvos:', error);
      }
    }
  }, []);

  // Função para gerar logs de teste
  const generateTestLogs = async () => {
    console.log('=== INICIANDO TESTE DE LOGS ===');
    try {
      // Testar cada nível individualmente
      logger.debug('Teste DEBUG');
      logger.info('Teste INFO');
      logger.warn('Teste WARN');
      logger.error('Teste ERROR');
      
      console.log('Logs de teste enviados');
      // Recarregar logs após o teste
      setTimeout(() => loadLogs(), 2000);
    } catch (error) {
      console.error('Erro durante teste de logs:', error);
    }
  };

  // Função para gerar apenas 2 logs de teste
  const generate2TestLogs = async () => {
    console.log('=== INICIANDO TESTE COM 2 LOGS ===');
    try {
      logger.info('Log de teste 1 - INFO');
      logger.warn('Log de teste 2 - WARN');
      
      console.log('2 logs de teste enviados');
      // Recarregar logs após o teste
      setTimeout(() => loadLogs(), 2000);
    } catch (error) {
      console.error('Erro durante teste de 2 logs:', error);
    }
  };

  // Os logs já vêm filtrados da API, então não precisamos filtrar novamente aqui
  const filteredLogs = logs;

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
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => loadLogs()}
              disabled={isLoading}
              title="Atualizar logs"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={copyLogs} title="Copiar logs">
              <Copy className="h-4 w-4" />
            </Button>
            <ExportDialog logs={systemLogs} />
            <Button variant="outline" size="icon" onClick={clearLogs} title="Limpar logs">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={generateTestLogs} title="Gerar logs de teste">
              Teste
            </Button>
            <Button variant="outline" size="sm" onClick={generate2TestLogs} title="Gerar 2 logs de teste">
              2 Logs
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="font-urbanist">Filtros Avançados</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              {Object.keys(savedFilters).length > 0 && (
                <Select onValueChange={loadSavedFilters}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtros salvos" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(savedFilters).map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* Busca por texto */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar mensagem... (busca em tempo real)"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
                {filters.search && (
                  <div className="mt-1 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={filters.searchInDetails}
                        onChange={(e) => handleCheckboxChange('searchInDetails', e.target.checked)}
                        className="w-3 h-3"
                      />
                      Buscar nos detalhes
                    </label>
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Busca automática ativa
                    </span>
                  </div>
                )}
              </div>

              {/* Intervalo de tempo predefinido */}
              <Select value={filters.timeRange} onValueChange={(value) => handleFilterChange('timeRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="1h">Última hora</SelectItem>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por nível */}
              <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="WARN">Warning</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="DEBUG">Debug</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro por contexto */}
              <Select value={filters.context || "all"} onValueChange={(value) => handleFilterChange('context', value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Contexto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os contextos</SelectItem>
                  {availableContexts.map(context => (
                    <SelectItem key={context} value={context}>{context}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por usuário */}
              <Select value={filters.userId || "all"} onValueChange={(value) => handleFilterChange('userId', value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {availableUsers.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Data inicial */}
              <Input
                type="datetime-local"
                placeholder="Data inicial"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />

              {/* Data final */}
              <Input
                type="datetime-local"
                placeholder="Data final"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            {/* Botões de ação dos filtros */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <Button onClick={() => loadLogs(filters, 1)} size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros Avançados
              </Button>
              <Button onClick={clearFilters} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
              {activeFiltersCount > 0 && (
                <Button 
                  onClick={() => {
                    const name = prompt('Nome para salvar estes filtros:');
                    if (name) saveCurrentFilters(name);
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  💾 Salvar Filtros
                </Button>
              )}
              {Object.keys(savedFilters).length > 0 && (
                <Button 
                  onClick={() => {
                    const name = prompt('Nome do filtro para excluir:\n' + Object.keys(savedFilters).join('\n'));
                    if (name && savedFilters[name]) deleteSavedFilters(name);
                  }} 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  🗑️ Excluir Salvos
                </Button>
              )}
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
                <div className="h-[600px] rounded-md border overflow-y-auto">
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
                </div>
                
                {/* Paginação */}
                {totalLogs > 0 && (
                  <div className="p-4 border-t bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalLogs)} de {totalLogs} logs
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(1)}
                          disabled={currentPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(pageNum)}
                                className="h-8 w-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="realtime" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-urbanist">Logs em Tempo Real</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-muted-foreground">Ativo</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => loadLogs()}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] rounded-md border overflow-y-auto">
                  <div className="p-4 space-y-2">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.slice(0, 20).map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg border bg-card/30 hover:bg-card/50 transition-colors">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getLogIcon(log.type)}
                            <Badge variant="outline" className={`${getLogBadgeStyle(log.type)} text-xs`}>
                              {log.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {log.timestamp.split(' ')[1]}
                            </span>
                            <span className="text-sm font-plus-jakarta truncate">
                              {log.message}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {log.source}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Clock className="h-8 w-8 mb-2" />
                        <p className="font-plus-jakarta">Aguardando novos logs...</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}