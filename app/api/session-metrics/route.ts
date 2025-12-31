import { NextResponse } from 'next/server';

export async function GET() {
  const data = {
    activeSessions: 1,
    totalSessions: 2,
    averageSessionDuration: 105,
    totalProfit: 270,
    bestPerformingStrategy: 'Conservadora',
    worstPerformingStrategy: 'Agressiva',
    dailyStats: [
      { date: '2025-11-01', sessions: 5, profit: 820, winRate: 0.61 },
      { date: '2025-11-02', sessions: 3, profit: -120, winRate: 0.47 },
    ],
  };
  return NextResponse.json(data);
}