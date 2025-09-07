'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Filter } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    strategy: '',
    roulette: '',
    result: '',
    period: ''
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Padrões</h1>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

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
      </div>
    </DashboardLayout>
  );
}