'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SignalHistoryItem {
  id?: string;
  strategy_name?: string;
  table_id?: string;
  confidence_level?: number;
  is_validated?: boolean;
  timestamp_generated?: string;
  metadata?: any;
}

interface ApiResponse {
  data: SignalHistoryItem[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    returned_count: number;
    items_per_page: number;
  };
  success: boolean;
  message?: string;
}

export default function HistoricoDePadroesPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SignalHistoryItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // Filtros
  const [tableId, setTableId] = useState<string>('');
  const [strategy, setStrategy] = useState<string>('');
  const [confidenceMin, setConfidenceMin] = useState<number>(70);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (tableId) params.append('table_id', tableId);
    if (strategy) params.append('strategy', strategy);
    if (confidenceMin) params.append('confidence_min', confidenceMin.toString());
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    return params.toString();
  }, [page, limit, tableId, strategy, confidenceMin, dateFrom, dateTo]);

  useEffect(() => {
    let abort = false;
    async function fetchHistory() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/signals-history?${queryString}`);
        if (!res.ok) throw new Error(`Falha ao buscar histórico: ${res.status}`);
        const json: ApiResponse = await res.json();
        if (abort) return;
        setItems(Array.isArray(json.data) ? json.data : []);
      } catch (err: any) {
        if (abort) return;
        setError(err?.message || 'Erro inesperado');
      } finally {
        if (!abort) setLoading(false);
      }
    }
    fetchHistory();
    return () => { abort = true; };
  }, [queryString]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Histórico de Padrões</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Mesa (table_id)</label>
              <Input placeholder="ex: mesa_001" value={tableId} onChange={(e) => setTableId(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Estratégia</label>
              <Input placeholder="ex: Martingale" value={strategy} onChange={(e) => setStrategy(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Confiança mínima</label>
              <Select value={confidenceMin.toString()} onValueChange={(val) => setConfidenceMin(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[50, 60, 70, 80, 85, 90, 95].map(v => (
                    <SelectItem key={v} value={v.toString()}>{v}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium">De</label>
                <Input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Até</label>
                <Input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => { setPage(1); }}>Aplicar filtros</Button>
            <Button variant="ghost" onClick={() => { setTableId(''); setStrategy(''); setConfidenceMin(70); setDateFrom(''); setDateTo(''); setPage(1); }}>Limpar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Mesa</TableHead>
                    <TableHead>Estratégia</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Validado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum registro encontrado</TableCell>
                    </TableRow>
                  )}
                  {items.map((it, idx) => (
                    <TableRow key={`${it.id || idx}`}>
                      <TableCell>{it.timestamp_generated ? new Date(it.timestamp_generated).toLocaleString() : '-'}</TableCell>
                      <TableCell>{it.table_id || '-'}</TableCell>
                      <TableCell>{it.strategy_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeof it.confidence_level === 'number' ? `${it.confidence_level}%` : '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        {it.is_validated ? (
                          <Badge className="bg-green-600">Validado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Itens por página</span>
                  <Select value={limit.toString()} onValueChange={(val) => { setLimit(Number(val)); setPage(1); }}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map(v => (
                        <SelectItem key={v} value={v.toString()}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
                  <span className="text-sm">Página {page}</span>
                  <Button variant="outline" onClick={() => setPage(p => p + 1)}>Próxima</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}