export type BankAccount = {
  holder_name: string
  bank: string
  branch_number: string
  account_number: string
  account_check_digit: string
  type: 'checking' | 'savings'
}

export type CreateRecipientPayload = {
  affiliate_slug: string
  name: string
  email: string
  document: string
  bank_account: BankAccount
}

export async function createRecipient(payload: CreateRecipientPayload): Promise<{ success: boolean; recipient_id?: string; error?: string }>
{
  const res = await fetch('/api/affiliates/create-recipient', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  try {
    const data = await res.json()
    if (!res.ok) {
      const err = data?.error
      const errStr = typeof err === 'string' ? err : (err?.message || JSON.stringify(err))
      return { success: false, error: errStr || 'Erro ao criar recebedor' }
    }
    return { success: !!data?.success, recipient_id: data?.recipient_id }
  } catch {
    return { success: false, error: 'Erro inesperado' }
  }
}
