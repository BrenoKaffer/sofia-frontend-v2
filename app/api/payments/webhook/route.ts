import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { redisCache, CACHE_TTL } from '@/lib/redis';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const provided = signature.startsWith('sha256=') ? signature.slice('sha256='.length) : signature;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (!/^[0-9a-f]+$/i.test(provided)) return false;
  if (provided.length !== expectedSignature.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    // Idempotência: chave via header ou hash do corpo+assinatura
    const idempotencyHeader = request.headers.get('Idempotency-Key') || '';
    const derivedKey = crypto.createHash('sha256').update(body + signature).digest('hex');
    const idempotencyKey = idempotencyHeader || derivedKey;
    const cacheKey = `webhook:payments:${idempotencyKey}`;

    // Verifica duplicidade
    const alreadyProcessed = await redisCache.exists(cacheKey);
    if (alreadyProcessed) {
      logger.info('Webhook idempotente ignorado (já processado)', { metadata: { cacheKey } });
      return NextResponse.json({ received: true, idempotent: true });
    }
    
    const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret não configurado' }, { status: 500 });
    }
    if (!signature) {
      return NextResponse.json({ error: 'Headers obrigatórios ausentes' }, { status: 400 });
    }
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      logger.warn('Webhook inválido recebido', { metadata: { signature } });
      return NextResponse.json({ error: 'Webhook inválido' }, { status: 401 });
    }

    const webhookData = JSON.parse(body);
    
    // Log do webhook recebido
    logger.info('Webhook recebido do Pagar.me', {
      metadata: {
        event: webhookData.type,
        order_id: webhookData.data?.id,
        status: webhookData.data?.status,
      }
    });

    // Processar diferentes tipos de eventos
    switch (webhookData.type) {
      case 'order.paid':
        await handleOrderPaid(webhookData.data);
        break;
      
      case 'order.payment_failed':
        await handleOrderPaymentFailed(webhookData.data);
        break;
      
      case 'order.canceled':
        await handleOrderCanceled(webhookData.data);
        break;
      
      case 'charge.paid':
        await handleChargePaid(webhookData.data);
        break;
      
      case 'charge.payment_failed':
        await handleChargePaymentFailed(webhookData.data);
        break;
      
      default:
        logger.info('Evento de webhook não processado', {
          metadata: {
            event: webhookData.type,
          }
        });
    }

    await redisCache.set(cacheKey, { processedAt: Date.now(), event: webhookData.type }, CACHE_TTL.SHORT);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    
    logger.error('Erro ao processar webhook', {
      metadata: {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
      }
    });

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function handleOrderPaid(orderData: any) {
  try {
    logger.info('Pedido pago com sucesso', {
      metadata: {
        order_id: orderData.id,
        amount: orderData.amount,
        customer_email: orderData.customer?.email,
      }
    });

    // Aqui você pode implementar a lógica específica para quando um pedido é pago
    // Por exemplo:
    // - Ativar acesso do usuário
    // - Enviar email de confirmação
    // - Atualizar banco de dados
    // - Etc.

  } catch (error) {
    logger.error('Erro ao processar pedido pago', {
      metadata: {
        order_id: orderData.id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    });
  }
}

async function handleOrderPaymentFailed(orderData: any) {
  try {
    logger.warn('Falha no pagamento do pedido', {
      metadata: {
        order_id: orderData.id,
        customer_email: orderData.customer?.email,
      }
    });

    // Implementar lógica para falha de pagamento
    // Por exemplo:
    // - Notificar o usuário
    // - Tentar novamente
    // - Cancelar pedido após X tentativas
    // - Etc.

  } catch (error) {
    logger.error('Erro ao processar falha de pagamento', {
      metadata: {
        order_id: orderData.id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    });
  }
}

async function handleOrderCanceled(orderData: any) {
  try {
    logger.info('Pedido cancelado', {
      metadata: {
        order_id: orderData.id,
        customer_email: orderData.customer?.email,
      }
    });

    // Implementar lógica para cancelamento
    // Por exemplo:
    // - Reverter acesso
    // - Notificar usuário
    // - Atualizar banco de dados
    // - Etc.

  } catch (error) {
    logger.error('Erro ao processar cancelamento', {
      metadata: {
        order_id: orderData.id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    });
  }
}

async function handleChargePaid(chargeData: any) {
  try {
    logger.info('Cobrança paga com sucesso', {
      metadata: {
        charge_id: chargeData.id,
        amount: chargeData.amount,
        payment_method: chargeData.payment_method,
      }
    });

    // Implementar lógica específica para cobrança paga

  } catch (error) {
    logger.error('Erro ao processar cobrança paga', {
      metadata: {
        charge_id: chargeData.id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    });
  }
}

async function handleChargePaymentFailed(chargeData: any) {
  try {
    logger.warn('Falha na cobrança', {
      metadata: {
        charge_id: chargeData.id,
        payment_method: chargeData.payment_method,
      }
    });

    // Implementar lógica para falha de cobrança

  } catch (error) {
    logger.error('Erro ao processar falha de cobrança', {
      metadata: {
        charge_id: chargeData.id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-hub-signature-256, Idempotency-Key',
    },
  });
}
