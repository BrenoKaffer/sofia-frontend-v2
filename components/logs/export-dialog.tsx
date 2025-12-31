'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, FileJson, FileSpreadsheet, FileImage } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SystemLogEntry, LogLevelString } from '@/lib/logger';
import { LogExporter, ExportOptions } from '@/lib/log-export';
import { toast } from 'sonner';

interface ExportDialogProps {
  logs: SystemLogEntry[];
  trigger?: React.ReactNode;
}

export function ExportDialog({ logs, trigger }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'txt' | 'pdf'>('json');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Obter níveis únicos dos logs
  const availableLevels = Array.from(new Set(logs.map(log => log.level)));
  
  // Obter contextos únicos dos logs
  const availableContexts = Array.from(new Set(logs.map(log => log.context).filter(Boolean))) as string[];

  const handleLevelChange = (level: string, checked: boolean) => {
    if (checked) {
      setSelectedLevels(prev => [...prev, level]);
    } else {
      setSelectedLevels(prev => prev.filter(l => l !== level));
    }
  };

  const handleContextChange = (context: string, checked: boolean) => {
    if (checked) {
      setSelectedContexts(prev => [...prev, context]);
    } else {
      setSelectedContexts(prev => prev.filter(c => c !== context));
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const options: ExportOptions = {
        format: exportFormat,
        includeDetails,
        ...(dateRange.start && dateRange.end ? {
          dateRange: {
            start: dateRange.start,
            end: dateRange.end
          }
        } : {}),
        ...(selectedLevels.length > 0 ? { levels: selectedLevels } : {}),
        ...(selectedContexts.length > 0 ? { contexts: selectedContexts } : {})
      };

      await LogExporter.exportAndDownload(logs, options);
      
      toast.success(`Logs exportados com sucesso em formato ${exportFormat.toUpperCase()}!`);
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      toast.error('Erro ao exportar logs. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = () => {
    switch (exportFormat) {
      case 'json':
        return <FileJson className="h-4 w-4" />;
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'txt':
        return <FileText className="h-4 w-4" />;
      case 'pdf':
        return <FileImage className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFilteredLogsCount = () => {
    const options: ExportOptions = {
      format: exportFormat,
      includeDetails,
      ...(dateRange.start && dateRange.end ? {
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        }
      } : {}),
      ...(selectedLevels.length > 0 ? { levels: selectedLevels } : {}),
      ...(selectedContexts.length > 0 ? { contexts: selectedContexts } : {})
    };

    // Simular a filtragem para mostrar a contagem
    let filteredLogs = logs;

    if (options.dateRange) {
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= options.dateRange!.start && logDate <= options.dateRange!.end;
      });
    }

    if (options.levels && options.levels.length > 0) {
      filteredLogs = filteredLogs.filter(log => options.levels!.includes(log.level));
    }

    if (options.contexts && options.contexts.length > 0) {
      filteredLogs = filteredLogs.filter(log => log.context && options.contexts!.includes(log.context));
    }

    return filteredLogs.length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportar Logs</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Formato */}
          <div className="space-y-2">
            <Label>Formato de Exportação</Label>
            <Select value={exportFormat} onValueChange={(value: 'json' | 'csv' | 'txt') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON - Estruturado para APIs
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV - Para planilhas
                  </div>
                </SelectItem>
                <SelectItem value="txt">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    TXT - Relatório legível
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    PDF - Documento formatado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opções */}
          <div className="space-y-2">
            <Label>Opções</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-details"
                checked={includeDetails}
                onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
              />
              <Label htmlFor="include-details">Incluir detalhes técnicos</Label>
            </div>
          </div>

          {/* Filtro por Data */}
          <div className="space-y-2">
            <Label>Período (opcional)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dateRange.start ? format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inicial'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.start}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dateRange.end ? format(dateRange.end, 'dd/MM/yyyy', { locale: ptBR }) : 'Data final'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.end}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filtro por Nível */}
          {availableLevels.length > 0 && (
            <div className="space-y-2">
              <Label>Níveis (opcional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableLevels.map(level => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`level-${level}`}
                      checked={selectedLevels.includes(level)}
                      onCheckedChange={(checked) => handleLevelChange(level, checked as boolean)}
                    />
                    <Label htmlFor={`level-${level}`} className="capitalize">
                      {level}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtro por Contexto */}
          {availableContexts.length > 0 && (
            <div className="space-y-2">
              <Label>Contextos (opcional)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {availableContexts.map(context => (
                  <div key={context} className="flex items-center space-x-2">
                    <Checkbox
                      id={`context-${context}`}
                      checked={selectedContexts.includes(context)}
                      onCheckedChange={(checked) => handleContextChange(context, checked as boolean)}
                    />
                    <Label htmlFor={`context-${context}`} className="text-sm">
                      {context}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">
              <strong>{getFilteredLogsCount()}</strong> logs serão exportados de um total de <strong>{logs.length}</strong>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {getFormatIcon()}
              {isExporting ? 'Exportando...' : `Exportar ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}