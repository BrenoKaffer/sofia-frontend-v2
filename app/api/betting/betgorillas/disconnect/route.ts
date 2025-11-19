import { NextResponse } from 'next/server';

export async function POST() {
  const data = {
    success: true,
    message: 'Desconectado do BetGorillas com sucesso',
    data: {
      status: 'disconnected',
    },
  };
  return NextResponse.json(data);
}