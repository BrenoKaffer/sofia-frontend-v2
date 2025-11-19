import { NextResponse } from 'next/server';

export async function GET() {
  const data = {
    success: true,
    data: {
      connected: true,
      running: false,
      provider: 'BetGorillas',
      gameDetected: true,
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(data);
}