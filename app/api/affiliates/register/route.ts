import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { createRecipientOnPagarme } from '@/lib/pagarme-recipient-service'

export const runtime = 'nodejs'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  document: z.string().min(11),
  bank_account: z.object({
    holder_name: z.string().min(1),
    bank: z.string().min(1),
    branch_number: z.string().min(1),
    account_number: z.string().min(1),
    account_check_digit: z.string().min(1),
    type: z.enum(['checking', 'savings']),
  }),
})

function sanitize(v: string) {
  return v.replace(/\D/g, '')
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return {
    client: createClient(url || '', key || '', { auth: { autoRefreshToken: false, persistSession: false } }),
    configured: Boolean(url && key),
  }
}

function genSlug(len = 7) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const arr = crypto.randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length]
  return out
}

async function uniqueSlug(supabase: any, attempts = 5): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const slug = genSlug(7)
    const { data } = await supabase.from('affiliates').select('id').eq('slug', slug).limit(1)
    if (!data || data.length === 0) return slug
  }
  return genSlug(8)
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const parsed = schema.parse(input)

    const payload = {
      name: parsed.name,
      email: parsed.email,
      document: sanitize(parsed.document),
      bank_account: {
        holder_name: parsed.bank_account.holder_name,
        bank: sanitize(parsed.bank_account.bank),
        branch_number: sanitize(parsed.bank_account.branch_number),
        account_number: sanitize(parsed.bank_account.account_number),
        account_check_digit: sanitize(parsed.bank_account.account_check_digit),
        type: parsed.bank_account.type,
      },
    }

    const { client: supabase, configured } = getAdminClient()
    if (!configured) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado' }, { status: 500 })
    }

    const recipient = await createRecipientOnPagarme({
      name: payload.name,
      email: payload.email,
      document: payload.document,
      bank_account: payload.bank_account,
    })

    const recipientId = recipient?.id || recipient?.recipient?.id
    if (!recipientId) {
      return NextResponse.json({ success: false, error: 'Falha ao criar recebedor no Pagar.me' }, { status: 502 })
    }

    const slug = await uniqueSlug(supabase)

    const { data: affInsert, error: affErr } = await supabase
      .from('affiliates')
      .insert({
        name: payload.name,
        email: payload.email,
        slug,
        recipient_id: recipientId,
        status: 'active',
        type: 'affiliate',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (affErr || !affInsert?.id) {
      return NextResponse.json({ success: false, error: 'Falha ao criar registro do afiliado' }, { status: 500 })
    }

    const affiliateId = affInsert.id

    const { error: splitErr } = await supabase
      .from('affiliates_split_rules')
      .insert({
        affiliate_id: affiliateId,
        recipient_id: recipientId,
        percentage: 100,
        commission_mode: 'first_purchase',
        created_at: new Date().toISOString(),
      })
    if (splitErr) {
      return NextResponse.json({ success: false, error: 'Falha ao criar regras de split' }, { status: 500 })
    }

    const BASE = process.env.NEXT_PUBLIC_CHECKOUT_URL ? `${process.env.NEXT_PUBLIC_CHECKOUT_URL}/checkout` : 'https://pay.v1sofia.com/checkout'
    const monthly = `${BASE}/${slug}/eVfeKlBKW9N3RssKh`
    const semiannual = `${BASE}/${slug}/s7DhuYgeh9qYLJ25P`
    const annual = `${BASE}/${slug}/OD4QF0B1dnaXSTSt0`

    return NextResponse.json({
      success: true,
      affiliate_slug: slug,
      checkout_links: { monthly, semiannual, annual },
    })
  } catch (err: any) {
    const pagarmeErr = err?.response?.data ?? err?.data ?? err?.message
    const status = /invalid|parse|zod/i.test(String(err?.message || pagarmeErr)) ? 400 : 500
    return NextResponse.json({ success: false, error: pagarmeErr }, { status })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
