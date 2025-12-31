import { NextResponse } from 'next/server';

// Mock data
const mockStrategies = [
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

const mockSessions = [
  {
    id: 'sess-1',
    name: 'Sessão Manhã',
    strategy: mockStrategies[0],
    status: 'active',
    startTime: new Date(),
    duration: 90,
    currentStats: {
      totalBets: 45,
      winningBets: 28,
      losingBets: 17,
      currentProfit: 420,
      currentDrawdown: 3,
      consecutiveLosses: 1,
    },
    settings: {
      autoStop: true,
      maxDuration: 180,
      profitTarget: 1000,
      lossLimit: 200,
    },
    tables: ['A1', 'B7'],
    logs: [],
  },
  {
    id: 'sess-2',
    name: 'Sessão Tarde',
    strategy: mockStrategies[1],
    status: 'paused',
    startTime: new Date(Date.now() - 1000 * 60 * 120),
    endTime: undefined,
    duration: 120,
    currentStats: {
      totalBets: 80,
      winningBets: 42,
      losingBets: 38,
      currentProfit: -150,
      currentDrawdown: 12,
      consecutiveLosses: 2,
    },
    settings: {
      autoStop: false,
      maxDuration: 240,
    },
    tables: ['C3'],
    logs: [],
  },
];

export async function GET() {
  return NextResponse.json(mockSessions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const newSession = {
    id: `sess-${Math.random().toString(36).slice(2, 8)}`,
    name: body.name ?? 'Nova Sessão',
    strategy: body.strategy ?? mockStrategies[0],
    status: 'paused',
    startTime: new Date(),
    duration: 0,
    currentStats: {
      totalBets: 0,
      winningBets: 0,
      losingBets: 0,
      currentProfit: 0,
      currentDrawdown: 0,
      consecutiveLosses: 0,
    },
    settings: body.settings ?? { autoStop: true },
    tables: body.tables ?? [],
    logs: [],
  };
  return NextResponse.json(newSession, { status: 201 });
}