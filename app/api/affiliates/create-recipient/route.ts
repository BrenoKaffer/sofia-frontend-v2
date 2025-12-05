import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createRecipientOnPagarme } from '@/lib/pagarme-recipient-service'

export const runtime = 'nodejs'

const schema = z.object({
  affiliate_slug: z.string().min(1),
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

function getAdminClient() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = envUrl || 'https://placeholder.supabase.co'
  const key = envKey || 'placeholder-key'
  return {
    client: createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }),
    configured: Boolean(envUrl && envKey),
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    const payload = schema.parse(input)

    const { client: supabase, configured } = getAdminClient()
    if (!configured) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado' }, { status: 500 })
    }

    const { data: affiliate, error: affErr } = await supabase
      .from('affiliates')
      .select('id, slug, recipient_id')
      .eq('slug', payload.affiliate_slug)
      .single()
    if (affErr || !affiliate) {
      return NextResponse.json({ success: false, error: 'Afiliado não encontrado' }, { status: 404 })
    }
    if (affiliate.recipient_id) {
      return NextResponse.json({ success: false, error: 'Este afiliado já possui um recebedor cadastrado.' }, { status: 409 })
    }

    const result = await createRecipientOnPagarme({
      name: payload.name,
      email: payload.email,
      document: payload.document,
      bank_account: payload.bank_account,
    })
    const recipientId = result?.id || result?.recipient?.id || null

    const { error: updErr } = await supabase
      .from('affiliates')
      .update({ recipient_id: recipientId, updated_at: new Date().toISOString() })
      .eq('slug', payload.affiliate_slug)
    if (updErr) {
      return NextResponse.json({ success: false, error: 'Falha ao persistir recipient_id' }, { status: 500 })
    }

    try {
      await supabase.from('affiliate_audit_logs').insert({
        type: 'recipient_created',
        slug: payload.affiliate_slug,
        recipient_id: recipientId,
        created_at: new Date().toISOString(),
      })
    } catch {}

    return NextResponse.json({ success: true, recipient_id: recipientId, affiliate_slug: payload.affiliate_slug, message: 'Recebedor criado e vinculado ao afiliado com sucesso.' })
  } catch (error: any) {
    const message = error?.message || 'Erro ao criar recebedor'
    const status = /invalid|parse/i.test(message) ? 400 : 500
    return NextResponse.json({ success: false, error: message }, { status })
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
