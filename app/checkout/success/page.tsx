'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('order_id');
  const checkoutId = searchParams.get('checkout_id');

  useEffect(() => {
    if (orderId || checkoutId) {
      // Aqui você pode fazer uma requisição para buscar os detalhes do pedido
      // Por enquanto, vamos simular os dados
      setTimeout(() => {
        setOrderData({
          id: orderId || checkoutId,
          amount: 'R$ 849,00',
          status: 'paid',
          payment_method: 'credit_card',
          created_at: new Date().toISOString()
        });
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [orderId, checkoutId]);

  // Redirect automático para o dashboard quando o pagamento estiver confirmado
  useEffect(() => {
    if (orderData?.status === 'paid') {
      const t = setTimeout(() => {
        window.location.href = '/dashboard?welcome=true';
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [orderData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Ícone de Sucesso */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Aprovado!
        </h1>

        <p className="text-gray-600 mb-6">
          Seu pagamento foi processado com sucesso. Você receberá um e-mail de confirmação em breve.
        </p>

        {/* Detalhes do Pedido */}
        {orderData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Detalhes do Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID do Pedido:</span>
                <span className="font-mono text-gray-900">{orderData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor:</span>
                <span className="font-semibold text-gray-900">{orderData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Pago
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data:</span>
                <span className="text-gray-900">
                  {new Date(orderData.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="space-y-3">
          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <Link href="/dashboard">
              <ArrowRight className="w-4 h-4 mr-2" />
              Acessar SOFIA PRO
            </Link>
          </Button>

          <Button variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Baixar Comprovante
          </Button>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">
            Processado com segurança pela Pagar.me
          </p>
          <p className="text-xs text-gray-400">
            Em caso de dúvidas, entre em contato conosco através do suporte.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}