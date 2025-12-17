'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Download, ArrowRight, Mail, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PaymentSuccessPage() {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar detalhes do pedido da URL ou localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    
    // Simular busca dos dados do pedido
    setTimeout(() => {
      setOrderDetails({
        id: orderId || 'ORD-' + Date.now(),
        amount: 'R$ 197,00',
        product: 'Sistema SOFIA - Licença Anual',
        date: new Date().toLocaleDateString('pt-BR'),
        paymentMethod: 'Cartão de Crédito',
        email: 'cliente@email.com'
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleDownload = () => {
    // Implementar download do sistema ou redirecionamento para área do cliente
    alert('Redirecionando para download...');
  };

  const handleAccessSystem = () => {
    // Redirecionar para o sistema
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processando seu pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header de Sucesso */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Pagamento Aprovado!
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Parabéns! Sua compra foi processada com sucesso.
          </p>
          <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2">
            Pedido #{orderDetails?.id}
          </Badge>
        </div>

        {/* Detalhes do Pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 text-green-600 mr-2" />
              Detalhes da Compra
            </CardTitle>
            <CardDescription>
              Informações sobre sua transação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Produto</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {orderDetails?.product}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor Pago</label>
                  <p className="text-2xl font-bold text-green-600">
                    {orderDetails?.amount}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data da Compra</label>
                  <p className="text-lg text-gray-900">
                    {orderDetails?.date}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Método de Pagamento</label>
                  <p className="text-lg text-gray-900">
                    {orderDetails?.paymentMethod}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximos Passos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRight className="w-5 h-5 text-blue-600 mr-2" />
              Próximos Passos
            </CardTitle>
            <CardDescription>
              O que fazer agora para começar a usar o Sistema SOFIA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                1. Verifique seu e-mail
              </h3>
              <p className="text-blue-800 mb-3">
                Enviamos um e-mail de confirmação para <strong>{orderDetails?.email}</strong> 
                com suas credenciais de acesso e instruções detalhadas.
              </p>
              <p className="text-sm text-blue-700">
                Não encontrou o e-mail? Verifique sua caixa de spam ou lixo eletrônico.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <Download className="w-5 h-5 mr-2" />
                2. Faça o download do sistema
              </h3>
              <p className="text-green-800 mb-4">
                Baixe e instale o Sistema SOFIA em seu computador para começar a usar 
                todas as funcionalidades.
              </p>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Sistema SOFIA
              </Button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                3. Configure sua conta
              </h3>
              <p className="text-purple-800 mb-4">
                Acesse o painel administrativo para configurar suas preferências 
                e começar a usar o sistema.
              </p>
              <Button 
                variant="outline" 
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
                onClick={handleAccessSystem}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Acessar Painel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Suporte e Garantia */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Suporte Técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Nossa equipe está pronta para ajudar você a configurar e usar o sistema.
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>E-mail:</strong> suporte@sofia.com
                </p>
                <p className="text-sm">
                  <strong>WhatsApp:</strong> (11) 99999-9999
                </p>
                <p className="text-sm">
                  <strong>Horário:</strong> Segunda a Sexta, 9h às 18h
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🛡️ Garantia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Você tem 30 dias de garantia incondicional. Se não ficar satisfeito, 
                devolvemos 100% do seu dinheiro.
              </p>
              <p className="text-sm text-gray-500">
                Sem perguntas, sem complicações. Sua satisfação é nossa prioridade.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações Importantes */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-yellow-800 mb-2">
              📋 Informações Importantes
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Guarde este número do pedido para futuras consultas: <strong>#{orderDetails?.id}</strong></li>
              <li>• Sua licença é válida por 12 meses a partir da data da compra</li>
              <li>• Você pode instalar o sistema em até 3 computadores</li>
              <li>• Atualizações gratuitas estão incluídas durante o período da licença</li>
              <li>• O recibo fiscal será enviado por e-mail em até 24 horas</li>
            </ul>
          </CardContent>
        </Card>

        {/* Botão de Ação Principal */}
        <div className="text-center mt-8">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
            onClick={handleAccessSystem}
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Começar a Usar o Sistema SOFIA
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Obrigado por escolher o Sistema SOFIA! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}