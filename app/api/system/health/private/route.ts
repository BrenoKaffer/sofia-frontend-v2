import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Status = 'healthy' | 'degraded' | 'unhealthy';

function authorized(request: NextRequest): boolean {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const expected = process.env.HEALTH_ADMIN_TOKEN || process.env.NEXT_HEALTH_ADMIN_TOKEN || '';
  return !!expected && token.trim() === expected.trim();
}

async function getSupabaseSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function checkSupabase(): Promise<{ status: Status; latency_ms: number; details?: any }> {
  const start = Date.now();
  try {
    const supabase = await getSupabaseSafe();
    if (!supabase) {
      return { status: 'unhealthy', latency_ms: Date.now() - start, details: { error: 'missing_service_role' } };
    }
    const tables = ['user_profiles', 'payment_webhooks', 'subscriptions'];
    const result: Record<string, boolean> = {};
    for (const t of tables) {
      const { error } = await supabase.from(t).select('id').limit(1);
      result[t] = !error;
      if (error) {
        return { status: 'degraded', latency_ms: Date.now() - start, details: { table_error: t, message: error.message } };
      }
    }
    return { status: 'healthy', latency_ms: Date.now() - start, details: { tables_ok: result } };
  } catch (err: any) {
    return { status: 'unhealthy', latency_ms: Date.now() - start, details: { error: String(err?.message || err) } };
  }
}

async function checkPagarmeRecipients(): Promise<{ status: Status; latency_ms: number; details?: any }> {
  const start = Date.now();
  try {
    const key = process.env.PAGARME_SECRET_KEY || process.env.PAGARME_API_KEY;
    if (!key) {
      return { status: 'unhealthy', latency_ms: Date.now() - start, details: { error: 'missing_api_key' } };
    }
    const auth = Buffer.from(`${key}:`).toString('base64');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch('https://api.pagar.me/core/v5/recipients?page=1&size=1', {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    if (res.ok) {
      return { status: 'healthy', latency_ms: latency };
    }
    if (res.status === 401 || res.status === 403) {
      return { status: 'unhealthy', latency_ms: latency, details: { http_status: res.status } };
    }
    return { status: 'degraded', latency_ms: latency, details: { http_status: res.status } };
  } catch (err: any) {
    return { status: 'degraded', latency_ms: Date.now() - start, details: { error: String(err?.message || err) } };
  }
}

async function checkWebhook(): Promise<{ status: Status; latency_ms: number; details?: any }> {
  const start = Date.now();
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || '';
    const url = origin ? `${origin.replace(/\/+$/, '')}/api/webhooks/pagarme` : '/api/webhooks/pagarme';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    if (res.ok) return { status: 'healthy', latency_ms: latency };
    return { status: res.status === 410 ? 'degraded' : 'unhealthy', latency_ms: latency, details: { http_status: res.status } };
  } catch (err: any) {
    return { status: 'degraded', latency_ms: Date.now() - start, details: { error: String(err?.message || err) } };
  }
}

function overallStatus(items: Array<{ status: Status }>): Status {
  const ss = items.map(i => i.status);
  if (ss.includes('unhealthy')) return 'unhealthy';
  if (ss.every(s => s === 'healthy')) return 'healthy';
  return 'degraded';
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }
  const started = Date.now();
  const [db, pagarme, webhook] = await Promise.all([checkSupabase(), checkPagarmeRecipients(), checkWebhook()]);
  const services = {
    database: db,
    external_pagarme: pagarme,
    webhooks: webhook,
  };
  const status = overallStatus([db, pagarme, webhook]);
  const body = {
    status,
    timestamp: new Date().toISOString(),
    uptime_ms: process.uptime() * 1000,
    latency_ms: Date.now() - started,
    services,
  };
  try {
    const supabase = await getSupabaseSafe();
    if (supabase) {
      const level = status === 'unhealthy' ? 'error' : status === 'degraded' ? 'warn' : 'info';
      await supabase
        .from('system_logs')
        .insert([{ level, message: 'system_health_private', context: 'health_private', source: 'frontend', metadata: body }]);
    }
  } catch {}
  const code = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
  return NextResponse.json(body, { status: code, headers: { 'Cache-Control': 'no-cache' } });
}
