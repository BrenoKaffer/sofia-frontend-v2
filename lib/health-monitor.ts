import { backendService } from './backend-service';
import { websocketService } from './websocket-service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  services: {
    backend: ServiceHealth;
    websocket: ServiceHealth;
    database: ServiceHealth;
    auth: ServiceHealth;
  };
  metrics: {
    responseTime: number;
    uptime: number;
    errorRate: number;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: number;
  error?: string;
  details?: any;
}

export class HealthMonitor {
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: HealthStatus) => void> = new Set();
  private lastStatus: HealthStatus | null = null;
  private startTime = Date.now();
  private errorCount = 0;
  private totalChecks = 0;

  constructor(private intervalMs: number = 30000) {}

  /**
   * Inicia o monitoramento automático
   */
  start(): void {
    if (this.checkInterval) {
      return;
    }

    // Fazer check inicial
    this.performHealthCheck();

    // Configurar checks periódicos
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.intervalMs);

    console.log('Health monitor iniciado');
  }

  /**
   * Para o monitoramento
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('Health monitor parado');
  }

  /**
   * Adiciona listener para mudanças de status
   */
  onStatusChange(callback: (status: HealthStatus) => void): () => void {
    this.listeners.add(callback);
    
    // Enviar status atual se disponível
    if (this.lastStatus) {
      callback(this.lastStatus);
    }

    // Retornar função de cleanup
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Obtém o último status conhecido
   */
  getLastStatus(): HealthStatus | null {
    return this.lastStatus;
  }

  /**
   * Força um check de saúde
   */
  async forceCheck(): Promise<HealthStatus> {
    return this.performHealthCheck();
  }

  private async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    this.totalChecks++;

    try {
      // Verificar todos os serviços em paralelo
      const [backendHealth, websocketHealth, databaseHealth, authHealth] = await Promise.allSettled([
        this.checkBackendHealth(),
        this.checkWebSocketHealth(),
        this.checkDatabaseHealth(),
        this.checkAuthHealth()
      ]);

      const services = {
        backend: this.extractServiceHealth(backendHealth),
        websocket: this.extractServiceHealth(websocketHealth),
        database: this.extractServiceHealth(databaseHealth),
        auth: this.extractServiceHealth(authHealth)
      };

      // Calcular status geral
      const overallStatus = this.calculateOverallStatus(services);
      const responseTime = Date.now() - startTime;

      // Atualizar métricas de erro
      if (overallStatus === 'unhealthy') {
        this.errorCount++;
      }

      const status: HealthStatus = {
        status: overallStatus,
        timestamp: Date.now(),
        services,
        metrics: {
          responseTime,
          uptime: Date.now() - this.startTime,
          errorRate: this.totalChecks > 0 ? (this.errorCount / this.totalChecks) * 100 : 0
        }
      };

      this.lastStatus = status;
      this.notifyListeners(status);

      return status;

    } catch (error) {
      console.error('Erro no health check:', error);
      this.errorCount++;

      const errorStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: Date.now(),
        services: {
          backend: { status: 'unhealthy', lastCheck: Date.now(), error: 'Health check failed' },
          websocket: { status: 'unhealthy', lastCheck: Date.now(), error: 'Health check failed' },
          database: { status: 'unhealthy', lastCheck: Date.now(), error: 'Health check failed' },
          auth: { status: 'unhealthy', lastCheck: Date.now(), error: 'Health check failed' }
        },
        metrics: {
          responseTime: Date.now() - startTime,
          uptime: Date.now() - this.startTime,
          errorRate: (this.errorCount / this.totalChecks) * 100
        }
      };

      this.lastStatus = errorStatus;
      this.notifyListeners(errorStatus);

      return errorStatus;
    }
  }

  private async checkBackendHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/system/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          status: 'healthy',
          responseTime,
          lastCheck: Date.now(),
          details: data
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          lastCheck: Date.now(),
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkWebSocketHealth(): Promise<ServiceHealth> {
    try {
      const isConnected = websocketService.isConnected();
      const status = websocketService.getStatus();

      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        lastCheck: Date.now(),
        details: { connectionStatus: status }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : 'WebSocket check failed'
      };
    }
  }

  private async checkDatabaseHealth(): Promise<ServiceHealth> {
    try {
      // Verificar conexão com Supabase
      if (typeof window !== 'undefined') {
        const { supabase } = await import('./supabase');
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          return {
            status: 'unhealthy',
            lastCheck: Date.now(),
            error: error.message
          };
        }

        return {
          status: 'healthy',
          lastCheck: Date.now(),
          details: { connection: 'active' }
        };
      }

      return {
        status: 'healthy',
        lastCheck: Date.now(),
        details: { connection: 'server-side' }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : 'Database check failed'
      };
    }
  }

  private async checkAuthHealth(): Promise<ServiceHealth> {
    try {
      if (typeof window !== 'undefined') {
        const { supabase } = await import('./supabase');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          return {
            status: 'degraded',
            lastCheck: Date.now(),
            error: error.message
          };
        }

        return {
          status: 'healthy',
          lastCheck: Date.now(),
          details: { 
            authenticated: !!session,
            sessionValid: session ? !this.isSessionExpired(session) : false
          }
        };
      }

      return {
        status: 'healthy',
        lastCheck: Date.now(),
        details: { context: 'server-side' }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : 'Auth check failed'
      };
    }
  }

  private extractServiceHealth(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: result.reason?.message || 'Service check failed'
      };
    }
  }

  private calculateOverallStatus(services: HealthStatus['services']): HealthStatus['status'] {
    const statuses = Object.values(services).map(s => s.status);
    
    if (statuses.every(s => s === 'healthy')) {
      return 'healthy';
    } else if (statuses.some(s => s === 'unhealthy')) {
      return 'unhealthy';
    } else {
      return 'degraded';
    }
  }

  private isSessionExpired(session: any): boolean {
    if (!session.expires_at) return false;
    return Date.now() / 1000 > session.expires_at;
  }

  private notifyListeners(status: HealthStatus): void {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Erro no listener de health status:', error);
      }
    });
  }
}

// Instância singleton
export const healthMonitor = new HealthMonitor();