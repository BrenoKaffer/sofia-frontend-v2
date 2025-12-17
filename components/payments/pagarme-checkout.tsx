'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, QrCode, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export interface CheckoutItem {
  id: string;
  title: string;
  unit_price: number; // em centavos
  quantity: number;
  tangible: boolean;
}

export interface CheckoutCustomer {
  name: string;
  email: string;
  document: string;
  phone?: string;
}

interface PagarMeCheckoutProps {
  items: CheckoutItem[];
  customer?: Partial<CheckoutCustomer>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export function PagarMeCheckout({ 
  items, 
  customer, 
  onSuccess, 
  onError
}: PagarMeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CheckoutCustomer>({
    name: customer?.name || '',
    email: customer?.email || '',
    document: customer?.document || '',
    phone: customer?.phone || '',
  });

  const totalAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  const handleCustomerChange = (field: keyof CheckoutCustomer, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const isCustomerDataValid = () => {
    return customerData.name && 
           customerData.email && 
           customerData.document &&
           customerData.document.replace(/\D/g, '').length === 11;
  };

  const createCheckoutLink = async () => {
    if (!isCustomerDataValid()) {
      toast.error('Por favor, preencha todos os dados obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para o checkout conforme a API existente
      const checkoutData = {
        items: items.map(item => ({
          amount: item.unit_price,
          name: item.title,
          default_quantity: item.quantity
        })),
        customer: {
          name: customerData.name,
          email: customerData.email,
          document: customerData.document.replace(/\D/g, ''),
          phone: customerData.phone
        },
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`
      };

      // Criar link de pagamento (usar endpoint alinhado)
      const response = await fetch('/api/checkout-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar checkout');
      }

      // Redirecionar para o checkout hospedado da Pagar.me
      // Backend retorna { url } conforme contrato alinhado
      window.location.href = result.url;

    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao processar pagamento: ${errorMessage}`);
      onError?.(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 p-6">
        {/* Coluna Esquerda - Formulário */}
        <div className="flex-1 space-y-6">
          {/* Header com Logo */}
          <div className="bg-white">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="text-sm text-gray-700 font-medium">pagar.me</span>
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">UMA EMPRESA STONE CO.</p>
          </div>

          {/* Métodos de Pagamento */}
          <div className="bg-white">
            <h2 className="text-xl font-normal mb-6 text-gray-900">Métodos de pagamento disponíveis</h2>
            
            {/* Informação sobre métodos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2 font-medium">
                <ExternalLink className="w-4 h-4 inline mr-1" />
                Checkout Seguro da Pagar.me
              </p>
              <p className="text-xs text-blue-600">
                Você será redirecionado para o ambiente seguro da Pagar.me onde poderá escolher entre:
              </p>
            </div>

            {/* Opções de Pagamento Disponíveis */}
            <div className="space-y-3">
              <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <span className="font-medium text-gray-700 block">Cartão de Crédito</span>
                  <span className="text-xs text-gray-500">Parcelamento em até 6x sem juros</span>
                </div>
              </div>
              
              <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                <CreditCard className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <span className="font-medium text-gray-700 block">Cartão de Débito</span>
                  <span className="text-xs text-gray-500">Pagamento à vista</span>
                </div>
              </div>
              
              <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                <QrCode className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <span className="font-medium text-gray-700 block">PIX</span>
                  <span className="text-xs text-gray-500">Pagamento instantâneo</span>
                </div>
              </div>
              
              <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                <FileText className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <span className="font-medium text-gray-700 block">Boleto Bancário</span>
                  <span className="text-xs text-gray-500">Vencimento em 7 dias</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="bg-white">
            <h2 className="text-xl font-normal mb-6 text-gray-900">Dados pessoais</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-normal text-gray-700 mb-1 block">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => handleCustomerChange('email', e.target.value)}
                  placeholder="anasilva@exemplo.com"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="name" className="text-sm font-normal text-gray-700 mb-1 block">Nome completo *</Label>
                <Input
                  id="name"
                  value={customerData.name}
                  onChange={(e) => handleCustomerChange('name', e.target.value)}
                  placeholder="Ana Cristina da Silva"
                  className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="document-type" className="text-sm font-normal text-gray-700 mb-1 block">Documento</Label>
                  <select className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option>CPF</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="document" className="text-sm font-normal text-gray-700 mb-1 block">Número do documento *</Label>
                  <Input
                    id="document"
                    value={customerData.document}
                    onChange={(e) => handleCustomerChange('document', e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country" className="text-sm font-normal text-gray-700 mb-1 block">Código do país</Label>
                  <select className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option>Brasil (+55)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-normal text-gray-700 mb-1 block">Celular com DDD *</Label>
                  <Input
                    id="phone"
                    value={customerData.phone}
                    onChange={(e) => handleCustomerChange('phone', e.target.value)}
                    placeholder="(00) 0 0000-0000"
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Pagamento Protegido */}
            <div className="flex items-center justify-center mt-8 mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>🔒</span>
                <span>Pagamento protegido pela Pagar.me</span>
                <span className="text-gray-400">ⓘ</span>
              </div>
            </div>

            {/* Botão Continuar */}
            <div className="mt-6">
              <Button
                onClick={createCheckoutLink}
                disabled={loading || !isCustomerDataValid()}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-base transition-colors"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando checkout...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ir para Pagamento
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Você será redirecionado para o ambiente seguro da Pagar.me
              </p>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Resumo */}
        <div className="lg:w-80">
          <div className="bg-gray-100 p-6 rounded-lg">
            <div className="text-center mb-6">
              <h3 className="text-xs font-medium text-gray-500 mb-2 tracking-wide uppercase">CHECKOUT</h3>
              <h2 className="text-xl font-semibold text-gray-900">Resumo da compra</h2>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    Acesso ao Sistema de Operação de Fichas Inteligentes e Autônomas.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-medium">
                      {item.quantity} unidade{item.quantity > 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-gray-900">
                      R$ {(item.unit_price / 100).toFixed(2).replace('.', ',')} /un.
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">R$ {(totalAmount / 100).toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frete</span>
                <span className="font-medium text-gray-900">R$ 0,00</span>
              </div>
              <div className="border-t border-gray-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total a pagar</span>
                  <span className="font-bold text-xl text-gray-900">
                    R$ {(totalAmount / 100).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações de Segurança */}
            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  🔐 Checkout hospedado pela Pagar.me
                </p>
                <p className="text-xs text-gray-400">
                  Seus dados são protegidos com criptografia SSL
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}