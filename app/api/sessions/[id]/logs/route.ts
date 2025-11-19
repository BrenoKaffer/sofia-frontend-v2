import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const newLog = {
    id: `log-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    type: body.type ?? 'system',
    message: body.message ?? 'Evento de sessão',
    amount: body.amount,
    table: body.table,
    metadata: body.metadata ?? {},
  };
  return NextResponse.json(newLog, { status: 201 });
}