import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { SecurityMiddlewares } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Segurança e rate limiting
    const guard = SecurityMiddlewares.publicApi(request);
    if (guard) return guard;

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    console.log('🚀 Iniciando criação de PIX...', { requestId });
    const raw = await request.json();

    // Validação forte com Zod
    const schema = z.object({
      amount: z.number().int().positive(), // em centavos
      pix_expiration_date: z.string().datetime().optional(),
      customer: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        type: z.enum(['individual','corporation']).optional(),
        document_number: z.string().regex(/^\d{11,14}$/),
        phone: z.string().optional(),
        code: z.string().optional()
      }),
    });
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;
    
    // Validação básica dos dados recebidos
    if (!body.customer || !body.amount) {
      console.log('❌ Dados obrigatórios não fornecidos');
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Configuração da API Pagar.me
    const pagarmeSecret = process.env.PAGARME_SECRET_KEY;
    console.log('🔑 Secret Key configurada:', pagarmeSecret ? 'SIM' : 'NÃO');
    
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

    // Helper para normalizar telefone para o formato esperado pela API v5 da Pagar.me
    const normalizePhone = (raw?: string) => {
      const digits = (raw || '').replace(/\D/g, '');
      if (!digits) return undefined;
      // Se vier com DDI (12+ dígitos): cc(2) + DDD(2) + número
      if (digits.length >= 12) {
        return {
          country_code: digits.slice(0, 2),
          area_code: digits.slice(2, 4),
          number: digits.slice(4)
        };
      }
      // Brasil: 10 ou 11 dígitos
      if (digits.length === 11 || digits.length === 10) {
        return {
          country_code: '55',
          area_code: digits.slice(0, 2),
          number: digits.slice(2)
        };
      }
      // Número inválido: não enviar
      return undefined;
    };

    // Dados para criar o pagamento PIX na Pagar.me (usado como referência)
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
        phone_numbers: ['+5511999999999'],
        birthday: '1990-01-01'
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
      postback_url: postbackUrl
    };

    // Chamada real para a API da Pagar.me (API v5)
    console.log('🌐 Fazendo chamada para Pagar.me...', { requestId });

    const idempotencyKey = Buffer.from(
      crypto.createHash('sha256').update(JSON.stringify({
        customer: body.customer,
        amount: body.amount,
        payments: 'pix'
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
        name: body.customer.name,
        email: body.customer.email,
        document: body.customer.document_number,
        document_type: 'cpf',
        type: 'individual',
        code: body.customer.code || body.customer.email,
        ...(normalizePhone(body.customer.phone) ? { phones: { mobile_phone: normalizePhone(body.customer.phone)! } } : {})
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
        postback_url: postbackUrl,
        metadata: {
          order_id: `order_${Date.now()}`,
          source: 'checkout_sofia'
        }
      })
    });

    if (!pagarmeResponse.ok) {
      const errorData = await pagarmeResponse.json();
      console.error('❌ Erro da Pagar.me', { status: pagarmeResponse.status, requestId, message: errorData?.message, errors: errorData?.errors?.[0] });
      
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
    console.log('✅ PIX criado na Pagar.me', { requestId, order_id: orderResult?.id, charge_id: orderResult?.charges?.[0]?.id, status: orderResult?.status });

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
    // Segurança e rate limiting
    const guard = SecurityMiddlewares.publicApi(request);
    if (guard) return guard;

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id') || searchParams.get('transaction_id');
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'ID do pedido é obrigatório' },
        { status: 400 }
      );
    }

    // Em todos os ambientes, verificar status real na Pagar.me via API v5 (Basic)

    // Em produção, verificar status real na Pagar.me via API v5 (Basic)
    const pagarmeSecret = process.env.PAGARME_SECRET_KEY;
    const response = await fetch(`https://api.pagar.me/core/v5/orders/${orderId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${pagarmeSecret}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar status do pedido');
    }

    const order = await response.json();

    const charges = order?.charges || [];
    const hasPaid = charges.some((c: any) => c.status === 'paid');
    const paidAt = charges.find((c: any) => c.status === 'paid')?.paid_at || null;
    const status = hasPaid ? 'paid' : (charges[0]?.status || 'waiting_payment');

    return NextResponse.json({
      success: true,
      order_id: orderId,
      status,
      paid_at: paidAt
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
