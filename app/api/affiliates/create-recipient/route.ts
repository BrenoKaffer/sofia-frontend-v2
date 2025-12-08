import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { createRecipientOnPagarme, getRecipientOnPagarme, updateRecipientOnPagarme } from '@/lib/pagarme-recipient-service'

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

    const sanitize = (v: string) => String(v || '').replace(/\D/g, '')
    const isValidCPF = (raw: string) => {
      const cpf = sanitize(raw)
      if (!cpf || cpf.length !== 11) return false
      if (/^(\d)\1{10}$/.test(cpf)) return false
      let sum = 0
      for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i)
      let d1 = (sum * 10) % 11; if (d1 >= 10) d1 = 0; if (d1 !== parseInt(cpf.charAt(9))) return false
      sum = 0
      for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i)
      let d2 = (sum * 10) % 11; if (d2 >= 10) d2 = 0; return d2 === parseInt(cpf.charAt(10))
    }
    const isValidBank = (b: string) => /^\d{3}$/.test(sanitize(b))
    const isValidBranch = (b: string) => /^\d{1,4}$/.test(sanitize(b))
    const isValidDigit = (d: string) => /^[0-9Xx]$/.test(String(d || ''))

    const normalized = {
      affiliate_slug: payload.affiliate_slug,
      name: String(payload.name || '').trim(),
      email: payload.email,
      document: sanitize(payload.document),
      bank_account: {
        holder_name: String(payload.bank_account.holder_name || '').trim(),
        bank: sanitize(payload.bank_account.bank),
        branch_number: sanitize(payload.bank_account.branch_number),
        account_number: sanitize(payload.bank_account.account_number),
        account_check_digit: String(payload.bank_account.account_check_digit || '').toUpperCase().replace(/[^0-9X]/g, ''),
        type: payload.bank_account.type,
      },
    }

    if (!isValidCPF(normalized.document)) {
      return NextResponse.json({ success: false, error: 'CPF inválido' }, { status: 400 })
    }
    if (!isValidBank(normalized.bank_account.bank)) {
      return NextResponse.json({ success: false, error: 'Banco inválido' }, { status: 400 })
    }
    if (!isValidBranch(normalized.bank_account.branch_number)) {
      return NextResponse.json({ success: false, error: 'Agência inválida' }, { status: 400 })
    }
    if (!isValidDigit(normalized.bank_account.account_check_digit)) {
      return NextResponse.json({ success: false, error: 'Dígito inválido' }, { status: 400 })
    }

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
      try {
        const existing = await getRecipientOnPagarme(String(affiliate.recipient_id))
        const status = String(existing?.status || existing?.recipient?.status || '').toLowerCase()
        const needsActivation = /afil/i.test(status)
        if (needsActivation) {
          await updateRecipientOnPagarme(String(affiliate.recipient_id), {
            name: normalized.name,
            email: normalized.email,
            document: normalized.document,
            bank_account: normalized.bank_account,
          })
          return NextResponse.json({ success: true, recipient_id: affiliate.recipient_id, affiliate_slug: payload.affiliate_slug, message: 'Recebedor reativado com sucesso.' })
        }
      } catch {}
      return NextResponse.json({ success: false, error: 'Este afiliado já possui um recebedor cadastrado.' }, { status: 409 })
    }

    const result = await createRecipientOnPagarme({
      name: normalized.name,
      email: normalized.email,
      document: normalized.document,
      bank_account: normalized.bank_account,
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
