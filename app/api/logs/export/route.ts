/**
 * API de Exportação de Logs
 * Endpoint para exportar logs em diferentes formatos
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LogExporter, ExportOptions } from '@/lib/log-export';
import { logger } from '@/lib/logger';
import { SystemLogEntry } from '@/lib/logger';

// GET - Exportar logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de exportação
    const format = (searchParams.get('format') || 'json') as 'json' | 'csv' | 'txt' | 'pdf';
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const levels = searchParams.get('levels')?.split(',').filter(Boolean) || [];
    const contexts = searchParams.get('contexts')?.split(',').filter(Boolean) || [];
    
    // Parâmetros de data
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Parâmetros de paginação
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir query base
    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros de data
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Aplicar filtros de nível
    if (levels.length > 0) {
      query = query.in('level', levels);
    }

    // Aplicar filtros de contexto
    if (contexts.length > 0) {
      query = query.in('context', contexts);
    }

    const { data: logs, error } = await query;

    if (error) {
      logger.error('Erro ao buscar logs para exportação:', undefined, error as Error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro ao buscar logs',
          message: error.message 
        },
        { status: 500 }
      );
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nenhum log encontrado',
          message: 'Nenhum log encontrado para os filtros especificados' 
        },
        { status: 404 }
      );
    }

    // Converter para formato SystemLogEntry
    const systemLogs: SystemLogEntry[] = logs.map(log => ({
      id: log.id,
      level: log.level,
      message: log.message,
      timestamp: log.created_at,
      context: typeof log.context === 'string' ? log.context : JSON.stringify(log.context),
      source: log.source || undefined,
      user_id: log.user_id,
      session_id: log.session_id,
      details: log.details || {},
      stack_trace: log.stack_trace || undefined,
      request_id: log.request_id || undefined,
      environment: 'production',
      version: log.version || undefined,
      ip_address: log.ip_address || undefined,
      user_agent: log.user_agent || undefined,
      created_at: log.created_at,
      updated_at: log.updated_at || log.created_at
    }));

    // Configurar opções de exportação
    const exportOptions: ExportOptions = {
      format,
      includeDetails,
      ...(startDate && endDate ? {
        dateRange: {
          start: new Date(startDate),
          end: new Date(endDate)
        }
      } : {}),
      ...(levels.length > 0 ? { levels } : {}),
      ...(contexts.length > 0 ? { contexts } : {})
    };

    // Exportar baseado no formato
    let exportedData: string | Blob;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'json':
        exportedData = LogExporter.exportToJSON(systemLogs, exportOptions);
        contentType = 'application/json';
        filename = LogExporter.generateFilename(exportOptions);
        break;
      
      case 'csv':
        exportedData = LogExporter.exportToCSV(systemLogs, exportOptions);
        contentType = 'text/csv';
        filename = LogExporter.generateFilename(exportOptions);
        break;
      
      case 'txt':
        exportedData = LogExporter.exportToTXT(systemLogs, exportOptions);
        contentType = 'text/plain';
        filename = LogExporter.generateFilename(exportOptions);
        break;
      
      case 'pdf':
        exportedData = await LogExporter.exportToPDF(systemLogs, exportOptions);
        contentType = 'application/pdf';
        filename = LogExporter.generateFilename(exportOptions);
        break;
      
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Formato inválido',
            message: 'Formato de exportação não suportado' 
          },
          { status: 400 }
        );
    }

    logger.info('Logs exportados com sucesso', {
      metadata: {
        format,
        totalLogs: systemLogs.length,
        filename,
        includeDetails,
        filters: { levels, contexts, startDate, endDate }
      }
    });

    // Retornar arquivo para download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache');

    return new NextResponse(exportedData, {
      status: 200,
      headers
    });

  } catch (error) {
    logger.error('Erro na API de exportação de logs:', undefined, error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao processar exportação de logs'
      },
      { status: 500 }
    );
  }
}

// OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}