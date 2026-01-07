import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordSetupEmail } from '@/lib/email';

// Normaliza o payload do webhook da Pagar.me para um formato interno
function normalizeOrderData(data: any) {
  const id = data?.id || data?.order?.id || data?.data?.id || data?.object?.id || null;
  const customer = data?.customer || data?.order?.customer || data?.data?.customer || data?.object?.customer || null;
  const amount =
    data?.amount ||
    data?.order?.amount ||
    data?.data?.amount ||
    data?.charges?.[0]?.amount ||
    data?.order?.charges?.[0]?.amount || null;
  const items = data?.items || data?.order?.items || data?.data?.items || [];
  return { id, customer, amount, items };
}

// Função para verificar a assinatura do webhook
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

// Função para processar diferentes tipos de eventos
async function processWebhookEvent(eventType: string, data: any, objectId?: string) {
  console.log(`Processando evento: ${eventType}`, data);

  switch (eventType) {
    case 'order.paid':
      await handleOrderPaid(data, objectId);
      break;
    case 'order.payment_failed':
      await handleOrderPaymentFailed(data, objectId);
      break;
    case 'order.canceled':
      await handleOrderCanceled(data, objectId);
      break;
    case 'order.refunded':
      await handleOrderRefunded(data, objectId);
      break;
    default:
      console.log(`Evento não tratado: ${eventType}`);
  }
}

// Handler para pagamento aprovado
async function handleOrderPaid(data: any, objectId?: string) {
  try {
    const { id: orderId, customer, amount, items } = normalizeOrderData(data);
    
    console.log('Pagamento aprovado:', {
      orderId,
      customerEmail: customer?.email,
      amount,
      items
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase Admin não configurado');
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = customer?.email;
    const full_name = customer?.name || customer?.name || null;
    const cpf = customer?.document || customer?.cpf || null;
    if (!email) {
      console.warn('Pagamento aprovado sem email de cliente — ignorando criação de usuário');
      return;
    }

    // 1) Criar/garantir usuário de auth
    let userId: string | null = null;
    try {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (existing) {
        userId = existing.id;
      } else {
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name, cpf },
        });
        if (createErr) throw createErr;
        userId = created.user.id;
      }
    } catch (authErr) {
      console.error('Erro ao criar/recuperar usuário auth:', authErr);
      return;
    }

    // 2) Upsert perfil com premium
    try {
      if (userId) {
        await supabase.from('user_profiles').upsert({
          user_id: userId,
          full_name,
          cpf,
          email,
          status: 'active',
          plan: 'pro',
        }, { onConflict: 'user_id' });
      }
    } catch (profileErr) {
      console.error('Erro ao upsert perfil premium:', profileErr);
    }

    // 3) Gerar link de recuperação e enviar email
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: `${siteUrl}/reset-password` },
      });
      if (linkErr) throw linkErr;
      const actionLink = (linkData as any)?.action_link || (linkData as any)?.properties?.action_link;
      const setupLink = actionLink || `${siteUrl}/reset-password`;
      await sendPasswordSetupEmail({ to: email, name: full_name, setupLink });
    } catch (emailErr) {
      console.error('Erro ao enviar email de criação de senha:', emailErr);
    }

    if (objectId) {
      const processedAt = new Date().toISOString();
      const updated = await supabase
        .from('payment_webhooks')
        .update({ status: 'processed', processed_at: processedAt } as any)
        .eq('object_id', objectId)
        .eq('event_type', 'order.paid');

      if (updated.error) {
        await supabase
          .from('payment_webhooks')
          .update({ processed: true, processed_at: processedAt } as any)
          .eq('object_id', objectId)
          .eq('event_type', 'order.paid');
      }
    }

    // Log para desenvolvimento
    console.log(`✅ Pedido ${orderId} processado com sucesso`);
    
  } catch (error) {
    console.error('Erro ao processar pagamento aprovado:', error);
    throw error;
  }
}

// Handler para falha no pagamento
async function handleOrderPaymentFailed(data: any, _objectId?: string) {
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
async function handleOrderCanceled(data: any, _objectId?: string) {
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
async function handleOrderRefunded(data: any, _objectId?: string) {
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

async function persistWebhookEvent(params: {
  supabaseAdmin: any;
  eventType: string;
  objectId: string;
  objectType: string;
  webhookData: any;
  signature: string;
}) {
  const { supabaseAdmin, eventType, objectId, objectType, webhookData, signature } = params;
  const receivedAt = new Date().toISOString();

  const headers = {
    'x-hub-signature-256': signature,
    'x-pagarme-event': eventType,
  };

  try {
    const existing = await supabaseAdmin
      .from('payment_webhooks')
      .select('id, attempts')
      .eq('object_id', objectId)
      .eq('event_type', eventType)
      .limit(1)
      .maybeSingle();

    if (existing?.data?.id) {
      const current = Number((existing.data as any)?.attempts ?? 0);
      const attempts = Number.isFinite(current) ? current + 1 : 1;

      await supabaseAdmin
        .from('payment_webhooks')
        .update({
          attempts,
          last_attempt_at: receivedAt,
          payload: webhookData,
          headers,
        })
        .eq('id', existing.data.id);

      return;
    }
  } catch {}

  const primaryRow: any = {
    webhook_id: webhookData?.id || null,
    event_type: eventType,
    object_type: objectType,
    object_id: objectId,
    status: 'pending',
    attempts: 1,
    last_attempt_at: receivedAt,
    payload: webhookData,
    headers,
    received_at: receivedAt,
  };

  const primary = await supabaseAdmin.from('payment_webhooks').insert(primaryRow);
  if (!primary.error) return;

  const fallbackRow: any = {
    event_type: eventType,
    object_id: objectId,
    payload: webhookData,
    signature,
    processed: false,
    received_at: receivedAt,
  };

  const fallback = await supabaseAdmin.from('payment_webhooks').insert(fallbackRow);
  if (!fallback.error) return;

  await supabaseAdmin.from('payment_webhooks').insert({
    event_type: eventType,
    object_id: objectId,
    payload: webhookData,
    received_at: receivedAt,
  } as any);
}

export async function POST() { return new NextResponse('Gone. Webhook processing moved to Backend.', { status: 410 }); }
async function POST_DISABLED(request: NextRequest) {
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

    const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret não configurado' }, { status: 500 });
    }

    const isValidSignature = verifyWebhookSignature(body, signature, webhookSecret);

    if (!isValidSignature) {
      console.error('Assinatura do webhook inválida');
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase Admin não configurado');
      }
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const objectIdRaw = webhookData?.id || webhookData?.data?.id || webhookData?.object?.id || null;
      const objectId = objectIdRaw || crypto.createHash('sha256').update(body).digest('hex');
      const objectType = String(eventType).split('.')[0] || 'event';
      await persistWebhookEvent({ supabaseAdmin, eventType, objectId, objectType, webhookData, signature });
    } catch (persistError) {
      console.error('Falha ao persistir webhook', persistError);
    }

    // Processar evento após persistir
    const objectIdRaw = webhookData?.id || webhookData?.data?.id || webhookData?.object?.id || null;
    const objectId = objectIdRaw || crypto.createHash('sha256').update(body).digest('hex');
    await processWebhookEvent(eventType, webhookData?.data || webhookData, objectId);

    // Retornar sucesso (ack)
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
export async function GET() { return new NextResponse('Gone. Webhook processing moved to Backend.', { status: 410 }); }
async function GET_DISABLED() {
  return NextResponse.json({
    message: 'Webhook endpoint da Pagar.me está funcionando',
    timestamp: new Date().toISOString(),
    status: 'active'
  });
}
