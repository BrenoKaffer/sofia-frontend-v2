import { SystemLogEntry } from './logger';

export interface ExportOptions {
  format: 'json' | 'csv' | 'txt' | 'pdf';
  includeDetails: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  levels?: string[];
  contexts?: string[];
}

export class LogExporter {
  // Exportar logs em formato JSON
  static exportToJSON(logs: SystemLogEntry[], options: ExportOptions): string {
    const filteredLogs = this.filterLogs(logs, options);
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalLogs: filteredLogs.length,
        format: 'json',
        filters: {
          dateRange: options.dateRange,
          levels: options.levels,
          contexts: options.contexts,
        }
      },
      logs: filteredLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        context: log.context,
        userId: log.user_id,
        ...(options.includeDetails && log.details ? { details: log.details } : {})
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Exportar logs em formato CSV
  static exportToCSV(logs: SystemLogEntry[], options: ExportOptions): string {
    const filteredLogs = this.filterLogs(logs, options);
    
    if (filteredLogs.length === 0) {
      return 'Nenhum log encontrado para os filtros especificados';
    }

    // Cabeçalhos
    const headers = ['ID', 'Timestamp', 'Level', 'Message', 'Context', 'User ID'];
    if (options.includeDetails) {
      headers.push('Details');
    }

    // Função para escapar valores CSV
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Construir CSV
    const csvLines = [headers.join(',')];
    
    filteredLogs.forEach(log => {
      const row = [
        escapeCSV(log.id),
        escapeCSV(new Date(log.timestamp).toLocaleString('pt-BR')),
        escapeCSV(log.level),
        escapeCSV(log.message),
        escapeCSV(log.context),
        escapeCSV(log.user_id || '')
      ];

      if (options.includeDetails && log.details) {
        row.push(escapeCSV(JSON.stringify(log.details)));
      }

      csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
  }

  // Exportar logs em formato TXT
  static exportToTXT(logs: SystemLogEntry[], options: ExportOptions): string {
    const filteredLogs = this.filterLogs(logs, options);
    
    if (filteredLogs.length === 0) {
      return 'Nenhum log encontrado para os filtros especificados';
    }

    const lines = [
      '='.repeat(80),
      'RELATÓRIO DE LOGS',
      '='.repeat(80),
      `Data de Exportação: ${new Date().toLocaleString('pt-BR')}`,
      `Total de Logs: ${filteredLogs.length}`,
      `Formato: TXT`,
      ''
    ];

    if (options.dateRange) {
      lines.push(`Período: ${options.dateRange.start.toLocaleDateString('pt-BR')} - ${options.dateRange.end.toLocaleDateString('pt-BR')}`);
    }

    if (options.levels && options.levels.length > 0) {
      lines.push(`Níveis: ${options.levels.join(', ')}`);
    }

    if (options.contexts && options.contexts.length > 0) {
      lines.push(`Contextos: ${options.contexts.join(', ')}`);
    }

    lines.push('', '='.repeat(80), 'LOGS', '='.repeat(80), '');

    filteredLogs.forEach((log, index) => {
      lines.push(`[${index + 1}] ${'-'.repeat(70)}`);
      lines.push(`Timestamp: ${new Date(log.timestamp).toLocaleString('pt-BR')}`);
      lines.push(`Nível: ${log.level}`);
      lines.push(`Contexto: ${log.context || 'N/A'}`);
      lines.push(`Usuário: ${log.user_id || 'N/A'}`);
      lines.push(`Mensagem: ${log.message}`);
      
      if (options.includeDetails && log.details) {
        lines.push(`Detalhes: ${JSON.stringify(log.details, null, 2)}`);
      }
      
      lines.push('');
    });

    lines.push('='.repeat(80), 'FIM DO RELATÓRIO', '='.repeat(80));

    return lines.join('\n');
  }

  // Exportar logs em formato PDF
  static async exportToPDF(logs: SystemLogEntry[], options: ExportOptions): Promise<Blob> {
    // Importação dinâmica para evitar problemas de SSR
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    
    const filteredLogs = this.filterLogs(logs, options);
    
    if (filteredLogs.length === 0) {
      throw new Error('Nenhum log encontrado para os filtros especificados');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 6;
    let yPosition = margin;

    // Função para adicionar nova página se necessário
    const checkPageBreak = (requiredHeight: number = lineHeight) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Função para adicionar texto com quebra de linha
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const maxWidth = pageWidth - (margin * 2);
      const lines = doc.splitTextToSize(text, maxWidth);
      
      for (const line of lines) {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      }
    };

    // Cabeçalho do relatório
    addText('RELATÓRIO DE LOGS - SOFIA', 16, true);
    yPosition += 5;
    addText(`Data de Exportação: ${new Date().toLocaleString('pt-BR')}`, 12);
    addText(`Total de Logs: ${filteredLogs.length}`, 12);
    addText(`Formato: PDF`, 12);
    yPosition += 5;

    // Filtros aplicados
    if (options.dateRange) {
      addText(`Período: ${options.dateRange.start.toLocaleDateString('pt-BR')} - ${options.dateRange.end.toLocaleDateString('pt-BR')}`, 10);
    }

    if (options.levels && options.levels.length > 0) {
      addText(`Níveis: ${options.levels.join(', ')}`, 10);
    }

    if (options.contexts && options.contexts.length > 0) {
      addText(`Contextos: ${options.contexts.join(', ')}`, 10);
    }

    yPosition += 10;
    addText('LOGS', 14, true);
    yPosition += 5;

    // Logs
    filteredLogs.forEach((log, index) => {
      checkPageBreak(lineHeight * 6); // Espaço mínimo para um log

      addText(`[${index + 1}] ────────────────────────────────────────`, 10, true);
      addText(`Timestamp: ${new Date(log.timestamp).toLocaleString('pt-BR')}`, 10);
      addText(`Nível: ${log.level}`, 10);
      addText(`Contexto: ${log.context || 'N/A'}`, 10);
      addText(`Usuário: ${log.user_id || 'N/A'}`, 10);
      addText(`Mensagem: ${log.message}`, 10);
      
      if (options.includeDetails && log.details) {
        addText(`Detalhes: ${JSON.stringify(log.details)}`, 9);
      }
      
      yPosition += 5;
    });

    return doc.output('blob');
  }

  // Filtrar logs baseado nas opções
  private static filterLogs(logs: SystemLogEntry[], options: ExportOptions): SystemLogEntry[] {
    return logs.filter(log => {
      // Filtro por data
      if (options.dateRange) {
        const logDate = new Date(log.timestamp);
        if (logDate < options.dateRange.start || logDate > options.dateRange.end) {
          return false;
        }
      }

      // Filtro por nível
      if (options.levels && options.levels.length > 0) {
        if (!options.levels.includes(log.level)) {
          return false;
        }
      }

      // Filtro por contexto
      if (options.contexts && options.contexts.length > 0) {
        if (!log.context || !options.contexts.includes(log.context)) {
          return false;
        }
      }

      return true;
    });
  }

  // Baixar arquivo
  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Baixar blob (para PDFs)
  static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Gerar nome de arquivo baseado nas opções
  static generateFilename(options: ExportOptions): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const extension = options.format;
    
    let filename = `logs-${timestamp}`;
    
    if (options.levels && options.levels.length > 0) {
      filename += `-${options.levels.join('-').toLowerCase()}`;
    }
    
    if (options.contexts && options.contexts.length > 0) {
      filename += `-${options.contexts.join('-').toLowerCase()}`;
    }
    
    return `${filename}.${extension}`;
  }

  // Exportar e baixar
  static async exportAndDownload(logs: SystemLogEntry[], options: ExportOptions) {
    if (options.format === 'pdf') {
      // Tratamento especial para PDF (retorna Blob)
      const blob = await this.exportToPDF(logs, options);
      const filename = this.generateFilename(options);
      this.downloadBlob(blob, filename);
      return;
    }

    let content: string;
    let mimeType: string;

    switch (options.format) {
      case 'json':
        content = this.exportToJSON(logs, options);
        mimeType = 'application/json';
        break;
      case 'csv':
        content = this.exportToCSV(logs, options);
        mimeType = 'text/csv';
        break;
      case 'txt':
        content = this.exportToTXT(logs, options);
        mimeType = 'text/plain';
        break;
      default:
        throw new Error(`Formato não suportado: ${options.format}`);
    }

    const filename = this.generateFilename(options);
    this.downloadFile(content, filename, mimeType);
  }
}