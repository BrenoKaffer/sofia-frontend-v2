import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { sendDunningEmail } from '@/lib/email'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
  return { client: createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }), configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) }
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 3600 * 1000)
}

function computePlan(nextRetryBase: Date, retryCount: number) {
  if (retryCount === 1) return { nextRetryAt: addHours(nextRetryBase, 24), willCancelAt: null }
  if (retryCount === 2) return { nextRetryAt: addHours(nextRetryBase, 48), willCancelAt: null }
  return { nextRetryAt: null, willCancelAt: nextRetryBase }
}

async function processSubscription(client: any, sub: any) {
  const now = new Date()
  const meta = typeof sub.metadata === 'object' && sub.metadata !== null ? sub.metadata : {}
  const retryCount = Number(meta.retry_count || 0) + 1
  const plan = computePlan(now, retryCount)
  const newMeta = { ...meta, retry_count: retryCount, next_retry_at: plan.nextRetryAt ? plan.nextRetryAt.toISOString() : null }
  let canceled = false
  if (retryCount >= 3) {
    await client.from('subscriptions').update({ status: 'canceled', canceled_at: now.toISOString(), metadata: newMeta }).eq('id', sub.id)
    canceled = true
  } else {
    await client.from('subscriptions').update({ metadata: newMeta }).eq('id', sub.id)
  }
  const { data: txs } = await client.from('transactions').select('id,status,metadata').eq('user_id', sub.user_id).order('created_at', { ascending: false }).limit(1)
  const tx = Array.isArray(txs) ? txs[0] : null
  if (tx) {
    const tmeta = typeof tx.metadata === 'object' && tx.metadata !== null ? tx.metadata : {}
    const tNew = { ...tmeta, retry_count: retryCount, next_retry_at: newMeta.next_retry_at }
    await client.from('transactions').update({ metadata: tNew }).eq('id', tx.id)
  }
  try {
    await sendDunningEmail({ to: sub.user_email, name: null, retryCount, nextRetryAt: newMeta.next_retry_at, cancelAt: canceled ? now.toISOString() : null, paymentUrl: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/settings/billing` : undefined })
  } catch (e: any) {
    logger.warn('Falha ao enviar email de dunning', { metadata: { component: 'BILLING', action: 'DUNNING', error: e?.message } })
  }
  logger.info('Dunning processado', { metadata: { component: 'BILLING', action: 'DUNNING', subscription_id: sub.id, user_id: sub.user_id, retry_count: retryCount, next_retry_at: newMeta.next_retry_at, canceled } })
  return { canceled, retryCount }
}

export async function POST(_req: NextRequest) {
  const { client, configured } = getAdminClient()
  if (!configured) {
    return NextResponse.json({ error: 'Supabase admin não configurado' }, { status: 500 })
  }
  const statuses = ['past_due', 'unpaid']
  const { data: subs, error } = await client.from('subscriptions').select('id,user_id,user_email,status,metadata').in('status', statuses).limit(500)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  let attempted = 0
  let canceled = 0
  for (const sub of subs || []) {
    const meta = typeof sub.metadata === 'object' && sub.metadata !== null ? sub.metadata : {}
    const retryCount = Number(meta.retry_count || 0)
    const nextAt = meta.next_retry_at ? new Date(meta.next_retry_at) : null
    const due = !nextAt || nextAt <= new Date()
    if (retryCount >= 3 || !due) continue
    const res = await processSubscription(client, sub)
    attempted++
    if (res.canceled) canceled++
  }
  return NextResponse.json({ success: true, attempted, canceled, reviewed: (subs || []).length, timestamp: new Date().toISOString() })
}

export async function GET() {
  return NextResponse.json({ status: 'ok', task: 'dunning', timestamp: new Date().toISOString() })
}
