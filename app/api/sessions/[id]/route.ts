import { NextResponse } from 'next/server';

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const updates = await request.json();
  const { id } = await ctx.params;
  const updatedSession = {
    id,
    name: updates.name ?? 'Sessão Atualizada',
    strategy: updates.strategy ?? {
      id: 'strat-1',
      name: 'Conservadora',
      description: 'Baixo risco, foco em consistência',
      type: 'conservative',
      parameters: {
        maxBetAmount: 50,
        stopLoss: 5,
        takeProfit: 10,
        riskPercentage: 2,
        maxConsecutiveLosses: 3,
      },
      isActive: true,
      performance: {
        totalBets: 1200,
        winRate: 62,
        totalProfit: 3500,
        maxDrawdown: 8,
        sharpeRatio: 1.4,
      },
    },
    status: updates.status ?? 'paused',
    startTime: updates.startTime ?? new Date(),
    endTime: updates.endTime,
    duration: updates.duration ?? 0,
    currentStats: updates.currentStats ?? {
      totalBets: 0,
      winningBets: 0,
      losingBets: 0,
      currentProfit: 0,
      currentDrawdown: 0,
      consecutiveLosses: 0,
    },
    settings: updates.settings ?? { autoStop: true },
    tables: updates.tables ?? [],
    logs: updates.logs ?? [],
  };
  return NextResponse.json(updatedSession);
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ success: true, deletedId: id });
}