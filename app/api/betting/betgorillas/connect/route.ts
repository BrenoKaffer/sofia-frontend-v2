import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const gameUrl = body?.gameUrl ?? 'https://betgorillas.bet.br/games/imaginelive/roleta-brasileira';

  const data = {
    success: true,
    message: 'Conectado ao BetGorillas com sucesso',
    data: {
      gameElements: { tableId: 'mesa-01', currency: 'BRL' },
      iframeElements: { detected: true },
      bettingElements: { chipSizes: [1, 5, 10, 25, 100] },
      provider: 'BetGorillas',
      status: 'connected',
      gameUrl,
    },
  };
  return NextResponse.json(data);
}