import { NextResponse } from 'next/server';
import { auth, createSupabaseServerClient } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseNumeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();

    const { data: settings, error: settingsError } = await supabase
      .from('user_bankroll_settings')
      .select('initial_bankroll')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    const initialBankroll = parseNumeric((settings as any)?.initial_bankroll) ?? 0;

    const { data: txs, error: txError } = await supabase
      .from('bankroll_transactions')
      .select('amount')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    const delta = (txs || []).reduce((sum, row: any) => {
      const amount = parseNumeric(row?.amount);
      return sum + (amount ?? 0);
    }, 0);

    const balance = initialBankroll + delta;

    return NextResponse.json({
      initialBankroll,
      balance,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

