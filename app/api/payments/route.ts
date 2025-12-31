import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
import { PagarmeOrder, getPagarmeService } from '@/lib/pagarme-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação básica dos dados
    if (!body.customer || !body.items || !body.payments) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Log da tentativa de pagamento
    logger.info('Iniciando processamento de pagamento', {
      metadata: {
        customer_email: body.customer.email,
        payment_method: body.payments[0]?.payment_method,
        amount: body.items.reduce((sum: number, item: any) => sum + (item.amount * item.quantity), 0)
      }
    });

    // Criar pedido no Pagar.me
    const order: PagarmeOrder = {
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        document: body.customer.document,
        document_type: body.customer.document_type || 'CPF',
        type: body.customer.type || 'individual',
        phones: body.customer.phones,
        address: body.customer.address,
      },
      items: body.items.map((item: any) => ({
        amount: item.amount,
        description: item.description,
        quantity: item.quantity,
        code: item.code,
      })),
      payments: body.payments,
      metadata: {
        user_id: body.user_id || '',
        source: 'sofia-saas',
        ...body.metadata,
      },
    };

    // Validar chave da API em tempo de requisição
    const apiKey = process.env.PAGARME_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PAGARME_API_KEY não configurada' },
        { status: 500 }
      );
    }

    const pagarmeService = getPagarmeService();
    const result = await pagarmeService.createOrder(order);

    // Log do sucesso
    logger.info('Pagamento processado com sucesso', {
      metadata: {
        order_id: result.id,
        status: result.status,
        customer_email: body.customer.email,
      }
    });

    return NextResponse.json({
      success: true,
      order: result,
      payment_info: {
        order_id: result.id,
        status: result.status,
        amount: result.amount,
        charges: result.charges.map(charge => ({
          id: charge.id,
          status: charge.status,
          payment_method: charge.payment_method,
          pix_qr_code: charge.last_transaction?.pix?.qr_code,
          pix_qr_code_url: charge.last_transaction?.pix?.qr_code_url,
          boleto_url: charge.last_transaction?.boleto?.url,
          boleto_barcode: charge.last_transaction?.boleto?.barcode,
        })),
      },
    });

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    
    // Log do erro
    logger.error('Erro ao processar pagamento', {
      metadata: {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
      }
    });

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '20');
    const status = searchParams.get('status');

    const apiKey = process.env.PAGARME_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PAGARME_API_KEY não configurada' },
        { status: 500 }
      );
    }

    const pagarmeService = getPagarmeService();

    if (orderId) {
      // Buscar pedido específico
      const order = await pagarmeService.getOrder(orderId);
      return NextResponse.json({ order });
    } else {
      // Listar pedidos
      const result = await pagarmeService.listOrders({
        page,
        size,
        status: status || undefined,
      });
      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    
    logger.error('Erro ao buscar pagamentos', {
      metadata: {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    });

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}