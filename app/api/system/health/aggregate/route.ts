import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Status = 'healthy' | 'degraded' | 'unhealthy';

async function getSupabaseSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function fetchJSON(url: string, headers: Record<string, string> = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : 'fetch_failed' };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeStatus(input: any): Status {
  if (!input) return 'unhealthy';
  const s = String(input).toLowerCase();
  if (s === 'healthy') return 'healthy';
  if (s === 'degraded') return 'degraded';
  if (s === 'unhealthy') return 'unhealthy';
  return 'degraded';
}

function scoreFor(status: Status): number {
  if (status === 'healthy') return 1;
  if (status === 'degraded') return 0.5;
  return 0;
}

function computeOverallStatus(services: Record<string, Status>): Status {
  const values = Object.values(services);
  if (values.includes('unhealthy')) return 'unhealthy';
  if (values.every(v => v === 'healthy')) return 'healthy';
  return 'degraded';
}

function authorized(request: NextRequest): boolean {
  const token = request.headers.get('authorization') || '';
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
  const expected = process.env.HEALTH_ADMIN_TOKEN || process.env.NEXT_HEALTH_ADMIN_TOKEN || '';
  return !!expected && raw.trim() === expected.trim();
}

export async function GET(request: NextRequest) {
  const started = Date.now();
  const origin = new URL(request.url).origin;
  const authz = authorized(request);
  const headers = { 'Accept': 'application/json' };

  const frontendHealth = await fetchJSON(`${origin}/api/system/health`, headers);
  const publicHealth = await fetchJSON(`${origin}/api/public/system/health`, headers);

  const backendUrl = process.env.SOFIA_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const backendHealth = backendUrl ? await fetchJSON(`${backendUrl.replace(/\/+$/,'')}/health`, headers) : { ok: false, status: 0, data: null };

  const frontendStatus: Status = normalizeStatus(frontendHealth?.data?.status);
  const publicStatus: Status = normalizeStatus(publicHealth?.data?.data?.status ?? publicHealth?.data?.status);
  const backendStatus: Status = normalizeStatus(backendHealth?.data?.status ?? (backendHealth.ok ? 'healthy' : 'unhealthy'));

  const services: Record<string, Status> = {
    frontend: frontendStatus,
    public: publicStatus,
    backend: backendStatus
  };

  const overall: Status = computeOverallStatus(services);

  const response = {
    overall_status: overall,
    timestamp: new Date().toISOString(),
    latency_ms: Date.now() - started,
    services_status: services,
    details: authz ? {
      frontend: {
        http_status: frontendHealth.status,
        ok: frontendHealth.ok
      },
      public: {
        http_status: publicHealth.status,
        ok: publicHealth.ok
      },
      backend: {
        http_status: backendHealth.status,
        ok: (backendHealth as any).ok
      }
    } : undefined
  };

  try {
    const supabase = await getSupabaseSafe();
    if (supabase) {
      const level = overall === 'unhealthy' ? 'error' : overall === 'degraded' ? 'warn' : 'info';
      await supabase.from('system_logs').insert([{
        level,
        message: 'health_aggregate',
        context: 'health_aggregate',
        source: 'frontend',
        metadata: {
          overall_status: overall,
          services_status: services,
          latency_ms: response.latency_ms
        }
      }]);
    }
  } catch {}

  const statusCode = overall === 'healthy' ? 200 : overall === 'degraded' ? 200 : 503;
  return NextResponse.json(response, { status: statusCode, headers: { 'Cache-Control': 'no-cache' } });
}

