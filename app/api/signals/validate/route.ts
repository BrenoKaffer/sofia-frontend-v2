import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'

function jsonLog(obj: any) { try { console.log(JSON.stringify(obj)) } catch { /* noop */ } }

// Configuração do Backend SOFIA (env primeiro, fallback para localhost)
const BACKEND_BASE = process.env.SOFIA_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const SOFIA_BACKEND_URL = `${BACKEND_BASE}/api`;

export async function POST(request: NextRequest) {
  try {
    const correlation_id = (() => { try { return require('crypto').randomUUID() } catch { return `${Date.now()}-${Math.random()}` } })()
    jsonLog({ level: 'info', op: 'signals.validate', msg: 'start', correlation_id })
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      jsonLog({ level: 'warn', op: 'signals.validate', msg: 'missing bearer', correlation_id })
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const body = await request.json();
    jsonLog({ level: 'debug', op: 'signals.validate', msg: 'payload', payload: body, correlation_id })

    // Validar sinal no backend SOFIA
    jsonLog({ level: 'info', op: 'signals.validate', msg: 'forwarding to backend', backend: SOFIA_BACKEND_URL, correlation_id })
    const response = await fetch(`${SOFIA_BACKEND_URL}/signals/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      jsonLog({ level: 'error', op: 'signals.validate', msg: 'backend error', status: response.status, statusText: response.statusText, error: errorData, correlation_id })
      return NextResponse.json(errorData, { status: response.status });
    }

    const validationData = await response.json();
    jsonLog({ level: 'info', op: 'signals.validate', msg: 'backend ok', data: validationData, correlation_id })
    return NextResponse.json(validationData);
  } catch (error) {
    jsonLog({ level: 'error', op: 'signals.validate', msg: 'internal error', error: String(error) })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST para validar um sinal',
    endpoint: '/api/signals/validate',
    method: 'POST',
    description: 'Valida um sinal como hit ou miss e calcula o expected_return real',
    parameters: {
      signal_id: 'ID do sinal a ser validado',
      result: 'hit ou miss',
      winning_number: 'Número que saiu na roleta',
      net_payout: 'Lucro líquido real (opcional, será calculado se não fornecido)'
    }
  });
}

export async function OPTIONS() {
  return NextResponse.json({
    ok: true,
    methods: ['POST'],
    description: 'Validate a signal outcome with server token',
    auth: 'Bearer BACKEND_API_KEY',
    payload: {
      signal_id: 'string',
      result: 'hit|miss',
      winning_number: '0..36? optional',
      net_payout: 'number? optional',
      table_id: 'string? optional',
      strategy_id: 'string? optional'
    },
  })
}
