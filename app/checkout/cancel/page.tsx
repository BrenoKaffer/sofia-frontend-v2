'use client';

import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Ícone de Cancelamento */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Cancelado
        </h1>

        <p className="text-gray-600 mb-6">
          Seu pagamento foi cancelado. Nenhuma cobrança foi realizada em seu cartão ou conta.
        </p>

        {/* Informações */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">O que aconteceu?</h3>
          <ul className="text-sm text-gray-600 text-left space-y-1">
            <li>• Você cancelou o pagamento</li>
            <li>• Fechou a janela de pagamento</li>
            <li>• Houve um problema na transação</li>
          </ul>
        </div>

        {/* Ações */}
        <div className="space-y-3">
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link href="/checkout">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>

        {/* Suporte */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Precisa de ajuda?
          </p>
          <Button variant="link" className="text-blue-600 hover:text-blue-700 p-0">
            Entre em contato com o suporte
          </Button>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-4">
          <p className="text-xs text-gray-400">
            Seus dados estão seguros. Nenhuma informação foi armazenada.
          </p>
        </div>
      </div>
    </div>
  );
}