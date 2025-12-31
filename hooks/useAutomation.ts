import { useEffect, useMemo, useState } from 'react'
import { RiskMetrics, AdvancedMetrics, RiskAlert } from '@/types/risk-metrics'

type SystemHealth = 'healthy' | 'warning' | 'error'

export interface SystemStatus {
  isInitialized: boolean
  isRunning: boolean
  activeSessions: number
  totalProfit: number
  systemHealth: SystemHealth
  lastUpdate: Date
  emergencyStop?: boolean
}

export interface AutomationMetrics {
  totalBets: number
  successRate: number
  avgResponseTime: number
  queueSize: number
  cpuUsage: number
  memoryUsage: number
  totalSessions?: number
  activeSessions?: number
  totalProfit?: number
  systemUptime?: string
}

function safeNumber(v: any, d = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

export function useAutomation() {
  const [status, setStatus] = useState<SystemStatus>({
    isInitialized: false,
    isRunning: false,
    activeSessions: 0,
    totalProfit: 0,
    systemHealth: 'healthy',
    lastUpdate: new Date(),
  })

  const [metrics, setMetrics] = useState<AutomationMetrics>({
    totalBets: 0,
    successRate: 0,
    avgResponseTime: 0,
    queueSize: 0,
    cpuUsage: 0,
    memoryUsage: 0,
  })

  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    overallRiskScore: 0,
    expectedReturn: 0,
    volatility: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    valueAtRisk: 0,
    tableRisks: {},
    strategyRisks: {},
    recommendations: [],
    lastUpdate: new Date(),
  })

  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics>({
    roi: 0,
    hitRate: 0,
    profitFactor: 0,
    winStreak: 0,
    lossStreak: 0,
    bankrollUsage: 0,
    consecutiveLosses: 0,
    totalBets: 0,
    totalProfit: 0,
    averageBet: 0,
    systemUptime: 0,
    hourlyPerformance: {},
    dailyPerformance: {},
    timestamp: new Date(),
  })

  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([])

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  async function refreshStatus() {
    try {
      const res = await fetch('/api/automation/initialize')
      const data = await res.json().catch(() => ({}))
      setStatus(s => ({
        ...s,
        isInitialized: Boolean(data.initialized ?? false),
        isRunning: Boolean(data.running ?? s.isRunning ?? false),
        systemHealth: (data.health as SystemHealth) ?? s.systemHealth ?? 'healthy',
        lastUpdate: new Date(),
      }))
    } catch (e) {
      setError('Falha ao obter status do sistema')
    }
  }

  async function refreshMetrics() {
    try {
      const res = await fetch('/api/automation/metrics')
      const data = await res.json().catch(() => ({}))
      const base = data?.metrics ?? data ?? {}
      setMetrics({
        totalBets: safeNumber(base.totalBets),
        successRate: safeNumber(base.successRate ?? base.winRate),
        avgResponseTime: safeNumber(base.avgResponseTime),
        queueSize: safeNumber(base.queueSize),
        cpuUsage: safeNumber(base.cpuUsage ?? base.performance?.cpu),
        memoryUsage: safeNumber(base.memoryUsage ?? base.performance?.memory),
        totalSessions: safeNumber(base.totalSessions),
        activeSessions: safeNumber(base.activeSessions),
        totalProfit: safeNumber(base.totalProfit),
        systemUptime: typeof base.systemUptime === 'string' ? base.systemUptime : '00:00:00',
      })
    } catch (e) {
      setError('Falha ao obter métricas de automação')
    }
  }

  async function refreshRiskMetrics() {
    try {
      const response = await fetch('/api/automation/risk-metrics')
      if (response.ok) {
        const data = await response.json()
        setRiskMetrics({
          overallRiskScore: safeNumber(data.overallRiskScore),
          expectedReturn: safeNumber(data.expectedReturn),
          volatility: safeNumber(data.volatility),
          sharpeRatio: safeNumber(data.sharpeRatio),
          maxDrawdown: safeNumber(data.maxDrawdown),
          valueAtRisk: safeNumber(data.valueAtRisk),
          tableRisks: data.tableRisks || {},
          strategyRisks: data.strategyRisks || {},
          recommendations: data.recommendations || [],
          lastUpdate: new Date(data.lastUpdate || Date.now()),
        })
      }
    } catch (err) {
      console.error('Error fetching risk metrics:', err)
    }
  }

  async function refreshAdvancedMetrics() {
    try {
      const response = await fetch('/api/automation/advanced-metrics')
      if (response.ok) {
        const data = await response.json()
        setAdvancedMetrics({
          roi: safeNumber(data.roi),
          hitRate: safeNumber(data.hitRate),
          profitFactor: safeNumber(data.profitFactor),
          winStreak: safeNumber(data.winStreak),
          lossStreak: safeNumber(data.lossStreak),
          bankrollUsage: safeNumber(data.bankrollUsage),
          consecutiveLosses: safeNumber(data.consecutiveLosses),
          totalBets: safeNumber(data.totalBets),
          totalProfit: safeNumber(data.totalProfit),
          averageBet: safeNumber(data.averageBet),
          systemUptime: safeNumber(data.systemUptime),
          hourlyPerformance: data.hourlyPerformance || {},
          dailyPerformance: data.dailyPerformance || {},
          timestamp: new Date(data.timestamp || Date.now()),
        })
      }
    } catch (err) {
      console.error('Error fetching advanced metrics:', err)
    }
  }

  async function initializeSystem(sendCommand?: (command: string) => boolean) {
    try {
      setLoading(true)
      
      // Try WebSocket first if available
      if (sendCommand) {
        const success = sendCommand('initialize_system')
        if (success) {
          setStatus(s => ({ ...s, isInitialized: true, systemHealth: 'healthy', lastUpdate: new Date() }))
          await refreshMetrics()
          return { success: true }
        }
      }
      
      // Fallback to HTTP API
      const res = await fetch('/api/automation/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providers: ['puppeteer'],
          maxConcurrentSessions: 5,
          retryAttempts: 3,
          enableLogging: true
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Falha ao inicializar sistema')
      }
      setStatus(s => ({ ...s, isInitialized: true, systemHealth: 'healthy', lastUpdate: new Date() }))
      await refreshMetrics()
      return { success: true, data }
    } catch (e: any) {
      setError(e?.message || 'Erro ao inicializar sistema')
      return { success: false, error: e?.message || 'Erro ao inicializar sistema' }
    } finally {
      setLoading(false)
    }
  }

  async function emergencyStop(sendCommand?: (command: string) => boolean) {
    try {
      setLoading(true)
      
      // Try WebSocket first if available
      if (sendCommand) {
        const success = sendCommand('emergency_stop')
        if (success) {
          setStatus(s => ({ ...s, isRunning: false, lastUpdate: new Date() }))
          return { success: true }
        }
      }
      
      // Fallback to HTTP API
      const res = await fetch('/api/automation/emergency-stop', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Falha ao executar parada de emergência')
      }
      setStatus(s => ({ ...s, isRunning: false, lastUpdate: new Date() }))
      return { success: true, data }
    } catch (e: any) {
      setError(e?.message || 'Erro na parada de emergência')
      return { success: false, error: e?.message || 'Erro na parada de emergência' }
    } finally {
      setLoading(false)
    }
  }

  async function startSession(payload: {
    tableId: string
    strategy: string
    suggestedBets: Array<any>
    config?: Record<string, any>
  }) {
    try {
      setLoading(true)
      const res = await fetch('/api/automation/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Falha ao iniciar sessão')
      }
      setStatus(s => ({ ...s, isRunning: true, activeSessions: safeNumber((s.activeSessions || 0) + 1) }))
      await refreshMetrics()
      return { success: true, data }
    } catch (e: any) {
      setError(e?.message || 'Erro ao iniciar sessão')
      return { success: false, error: e?.message || 'Erro ao iniciar sessão' }
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh básico
  useEffect(() => {
    let mounted = true
    ;(async () => {
      await refreshStatus()
      await refreshMetrics()
      await refreshRiskMetrics()
      await refreshAdvancedMetrics()
    })()
    const t = setInterval(() => {
      if (!mounted) return
      refreshMetrics()
      refreshRiskMetrics()
      refreshAdvancedMetrics()
    }, 5000)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [])

  const initialized = useMemo(() => status.isInitialized === true, [status.isInitialized])

  // Notification management
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>>([]);

  const addNotification = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // WebSocket message handler
  const handleWebSocketMessage = (channel: string, data: any) => {
    switch (channel) {
      case 'AUTOMATION_NOTIFICATIONS':
        addNotification('info', data.message);
        if (data.type === 'system_initialized') {
          setStatus(prev => ({ ...prev, isInitialized: true }));
        } else if (data.type === 'emergency_stop') {
          setStatus(prev => ({ ...prev, isRunning: false }));
        }
        break;
        
      case 'BETTING_UPDATES':
        if (data.type === 'bet_placed') {
          setMetrics(prev => ({ ...prev, totalBets: prev.totalBets + 1 }));
        } else if (data.type === 'bet_result') {
          setMetrics(prev => ({ 
            ...prev, 
            successRate: calculateSuccessRate(data.result)
          }));
        }
        break;
        
      case 'SESSION_EVENTS':
        if (data.type === 'session_started') {
          setStatus(prev => ({ 
            ...prev, 
            isRunning: true,
            activeSessions: prev.activeSessions + 1
          }));
          addNotification('success', `Sessão ${data.sessionId} iniciada`);
        } else if (data.type === 'session_ended') {
          setStatus(prev => ({ 
            ...prev, 
            activeSessions: Math.max(0, prev.activeSessions - 1)
          }));
          addNotification('info', `Sessão finalizada: ${data.profit > 0 ? 'lucro' : 'prejuízo'} R$ ${data.profit}`);
        }
        break;
        
      case 'SYSTEM_STATUS':
        if (data.uptime) {
          setStatus(prev => ({ ...prev, lastUpdate: new Date() }));
        }
        break;
    }
  };

  const calculateSuccessRate = (result: any) => {
    // Implementation depends on your result structure
    return result.won ? 1 : 0; // Simplified
  };

  return {
    status,
    metrics,
    riskMetrics,
    advancedMetrics,
    riskAlerts,
    loading,
    error,
    initialized,
    notifications,
    refreshStatus,
    refreshMetrics,
    refreshRiskMetrics,
    refreshAdvancedMetrics,
    initializeSystem,
    emergencyStop,
    startSession,
    addNotification,
    clearNotifications,
    handleWebSocketMessage,
  }
}