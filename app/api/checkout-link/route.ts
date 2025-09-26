import { NextRequest, NextResponse } from 'next/server';

// Configurações da Pagar.me
const PAGARME_API_URL = 'https://api.pagar.me/core/v5/orders';

// Verificação obrigatória da variável de ambiente
if (!process.env.PAGARME_SECRET_KEY) {
  throw new Error('PAGARME_SECRET_KEY é obrigatória. Configure a variável de ambiente.');
}

const PAGARME_SECRET_KEY = process.env.PAGARME_SECRET_KEY;

interface CheckoutItem {
  amount: number;
  name: string;
  default_quantity: number;
}

interface CheckoutRequest {
  payment_settings: {
    accepted_payment_methods: string[];
    credit_card_settings: {
      operation_type: string;
      installments: Array<{
        number: number;
        total: number;
      }>;
    };
  };
  cart_settings: {
    items: CheckoutItem[];
  };
  name: string;
  type: string;
  success_url?: string;
  cancel_url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();

    // Validação básica
    if (!body.cart_settings?.items?.length) {
      return NextResponse.json(
        { error: 'Itens do carrinho são obrigatórios' },
        { status: 400 }
      );
    }

    // Preparar dados para a API da Pagar.me
    const pagarmeData = {
      items: body.cart_settings.items.map(item => ({
        amount: item.amount,
        description: item.name,
        quantity: item.default_quantity || 1,
        code: `item_${Date.now()}`
      })),
      customer: {
        name: 'Cliente Teste',
        email: 'cliente@teste.com',
        document: '12345678901',
        type: 'individual',
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: '11',
            number: '999999999'
          }
        }
      },
      payments: [
        {
          payment_method: 'checkout',
          checkout: {
            expires_in: 3600, // 1 hora
            default_payment_method: 'credit_card',
            accepted_payment_methods: body.payment_settings.accepted_payment_methods,
            success_url: body.success_url || `${request.nextUrl.origin}/payment/success`,
            cancel_url: body.cancel_url || `${request.nextUrl.origin}/payment/cancel`,
            customer_editable: true,
            billing_address_editable: true,
            skip_checkout_success_page: false,
            credit_card: {
              installments: body.payment_settings.credit_card_settings.installments.map(inst => ({
                number: inst.number,
                total: inst.total
              }))
            }
          }
        }
      ],
      closed: false
    };

    // Em ambiente de desenvolvimento, simular resposta da API
    if (process.env.NODE_ENV === 'development') {
      // Simulação da resposta da Pagar.me
      const mockResponse = {
        id: `pl_${Date.now()}`,
        status: 'pending',
        amount: body.cart_settings.items.reduce((sum, item) => sum + item.amount, 0),
        currency: 'BRL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        checkouts: [
          {
            id: `chk_${Date.now()}`,
            payment_url: `https://checkout.pagar.me/payment/${Date.now()}`,
            expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hora
          }
        ]
      };

      return NextResponse.json({
        id: mockResponse.id,
        url: mockResponse.checkouts[0].payment_url,
        status: mockResponse.status,
        created_at: mockResponse.created_at,
        expires_in: 3600
      });
    }

    // Fazer requisição real para a API da Pagar.me
    const response = await fetch(PAGARME_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${PAGARME_SECRET_KEY}:`).toString('base64')}`
      },
      body: JSON.stringify(pagarmeData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da API Pagar.me:', errorData);
      
      return NextResponse.json(
        { 
          error: 'Erro ao criar checkout',
          details: errorData.message || 'Erro desconhecido'
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Retornar dados formatados
    return NextResponse.json({
      id: result.id,
      url: result.checkouts?.[0]?.payment_url || '',
      status: result.status,
      created_at: result.created_at,
      expires_in: 3600
    });

  } catch (error) {
    console.error('Erro interno:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se a API está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'API de checkout funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}