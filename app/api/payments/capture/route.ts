import { NextRequest, NextResponse } from 'next/server';

// Configuração da API da Pagar.me
// Verificação obrigatória da variável de ambiente
if (!process.env.PAGARME_API_KEY) {
  throw new Error('PAGARME_API_KEY é obrigatória. Configure a variável de ambiente.');
}

const PAGARME_API_KEY = process.env.PAGARME_API_KEY;
const PAGARME_API_URL = 'https://api.pagar.me/1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, amount, customer, items } = body;

    if (!token || !amount || !customer) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Preparar dados para a API da Pagar.me
    const transactionData = {
      api_key: PAGARME_API_KEY,
      amount: amount,
      card_token: token,
      customer: {
        name: customer.name,
        email: customer.email,
        document_number: customer.document.replace(/\D/g, ''),
        phone: customer.phone ? {
          ddd: customer.phone.substring(0, 2),
          number: customer.phone.substring(2)
        } : undefined
      },
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        unit_price: item.unit_price,
        quantity: item.quantity,
        tangible: item.tangible
      })),
      metadata: {
        order_id: `order_${Date.now()}`,
        created_at: new Date().toISOString()
      }
    };

    // Fazer a requisição para a API da Pagar.me
    const response = await fetch(`${PAGARME_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erro da API Pagar.me:', result);
      return NextResponse.json(
        { 
          error: 'Erro ao processar pagamento',
          details: result.errors || result.message 
        },
        { status: response.status }
      );
    }

    // Log da transação para debug
    console.log('Transação criada:', {
      id: result.id,
      status: result.status,
      amount: result.amount,
      customer: result.customer?.name
    });

    // Retornar sucesso
    return NextResponse.json({
      success: true,
      transaction: {
        id: result.id,
        status: result.status,
        amount: result.amount,
        payment_method: result.payment_method,
        created_at: result.date_created
      }
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

export async function GET() {
  return NextResponse.json(
    { message: 'Endpoint para captura de pagamentos - use POST' },
    { status: 405 }
  );
}