import { NextResponse } from 'next/server';

export async function POST() {
  const data = {
    success: true,
    message: 'Automação parada com sucesso',
    data: {
      status: 'stopped',
      finalStats: {
        totalBets: 12,
        wins: 6,
        losses: 6,
        profit: -4,
      },
    },
  };
  return NextResponse.json(data);
}