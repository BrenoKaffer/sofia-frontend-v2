import { NextRequest, NextResponse } from 'next/server';

// Cupons válidos (em produção, isso viria de um banco de dados)
const VALID_COUPONS = {
  'SOFIA10': {
    discount: 10,
    type: 'percentage',
    description: '10% de desconto',
    active: true,
    expires_at: '2025-12-31'
  },
  'SOFIA20': {
    discount: 20,
    type: 'percentage',
    description: '20% de desconto',
    active: true,
    expires_at: '2025-12-31'
  },
  'WELCOME50': {
    discount: 50,
    type: 'fixed',
    description: 'R$ 50,00 de desconto',
    active: true,
    expires_at: '2025-12-31'
  },
  'BLACKFRIDAY': {
    discount: 30,
    type: 'percentage',
    description: '30% de desconto - Black Friday',
    active: true,
    expires_at: '2025-11-30'
  },
  'FIRSTMONTH': {
    discount: 100,
    type: 'percentage',
    description: 'Primeiro mês grátis',
    active: true,
    expires_at: '2025-12-31'
  }
};

export async function POST(request: NextRequest) {
  try {
    const { coupon, amount } = await request.json();
    
    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Código do cupom é obrigatório' },
        { status: 400 }
      );
    }

    const couponCode = coupon.toUpperCase().trim();
    const couponData = VALID_COUPONS[couponCode as keyof typeof VALID_COUPONS];

    if (!couponData) {
      return NextResponse.json(
        { success: false, error: 'Cupom inválido' },
        { status: 400 }
      );
    }

    if (!couponData.active) {
      return NextResponse.json(
        { success: false, error: 'Cupom não está ativo' },
        { status: 400 }
      );
    }

    // Verificar se o cupom expirou
    const expirationDate = new Date(couponData.expires_at);
    const currentDate = new Date();
    
    if (currentDate > expirationDate) {
      return NextResponse.json(
        { success: false, error: 'Cupom expirado' },
        { status: 400 }
      );
    }

    // Calcular desconto
    let discountAmount = 0;
    let finalAmount = amount;

    if (couponData.type === 'percentage') {
      discountAmount = Math.round((amount * couponData.discount) / 100);
    } else if (couponData.type === 'fixed') {
      discountAmount = couponData.discount * 100; // Converter para centavos
    }

    // Garantir que o desconto não seja maior que o valor total
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    finalAmount = amount - discountAmount;

    return NextResponse.json({
      success: true,
      coupon: {
        code: couponCode,
        description: couponData.description,
        discount: couponData.discount,
        type: couponData.type
      },
      calculation: {
        original_amount: amount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        savings_percentage: Math.round((discountAmount / amount) * 100)
      }
    });

  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Método GET para listar cupons disponíveis (apenas para desenvolvimento)
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Endpoint disponível apenas em desenvolvimento' },
      { status: 403 }
    );
  }

  const activeCoupons = Object.entries(VALID_COUPONS)
    .filter(([_, coupon]) => coupon.active)
    .map(([code, coupon]) => ({
      code,
      description: coupon.description,
      discount: coupon.discount,
      type: coupon.type,
      expires_at: coupon.expires_at
    }));

  return NextResponse.json({
    coupons: activeCoupons,
    total: activeCoupons.length
  });
}