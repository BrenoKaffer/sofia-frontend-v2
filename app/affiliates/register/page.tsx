'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

const sanitize = (v: string) => v.replace(/\D/g, '')

function isValidCPF(raw: string): boolean {
  const cpf = sanitize(raw)
  if (!cpf || cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i)
  let d1 = (sum * 10) % 11
  if (d1 === 10 || d1 === 11) d1 = 0
  if (d1 !== parseInt(cpf.charAt(9))) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i)
  let d2 = (sum * 10) % 11
  if (d2 === 10 || d2 === 11) d2 = 0
  return d2 === parseInt(cpf.charAt(10))
}

export default function AffiliatesRegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [document, setDocument] = useState('')
  const [bank, setBank] = useState('')
  const [branch, setBranch] = useState('')
  const [account, setAccount] = useState('')
  const [digit, setDigit] = useState('')
  const [accountType, setAccountType] = useState<'checking' | 'savings' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [links, setLinks] = useState<{ monthly: string; semiannual: string; annual: string } | null>(null)
  const [slug, setSlug] = useState('')

  const valid = () => {
    if (!name || !email || !document || !bank || !branch || !account || !digit || !accountType) return false
    const emailOk = /.+@.+\..+/.test(email)
    const cpfOk = isValidCPF(document)
    return emailOk && cpfOk
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!valid()) {
      setError('CPF ou e-mail inválido. Verifique e tente novamente.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/affiliates/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          document: sanitize(document),
          bank_account: {
            holder_name: name,
            bank: sanitize(bank),
            branch_number: sanitize(branch),
            account_number: sanitize(account),
            account_check_digit: sanitize(digit),
            type: accountType,
          },
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        const err = data?.error
        const message = typeof err === 'string' ? err : (err?.message || JSON.stringify(err) || 'Falha ao registrar afiliado')
        setError(message)
        setSuccess(false)
      } else {
        setSuccess(true)
        setSlug(data?.affiliate_slug || '')
        setLinks(data?.checkout_links || null)
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-neutral-950 to-neutral-900 text-foreground flex items-center justify-center px-4">
      <Card className="w-full max-w-xl border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl">Cadastro de Afiliado</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Crie sua conta de afiliado e receba comissões automaticamente</CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
            <form onSubmit={submit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" required />
                </div>
              </div>

              <Separator className="my-2" />

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">Banco</Label>
                  <Input id="bank" value={bank} onChange={e => setBank(e.target.value)} placeholder="001, 033, 104, 237, 341" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Agência</Label>
                  <Input id="branch" value={branch} onChange={e => setBranch(e.target.value)} placeholder="1234" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Conta</Label>
                  <Input id="account" value={account} onChange={e => setAccount(e.target.value)} placeholder="123456" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="digit">Dígito</Label>
                  <Input id="digit" value={digit} onChange={e => setDigit(e.target.value)} placeholder="0" required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de conta</Label>
                  <div className="flex gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="acct-type" checked={accountType === 'checking'} onChange={() => setAccountType('checking')} /> Corrente
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="acct-type" checked={accountType === 'savings'} onChange={() => setAccountType('savings')} /> Poupança
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button type="submit" disabled={loading} className="h-10 bg-gradient-to-r from-emerald-500/90 to-green-600/90">
                  {loading ? 'Criando...' : 'Criar conta de afiliado'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-emerald-400/30 bg-emerald-100/5 p-3 text-sm">
                Seu cadastro foi aprovado!<br />
                Slug: <span className="font-mono">{slug}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span>Plano Mensal:</span>
                  {links?.monthly && (
                    <div className="flex items-center gap-2">
                      <a className="text-emerald-400 hover:underline" href={links.monthly} target="_blank">{links.monthly}</a>
                      <Button variant="secondary" onClick={() => copy(links.monthly)}>Copiar</Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Plano Semestral:</span>
                  {links?.semiannual && (
                    <div className="flex items-center gap-2">
                      <a className="text-emerald-400 hover:underline" href={links.semiannual} target="_blank">{links.semiannual}</a>
                      <Button variant="secondary" onClick={() => copy(links.semiannual)}>Copiar</Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Plano Anual:</span>
                  {links?.annual && (
                    <div className="flex items-center gap-2">
                      <a className="text-emerald-400 hover:underline" href={links.annual} target="_blank">{links.annual}</a>
                      <Button variant="secondary" onClick={() => copy(links.annual)}>Copiar</Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end">
                <Button className="h-10 bg-gradient-to-r from-emerald-500/90 to-green-600/90">Concluir</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

