'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  amount: number;
  created_at: string;
  pagarme_transaction_id: string;
  status: string;
}

interface UserData {
  full_name: string;
  email: string;
  cpf: string;
  plan: string;
}

export default function RefundPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [agreements, setAgreements] = useState({
    analysis: false,
    terms: false,
    audit: false,
  });

  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const runWithTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout em ${label} após ${ms}ms`)), ms)
          );
          return Promise.race([promise, timeout]);
        };

        const { data: { session }, error: sessionError } = await runWithTimeout(
          supabase.auth.getSession(),
          10_000,
          'obter sessão (refund)'
        );
        if (sessionError) throw sessionError;
        if (!session) {
          router.push('/login');
          return;
        }

        // Buscar perfil
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name, cpf')
          .eq('user_id', session.user.id)
          .single();
        if (profileError) throw profileError;

        // Buscar última transação paga
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1);
        if (transactionsError) throw transactionsError;

        // Buscar assinatura
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('plan_name')
          .eq('user_id', session.user.id)
          .in('status', ['active', 'trialing'])
          .single();
        if (subscriptionError) throw subscriptionError;

        setUser({
          full_name: profile?.full_name || session.user.user_metadata?.full_name || 'N/A',
          email: session.user.email || '',
          cpf: profile?.cpf || 'N/A',
          plan: subscription?.plan_name || 'N/A',
        });

        if (transactions && transactions.length > 0) {
          setTransaction(transactions[0]);
        }

      } catch (error) {
        console.error('Erro:', error);
        toast.error('Erro ao carregar informações.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return toast.error('Nenhuma transação elegível.');
    if (!reason) return toast.error('Selecione um motivo.');
    if (reason === 'Outro motivo' && !description) return toast.error('Descreva o motivo.');
    if (!Object.values(agreements).every(Boolean)) return toast.error('Aceite os termos.');

    setSubmitting(true);
    try {
      const response = await fetch('/api/refunds/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transaction.id,
          reason,
          description,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success('Solicitação enviada com sucesso!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!transaction) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Atenção</span>
            </div>
            <CardTitle>Nenhuma compra elegível</CardTitle>
            <CardDescription>Não encontramos transações recentes elegíveis para reembolso.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/dashboard')}>Voltar ao Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Solicitação de Reembolso</h1>
        <p className="mt-2 text-slate-600">Este formulário inicia a análise do seu pedido conforme nossos termos.</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
              {[
                ['Nome', user?.full_name],
                ['Email', user?.email],
                ['CPF', user?.cpf],
                ['Plano', user?.plan],
                ['Data', new Date(transaction.created_at).toLocaleDateString('pt-BR')],
                ['ID Transação', transaction.pagarme_transaction_id || transaction.id.slice(0, 8)]
              ].map(([label, value]) => (
                <div key={label}>
                  <Label className="text-xs text-slate-500">{label}</Label>
                  <div className="font-medium text-sm">{value}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Motivo do reembolso <span className="text-red-500">*</span></Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {['Não me adaptei à metodologia', 'Tive dificuldades técnicas', 'Não era o que eu esperava', 'Comprei por engano', 'Outro motivo'].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reason === 'Outro motivo' && (
              <div className="space-y-2">
                <Label>Descreva o motivo <span className="text-red-500">*</span></Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Detalhe o motivo..." />
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              {[
                ['analysis', 'Estou ciente de que o pedido passará por análise manual.'],
                ['terms', 'Entendo que o reembolso segue os termos de uso.'],
                ['audit', 'Autorizo a verificação do histórico de uso da conta.']
              ].map(([key, text]) => (
                <div key={key} className="flex items-start space-x-2">
                  <Checkbox id={key} checked={agreements[key as keyof typeof agreements]} onCheckedChange={(c) => setAgreements(p => ({ ...p, [key]: !!c }))} />
                  <Label htmlFor={key} className="text-sm font-normal leading-none pt-0.5">{text}</Label>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting || !Object.values(agreements).every(Boolean)}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar solicitação para análise'}
            </Button>
            <p className="text-xs text-slate-500">Prazo de resposta: até 3 dias úteis.</p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
