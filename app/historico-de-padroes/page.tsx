'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Search, Filter, Calendar, Target, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

// Interfaces
interface SignalHistoryItem {
  id: number;
  timestamp_generated: string;
  strategy_name: string;
  table_id: string;
  suggested_bets: (string | number)[];
  suggested_units: number;
  confidence_level: string;
  message: string;
  is_validated: boolean;
  type: string;
  expires_at: string;
}

interface PaginationInfo {
  limit: number;
  offset: number;
  returned_count: number;
}

interface FiltersApplied {
  strategy_name?: string;
  table_id?: string;
  confidence_level?: string;
  is_validated?: boolean;
}

interface ApiResponse {
  data: SignalHistoryItem[];
  pagination: PaginationInfo;
  filters: FiltersApplied;
}

export default function HistoricoDePadroesPage() {
  const { user, getToken } = useAuth();
  const [signals, setSignals] = useState<SignalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  
  // Filtros
  const [filters, setFilters] = useState({
    strategy_name: '',
    table_id: '',
    confidence_level: '',
    is_validated: ''
  });
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 20,
    offset: 0,
    returned_count: 0
  });

  // Função para buscar dados da API
  const fetchSignalsHistory = useCallback(async (page: number = 1, appliedFilters = filters) => {
    if (!user || !getToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const offset = (page - 1) * itemsPerPage;
      
      // Construir query string
      const queryParams = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });
      
      // Adicionar filtros não vazios
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value && value.trim() !== '' && value !== 'all') {
          queryParams.append(key, value.trim());
        }
      });
      
      const response = await fetch(`/api/signals-history?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data: ApiResponse = await response.json();
      
      setSignals(data.data || []);
      setPagination(data.pagination);
      setTotalItems(data.pagination.returned_count);
      
    } catch (err) {
      console.error('Erro ao buscar histórico de sinais:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user, getToken, itemsPerPage, filters]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchSignalsHistory(1);
  }, [fetchSignalsHistory]);

  // Aplicar filtros
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchSignalsHistory(1, filters);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    const clearedFilters = {
      strategy_name: '',
      table_id: '',
      confidence_level: 'all',
      is_validated: 'all'
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    fetchSignalsHistory(1, clearedFilters);
  };

  // Navegação de páginas
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchSignalsHistory(newPage, filters);
  };

  // Formatação de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatação de apostas sugeridas
  const formatSuggestedBets = (bets: (string | number)[]) => {
    return bets.slice(0, 3).join(', ') + (bets.length > 3 ? '...' : '');
  };

  // Badge de confiança
  const getConfidenceBadge = (level: string) => {
    const variants = {
      'HIGH': 'bg-green-100 text-green-800 border-green-200',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'LOW': 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[level as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Badge de status
  const getStatusBadge = (isValidated: boolean, expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    
    if (isValidated) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (now > expiry) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    } else {
      return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusText = (isValidated: boolean, expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    
    if (isValidated) return 'Validado';
    if (now > expiry) return 'Expirado';
    return 'Ativo';
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Função para truncar texto
  const truncateText = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Função para alternar expansão da mensagem
  const toggleMessageExpansion = (signalId: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(signalId)) {
      newExpanded.delete(signalId);
    } else {
      newExpanded.add(signalId);
    }
    setExpandedMessages(newExpanded);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Histórico de Padrões</h1>
            <p className="text-muted-foreground">
              Análise completa de todos os sinais gerados pela SOFIA
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{signals.length} sinais encontrados</span>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
            <CardDescription>
              Refine sua busca para encontrar sinais específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estratégia</label>
                <Input
                  placeholder="Nome da estratégia"
                  value={filters.strategy_name}
                  onChange={(e) => setFilters(prev => ({ ...prev, strategy_name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mesa</label>
                <Input
                  placeholder="ID da mesa"
                  value={filters.table_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, table_id: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Confiança</label>
                <Select
                  value={filters.confidence_level}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, confidence_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="LOW">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.is_validated}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, is_validated: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Validados</SelectItem>
                    <SelectItem value="false">Não Validados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Sinais Encontrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">Erro ao carregar dados: {error}</p>
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
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-mono text-sm">
                          {formatDate(signal.timestamp_generated)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {signal.strategy_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {signal.table_id}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatSuggestedBets(signal.suggested_bets)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {signal.suggested_units}
                        </TableCell>
                        <TableCell>
                          <Badge className={getConfidenceBadge(signal.confidence_level)}>
                            {signal.confidence_level === 'HIGH' ? 'Alta' : 
                             signal.confidence_level === 'MEDIUM' ? 'Média' : 'Baixa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(signal.is_validated, signal.expires_at)}>
                            {getStatusText(signal.is_validated, signal.expires_at)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">
                          <div className="space-y-1">
                            <div className={expandedMessages.has(signal.id) ? '' : 'line-clamp-1'}>
                              {expandedMessages.has(signal.id) ? signal.message : truncateText(signal.message)}
                            </div>
                            {signal.message.length > 40 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                                onClick={() => toggleMessageExpansion(signal.id)}
                              >
                                {expandedMessages.has(signal.id) ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    ver menos
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    ver mais
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {pagination.offset + 1} a {Math.min(pagination.offset + pagination.returned_count, totalItems)} de {totalItems} resultados
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
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
                        disabled={currentPage === totalPages}
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}