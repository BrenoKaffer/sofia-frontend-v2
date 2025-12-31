'use client';

import React from 'react';
import { PagarMeCheckout, CheckoutItem } from '@/components/payments/pagarme-checkout';

export default function CheckoutPagarMePage() {
  // Dados de exemplo para o checkout
  const items: CheckoutItem[] = [
    {
      id: '1',
      title: 'Licença SOFIA',
      unit_price: 19700, // R$ 197,00 em centavos
      quantity: 1,
      tangible: false
    }
  ];

  const handleSuccess = (result: any) => {
    console.log('Pagamento realizado com sucesso:', result);
    // Redirecionar para página de sucesso ou atualizar estado
  };

  const handleError = (error: any) => {
    console.error('Erro no pagamento:', error);
    // Tratar erro conforme necessário
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <PagarMeCheckout
          items={items}
          customer={{
            name: '',
            email: '',
            document: '',
            phone: ''
          }}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  );
}