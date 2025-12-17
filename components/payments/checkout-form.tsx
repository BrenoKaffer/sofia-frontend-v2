'use client';

import React, { useState } from 'react';
import { CreditCard, Shield, Check, AlertCircle, Lock, Star, Smartphone, Copy, ChevronDown, Tag, QrCode, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCardForm } from './credit-card-form';
import { PixForm } from './pix-form';
import { BoletoForm } from './boleto-form';

export interface CheckoutItem {
  description: string;
  amount: number; // em centavos
  quantity: number;
  code?: string;
}

export interface CheckoutCustomer {
  name: string;
  email: string;
  document: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface CheckoutFormProps {
  items: CheckoutItem[];
  customer?: Partial<CheckoutCustomer>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

export function CheckoutForm({ items, customer, onSuccess, onError }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix' | 'boleto'>('credit_card');
  const [customerData, setCustomerData] = useState<CheckoutCustomer>({
    name: customer?.name || '',
    email: customer?.email || '',
    document: customer?.document || '',
    phone: customer?.phone || '',
    address: customer?.address || {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  const totalAmount = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);

  const handleCustomerChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setCustomerData(prev => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressField]: value,
        },
      }));
    } else {
      setCustomerData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const processPayment = async (paymentData: any) => {
    setLoading(true);
    
    try {
      const orderData = {
        customer: {
          name: customerData.name,
          email: customerData.email,
          document: customerData.document.replace(/\D/g, ''),
          document_type: 'CPF',
          type: 'individual',
          phones: customerData.phone ? {
            mobile_phone: {
              country_code: '55',
              area_code: customerData.phone.substring(0, 2),
              number: customerData.phone.substring(2),
            },
          } : undefined,
          address: customerData.address ? {
            line_1: `${customerData.address.street}, ${customerData.address.number}`,
            line_2: customerData.address.complement || undefined,
            zip_code: customerData.address.zipCode.replace(/\D/g, ''),
            city: customerData.address.city,
            state: customerData.address.state,
            country: 'BR',
          } : undefined,
        },
        items: items.map(item => ({
          amount: item.amount,
          description: item.description,
          quantity: item.quantity,
          code: item.code,
        })),
        payments: [paymentData],
      };

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao processar pagamento');
      }

      toast.success('Pagamento processado com sucesso!');
      onSuccess?.(result);

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao processar pagamento: ${errorMessage}`);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const isCustomerDataValid = () => {
    return customerData.name && 
           customerData.email && 
           customerData.document &&
           customerData.document.replace(/\D/g, '').length === 11;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Resumo do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.description}</span>
                  {item.quantity > 1 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      x{item.quantity}
                    </span>
                  )}
                </div>
                <span className="font-medium">
                  R$ {((item.amount * item.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-4">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>R$ {(totalAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>
            Preencha seus dados para finalizar a compra
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={customerData.name}
                onChange={(e) => handleCustomerChange('name', e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => handleCustomerChange('email', e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="document">CPF *</Label>
              <Input
                id="document"
                value={customerData.document}
                onChange={(e) => handleCustomerChange('document', e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={customerData.phone}
                onChange={(e) => handleCustomerChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={customerData.address?.street || ''}
                  onChange={(e) => handleCustomerChange('address.street', e.target.value)}
                  placeholder="Nome da rua"
                />
              </div>
              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={customerData.address?.number || ''}
                  onChange={(e) => handleCustomerChange('address.number', e.target.value)}
                  placeholder="123"
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={customerData.address?.neighborhood || ''}
                  onChange={(e) => handleCustomerChange('address.neighborhood', e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={customerData.address?.city || ''}
                  onChange={(e) => handleCustomerChange('address.city', e.target.value)}
                  placeholder="Nome da cidade"
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={customerData.address?.state || ''}
                  onChange={(e) => handleCustomerChange('address.state', e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={customerData.address?.zipCode || ''}
                  onChange={(e) => handleCustomerChange('address.zipCode', e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forma de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
          <CardDescription>
            Escolha como deseja pagar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credit_card" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Cartão
              </TabsTrigger>
              <TabsTrigger value="pix" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                PIX
              </TabsTrigger>
              <TabsTrigger value="boleto" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Boleto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credit_card" className="mt-6">
              <CreditCardForm
                amount={totalAmount}
                onSubmit={processPayment}
                loading={loading}
                disabled={!isCustomerDataValid()}
              />
            </TabsContent>

            <TabsContent value="pix" className="mt-6">
              <PixForm
                amount={totalAmount}
                onSubmit={processPayment}
                loading={loading}
                disabled={!isCustomerDataValid()}
              />
            </TabsContent>

            <TabsContent value="boleto" className="mt-6">
              <BoletoForm
                amount={totalAmount}
                onSubmit={processPayment}
                loading={loading}
                disabled={!isCustomerDataValid()}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}