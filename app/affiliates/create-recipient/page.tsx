'use client'

import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import AffiliateRecipientForm from '@/components/affiliates/AffiliateRecipientForm'

export default function CreateRecipientPage() {
  const params = useSearchParams()
  const [manualSlug, setManualSlug] = useState('')

  const slugFromQuery = useMemo(() => {
    return (
      params.get('slug') ||
      params.get('affiliate') ||
      params.get('s') ||
      params.toString() // fallback: primeira entrada sem chave
    ) || ''
  }, [params])

  const effectiveSlug = (slugFromQuery || manualSlug).trim()

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-neutral-950 to-neutral-900 text-foreground flex items-center justify-center px-4">
      <Card className="w-full max-w-xl border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl">Criar recebedor (Afiliado)</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Preencha seus dados para receber comissões automaticamente no Pagar.me</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {!slugFromQuery && (
              <div className="space-y-2">
                <Label htmlFor="slug">Affiliate Slug</Label>
                <Input id="slug" value={manualSlug} onChange={e => setManualSlug(e.target.value)} placeholder="k91bd0x" />
                <p className="text-xs text-muted-foreground">Se você acessou sem query, informe seu slug de afiliado.</p>
              </div>
            )}

            <Separator className="my-2" />

            <AffiliateRecipientForm affiliateSlug={effectiveSlug} />

            {!effectiveSlug && (
              <div className="rounded-md border border-yellow-300/30 bg-yellow-100/5 p-3 text-xs text-yellow-200">
                Informe o slug para enviar o formulário.
              </div>
            )}

            <div className="flex items-center justify-end">
              <Button disabled className="h-10 bg-gradient-to-r from-emerald-500/90 to-green-600/90">
                Continuar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

