import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { paymentStatus, transactionId, userEmail, planType } = await request.json();

    // Validar dados obrigatórios
    if (!paymentStatus || !transactionId || !userEmail) {
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios não fornecidos'
      }, { status: 400 });
    }

    // Determinar URL de redirecionamento baseado no status do pagamento
    let redirectUrl = '/dashboard';
    let message = '';

    switch (paymentStatus) {
      case 'paid':
      case 'authorized':
        redirectUrl = '/dashboard?welcome=true';
        message = 'Pagamento aprovado! Redirecionando para o dashboard...';
        break;
      
      case 'pending':
        redirectUrl = '/payment/pending';
        message = 'Pagamento pendente. Aguardando confirmação...';
        break;
      
      case 'refused':
      case 'failed':
        redirectUrl = '/checkout?error=payment_failed';
        message = 'Pagamento recusado. Tente novamente com outro cartão.';
        break;
      
      case 'canceled':
        redirectUrl = '/checkout?error=payment_canceled';
        message = 'Pagamento cancelado.';
        break;
      
      default:
        redirectUrl = '/checkout';
        message = 'Status de pagamento desconhecido.';
    }

    // Log da transação para auditoria
    console.log(`[PAYMENT_REDIRECT] Transaction ${transactionId} - Status: ${paymentStatus} - User: ${userEmail} - Redirect: ${redirectUrl}`);

    // Retornar informações de redirecionamento
    return NextResponse.json({
      success: true,
      redirect: {
        url: redirectUrl,
        message: message,
        delay: paymentStatus === 'paid' ? 2000 : 1000 // Delay maior para pagamentos aprovados
      },
      transaction: {
        id: transactionId,
        status: paymentStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[PAYMENT_REDIRECT_ERROR]', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      redirect: {
        url: '/checkout',
        message: 'Erro ao processar redirecionamento. Tente novamente.',
        delay: 1000
      }
    }, { status: 500 });
  }
}

// Endpoint GET para obter URLs de redirecionamento disponíveis (útil para desenvolvimento)
export async function GET() {
  const redirectOptions = {
    success: '/dashboard?welcome=true',
    pending: '/payment/pending',
    failed: '/checkout?error=payment_failed',
    canceled: '/checkout?error=payment_canceled',
    default: '/checkout'
  };

  return NextResponse.json({
    success: true,
    redirectOptions,
    description: 'URLs de redirecionamento disponíveis após pagamento'
  });
}