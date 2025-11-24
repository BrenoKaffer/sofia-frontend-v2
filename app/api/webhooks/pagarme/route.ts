import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase';

// Função para verificar a assinatura do webhook
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Função para processar diferentes tipos de eventos
async function processWebhookEvent(eventType: string, data: any) {
  console.log(`Processando evento: ${eventType}`, data);

  switch (eventType) {
    case 'order.paid':
      await handleOrderPaid(data);
      break;
    case 'order.payment_failed':
      await handleOrderPaymentFailed(data);
      break;
    case 'order.canceled':
      await handleOrderCanceled(data);
      break;
    case 'order.refunded':
      await handleOrderRefunded(data);
      break;
    default:
      console.log(`Evento não tratado: ${eventType}`);
  }
}

// Handler para pagamento aprovado
async function handleOrderPaid(data: any) {
  try {
    const { id: orderId, customer, amount, items } = data;
    
    console.log('Pagamento aprovado:', {
      orderId,
      customerEmail: customer?.email,
      amount,
      items
    });

    // Aqui você pode:
    // 1. Atualizar o status do pedido no banco de dados
    // 2. Enviar e-mail de confirmação para o cliente
    // 3. Ativar a licença do sistema
    // 4. Registrar logs de auditoria

    // Exemplo de atualização no banco (adapte conforme sua estrutura)
    /*
    await updateOrderStatus(orderId, 'paid');
    await activateUserLicense(customer.email);
    await sendConfirmationEmail(customer.email, orderId);
    */

    // Log para desenvolvimento
    console.log(`✅ Pedido ${orderId} processado com sucesso`);
    
  } catch (error) {
    console.error('Erro ao processar pagamento aprovado:', error);
    throw error;
  }
}

// Handler para falha no pagamento
async function handleOrderPaymentFailed(data: any) {
  try {
    const { id: orderId, customer, refuse_reason } = data;
    
    console.log('Pagamento falhou:', {
      orderId,
      customerEmail: customer?.email,
      reason: refuse_reason
    });

    // Aqui você pode:
    // 1. Atualizar o status do pedido para "failed"
    // 2. Enviar e-mail informando sobre a falha
    // 3. Registrar tentativa de pagamento

    console.log(`❌ Falha no pagamento do pedido ${orderId}: ${refuse_reason}`);
    
  } catch (error) {
    console.error('Erro ao processar falha de pagamento:', error);
    throw error;
  }
}

// Handler para pedido cancelado
async function handleOrderCanceled(data: any) {
  try {
    const { id: orderId, customer } = data;
    
    console.log('Pedido cancelado:', {
      orderId,
      customerEmail: customer?.email
    });

    // Aqui você pode:
    // 1. Atualizar o status do pedido para "canceled"
    // 2. Liberar estoque se necessário
    // 3. Enviar e-mail de cancelamento

    console.log(`🚫 Pedido ${orderId} cancelado`);
    
  } catch (error) {
    console.error('Erro ao processar cancelamento:', error);
    throw error;
  }
}

// Handler para reembolso
async function handleOrderRefunded(data: any) {
  try {
    const { id: orderId, customer, amount } = data;
    
    console.log('Reembolso processado:', {
      orderId,
      customerEmail: customer?.email,
      amount
    });

    // Aqui você pode:
    // 1. Atualizar o status do pedido para "refunded"
    // 2. Desativar licença do usuário
    // 3. Enviar e-mail de confirmação de reembolso

    console.log(`💰 Reembolso de R$ ${amount/100} processado para o pedido ${orderId}`);
    
  } catch (error) {
    console.error('Erro ao processar reembolso:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obter o corpo da requisição
    const body = await request.text();
    const webhookData = JSON.parse(body);

    // Obter headers necessários
    const signature = request.headers.get('x-hub-signature-256');
    const eventType = request.headers.get('x-pagarme-event');

    // Verificar se os headers necessários estão presentes
    if (!signature || !eventType) {
      console.error('Headers obrigatórios ausentes:', { signature, eventType });
      return NextResponse.json(
        { error: 'Headers obrigatórios ausentes' },
        { status: 400 }
      );
    }

    // Verificar assinatura do webhook (recomendado para produção)
    const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET;
    if (webhookSecret) {
      const isValidSignature = verifyWebhookSignature(
        body,
        signature.replace('sha256=', ''),
        webhookSecret
      );

      if (!isValidSignature) {
        console.error('Assinatura do webhook inválida');
        return NextResponse.json(
          { error: 'Assinatura inválida' },
          { status: 401 }
        );
      }
    }

    // Persistir evento rapidamente e responder 200 (ack) para confiabilidade
    try {
      const supabase = createServerClient();
      const objectId = webhookData?.id || webhookData?.data?.id || webhookData?.object?.id || null;

      // Verificar idempotência básica por objectId + eventType
      if (objectId) {
        const existing = await supabase
          .from('payment_webhooks')
          .select('id, processed')
          .eq('object_id', objectId)
          .eq('event_type', eventType)
          .limit(1)
          .maybeSingle();

        if (existing?.data) {
          console.log('Webhook duplicado ignorado', { eventType, objectId });
        } else {
          await supabase.from('payment_webhooks').insert({
            event_type: eventType,
            object_id: objectId,
            payload: webhookData,
            signature,
            processed: false,
            received_at: new Date().toISOString()
          });
        }
      } else {
        // Sem objectId — armazenar apenas o payload
        await supabase.from('payment_webhooks').insert({
          event_type: eventType,
          object_id: null,
          payload: webhookData,
          signature,
          processed: false,
          received_at: new Date().toISOString()
        });
      }
    } catch (persistError) {
      console.error('Falha ao persistir webhook', persistError);
    }

    // Retornar sucesso imediatamente (ack) para evitar retries
    return NextResponse.json(
      {
        success: true,
        message: 'Webhook recebido',
        event: eventType
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint da Pagar.me está funcionando',
    timestamp: new Date().toISOString(),
    status: 'active'
  });
}