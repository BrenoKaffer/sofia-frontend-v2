"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Smartphone, Tag, ChevronDown, Shield, Lock, Check } from "lucide-react";

type Method = "card" | "pix";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function CheckoutV2Page() {
  const [clientReady, setClientReady] = useState(false);
  const [method, setMethod] = useState<Method>("card");
  const [showCoupon, setShowCoupon] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Preço base (em centavos)
  const basePrice = 19700;
  const hasDiscount = coupon.trim().toUpperCase() === "SOFIA10"; // demonstração
  const finalPrice = hasDiscount ? Math.round(basePrice * 0.9) : basePrice;

  useEffect(() => {
    const t = setTimeout(() => setClientReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async () => {
    setProcessing(true);
    setMessage(null);
    await new Promise((r) => setTimeout(r, 1300));
    setProcessing(false);
    setMessage("Assinatura simulada com sucesso. Esta é uma versão de teste.");
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header & Steps */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Ative sua assinatura</h1>
            <p className="text-sm text-gray-600 mt-1">Modelo V2 isolado para validação visual.</p>

            <div className="mt-6 flex items-center text-xs text-gray-600">
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center">1</span>
                <span className="ml-2">Dados</span>
              </div>
              <div className="mx-4 h-px w-12 bg-gray-300" />
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">2</span>
                <span className="ml-2">Pagamento</span>
              </div>
              <div className="mx-4 h-px w-12 bg-gray-300" />
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">3</span>
                <span className="ml-2">Confirmar</span>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6">
            {!clientReady ? (
              <div className="space-y-6">
                <Skeleton className="h-6 w-48" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Método */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Forma de pagamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMethod("card")}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                        method === "card"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mr-2" /> Cartão
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod("pix")}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                        method === "pix"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mr-2" /> PIX
                    </button>
                  </div>
                </div>

                {/* Dados pessoais */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Email</label>
                    <input
                      type="email"
                      placeholder="repita seu@email.com"
                      className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                    />
                  </div>
                </div>

                {/* Cartão (opcional) */}
                {method === "card" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Número do cartão</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiração</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cupom */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCoupon((v) => !v)}
                    className="flex items-center text-green-600 hover:text-green-700 font-medium mb-2"
                  >
                    <Tag className="w-4 h-4 mr-2" /> Tenho um cupom <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showCoupon ? "rotate-180" : ""}`} />
                  </button>
                  {showCoupon && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="Digite seu código"
                        className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 border-gray-300"
                      />
                      <div className="text-sm text-gray-600">
                        {coupon ? (
                          <span>
                            {hasDiscount ? (
                              <span className="text-green-700">Cupom reconhecido: 10% off</span>
                            ) : (
                              <span className="text-gray-500">Cupom não elegível (apenas demonstração)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">Digite um cupom para aplicar</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={handleSubmit}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Ativar assinatura – R$ {(finalPrice / 100).toFixed(2)}/mês
                    </>
                  )}
                </button>

                {/* Microcopy */}
                <div className="text-center text-xs text-gray-600">
                  <div className="flex items-center justify-center mb-2">
                    <Shield className="w-4 h-4 text-green-600 mr-1" />
                    Pagamento seguro & criptografado
                  </div>
                  <p>
                    Ao continuar, você concorda com os
                    <a href="#" className="text-green-600 hover:underline ml-1">Termos de Serviço</a>
                  </p>
                </div>

                {message && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center">
                    <Check className="w-4 h-4 mr-2" /> {message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer mini */}
          <div className="mt-6 text-center text-xs text-gray-500">
            © 2025 Umbrella Tecnologia – V2 Teste Visual
          </div>
        </div>
      </div>
    </div>
  );
}