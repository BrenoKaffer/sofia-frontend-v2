'use client'

import { useState } from 'react'
import { createRecipient, type CreateRecipientPayload } from '@/lib/services/createRecipient'

export function useCreateRecipient(affiliateSlug?: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [recipientId, setRecipientId] = useState<string | null>(null)

  const createRecipientAction = async (payload: Omit<CreateRecipientPayload, 'affiliate_slug'>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setRecipientId(null)
    const res = await createRecipient({ affiliate_slug: affiliateSlug || '', ...payload })
    setLoading(false)
    if (!res.success) {
      setError(res.error || 'Erro')
      return
    }
    setSuccess(true)
    setRecipientId(res.recipient_id || null)
  }

  return { createRecipient: createRecipientAction, loading, error, success, recipientId }
}
