import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const log = {
      id: `log-${Math.random().toString(36).slice(2, 8)}`,
      level: body?.level ?? 'info',
      message: body?.message ?? 'Mensagem de log recebida',
      context: body?.context ?? {},
      timestamp: new Date().toISOString(),
    };
    // Mock: apenas ecoa o log recebido
    return NextResponse.json({ success: true, log }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function OPTIONS() {
  // Útil caso algum cliente dispare preflight; mantemos simples e permissivo no mock
  return NextResponse.json({ ok: true }, { status: 200 });
}
