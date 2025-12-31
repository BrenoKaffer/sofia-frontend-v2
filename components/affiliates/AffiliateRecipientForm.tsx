'use client'

import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { useCreateRecipient } from '@/hooks/useCreateRecipient'

const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú' },
  { code: '260', name: 'Nubank' },
]

function isValidCPF(raw: string): boolean {
  const cpf = raw.replace(/\D/g, '')
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

const sanitize = (v: string) => v.replace(/\D/g, '')

export default function AffiliateRecipientForm({ affiliateSlug }: { affiliateSlug?: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [document, setDocument] = useState('')
  const [bank, setBank] = useState('')
  const [branch, setBranch] = useState('')
  const [account, setAccount] = useState('')
  const [digit, setDigit] = useState('')
  const [accountType, setAccountType] = useState<'checking' | 'savings' | ''>('')

  const { createRecipient, loading, error, success, recipientId } = useCreateRecipient(affiliateSlug)

  const validate = () => {
    if (!name || !email || !document || !bank || !branch || !account || !digit || !accountType) return false
    const emailOk = /.+@.+\..+/.test(email)
    const cpfOkLen = document.replace(/\D/g, '').length === 11
    const cpfOk = cpfOkLen && isValidCPF(document)
    return emailOk && cpfOk
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await createRecipient({
      name,
      email,
      document: sanitize(document),
      bank_account: {
        holder_name: name,
        bank: sanitize(bank),
        branch_number: sanitize(branch),
        account_number: sanitize(account),
        account_check_digit: sanitize(digit),
        type: accountType as 'checking' | 'savings',
      },
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {typeof error === 'string' ? error : 'Ocorreu um erro ao criar o recebedor.'}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Conta criada com sucesso! Agora você já pode receber comissões.</p>
            {recipientId && <p className="text-xs text-green-700 mt-1">Recipient ID: {recipientId}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" disabled={success} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" disabled={success} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document">CPF</Label>
          <Input id="document" value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" disabled={success} required />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Banco</Label>
          <Select value={bank} onValueChange={setBank} disabled={success}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o banco" />
            </SelectTrigger>
            <SelectContent>
              {BANKS.map(b => (
                <SelectItem key={b.code} value={b.code}>{b.code} — {b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branch">Agência</Label>
            <Input id="branch" value={branch} onChange={e => setBranch(e.target.value)} placeholder="0001" disabled={success} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account">Conta</Label>
            <Input id="account" value={account} onChange={e => setAccount(e.target.value)} placeholder="123456" disabled={success} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="digit">Dígito</Label>
            <Input id="digit" value={digit} onChange={e => setDigit(e.target.value)} placeholder="0" disabled={success} required />
          </div>
          <div className="space-y-2">
            <Label>Tipo da conta</Label>
            <RadioGroup value={accountType} onValueChange={v => setAccountType(v as 'checking' | 'savings')} className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="checking" id="checking" disabled={success} />
                <Label htmlFor="checking">Conta Corrente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="savings" id="savings" disabled={success} />
                <Label htmlFor="savings">Conta Poupança</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading || success} className="h-11 bg-gradient-to-r from-primary to-accent">
          {loading ? 'Criando...' : 'Criar conta de recebedor'}
        </Button>
        {!validate() && (
          <div className="flex items-center text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Preencha todos os campos corretamente
          </div>
        )}
      </div>
    </form>
  )
}
