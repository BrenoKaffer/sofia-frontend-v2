/**
 * Helper compartilhado para proxyar chamadas ao Backend SOFIA
 * Padroniza base URL, headers e fallback de mocks.
 */

export const USE_MOCKS = (process.env.USE_MOCKS || process.env.NEXT_PUBLIC_USE_MOCKS || '').toString().toLowerCase() === 'true';
export const BACKEND_BASE = process.env.SOFIA_BACKEND_URL || 'http://localhost:3001';

type JsonValue = Record<string, any> | any[] | string | number | boolean | null;

export async function fetchBackend(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${BACKEND_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Permitir override mantendo padrão
  const mergedInit: RequestInit = {
    ...init,
    headers: {
      ...headers,
      ...(init.headers as Record<string, string> | undefined),
    },
  };

  return fetch(url, mergedInit);
}

export async function safeJson(res: Response): Promise<JsonValue | null> {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return await res.json();
    const txt = await res.text();
    try { return JSON.parse(txt); } catch { return { message: txt }; }
  } catch {
    return null;
  }
}

export function numberOrZero(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Mocks leves e consistentes para rotas críticas
export const mocks = {
  availableOptions: {
    tables: [
      { id: 'TBL-01', name: 'Mesa 1', status: 'active' },
      { id: 'TBL-02', name: 'Mesa 2', status: 'active' },
    ],
    strategies: [
      { id: 'STRAT-BASE', name: 'Base', version: 'v1' },
      { id: 'STRAT-ADV', name: 'Avançada', version: 'v2' },
    ],
    providers: [
      { id: 'iframe', name: 'Iframe', status: 'connected' },
      { id: 'web', name: 'Web', status: 'disconnected' },
    ],
  },
  realtimeSignals(limit = 10) {
    return Array.from({ length: limit }).map((_, i) => ({
      id: `sig-${Date.now()}-${i}`,
      table_id: i % 2 === 0 ? 'TBL-01' : 'TBL-02',
      strategy_name: i % 2 === 0 ? 'Base' : 'Avançada',
      confidence: Number((Math.random() * 0.4 + 0.6).toFixed(2)),
      expected_return: Number((Math.random() * 50 - 10).toFixed(2)),
      timestamp: new Date().toISOString(),
      type: Math.random() > 0.5 ? 'RED' : 'BLACK',
    }));
  },
  realtimeKpis(limit = 10) {
    return Array.from({ length: limit }).map((_, i) => ({
      table_id: i % 2 === 0 ? 'TBL-01' : 'TBL-02',
      assertiveness_rate_percent: Number((Math.random() * 30 + 60).toFixed(2)),
      total_profit: Number((Math.random() * 500 - 100).toFixed(2)),
      total_signals: Math.floor(Math.random() * 100) + 50,
      successful_signals: Math.floor(Math.random() * 80) + 20,
      failed_signals: Math.floor(Math.random() * 20) + 5,
    }));
  },
  logs(limit = 50) {
    return Array.from({ length: limit }).map((_, i) => ({
      id: `log-${Date.now()}-${i}`,
      level: i % 7 === 0 ? 'error' : i % 3 === 0 ? 'warn' : 'info',
      message: i % 7 === 0 ? 'Falha ao conectar provedor' : 'Operação executada',
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      context: { component: 'automation', sessionId: `S-${Math.floor(Math.random() * 100)}` },
    }));
  },
  automationMetrics: {
    totalSessions: 0,
    activeSessions: 0,
    totalBets: 0,
    totalProfit: 0,
    systemUptime: '00:00:00',
    queueSize: 0,
    avgResponseTime: 0,
    successRate: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    providers: { connected: 0, total: 0 },
  },
};