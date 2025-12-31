import { NextResponse } from 'next/server';

type ResultItem = {
  id: string;
  type: string;
  value: number;
  amount: number;
  outcome: 'win' | 'loss';
  profit: number;
  timestamp: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const config = body?.config ?? {};
  const suggestedBets = (body?.suggestedBets ?? []).slice(0, 10);

  const results: ResultItem[] = suggestedBets.map((bet: any, i: number) => ({
    id: `bet_${Date.now()}_${i}`,
    type: bet.type ?? 'number',
    value: bet.value ?? Math.floor(Math.random() * 37),
    amount: bet.amount ?? 1,
    outcome: Math.random() > 0.5 ? 'win' : 'loss',
    profit: Math.random() > 0.5 ? bet.amount ?? 1 : -(bet.amount ?? 1),
    timestamp: new Date().toISOString(),
  }));

  const wins = results.filter((r: ResultItem) => r.outcome === 'win').length;
  const losses = results.length - wins;

  const data = {
    success: true,
    message: 'Automação executada com sucesso',
    data: {
      results,
      stats: {
        totalBets: results.length,
        wins,
        losses,
        winRate: ((wins / Math.max(results.length, 1)) * 100).toFixed(2),
      },
      config,
    },
  };
  return NextResponse.json(data);
}