'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, Calendar, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { apiClient } from '@/lib/api-client';
import { useRealtimeSignals } from '@/hooks/use-websocket';

// Interfaces
interface SignalHistoryItem {
  id: string;
  timestamp: string;
  strategy: string;
  table_id: string;
  suggested_bets: number[];
  units: number;
  confidence: number;
  status: 'pending' | 'win' | 'loss' | 'cancelled';
  message: string;
  result?: {
    winning_number?: number;
    profit?: number;
  };
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

interface FiltersApplied {
  strategy?: string;
  table_id?: string;
  confidence_min?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}

interface ApiResponse {
  signals: SignalHistoryItem[];
  pagination: PaginationInfo;
}

export default function RegistrosDePadroesPage() {
  const { user } = useUser();
  
  // Estados
  const [signals, setSignals] = useState<SignalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  
  // Filtros
  const [filters, setFilters] = useState<FiltersApplied>(() => {
    const defaults: FiltersApplied = {
      strategy: '',
      table_id: '',
      confidence_min: undefined,
      status: '',
      date_from: '',
      date_to: ''
    };

    if (typeof window === 'undefined') return defaults;

    try {
      const params = new URLSearchParams(window.location.search);
      const strategy = String(params.get('strategy') || '').trim();
      const table_id = String(params.get('table_id') || '').trim();
      return {
        ...defaults,
        ...(strategy ? { strategy } : null),
        ...(table_id ? { table_id } : null)
      };
    } catch {
      return defaults;
    }
  });
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20
  });

  // Assinar eventos em tempo real para auto-refresh e exibir status
  const { status: realtimeStatus, lastUpdate } = useRealtimeSignals({
    tableId: filters.table_id,
    confidenceMin: filters.confidence_min,
    limit: itemsPerPage,
    batchMs: 1000
  });

  // Função para buscar histórico de sinais
  const fetchSignalsHistory = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryFilters: any = {
        page,
        limit: itemsPerPage
      };
      
      // Adicionar filtros não vazios
      if (filters.strategy && filters.strategy !== 'all') queryFilters.strategy = filters.strategy;
      if (filters.table_id && filters.table_id !== 'all') queryFilters.table_id = filters.table_id;
      if (filters.confidence_min) queryFilters.confidence_min = filters.confidence_min;
      if (filters.status && filters.status !== 'all') queryFilters.status = filters.status;
      if (filters.date_from) queryFilters.date_from = filters.date_from;
      if (filters.date_to) queryFilters.date_to = filters.date_to;
      
      const response = await apiClient.getSignalsHistory(queryFilters);
      const apiResponse = response as unknown as { signals: SignalHistoryItem[]; pagination: PaginationInfo; };
      
      setSignals(apiResponse.signals || []);
      setPagination(apiResponse.pagination);
      setTotalItems(apiResponse.pagination.total_items);
      setCurrentPage(page);
      
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setError('Erro ao carregar histórico de sinais');
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }, [filters, itemsPerPage]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchSignalsHistory(1);
  }, [fetchSignalsHistory]);

  // Auto-refresh quando houver atualização em tempo real
  useEffect(() => {
    if (lastUpdate) {
      fetchSignalsHistory(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdate]);

  // Handlers
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchSignalsHistory(1);
  };

  const handleClearFilters = () => {
    setFilters({
      strategy: '',
      table_id: '',
      confidence_min: undefined,
      status: '',
      date_from: '',
      date_to: ''
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    fetchSignalsHistory(page);
  };

  // Funções de formatação
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSuggestedBets = (bets: number[]) => {
    return bets.join(', ');
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return <Badge variant="default" className="bg-green-500">Alta ({confidence}%)</Badge>;
    } else if (confidence >= 60) {
      return <Badge variant="secondary">Média ({confidence}%)</Badge>;
    } else {
      return <Badge variant="outline">Baixa ({confidence}%)</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'Pendente', variant: 'secondary' as const },
      'win': { label: 'Ganho', variant: 'default' as const },
      'loss': { label: 'Perda', variant: 'destructive' as const },
      'cancelled': { label: 'Cancelado', variant: 'outline' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Calcular total de páginas
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Toggle de expansão de mensagem
  const toggleMessageExpansion = (signalId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(signalId)) {
        newSet.delete(signalId);
      } else {
        newSet.add(signalId);
      }
      return newSet;
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Registros de Padrões</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Exportar
            </Button>
            <Badge
              variant="outline"
              className={
                realtimeStatus === 'connected'
                  ? 'bg-green-600 text-white border-green-600'
                  : realtimeStatus === 'connecting'
                  ? 'bg-yellow-500 text-black border-yellow-500'
                  : 'bg-red-600 text-white border-red-600'
              }
            >
              {realtimeStatus === 'connected'
                ? 'Realtime: Conectado'
                : realtimeStatus === 'connecting'
                ? 'Realtime: Reconectando'
                : 'Realtime: Desconectado'}
            </Badge>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Estratégia */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Estratégia</label>
                <Input
                  placeholder="Ex: Fibonacci"
                  value={filters.strategy || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, strategy: e.target.value }))}
                />
              </div>
              
              {/* Mesa */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Mesa</label>
                <Input
                  placeholder="Ex: Mesa 1"
                  value={filters.table_id || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, table_id: e.target.value }))}
                />
              </div>
              
              {/* Confiança Mínima */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Confiança Mín.</label>
                <Select
                  value={filters.confidence_min?.toString() || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    confidence_min: value === 'all' ? undefined : parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="50">50%+</SelectItem>
                    <SelectItem value="60">60%+</SelectItem>
                    <SelectItem value="70">70%+</SelectItem>
                    <SelectItem value="80">80%+</SelectItem>
                    <SelectItem value="90">90%+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="win">Ganho</SelectItem>
                    <SelectItem value="loss">Perda</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Botões */}
              <div className="flex gap-2 items-end">
                <Button onClick={handleApplyFilters} className="flex-1">
                  Aplicar Filtros
                </Button>
              </div>
              
              <div className="flex gap-2 items-end">
                <Button onClick={handleClearFilters} variant="outline" className="flex-1">
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Resultados */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => fetchSignalsHistory(currentPage)} variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            ) : signals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum sinal encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Estratégia</TableHead>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Apostas Sugeridas</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Confiança</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signals.map((signal, index) => (
                      <TableRow
                        key={signal.id}
                        className={index % 2 === 0 ? 'bg-muted/50' : ''}
                      >
                        <TableCell className="font-mono text-sm">
                          {formatDate(signal.timestamp)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {signal.strategy}
                        </TableCell>
                        <TableCell>
                          {signal.table_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {formatSuggestedBets(signal.suggested_bets)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {signal.units}
                        </TableCell>
                        <TableCell>
                          {getConfidenceBadge(signal.confidence)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(signal.status)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {expandedMessages.has(signal.id) 
                                ? signal.message 
                                : truncateText(signal.message)
                              }
                            </span>
                            {signal.message.length > 50 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleMessageExpansion(signal.id)}
                                className="h-6 w-6 p-0"
                              >
                                {expandedMessages.has(signal.id) ? '−' : '+'}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} resultados
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, currentPage - 2) + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
