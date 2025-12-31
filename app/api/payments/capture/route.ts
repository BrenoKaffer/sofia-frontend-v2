import { NextRequest, NextResponse } from 'next/server';

// Este endpoint foi descontinuado para evitar manuseio direto de dados de cartão.
// Utilize o checkout hospedado via POST /api/checkout-link.

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Endpoint desativado. Use o checkout hospedado (POST /api/checkout-link).',
      code: 'PAYMENT_CAPTURE_DISABLED'
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Endpoint desativado. Use o checkout hospedado (POST /api/checkout-link).',
      code: 'PAYMENT_CAPTURE_DISABLED'
    },
    { status: 410 }
  );
}