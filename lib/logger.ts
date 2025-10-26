/**
 * Sistema de logging estruturado para o SOFIA
 * Substitui console.log por logging profissional com níveis e contexto
 * Integrado com banco de dados Supabase para persistência
 */

import { createClient } from '@supabase/supabase-js';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Mapeamento para strings do banco
export const LogLevelString = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
} as const;

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

// Interface para logs do banco de dados
export interface SystemLogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
  context?: string;
  source?: string;
  user_id?: string;
  session_id?: string;
  details: Record<string, any>;
  stack_trace?: string;
  request_id?: string;
  environment: string;
  version?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private supabase: any;
  private persistToDatabase: boolean;
  private sessionId: string;
  private supabaseConnectionFailed: boolean = false;

  private constructor() {
    this.isDevelopment = process.env.NEXT_PUBLIC_ENV === 'development';
    const envLogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || '').toUpperCase();
    const levelMap: Record<string, LogLevel> = {
      ERROR: LogLevel.ERROR,
      WARN: LogLevel.WARN,
      INFO: LogLevel.INFO,
      DEBUG: LogLevel.DEBUG,
    };
    // Padrão mais silencioso em dev: INFO
    this.logLevel = levelMap[envLogLevel] ?? (this.isDevelopment ? LogLevel.INFO : LogLevel.INFO);
    const useMock = (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') || (process.env.USE_MOCK_DATA === 'true');
    this.persistToDatabase = !useMock; // Desabilita persistência em modo mock
    this.sessionId = this.generateSessionId();
    
    // Configurar Supabase apenas se as variáveis estiverem disponíveis
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };
  }

  private addToBuffer(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private formatMessage(entry: LogEntry): string {
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    const levelName = levelNames[entry.level];
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    let formatted = `[${timestamp}] ${levelName}: ${entry.message}`;
    
    if (entry.context?.component) {
      formatted += ` [${entry.context.component}]`;
    }
    
    if (entry.context?.action) {
      formatted += ` (${entry.context.action})`;
    }
    
    return formatted;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.isDevelopment) return;

    const formatted = this.formatMessage(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted, entry.error || '', entry.context?.metadata || '');
        break;
      case LogLevel.WARN:
        console.warn(formatted, entry.context?.metadata || '');
        break;
      case LogLevel.INFO:
        console.info(formatted, entry.context?.metadata || '');
        break;
      case LogLevel.DEBUG:
        console.log(formatted, entry.context?.metadata || '');
        break;
    }
  }

  private async persistToSupabase(entry: LogEntry): Promise<void> {
    // Se a persistência está desabilitada ou já detectamos falha de conexão, não tentar
    if (!this.persistToDatabase || this.supabaseConnectionFailed) return;
    // Evitar persistência explícita em modo mock
    if ((process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') || (process.env.USE_MOCK_DATA === 'true')) return;

    try {
      // Mapear o level
      const levelString = LogLevelString[entry.level];
      
      // Log detalhado para debug (apenas em desenvolvimento)
      if (this.isDevelopment) {
        console.log('=== DEBUG PERSISTÊNCIA VIA API ===');
        console.log('entry.level:', entry.level, 'typeof:', typeof entry.level);
        console.log('levelString:', levelString, 'typeof:', typeof levelString);
      }

      // Preparar dados do log para enviar à API
      const logData = {
        level: levelString,
        message: entry.message,
        context: entry.context?.component || null,
        source: entry.context?.action || 'frontend',
        details: {
          metadata: entry.context?.metadata || {},
          error_message: entry.error?.message || null,
          error_name: entry.error?.name || null,
          user_id: entry.context?.userId || null,
          session_id: this.sessionId,
          environment: this.isDevelopment ? 'development' : 'production',
          version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        },
        stack_trace: entry.error?.stack || null,
        request_id: entry.context?.metadata?.requestId || null,
      };

      if (this.isDevelopment) {
        console.log('Dados sendo enviados para API:', JSON.stringify(logData, null, 2));
      }

      // Fazer chamada para a API /api/logs
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId,
        },
        body: JSON.stringify(logData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(`API Error ${response.status}: ${errorData.error || errorData.message || 'Erro desconhecido'}`);
      }

      const result = await response.json();
      
      if (this.isDevelopment) {
        console.debug('Log persistido com sucesso via API:', result.message);
      }

    } catch (error: any) {
      // Verificar se é erro de conectividade ou de rede
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                            error.message?.includes('Network') ||
                            error.message?.includes('CORS') ||
                            error.name === 'TypeError' ||
                            error.name === 'NetworkError';

      const isServerError = error.message?.includes('API Error 5') || // 5xx errors
                           error.message?.includes('Internal Server Error');

      if (isNetworkError) {
        console.warn('🚫 Erro de conectividade detectado. Desabilitando persistência de logs temporariamente.');
        this.supabaseConnectionFailed = true;
      } else if (isServerError) {
        console.warn('🚫 Erro do servidor detectado. Desabilitando persistência de logs temporariamente.');
        this.supabaseConnectionFailed = true;
      } else {
        console.error('Erro ao persistir log via API:', error.message || error);
        
        // Para erros de validação (4xx), não desabilitar a persistência
        if (!error.message?.includes('API Error 4')) {
          this.supabaseConnectionFailed = true;
        }
      }
    }
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.addToBuffer(entry);
    this.logToConsole(entry);
    this.persistToSupabase(entry); // Persistir no banco
  }

  public warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.addToBuffer(entry);
    this.logToConsole(entry);
    this.persistToSupabase(entry); // Persistir no banco
  }

  public info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.addToBuffer(entry);
    this.logToConsole(entry);
    this.persistToSupabase(entry); // Persistir no banco
  }

  public debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.addToBuffer(entry);
    this.logToConsole(entry);
    this.persistToSupabase(entry); // Persistir no banco
  }

  public getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level <= level);
    }
    return [...this.logs];
  }

  public async getLogsFromDatabase(
    limit: number = 100,
    level?: string,
    context?: string,
    startDate?: string,
    endDate?: string
  ): Promise<SystemLogEntry[]> {
    try {
      // Construir parâmetros da query
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', '0');

      if (level) {
        params.append('level', level);
      }

      if (context) {
        params.append('context', context);
      }

      if (startDate) {
        params.append('start_date', startDate);
      }

      if (endDate) {
        params.append('end_date', endDate);
      }

      // Fazer chamada para a API /api/logs
      const response = await fetch(`/api/logs?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('Erro ao buscar logs via API:', errorData.error || errorData.message);
        return [];
      }

      const result = await response.json();
      return result.data || [];

    } catch (error: any) {
      console.error('Erro ao buscar logs via API:', error.message || error);
      return [];
    }
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public async clearDatabaseLogs(): Promise<boolean> {
    try {
      // Calcular data de 30 dias atrás como padrão
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fazer chamada para a API /api/logs com DELETE
      const response = await fetch(`/api/logs?olderThan=${thirtyDaysAgo.toISOString()}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('Erro ao limpar logs via API:', errorData.error || errorData.message);
        return false;
      }

      const result = await response.json();
      console.info('Logs limpos com sucesso:', result.message);
      return true;

    } catch (error: any) {
      console.error('Erro ao limpar logs via API:', error.message || error);
      return false;
    }
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public setPersistence(enabled: boolean): void {
    this.persistToDatabase = enabled;
    if (enabled) {
      // Reset connection failed flag when re-enabling
      this.supabaseConnectionFailed = false;
    }
  }

  public resetSupabaseConnection(): void {
    this.supabaseConnectionFailed = false;
    console.info('🔄 Conexão com Supabase resetada. Tentativas de persistência reabilitadas.');
  }

  public isSupabaseConnected(): boolean {
    return !this.supabaseConnectionFailed;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  // Método público para testar a persistência
  public async testPersistence(): Promise<void> {
    console.log('=== TESTE DE PERSISTÊNCIA DE LOGS ===');
    console.log('LogLevel enum values:', LogLevel);
    console.log('LogLevelString mapping:', LogLevelString);
    
    // Testar cada nível
    this.debug('Teste DEBUG', { metadata: { test: true } });
    this.info('Teste INFO', { metadata: { test: true } });
    this.warn('Teste WARN', { metadata: { test: true } });
    this.error('Teste ERROR', { metadata: { test: true } });
  }

  // Métodos de conveniência para contextos específicos
  public apiCall(message: string, endpoint: string, metadata?: any): void {
    this.info(message, {
      component: 'API',
      action: 'HTTP_REQUEST',
      metadata: { endpoint, ...metadata }
    });
  }

  public apiError(message: string, endpoint: string, error: Error, metadata?: any): void {
    this.error(message, {
      component: 'API',
      action: 'HTTP_ERROR',
      metadata: { endpoint, ...metadata }
    }, error);
  }

  public websocketEvent(message: string, event: string, metadata?: any): void {
    this.debug(message, {
      component: 'WebSocket',
      action: event,
      metadata
    });
  }

  public userAction(message: string, action: string, userId?: string, metadata?: any): void {
    this.info(message, {
      component: 'UI',
      action,
      userId,
      metadata
    });
  }

  public performance(message: string, component: string, duration: number, metadata?: any): void {
    this.debug(message, {
      component,
      action: 'PERFORMANCE',
      metadata: { duration, ...metadata }
    });
  }
}

// Instância singleton
export const logger = Logger.getInstance();