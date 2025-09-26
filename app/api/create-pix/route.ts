import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando criação de PIX...');
    const body = await request.json();
    console.log('📥 Dados recebidos:', JSON.stringify(body, null, 2));
    
    // Validação básica dos dados recebidos
    if (!body.customer || !body.amount) {
      console.log('❌ Dados obrigatórios não fornecidos');
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Configuração da API Pagar.me
    const pagarmeApiKey = process.env.PAGARME_API_KEY;
    console.log('🔑 API Key configurada:', pagarmeApiKey ? 'SIM' : 'NÃO');
    
    if (!pagarmeApiKey) {
      console.error('PAGARME_API_KEY não configurada');
      return NextResponse.json(
        { success: false, error: 'Configuração de pagamento não encontrada' },
        { status: 500 }
      );
    }

    // Dados para criar o pagamento PIX na Pagar.me
    const pixData = {
      amount: body.amount, // Valor em centavos
      payment_method: 'pix',
      pix_expiration_date: body.pix_expiration_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      customer: {
        external_id: `customer_pix_${Date.now()}`,
        name: body.customer.name || 'Cliente PIX',
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
      billing: {
        name: body.customer.name || 'Cliente PIX',
        address: {
          country: 'br',
          state: 'sp',
          city: 'São Paulo',
          neighborhood: 'Centro',
          street: 'Rua Teste',
          street_number: '123',
          zipcode: '01000000'
        }
      },
      items: [
        {
          id: 'item_1',
          title: 'Plano SaaS Mensal',
          unit_price: body.amount,
          quantity: 1,
          tangible: false
        }
      ],
      postback_url: body.postback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pagarme`
    };

    // Chamada real para a API da Pagar.me (API v5)
    console.log('🌐 Fazendo chamada para Pagar.me...');
    console.log('🔗 URL:', 'https://api.pagar.me/core/v5/orders');
    console.log('🔑 Authorization header:', `Basic ${Buffer.from(`${pagarmeApiKey}:`).toString('base64').substring(0, 20)}...`);
    
    const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${pagarmeApiKey}:`).toString('base64')}`
      },
      body: JSON.stringify({
        customer: {
          name: pixData.customer.name,
          email: pixData.customer.email,
          document: pixData.customer.documents[0].number,
          document_type: pixData.customer.documents[0].type,
          type: 'individual',
          phones: {
            mobile_phone: {
              country_code: '55',
              area_code: '11',
              number: '999999999'
            }
          }
        },
        items: [{
          id: 'item_1',
          title: 'Plano SaaS Mensal',
          description: 'Plano SaaS Mensal - Pagamento via PIX',
          amount: body.amount,
          quantity: 1,
          tangible: false
        }],
        payments: [
          {
            payment_method: 'pix',
            pix: {
              expires_in: 86400 // 24 horas em segundos
            }
          }
        ],
        metadata: {
          order_id: `order_${Date.now()}`,
          source: 'checkout_sofia'
        }
      })
    });

    if (!pagarmeResponse.ok) {
      const errorData = await pagarmeResponse.json();
      console.error('❌ Erro da Pagar.me - Status:', pagarmeResponse.status);
      console.error('❌ Erro da Pagar.me - Dados:', JSON.stringify(errorData, null, 2));
      console.error('❌ Dados enviados:', JSON.stringify({
        customer: {
          name: pixData.customer.name,
          email: pixData.customer.email,
          document: pixData.customer.documents[0].number,
          document_type: pixData.customer.documents[0].type,
          type: 'individual',
          phones: {
            mobile_phone: {
              country_code: '55',
              area_code: '11',
              number: '999999999'
            }
          }
        },
        items: pixData.items,
        payments: [
          {
            payment_method: 'pix',
            pix: {
              expires_in: 86400
            }
          }
        ]
      }, null, 2));
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.errors?.[0]?.message || errorData.message || 'Erro ao gerar PIX',
          details: errorData
        },
        { status: 400 }
      );
    }

    const orderResult = await pagarmeResponse.json();

    // Verificar se o pedido foi criado com sucesso e extrair dados do PIX
    if (orderResult.id && orderResult.charges && orderResult.charges.length > 0) {
      const charge = orderResult.charges[0];
      
      // Verificar se é um pagamento PIX e tem os dados necessários
      if (charge.payment_method === 'pix' && charge.last_transaction) {
        const pixTransaction = charge.last_transaction;
        
        return NextResponse.json({
          success: true,
          transaction: orderResult,
          order_id: orderResult.id,
          charge_id: charge.id,
          qr_code: pixTransaction.qr_code || null,
          qr_code_url: pixTransaction.qr_code_url || pixTransaction.qr_code,
          expires_at: pixTransaction.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          amount: charge.amount,
          status: charge.status,
          message: 'PIX gerado com sucesso! Escaneie o QR Code para pagar.'
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
    console.error('Erro ao gerar PIX:', error);
    
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
    message: 'API de PIX funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

// Método para verificar status do pagamento PIX
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id');
    
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
    }

    // Em desenvolvimento, simular verificação de status
    if (process.env.NODE_ENV === 'development') {
      // Simular que 30% dos PIX são pagos após algum tempo
      const isPaid = Math.random() > 0.7;
      
      return NextResponse.json({
        success: true,
        transaction_id: transactionId,
        status: isPaid ? 'paid' : 'waiting_payment',
        paid_at: isPaid ? new Date().toISOString() : null
      });
    }

    // Em produção, verificar status real na Pagar.me
    const pagarmeApiKey = process.env.PAGARME_API_KEY;
    const response = await fetch(`https://api.pagar.me/1/transactions/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${pagarmeApiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar status do pagamento');
    }

    const transaction = await response.json();
    
    return NextResponse.json({
      success: true,
      transaction_id: transactionId,
      status: transaction.status,
      paid_at: transaction.paid_at
    });

  } catch (error) {
    console.error('Erro ao verificar status do PIX:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao verificar status do pagamento' 
      },
      { status: 500 }
    );
  }
}