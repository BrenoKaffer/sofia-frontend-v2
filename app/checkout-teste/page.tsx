'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, Check, AlertCircle, Lock, Star, Smartphone, Copy, ChevronDown, Tag } from 'lucide-react';

const SaaSCheckout = () => {
  const [formData, setFormData] = useState({
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    cpf: '',
    coupon: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('credit_card'); // 'credit_card' ou 'pix'
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_url: string;
    expires_at: string;
  } | null>(null);
  const [showCoupon, setShowCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validations, setValidations] = useState<Record<string, string>>({});

  // Formatação de cartão de crédito
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Formatação de data de expiração
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Formatação de CPF
  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, '');
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Validações
  const validateForm = () => {
    const newValidations: Record<string, string> = {};
    
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newValidations.email = 'Email válido é obrigatório';
    }
    
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      newValidations.cpf = 'CPF inválido';
    }

    // Validações específicas para cartão de crédito
    if (paymentMethod === 'credit_card') {
      if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
        newValidations.cardNumber = 'Número do cartão inválido';
      }
      
      if (!formData.expiryDate || formData.expiryDate.length < 5) {
        newValidations.expiryDate = 'Data de expiração inválida';
      }
      
      if (!formData.cvv || formData.cvv.length < 3) {
        newValidations.cvv = 'CVV inválido';
      }
      
      if (!formData.cardName || formData.cardName.length < 3) {
        newValidations.cardName = 'Nome do titular é obrigatório';
      }
    }
    
    setValidations(newValidations);
    return Object.keys(newValidations).length === 0;
  };

  // Handler para mudanças no formulário
  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Limpar validação do campo quando o usuário digita
    if (validations[field]) {
      setValidations(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Integração com API backend
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const baseData = {
        customer: {
          email: formData.email,
          document_number: formData.cpf.replace(/\D/g, ''),
          name: paymentMethod === 'credit_card' ? formData.cardName : 'Cliente PIX',
          type: 'individual'
        },
        amount: 19700, // R$ 197,00 em centavos
      };

      if (paymentMethod === 'credit_card') {
        const subscriptionData = {
          ...baseData,
          plan: {
            amount: 19700,
            interval: 'month',
            interval_count: 1,
            name: 'Plano SaaS Mensal'
          },
          card: {
            number: formData.cardNumber.replace(/\s/g, ''),
            holder_name: formData.cardName,
            exp_month: formData.expiryDate.split('/')[0],
            exp_year: '20' + formData.expiryDate.split('/')[1],
            cvv: formData.cvv
          },
          payment_method: 'credit_card'
        };
        
        // Chamada para API de assinatura
        const response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscriptionData)
        });

        const result = await response.json();
        
        if (result.success) {
          setSuccess(true);
        } else {
          throw new Error(result.error || 'Erro ao processar pagamento');
        }
        
      } else if (paymentMethod === 'pix') {
        const pixPaymentData = {
          ...baseData,
          payment_method: 'pix',
          pix_expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
        };
        
        // Chamada para API de PIX
        const response = await fetch('/api/create-pix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pixPaymentData)
        });

        const result = await response.json();
        
        if (result.success) {
          setPixData({
            qr_code: result.qr_code,
            qr_code_url: result.qr_code_url,
            expires_at: result.expires_at
          });
        } else {
          throw new Error(result.error || 'Erro ao gerar PIX');
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Componente para ícones de cartão (bandeiras reais)
  const CardIcons = () => (
    <div className="flex space-x-2 ml-2">
      {/* Visa */}
      <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
        <svg width="24" height="8" viewBox="0 0 24 8" className="fill-blue-600">
          <path d="M8.4 6.2L9.8 1.8H11.3L9.9 6.2H8.4ZM15.4 1.8L13.8 5.1L13.1 1.8H11.5L12.8 6.2H14.3L17.1 1.8H15.4ZM6.8 1.8L5.4 4.6L4.8 1.8H3.1L4.3 6.2H5.9L8.2 1.8H6.8ZM20.1 1.8H18.8L17.9 6.2H19.4L19.6 5.2H20.4L20.6 6.2H22L20.1 1.8ZM19.3 4.1H19.8L19.6 3.1L19.3 4.1Z"/>
        </svg>
      </div>
      {/* Mastercard */}
      <div className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center">
        <svg width="24" height="14" viewBox="0 0 24 14">
          <circle cx="7" cy="7" r="6" className="fill-red-500" opacity="0.8"/>
          <circle cx="17" cy="7" r="6" className="fill-yellow-400" opacity="0.8"/>
        </svg>
      </div>
      {/* American Express */}
      <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
        <span className="text-white text-xs font-bold">AMEX</span>
      </div>
      {/* Elo */}
      <div className="w-10 h-6 bg-gradient-to-r from-yellow-400 to-red-500 rounded flex items-center justify-center">
        <span className="text-white text-xs font-bold">ELO</span>
      </div>
    </div>
  );

  // Copiar código PIX
  const copyPixCode = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.qr_code_url);
      // Aqui você poderia mostrar um toast de sucesso
    }
  };

  if (success && paymentMethod === 'credit_card') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Assinatura Ativada!</h2>
          <p className="text-gray-600 mb-6">
            Parabéns! Sua assinatura foi processada com sucesso. Você receberá um email de confirmação em breve.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Próxima cobrança:</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Acessar Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Tela de PIX gerado
  if (pixData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pague com PIX</h2>
          <p className="text-gray-600 mb-6">
            Escaneie o QR Code com seu banco ou copie o código PIX
          </p>
          
          {/* QR Code simulado */}
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
              <div className="grid grid-cols-8 gap-1">
                {Array.from({length: 64}).map((_, i) => (
                  <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}></div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">Código PIX:</p>
            <div className="flex items-center justify-between bg-white p-3 rounded border">
              <span className="text-sm font-mono text-gray-700 truncate">
                {pixData.qr_code_url.substring(0, 40)}...
              </span>
              <button
                onClick={copyPixCode}
                className="ml-2 p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-600 mb-6">
            <p className="font-semibold text-gray-900 text-lg">R$ 197,00</p>
            <p>Válido até: {new Date(pixData.expires_at).toLocaleString('pt-BR')}</p>
          </div>
          
          <button 
            onClick={() => {
              setPixData(null);
              setPaymentMethod('credit_card');
            }}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Voltar para outras opções
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assine Agora</h1>
            <p className="text-gray-600">Comece sua jornada com nosso SaaS</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Resumo do Plano */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">Plano Professional</h3>
                  <p className="text-gray-600">Acesso completo à plataforma</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-3xl font-bold text-gray-900">R$ 197</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Cobrança recorrente mensal</p>
              </div>

              <div className="space-y-4">
                {[
                  'Acesso ilimitado a todas as funcionalidades',
                  'Suporte prioritário 24/7',
                  'API completa para integrações',
                  'Relatórios avançados e analytics',
                  'Backup automático diário',
                  'SSL gratuito e segurança avançada'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-800 font-medium">Garantia de 30 dias</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Cancele a qualquer momento nos primeiros 30 dias
                </p>
              </div>

              {/* Selos de Segurança */}
              <div className="mt-6 space-y-4">
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Segurança & Confiança</h4>
                  
                  {/* Primeira linha de selos */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center p-2 bg-gray-50 rounded border text-xs">
                      <Shield className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-gray-700 font-medium">SSL Seguro</span>
                    </div>
                    <div className="flex items-center p-2 bg-gray-50 rounded border text-xs">
                      <Lock className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-gray-700 font-medium">PCI Compliant</span>
                    </div>
                  </div>

                  {/* Segunda linha de selos */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center p-2 bg-green-50 rounded border border-green-200 text-xs">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-green-700 font-medium">Compra Segura</span>
                    </div>
                    <div className="flex items-center p-2 bg-green-50 rounded border border-green-200 text-xs">
                      <Shield className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-green-700 font-medium">Reembolso 100%</span>
                    </div>
                  </div>

                  {/* Bancos parceiros */}
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">Bancos Parceiros:</p>
                    <div className="flex justify-center space-x-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">Bradesco</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">Itaú</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">Santander</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário de Pagamento */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 text-gray-600 mr-2" />
                <h3 className="text-xl font-bold text-gray-900">Informações de Pagamento</h3>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Opções de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Escolha a forma de pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit_card')}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                        paymentMethod === 'credit_card'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      <span className="font-medium">Cartão</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                        paymentMethod === 'pix'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mr-2" />
                      <span className="font-medium">PIX</span>
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                      validations.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="seu@email.com"
                  />
                  {validations.email && (
                    <p className="mt-1 text-sm text-red-600">{validations.email}</p>
                  )}
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                      validations.cpf ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="000.000.000-00"
                  />
                  {validations.cpf && (
                    <p className="mt-1 text-sm text-red-600">{validations.cpf}</p>
                  )}
                </div>

                {/* Campos específicos para cartão de crédito */}
                {paymentMethod === 'credit_card' && (
                  <>
                    {/* Nome no Cartão */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome no Cartão
                      </label>
                      <input
                        type="text"
                        value={formData.cardName}
                        onChange={(e) => handleInputChange('cardName', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                          validations.cardName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Nome como está no cartão"
                      />
                      {validations.cardName && (
                        <p className="mt-1 text-sm text-red-600">{validations.cardName}</p>
                      )}
                    </div>

                    {/* Número do Cartão */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número do Cartão
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                            validations.cardNumber ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CardIcons />
                        </div>
                      </div>
                      {validations.cardNumber && (
                        <p className="mt-1 text-sm text-red-600">{validations.cardNumber}</p>
                      )}
                    </div>

                    {/* Data de Expiração e CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Expiração
                        </label>
                        <input
                          type="text"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                            validations.expiryDate ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="MM/AA"
                          maxLength={5}
                        />
                        {validations.expiryDate && (
                          <p className="mt-1 text-sm text-red-600">{validations.expiryDate}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                            validations.cvv ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="123"
                          maxLength={4}
                        />
                        {validations.cvv && (
                          <p className="mt-1 text-sm text-red-600">{validations.cvv}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Campo de Cupom */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCoupon(!showCoupon)}
                    className="flex items-center text-green-600 hover:text-green-700 transition-colors"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Tenho um cupom de desconto</span>
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCoupon && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={formData.coupon}
                        onChange={(e) => handleInputChange('coupon', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Digite seu cupom"
                      />
                    </div>
                  )}
                </div>

                {/* Botão de Pagamento */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    `${paymentMethod === 'pix' ? 'Gerar PIX' : 'Assinar Agora'} - R$ 197,00`
                  )}
                </button>

                {/* Termos e Condições */}
                <p className="text-xs text-gray-600 text-center">
                  Ao continuar, você concorda com nossos{' '}
                  <a href="#" className="text-green-600 hover:underline">Termos de Serviço</a>{' '}
                  e{' '}
                  <a href="#" className="text-green-600 hover:underline">Política de Privacidade</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaaSCheckout;
