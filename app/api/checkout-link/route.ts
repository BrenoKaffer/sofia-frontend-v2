import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { SecurityMiddlewares } from '@/lib/security';

// Configurações da Pagar.me
const PAGARME_API_URL = 'https://api.pagar.me/core/v5/orders';

// Não lançar erro em tempo de build; validar dentro dos handlers
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
    // Segurança e rate limiting (API pública)
    const guard = SecurityMiddlewares.publicApi(request);
    if (guard) return guard;

    const raw = await request.json();
    const schema = z.object({
      payment_settings: z.object({
        accepted_payment_methods: z.array(z.string()).min(1),
        credit_card_settings: z.object({
          operation_type: z.string().optional(),
          installments: z.array(z.object({
            number: z.number().int().positive(),
            total: z.number().int().positive()
          })).min(1)
        })
      }),
      cart_settings: z.object({
        items: z.array(z.object({
          amount: z.number().int().positive(),
          name: z.string().min(1),
          default_quantity: z.number().int().positive().optional()
        })).min(1)
      }),
      customer: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        document: z.string().regex(/^\d{11,14}$/),
        phone: z.string().optional(),
        code: z.string().optional(),
        type: z.enum(['individual','corporation']).optional()
      }).optional(),
      name: z.string().optional(),
      type: z.string().optional(),
      success_url: z.string().url().optional(),
      cancel_url: z.string().url().optional()
    });

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const body: CheckoutRequest & { customer?: { name: string; email: string; document: string; phone?: string; code?: string; type?: string } } = parsed.data as any;

    // Validação básica
    if (!body.cart_settings?.items?.length) {
      return NextResponse.json(
        { error: 'Itens do carrinho são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar e normalizar success_url/cancel_url para evitar open redirect
    const origin = request.nextUrl.origin;
    const allowedBase = process.env.NEXT_PUBLIC_SITE_URL || origin;
    const normalizeUrl = (u?: string) => {
      if (!u) return undefined;
      try {
        const parsed = new URL(u);
        // Permitir apenas o mesmo host/domínio configurado
        if (parsed.host !== new URL(allowedBase).host) {
          return undefined;
        }
        return parsed.toString();
      } catch {
        return undefined;
      }
    };

    // Helper para normalizar telefone para o formato esperado pela API v5 da Pagar.me
    const normalizePhone = (raw?: string) => {
      const digits = (raw || '').replace(/\D/g, '');
      if (!digits) return undefined;
      if (digits.length >= 12) {
        return {
          country_code: digits.slice(0, 2),
          area_code: digits.slice(2, 4),
          number: digits.slice(4)
        };
      }
      if (digits.length === 11 || digits.length === 10) {
        return {
          country_code: '55',
          area_code: digits.slice(0, 2),
          number: digits.slice(2)
        };
      }
      return undefined;
    };

    // Preparar dados para a API da Pagar.me
    const pagarmeData = {
      items: body.cart_settings.items.map(item => ({
        amount: item.amount,
        description: item.name,
        quantity: item.default_quantity || 1,
        code: `item_${Date.now()}`
      })),
      customer: body.customer ? {
        name: body.customer.name,
        email: body.customer.email,
        document: body.customer.document,
        type: body.customer.type || 'individual',
        code: body.customer.code || body.customer.email,
        ...(normalizePhone(body.customer.phone) ? { phones: { mobile_phone: normalizePhone(body.customer.phone)! } } : {})
      } : undefined,
      payments: [
        {
          payment_method: 'checkout',
          checkout: {
            expires_in: 3600, // 1 hora
            default_payment_method: 'credit_card',
            accepted_payment_methods: body.payment_settings.accepted_payment_methods,
            success_url: normalizeUrl(body.success_url) || `${origin}/payment/success`,
            cancel_url: normalizeUrl(body.cancel_url) || `${origin}/payment/cancel`,
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

    // Em produção, validar a chave antes de prosseguir
    if (!PAGARME_SECRET_KEY) {
      return NextResponse.json(
        { error: 'PAGARME_SECRET_KEY não configurada' },
        { status: 500 }
      );
    }

    // Fazer requisição real para a API da Pagar.me
    // Idempotency-Key baseado no payload
    const idempotencyKey = crypto.createHash('sha256').update(JSON.stringify(pagarmeData)).digest('hex');

    const response = await fetch(PAGARME_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${PAGARME_SECRET_KEY}:`).toString('base64')}`,
        'Idempotency-Key': idempotencyKey
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