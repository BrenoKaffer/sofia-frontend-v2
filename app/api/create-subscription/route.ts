import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação básica dos dados recebidos
    if (!body.customer || !body.card || !body.plan) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Configuração da API Pagar.me
    const pagarmeSecret = process.env.PAGARME_SECRET_KEY;
    
    if (!pagarmeSecret) {
      console.error('PAGARME_SECRET_KEY não configurada');
      return NextResponse.json(
        { success: false, error: 'Configuração de pagamento não encontrada' },
        { status: 500 }
      );
    }

    const postbackUrl =
      process.env.POSTBACK_URL ||
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://pay.v1sofia.com'}/api/webhooks/pagarme`;

    // Dados para criar a assinatura na Pagar.me
    const subscriptionData = {
      plan: {
        id: `plan_${Date.now()}`, // ID único do plano
        name: body.plan.name || 'Plano SaaS Mensal',
        amount: body.plan.amount || 19700, // R$ 197,00 em centavos
        days: 30, // Período de cobrança em dias
        payment_methods: ['credit_card'],
        charges: null, // Cobrança recorrente infinita
        installments: 1
      },
      customer: {
        external_id: `customer_${Date.now()}`,
        name: body.customer.name,
        type: body.customer.type || 'individual',
        country: 'br',
        email: body.customer.email,
        documents: [
          {
            type: 'cpf',
            number: body.customer.document_number
          }
        ],
        phone_numbers: ['+5511999999999'], // Número padrão para teste
        birthday: '1990-01-01' // Data padrão para teste
      },
      card: {
        number: body.card.number,
        holder_name: body.card.holder_name,
        exp_month: parseInt(body.card.exp_month),
        exp_year: parseInt(body.card.exp_year),
        cvv: body.card.cvv
      },
      payment_method: 'credit_card'
    };

    // Remover simulação - usar sempre a API real
    // Chamada real para a API v5 da Pagar.me

    // Chamada real para a API v5 da Pagar.me
    // Adiciona Idempotency-Key para evitar pedidos duplicados
    const idempotencyKey = Buffer.from(
      require('crypto').createHash('sha256').update(JSON.stringify({
        customer: {
          document: subscriptionData.customer.documents[0].number,
          email: subscriptionData.customer.email
        },
        amount: subscriptionData.plan.amount,
        method: 'credit_card',
        card: {
          holder_name: subscriptionData.card.holder_name,
          exp_month: subscriptionData.card.exp_month,
          exp_year: subscriptionData.card.exp_year
        }
      })).digest('hex')
    ).toString('hex');

    const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${pagarmeSecret}:`).toString('base64')}`,
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        customer: {
          name: subscriptionData.customer.name,
          email: subscriptionData.customer.email,
          document: subscriptionData.customer.documents[0].number,
          document_type: subscriptionData.customer.documents[0].type,
          type: 'individual',
          phones: {
            mobile_phone: {
              country_code: '55',
              area_code: '11',
              number: '999999999'
            }
          }
        },
        items: [
          {
            amount: subscriptionData.plan.amount,
            description: subscriptionData.plan.name,
            quantity: 1,
            code: `plan_${Date.now()}`
          }
        ],
        payments: [
          {
            payment_method: 'credit_card',
            credit_card: {
              recurrence: true,
              installments: 1,
              statement_descriptor: 'SOFIA SAAS',
              card: {
                number: subscriptionData.card.number,
                holder_name: subscriptionData.card.holder_name,
                exp_month: subscriptionData.card.exp_month,
                exp_year: subscriptionData.card.exp_year,
                cvv: subscriptionData.card.cvv
              }
            }
          }
        ],
        postback_url: postbackUrl,
        metadata: {
          subscription_type: 'monthly',
          plan_name: subscriptionData.plan.name
        }
      })
    });

    if (!pagarmeResponse.ok) {
      const errorData = await pagarmeResponse.json();
      console.error('Erro da Pagar.me:', errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.errors?.[0]?.message || 'Erro ao processar pagamento' 
        },
        { status: 400 }
      );
    }

    const orderResult = await pagarmeResponse.json();

    // Verificar se o pedido foi criado com sucesso
    if (orderResult.id && orderResult.charges && orderResult.charges.length > 0) {
      const charge = orderResult.charges[0];
      
      // Verificar se é um pagamento com cartão de crédito
      if (charge.payment_method === 'credit_card' && charge.last_transaction) {
        const transaction = charge.last_transaction;
        
        return NextResponse.json({
          success: true,
          order: orderResult,
          order_id: orderResult.id,
          charge_id: charge.id,
          transaction_id: transaction.id,
          status: charge.status,
          amount: charge.amount,
          card_info: {
            last_four_digits: transaction.card?.last_four_digits,
            brand: transaction.card?.brand
          },
          message: 'Assinatura criada com sucesso!'
        });
      }
    }
    
    // Se chegou até aqui, algo deu errado
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao processar resposta da Pagar.me. Tente novamente.',
        debug: orderResult
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro ao processar assinatura:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor. Tente novamente.' 
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se a API está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'API de assinaturas funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}
