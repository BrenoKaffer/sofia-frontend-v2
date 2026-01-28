'use client';

import React from 'react';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentCancelPage() {
  const handleRetryPayment = () => {
    // Voltar para a página de checkout
    window.location.href = 'https://pay.v1sofia.com';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header de Cancelamento */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento Cancelado
          </h1>
          <p className="text-gray-600">
            Sua transação foi cancelada. Nenhum valor foi cobrado.
          </p>
        </div>

        {/* Informações sobre o Cancelamento */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              O que aconteceu?
            </CardTitle>
            <CardDescription>
              Possíveis motivos para o cancelamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">
                Motivos comuns para cancelamento:
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Você clicou em "Cancelar" durante o processo de pagamento</li>
                <li>• Fechou a janela do navegador durante a transação</li>
                <li>• Houve um problema de conexão com a internet</li>
                <li>• Decidiu não prosseguir com a compra</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">
                Não se preocupe!
              </h3>
              <p className="text-sm text-blue-700">
                Nenhum valor foi cobrado do seu cartão ou conta. Você pode tentar novamente 
                a qualquer momento ou entrar em contato conosco se precisar de ajuda.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Opções Disponíveis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>O que você gostaria de fazer?</CardTitle>
            <CardDescription>
              Escolha uma das opções abaixo para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Tentar novamente</h4>
                  <p className="text-sm text-gray-600">
                    Volte ao checkout e complete sua compra do Sistema SOFIA
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Voltar ao início</h4>
                  <p className="text-sm text-gray-600">
                    Retorne à página inicial para explorar mais sobre o sistema
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <HelpCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Precisa de ajuda?</h4>
                  <p className="text-sm text-gray-600">
                    Entre em contato com nosso suporte para esclarecimentos
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleRetryPayment}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Pagamento Novamente
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleGoHome}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </div>

        {/* Informações de Contato */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Ainda com dúvidas? Estamos aqui para ajudar:
          </p>
          <div className="flex justify-center space-x-6">
            <a 
              href="mailto:suporte@sofia.com" 
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              suporte@sofia.com
            </a>
            <a 
              href="tel:+5511999999999" 
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              (11) 99999-9999
            </a>
          </div>
        </div>

        {/* Garantia */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-center">
            <h3 className="font-medium text-green-800 mb-1">
              Compra 100% Segura
            </h3>
            <p className="text-sm text-green-700">
              Todos os pagamentos são processados de forma segura pela Pagar.me. 
              Seus dados estão protegidos com criptografia SSL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
