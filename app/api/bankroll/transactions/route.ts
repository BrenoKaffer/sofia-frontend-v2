import { NextRequest, NextResponse } from 'next/server';
import { auth, createSupabaseServerClient } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TransactionType = 'deposit' | 'withdraw';

function parseAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '200', 10) || 200));

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('bankroll_transactions')
      .select('id,user_id,type,amount,description,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as any;
    const type = String(body?.type || '').trim() as TransactionType;
    if (type !== 'deposit' && type !== 'withdraw') {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const amountRaw = parseAmount(body?.amount);
    if (!(amountRaw !== null && amountRaw > 0)) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const amount = type === 'withdraw' ? -Math.abs(amountRaw) : Math.abs(amountRaw);
    const description = typeof body?.description === 'string' && body.description.trim().length ? body.description.trim() : (type === 'withdraw' ? 'Saque' : 'Depósito');

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('bankroll_transactions')
      .insert({
        user_id: userId,
        type,
        amount,
        description,
      })
      .select('id,user_id,type,amount,description,created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

