import { NextRequest, NextResponse } from 'next/server';

interface CheckoutItem {
  amount: number; // valor em centavos
  name: string;
  default_quantity: number;
}

interface CreateCheckoutLinkRequest {
  items: CheckoutItem[];
  customer?: {
    name?: string;
    email?: string;
    document?: string;
    phone?: string;
  };
  success_url?: string;
  cancel_url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutLinkRequest = await request.json();
    
    // Validar dados obrigatórios
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Items são obrigatórios' },
        { status: 400 }
      );
    }

    // Configurar a requisição para a API da Pagar.me
    const pagarmeApiKey = process.env.PAGARME_API_KEY;
    
    if (!pagarmeApiKey) {
      return NextResponse.json(
        { error: 'Chave da API Pagar.me não configurada' },
        { status: 500 }
      );
    }

    // Preparar dados do checkout conforme documentação
    const checkoutData = {
      name: `Checkout SOFIA - ${new Date().toISOString()}`,
      type: "order",
      payment_settings: {
        accepted_payment_methods: [
          "credit_card",
          "debit_card", 
          "pix",
          "boleto"
        ],
        credit_card_settings: {
          operation_type: "auth_and_capture",
          installments_setup: {
            interest_type: "simple"
          },
          installments: [
            { number: 1, total: body.items.reduce((sum, item) => sum + (item.amount * item.default_quantity), 0) },
            { number: 2, total: body.items.reduce((sum, item) => sum + (item.amount * item.default_quantity), 0) },
            { number: 3, total: body.items.reduce((sum, item) => sum + (item.amount * item.default_quantity), 0) },
            { number: 4, total: body.items.reduce((sum, item) => sum + (item.amount * item.default_quantity), 0) },
            { number: 5, total: body.items.reduce((sum, item) => sum + (item.amount * item.default_quantity), 0) },
            { number: 6, total: body.items.reduce((sum, item) => sum + (item.amount * item.default_quantity), 0) }
          ]
        },
        pix_settings: {
          expires_in: 3600 // 1 hora
        },
        boleto_settings: {
          expires_in: 7 // 7 dias
        }
      },
      cart_settings: {
        items: body.items
      },
      checkout_settings: {
        success_url: body.success_url || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/success`,
        cancel_url: body.cancel_url || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/cancel`,
        customer_editable: true,
        skip_checkout_success_page: false,
        accepted_multi_payment_methods: [
          ["credit_card"],
          ["debit_card"],
          ["pix"],
          ["boleto"]
        ]
      }
    };

    // Fazer requisição para a API da Pagar.me
    const response = await fetch('https://api.pagar.me/core/v5/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pagarmeApiKey}`
      },
      body: JSON.stringify(checkoutData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erro da API Pagar.me:', result);
      return NextResponse.json(
        { 
          error: 'Erro ao criar checkout',
          details: result
        },
        { status: response.status }
      );
    }

    // Retornar o link de pagamento
    return NextResponse.json({
      success: true,
      checkout_url: result.url,
      checkout_id: result.id,
      expires_at: result.expires_at,
      status: result.status
    });

  } catch (error) {
    console.error('Erro ao criar checkout link:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para consultar status do checkout
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutId = searchParams.get('id');

    if (!checkoutId) {
      return NextResponse.json(
        { error: 'ID do checkout é obrigatório' },
        { status: 400 }
      );
    }

    const pagarmeApiKey = process.env.PAGARME_API_KEY;
    
    if (!pagarmeApiKey) {
      return NextResponse.json(
        { error: 'Chave da API Pagar.me não configurada' },
        { status: 500 }
      );
    }

    // Consultar status do checkout
    const response = await fetch(`https://api.pagar.me/core/v5/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${pagarmeApiKey}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erro ao consultar checkout:', result);
      return NextResponse.json(
        { error: 'Erro ao consultar checkout' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro ao consultar checkout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}