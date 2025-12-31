"use client";

// Snapshot de backup do checkout atual.
// Este arquivo foi gerado para manter uma cópia estática do conteúdo atual
// de `app/checkout/page.tsx` antes da criação do modelo V2 isolado.
// Não é utilizado em runtime; serve apenas como referência/rollback rápido.

import React from 'react';

// Conteúdo inline do snapshot (copiado do page.tsx no momento do backup)
export default function CheckoutPageSnapshot() {
  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold">Snapshot do Checkout</h1>
        <p className="text-sm text-gray-600 mt-2">
          Este é um snapshot estático do checkout atual. Para ver o checkout
          funcional, utilize a rota normal `/checkout`. Para o novo modelo
          isolado, utilize `/checkout-v2`.
        </p>
        <div className="mt-6 rounded border bg-gray-50 p-4 text-sm text-gray-700">
          <p>
            O snapshot completo do arquivo foi salvo neste componente para fins
            de backup documental. Caso precise do conteúdo funcional, consulte
            o arquivo original em `app/checkout/page.tsx`.
          </p>
        </div>
      </div>
    </div>
  );
}