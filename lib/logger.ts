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
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    this.persistToDatabase = true; // Habilitar persistência por padrão
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
    if (!this.persistToDatabase || !this.supabase || this.supabaseConnectionFailed) return;

    try {
      // Mapear o level
      const levelString = LogLevelString[entry.level];
      
      // Log detalhado para debug
      console.log('=== DEBUG PERSISTÊNCIA ===');
      console.log('entry.level:', entry.level, 'typeof:', typeof entry.level);
      console.log('levelString:', levelString, 'typeof:', typeof levelString);
      console.log('LogLevelString:', LogLevelString);
      console.log('Object.keys(LogLevelString):', Object.keys(LogLevelString));
      console.log('Object.values(LogLevelString):', Object.values(LogLevelString));

      // Dados mínimos que devem existir em qualquer versão da tabela
      const minimalLogData = {
        level: levelString,
        message: entry.message,
      };

      console.log('Dados sendo enviados:', JSON.stringify(minimalLogData, null, 2));

      // Dados opcionais que podem ou não existir na tabela
      const optionalFields = {
        timestamp: entry.timestamp,
        context: entry.context?.component || null,
        source: entry.context?.action || null,
        user_id: entry.context?.userId || null,
        session_id: this.sessionId,
        stack_trace: entry.error?.stack || null,
        environment: this.isDevelopment ? 'development' : 'production',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        details: {
          metadata: entry.context?.metadata || {},
          error_message: entry.error?.message || null,
          error_name: entry.error?.name || null,
        },
      };

      // Tentar inserir com todos os campos primeiro
      let logData = { ...minimalLogData, ...optionalFields };
      let { error } = await this.supabase
        .from('system_logs')
        .insert([logData]);

      // Se houver erro de coluna não encontrada, tentar com campos reduzidos
      if (error && error.code === 'PGRST204') {
        console.warn('Coluna não encontrada, tentando com campos básicos:', error.message);
        
        // Tentar sem details
        const { details, ...withoutDetails } = { ...minimalLogData, ...optionalFields };
        
        const { error: error2 } = await this.supabase
          .from('system_logs')
          .insert([withoutDetails]);

        if (error2 && error2.code === 'PGRST204') {
          console.warn('Ainda há colunas não encontradas, tentando com campos mínimos:', error2.message);
          
          // Tentar apenas com campos essenciais
          const essentialFields = {
            ...minimalLogData,
            timestamp: entry.timestamp,
            context: entry.context?.component || null,
          };

          const { error: error3 } = await this.supabase
            .from('system_logs')
            .insert([essentialFields]);

          if (error3 && error3.code === 'PGRST204') {
            console.warn('Tentando apenas com campos mínimos absolutos:', error3.message);
            
            // Último recurso: apenas level e message
            const { error: finalError } = await this.supabase
              .from('system_logs')
              .insert([minimalLogData]);

            if (finalError) {
              console.error('Falha ao persistir log mesmo com campos mínimos:', finalError);
              console.error('Dados que estavam sendo enviados:', JSON.stringify(minimalLogData, null, 2));
              console.error('entry.level original:', entry.level);
              console.error('typeof entry.level:', typeof entry.level);
              console.error('LogLevelString[entry.level]:', LogLevelString[entry.level]);
              console.error('Object.keys(LogLevelString):', Object.keys(LogLevelString));
              console.error('Object.values(LogLevelString):', Object.values(LogLevelString));
              
              // Se nem os campos mínimos funcionam, desabilitar persistência
              this.supabaseConnectionFailed = true;
              console.warn('🚫 Persistência de logs no Supabase desabilitada devido a problemas de estrutura da tabela');
              
              // Log detalhado do erro para debug
              if (finalError.code === '23514') {
                console.warn('Erro de constraint check detectado. Verifique os valores permitidos para a coluna level.');
                console.warn('Constraint esperada: DEBUG, INFO, WARN, ERROR, FATAL');
                console.warn('Valor enviado:', levelString);
              }
            } else {
              console.info('Log persistido com campos mínimos (level + message)');
            }
          } else if (error3) {
            console.error('Falha ao persistir log com campos essenciais:', error3);
          } else {
            console.info('Log persistido com campos essenciais');
          }
        } else if (error2) {
          console.error('Falha ao persistir log sem details:', error2);
        } else {
          console.info('Log persistido sem coluna details');
        }
      } else if (error) {
        // Verificar se é erro de conectividade ou constraint
        const isConnectionError = error.message?.includes('Failed to fetch') || 
                                 error.message?.includes('Network') ||
                                 error.message?.includes('CORS') ||
                                 !error.code;

        const isConstraintError = error.code === '23514' || // Check constraint violation
                                 error.code === '23505' || // Unique violation
                                 error.code === '23503' || // Foreign key violation
                                 error.message?.includes('constraint') ||
                                 error.message?.includes('violates check');

        if (isConnectionError || isConstraintError) {
          const errorType = isConnectionError ? 'conectividade' : 'constraint/estrutura da tabela';
          console.warn(`🚫 Problema de ${errorType} com Supabase detectado. Desabilitando persistência de logs.`);
          console.warn(`Erro detalhado: ${error.message || error.code}`);
          this.supabaseConnectionFailed = true;
        } else {
          console.error('Falha ao persistir log no banco:', error);
        }
      } else {
        // Sucesso na primeira tentativa
        console.debug('Log persistido com sucesso com todos os campos');
      }
    } catch (error: any) {
      // Verificar se é erro de conectividade
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('Network') ||
          error.name === 'TypeError') {
        console.warn('🚫 Erro de conectividade detectado. Desabilitando persistência de logs no Supabase.');
        this.supabaseConnectionFailed = true;
      } else {
        console.error('Erro ao persistir log:', error);
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
    if (!this.supabase) {
      console.warn('Supabase não configurado - retornando logs locais');
      return [];
    }

    try {
      let query = this.supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (level) {
        query = query.eq('level', level);
      }

      if (context) {
        query = query.eq('context', context);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar logs do banco:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public async clearDatabaseLogs(): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { error } = await this.supabase
        .from('system_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos

      if (error) {
        console.error('Erro ao limpar logs do banco:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
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