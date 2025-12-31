import { NextRequest, NextResponse } from 'next/server';

// Endpoint legado desativado para evitar divergência de contrato e autenticação.
// Utilize o endpoint canônico de checkout hospedado em POST /api/checkout-link.

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Endpoint desativado. Use o checkout hospedado (POST /api/checkout-link).',
      code: 'CHECKOUT_LINK_DEPRECATED'
    },
    { status: 410 }
  );
}

export async function GET(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Endpoint desativado. Use o checkout hospedado (POST /api/checkout-link).',
      code: 'CHECKOUT_LINK_DEPRECATED'
    },
    { status: 410 }
  );
}