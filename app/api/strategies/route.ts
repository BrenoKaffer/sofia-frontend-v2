import { NextResponse } from 'next/server';

export async function GET() {
  const strategies = [
    {
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
    {
      id: 'strat-2',
      name: 'Agressiva',
      description: 'Maior risco e potencial de retorno',
      type: 'aggressive',
      parameters: {
        maxBetAmount: 200,
        stopLoss: 15,
        takeProfit: 25,
        riskPercentage: 8,
        maxConsecutiveLosses: 5,
      },
      isActive: true,
      performance: {
        totalBets: 900,
        winRate: 55,
        totalProfit: 5600,
        maxDrawdown: 20,
        sharpeRatio: 1.1,
      },
    },
  ];
  return NextResponse.json(strategies);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newStrategy = {
    id: `strat-${Math.random().toString(36).slice(2, 8)}`,
    name: body.name ?? 'Nova Estratégia',
    description: body.description ?? '',
    type: body.type ?? 'custom',
    parameters: body.parameters ?? {
      maxBetAmount: 100,
      stopLoss: 10,
      takeProfit: 20,
      riskPercentage: 5,
      maxConsecutiveLosses: 4,
    },
    isActive: true,
    performance: {
      totalBets: 0,
      winRate: 0,
      totalProfit: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
    },
  };
  return NextResponse.json(newStrategy, { status: 201 });
}