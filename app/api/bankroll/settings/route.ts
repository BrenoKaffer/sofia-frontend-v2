import { NextRequest, NextResponse } from 'next/server';
import { auth, createSupabaseServerClient } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function booleanOrNull(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
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

    const { data, error } = await supabase
      .from('user_bankroll_settings')
      .select('user_id,initial_bankroll,stop_loss,take_profit,max_bet_percentage,auto_stop_loss,auto_take_profit,updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        user_id: userId,
        initial_bankroll: 0,
        stop_loss: 0,
        take_profit: 0,
        max_bet_percentage: 5,
        auto_stop_loss: true,
        auto_take_profit: true,
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as any;

    const payload: Record<string, any> = { user_id: userId };
    const initialBankroll = numberOrNull(body?.initial_bankroll ?? body?.initialBankroll);
    if (initialBankroll !== null) payload.initial_bankroll = initialBankroll;

    const stopLoss = numberOrNull(body?.stop_loss ?? body?.daily_stop_loss);
    if (stopLoss !== null) payload.stop_loss = stopLoss;

    const takeProfit = numberOrNull(body?.take_profit ?? body?.daily_stop_gain);
    if (takeProfit !== null) payload.take_profit = takeProfit;

    const maxBetPercentage = numberOrNull(body?.max_bet_percentage ?? body?.maxBetPercentage);
    if (maxBetPercentage !== null) payload.max_bet_percentage = maxBetPercentage;

    const autoStopLoss = booleanOrNull(body?.auto_stop_loss);
    if (autoStopLoss !== null) payload.auto_stop_loss = autoStopLoss;

    const autoTakeProfit = booleanOrNull(body?.auto_take_profit);
    if (autoTakeProfit !== null) payload.auto_take_profit = autoTakeProfit;

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('user_bankroll_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select('user_id,initial_bankroll,stop_loss,take_profit,max_bet_percentage,auto_stop_loss,auto_take_profit,updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

