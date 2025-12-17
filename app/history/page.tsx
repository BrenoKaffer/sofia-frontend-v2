'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Filter, Search, Calendar, FileText, TrendingUp } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { RouletteHeatmap } from '@/components/analytics/roulette-heatmap';

interface HistorySignal {
  id: string;
  date: string;
  strategy: string;
  numbers: number[];
  result: 'success' | 'error' | 'pending';
  roulette: string;
  confidence?: number;
  expected_return?: number;
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<HistorySignal[]>([]);
  const [filteredData, setFilteredData] = useState<HistorySignal[]>([]);
  const [rouletteHistoryData, setRouletteHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rouletteLoading, setRouletteLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({});
  const [filter, setFilter] = useState({
    strategy: '',
    roulette: '',
    result: '',
    period: '',
    minConfidence: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Buscar dados históricos dos sinais
  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        const response = await fetch('/api/signals/recent?limit=50', {
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const signals = await response.json();
          const mappedHistory: HistorySignal[] = signals.map((signal: any) => ({
            id: signal.id,
            date: new Date(signal.created_at).toLocaleString('pt-BR'),
            strategy: signal.strategy_id || signal.strategy_name || 'Estratégia Desconhecida',
            numbers: signal.bet_numbers || [],
            result: signal.status === 'validated' ? 'success' : signal.status === 'expired' ? 'error' : 'pending',
            roulette: signal.table_id || 'Mesa Desconhecida',
            confidence: signal.confidence_level,
            expected_return: signal.expected_return
          }));
          setHistoryData(mappedHistory);
          setFilteredData(mappedHistory);
        }
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        // Fallback para dados vazios
        setHistoryData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistoryData();
  }, []);

  // Carregar dados da roleta para o mapa de calor
  useEffect(() => {
    const fetchRouletteData = async () => {
      try {
        setRouletteLoading(true);
        const response = await fetch('/api/roulette-history?limit=1000');
        if (response.ok) {
          const data = await response.json();
          setRouletteHistoryData(data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da roleta:', error);
      } finally {
        setRouletteLoading(false);
      }
    };

    fetchRouletteData();
  }, []);

  // Processar dados da roleta para o mapa de calor
  const heatmapData = useMemo(() => {
    if (!rouletteHistoryData || rouletteHistoryData.length === 0) {
      return [];
    }

    // Calcular frequência de cada número
    const numberFrequency: { [key: number]: number } = {};
    const numberLastSeen: { [key: number]: string } = {};

    // Inicializar todos os números (0-36) com frequência 0
    for (let i = 0; i <= 36; i++) {
      numberFrequency[i] = 0;
    }

    // Contar frequências e última aparição
    rouletteHistoryData.forEach((spin: any) => {
      const number = parseInt(spin.spin_number || spin.number || spin.result);
      if (number >= 0 && number <= 36) {
        numberFrequency[number]++;
        if (!numberLastSeen[number]) {
          numberLastSeen[number] = spin.timestamp || spin.date || new Date().toISOString();
        }
      }
    });

    // Determinar cor do número (vermelho, preto ou verde)
    const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
      if (num === 0) return 'green';
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      return redNumbers.includes(num) ? 'red' : 'black';
    };

    // Converter para formato do componente
    return Object.entries(numberFrequency).map(([number, frequency]) => ({
      number: parseInt(number),
      frequency,
      lastSeen: numberLastSeen[parseInt(number)] ? 
        new Date(numberLastSeen[parseInt(number)]).toLocaleString('pt-BR') : 
        undefined,
      color: getNumberColor(parseInt(number))
    }));
  }, [rouletteHistoryData]);

  // Função de filtragem avançada
  useEffect(() => {
    let filtered = [...historyData];

    // Filtro por texto de busca
    if (searchText) {
      filtered = filtered.filter(item => 
        item.strategy.toLowerCase().includes(searchText.toLowerCase()) ||
        item.roulette.toLowerCase().includes(searchText.toLowerCase()) ||
        item.numbers.some(num => num.toString().includes(searchText))
      );
    }

    // Filtros por categoria
    if (filter.strategy && filter.strategy !== 'all') {
      filtered = filtered.filter(item => item.strategy.toLowerCase().includes(filter.strategy));
    }
    if (filter.roulette && filter.roulette !== 'all') {
      filtered = filtered.filter(item => item.roulette.toLowerCase().includes(filter.roulette));
    }
    if (filter.result && filter.result !== 'all') {
      filtered = filtered.filter(item => item.result === filter.result);
    }
    if (filter.minConfidence) {
      filtered = filtered.filter(item => (item.confidence || 0) >= parseInt(filter.minConfidence));
    }

    // Filtro por período
    if (filter.period && filter.period !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        switch (filter.period) {
          case 'today':
            return itemDate >= today;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return itemDate >= yesterday && itemDate < today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return itemDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filtro por intervalo de datas
    if (dateRange.from) {
      filtered = filtered.filter(item => new Date(item.date) >= dateRange.from!);
    }
    if (dateRange.to) {
      filtered = filtered.filter(item => new Date(item.date) <= dateRange.to!);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (filter.sortBy) {
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        case 'return':
          aValue = a.expected_return || 0;
          bValue = b.expected_return || 0;
          break;
        case 'strategy':
          aValue = a.strategy;
          bValue = b.strategy;
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }
      
      if (filter.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredData(filtered);
    setCurrentPage(1); // Reset para primeira página quando filtros mudam
  }, [historyData, searchText, filter, dateRange]);

  // Função de exportação CSV
  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Estratégia', 'Números', 'Resultado', 'Roleta', 'Confiança', 'Retorno Esperado'];
    const csvData = filteredData.map(item => [
      item.date,
      item.strategy,
      item.numbers.join(';'),
      item.result === 'success' ? 'Acerto' : 'Erro',
      item.roulette,
      item.confidence ? `${item.confidence}%` : 'N/A',
      item.expected_return ? `${item.expected_return}%` : 'N/A'
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico-sinais-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função de exportação JSON
  const exportToJSON = () => {
    const jsonData = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico-sinais-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cálculo da paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchText('');
    setDateRange({});
    setFilter({
      strategy: '',
      roulette: '',
      result: '',
      period: '',
      minConfidence: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Padrões</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={exportToCSV}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportToJSON}>
              <FileText className="h-4 w-4" />
              Exportar JSON
            </Button>
          </div>
        </div>

        <Tabs defaultValue="signals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signals">Histórico de Sinais</TabsTrigger>
            <TabsTrigger value="heatmap">Mapa de Calor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signals" className="space-y-6">

        {/* Barra de busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por estratégia, roleta ou números..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estratégia</label>
                <Select value={filter.strategy} onValueChange={(value) => setFilter({...filter, strategy: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as estratégias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as estratégias</SelectItem>
                    <SelectItem value="fibonacci">Fibonacci Reversal</SelectItem>
                    <SelectItem value="martingale">Martingale Pro</SelectItem>
                    <SelectItem value="dozens">Dozens Pattern</SelectItem>
                    <SelectItem value="color">Color Sequence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Roleta</label>
                <Select value={filter.roulette} onValueChange={(value) => setFilter({...filter, roulette: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as roletas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as roletas</SelectItem>
                    <SelectItem value="evolution">Evolution Gaming</SelectItem>
                    <SelectItem value="pragmatic">Pragmatic Play</SelectItem>
                    <SelectItem value="playtech">Playtech</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resultado</label>
                <Select value={filter.result} onValueChange={(value) => setFilter({...filter, result: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os resultados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os resultados</SelectItem>
                    <SelectItem value="success">Acertos</SelectItem>
                    <SelectItem value="error">Erros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={filter.period} onValueChange={(value) => setFilter({...filter, period: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todo o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo o período</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Estratégia</TableHead>
                  <TableHead>Números Sugeridos</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Roleta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando histórico...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Nenhum sinal encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.strategy}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.numbers.map((num, index) => (
                          <span 
                            key={index} 
                            className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                              num % 2 === 0 ? 'bg-black text-white' : 'bg-primary text-white'
                            }`}
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.result === 'success' ? 'default' : 'destructive'}>
                        {item.result === 'success' ? 'Acerto' : 'Erro'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.roulette}</TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-6">
            {rouletteLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Carregando dados da roleta...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <RouletteHeatmap 
                data={heatmapData}
                title="Mapa de Calor dos Números da Roleta"
                description={`Frequência dos números baseada nos últimos ${rouletteHistoryData.length} giros`}
                showStats={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}