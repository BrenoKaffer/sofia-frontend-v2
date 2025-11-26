"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Shield, Check, AlertCircle, Lock, Star, Smartphone, Copy, ChevronDown, Tag } from 'lucide-react';
import { useSofiaAuth } from '@/hooks/use-sofia-auth';
import { z } from 'zod';

// Interfaces para tipagem
interface FormData {
  email: string;
  emailConfirm: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  fullName: string;
  cpf: string;
  phone: string;
  coupon: string;
}

interface PixData {
  qr_code: string;
  qr_code_url: string;
  expires_at: string;
  pix_key?: string;
  amount?: number;
  order_id?: string;
}

interface Validations {
  [key: string]: string;
}

interface CouponData {
  code: string;
  description: string;
  discount: number;
  type: 'percentage' | 'fixed';
}

interface CouponCalculation {
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  savings_percentage: number;
}

export default function CheckoutPage() {
  // Hook de autenticação
  const { userProfile, isAuthenticated } = useSofiaAuth();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    emailConfirm: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    fullName: '',
    cpf: '',
    phone: '',
    coupon: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [showCoupon, setShowCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [processingStep, setProcessingStep] = useState('');
  const [validations, setValidations] = useState<Validations>({});
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [couponCalculation, setCouponCalculation] = useState<CouponCalculation | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Validar cupom de desconto
  const validateCoupon = async (couponCode: string) => {
    if (!couponCode.trim()) {
      setCouponData(null);
      setCouponCalculation(null);
      setCouponError('');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupon: couponCode,
          amount: 19700 // R$ 197,00 em centavos
        })
      });

      const result = await response.json();

      if (result.success) {
        setCouponData(result.coupon);
        setCouponCalculation(result.calculation);
        setCouponError('');
      } else {
        setCouponData(null);
        setCouponCalculation(null);
        setCouponError(result.error);
      }
    } catch (error) {
      setCouponError('Erro ao validar cupom');
      setCouponData(null);
      setCouponCalculation(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Debounce para validação de cupom
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.coupon) {
        validateCoupon(formData.coupon);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.coupon]);

  // Preencher dados automaticamente quando usuário estiver logado (sem sobrescrever o que o usuário digitar)
  useEffect(() => {
    if (!isAuthenticated) return;
    setFormData(prev => {
      // Se o usuário já começou a digitar, não sobrescrever
      if (prev.email || prev.cpf || prev.fullName) return prev;
      return {
        ...prev,
        email: userProfile?.email || prev.email,
        emailConfirm: userProfile?.email || prev.emailConfirm,
        cpf: userProfile?.cpf || prev.cpf,
        fullName: userProfile?.fullName || userProfile?.name || prev.fullName
        // cardName não é preenchido automaticamente para evitar problemas com abreviações
      };
    });
  }, [isAuthenticated, userProfile?.email, userProfile?.cpf]);
  const formatCardNumber = (value: string): string => {
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
  const formatExpiryDate = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Formatação de CPF
  const formatCPF = (value: string): string => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return v.substring(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Formatação de telefone brasileiro
  const formatPhone = (value: string): string => {
    const v = value.replace(/\D/g, '').substring(0, 11);
    if (v.length <= 10) {
      return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  // Validação de CPF com algoritmo dos dígitos verificadores
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  };

  // Validação de cartão de crédito usando algoritmo de Luhn
  const validateCardNumber = (cardNumber: string): boolean => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Validações com Zod
  const getSchema = () => {
    const base = z.object({
      email: z.string().email({ message: 'Email inválido' }),
      emailConfirm: z.string().email({ message: 'Confirmação inválida' }),
      fullName: z.string().min(5, { message: 'Nome completo é obrigatório' }),
      cpf: z.string().refine((v) => validateCPF(v), { message: 'CPF inválido' }),
      phone: z.string().refine((v) => v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 11, { message: 'Telefone inválido' }),
      coupon: z.string().optional().default('')
    }).refine((data) => data.email.toLowerCase() === data.emailConfirm.toLowerCase(), {
      message: 'Emails não conferem',
      path: ['emailConfirm']
    });

    if (paymentMethod === 'credit_card') {
      return base.extend({
        cardNumber: z.string().refine((v) => validateCardNumber(v), { message: 'Número do cartão inválido' }),
        expiryDate: z.string().refine((v) => {
          if (v.length < 5) return false;
          const [month, year] = v.split('/');
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear() % 100;
          const currentMonth = currentDate.getMonth() + 1;
          const expMonth = parseInt(month);
          const expYear = parseInt(year);
          if (expMonth < 1 || expMonth > 12) return false;
          if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) return false;
          return true;
        }, { message: 'Data de expiração inválida' }),
        cvv: z.string().min(3, { message: 'CVV deve ter pelo menos 3 dígitos' }),
        cardName: z.string().min(3, { message: 'Nome do titular é obrigatório' }).regex(/^[a-zA-ZÀ-ÿ\s]+$/, { message: 'Nome deve conter apenas letras' })
      });
    }
    // PIX não requer campos de cartão
    return base.extend({
      cardNumber: z.string().optional().default(''),
      expiryDate: z.string().optional().default(''),
      cvv: z.string().optional().default(''),
      cardName: z.string().optional().default('')
    });
  };

  const validateForm = () => {
    const schema = getSchema();
    const parsed = schema.safeParse(formData);
    const newValidations: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = (issue.path[0] as string) || 'form';
        newValidations[key] = issue.message;
      }
    }
    setValidations(newValidations);
    return parsed.success;
  };

  // Handler para mudanças no formulário
  const handleInputChange = (field: keyof FormData, value: string): void => {
    let formattedValue = value;

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (field === 'cardName') {
      // Permitir apenas letras, espaços e acentos
      formattedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').toUpperCase();
    } else if (field === 'email') {
      // Converter para minúsculas
      formattedValue = value.toLowerCase();
    } else if (field === 'emailConfirm') {
      formattedValue = value.toLowerCase();
    } else if (field === 'coupon') {
      // Converter para maiúsculas e remover espaços
      formattedValue = value.toUpperCase().replace(/\s/g, '');
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));

    // Limpar validação do campo quando o usuário digita
    if (validations[field]) {
      setValidations(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Simulação de integração com Pagar.me
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setProcessingStep('Validando dados...');

    try {
      // Calcular valor final considerando cupom
      const finalAmount = couponCalculation ? couponCalculation.final_amount : 19700;

      const baseData = {
        customer: {
          email: formData.email,
          document_number: formData.cpf.replace(/\D/g, ''),
          name: paymentMethod === 'credit_card' ? formData.cardName : 'Cliente PIX',
          type: 'individual'
        },
        amount: finalAmount,
        postback_url: 'https://sua-api.com/webhooks/pagarme',
        ...(couponData && { coupon: couponData.code })
      };

      if (paymentMethod === 'credit_card') {
        setProcessingStep('Processando pagamento...');
        setLoadingMessage('Validando cartão de crédito');

        const subscriptionData = {
          ...baseData,
          plan: {
            amount: finalAmount,
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

        setLoadingMessage('Criando assinatura...');
        // Chamar API real para criar assinatura
        const response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscriptionData)
        });

        const result = await response.json();

        if (result.success) {
          const status = result.status || result.order?.charges?.[0]?.status;
          if (status === 'paid') {
            setProcessingStep('Pagamento aprovado!');
            setLoadingMessage('Redirecionando...');
            // Encaminha para página de sucesso, que consulta detalhes
            window.location.href = `/checkout/success?order_id=${result.order_id}&mode=card`;
          } else {
            const msg = status === 'not_authorized' ? 'Pagamento não autorizado' : status === 'failed' ? 'Pagamento falhou' : 'Pagamento pendente';
            setError(`${msg}. Seu acesso ao dashboard será liberado somente após aprovação.`);
            setProcessingStep('');
            setLoadingMessage('');
          }
        } else {
          throw new Error(result.error || 'Erro ao processar pagamento');
        }
      } else if (paymentMethod === 'pix') {
        setProcessingStep('Gerando PIX...');
        setLoadingMessage('Criando código de pagamento');

        const pixData = {
          ...baseData,
          payment_method: 'pix',
          pix_expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
        };

        // Chamar API real para gerar PIX
        const response = await fetch('/api/create-pix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pixData)
        });

        const result = await response.json();

        if (result.success && result.qr_code_url) {
          setProcessingStep('PIX gerado com sucesso!');
          setLoadingMessage('');
          
          setTimeout(() => {
            setPixData({
              qr_code: result.qr_code_url, // URL da imagem para exibição
              qr_code_url: result.qr_code, // Código PIX oficial para copiar
              expires_at: result.expires_at,
              pix_key: result.pix_key,
              amount: result.amount,
              order_id: result.order_id
            });
          }, 1000);
        } else {
          throw new Error(result.error || 'Erro ao gerar PIX');
        }
      }

    } catch (err) {
      setError('Erro ao processar pagamento. Tente novamente.');
      setProcessingStep('');
      setLoadingMessage('');
    } finally {
      setLoading(false);
    }
  };

  // Componente para ícones de cartão (bandeiras reais)
  const CardIcons = () => (
    <div className="mt-2 flex justify-end">
      <img 
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1dzeybZgprwWRyK-12bqIACT_B4BQG6dNPQ&s" 
        alt="Bandeiras de Cartão" 
        className="h-5 w-auto"
      />
    </div>
  );

  // Copiar código PIX
  const copyPixCode = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.qr_code_url);
      // Aqui você poderia mostrar um toast de sucesso
      console.log('Código PIX copiado:', pixData.qr_code_url);
    }
  };

  // Polling de status do PIX
  useEffect(() => {
    if (!pixData?.order_id) return;
    let stopped = false;
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/create-pix?order_id=${pixData.order_id}`, { method: 'PUT' });
        const json = await res.json();
        if (json.success && json.status === 'paid') {
          if (!stopped) {
            stopped = true;
            window.location.href = `/checkout/success?order_id=${pixData.order_id}&mode=pix`;
          }
        }
      } catch (e) {
        console.warn('Falha ao verificar status PIX', e);
      }
    };
    // Checa imediatamente e a cada 10s
    checkStatus();
    const id = setInterval(checkStatus, 10000);
    return () => { stopped = true; clearInterval(id); };
  }, [pixData?.order_id]);

  if (success && paymentMethod === 'credit_card') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎉 Assinatura Ativada!</h2>
          <p className="text-gray-600 mb-6">
            Parabéns! Sua assinatura foi processada com sucesso. Você receberá um email de confirmação em breve.
          </p>
          
          {/* Mostrar informações do pagamento */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Plano:</span>
                <span className="font-medium">Professional</span>
              </div>
              <div className="flex justify-between">
                <span>Valor:</span>
                <span className="font-medium">
                  {couponCalculation ? 
                    `R$ ${(couponCalculation.final_amount / 100).toFixed(2)}/mês` : 
                    'R$ 197,00/mês'
                  }
                </span>
              </div>
              {couponData && (
                <div className="flex justify-between text-green-600">
                  <span>Cupom aplicado:</span>
                  <span className="font-medium">{couponData.code}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Próxima cobrança:</span>
                <span className="font-medium">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
            <div className="flex items-center mb-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-2">
                <Check className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm font-medium text-green-800">Investimento Inteligente!</p>
            </div>
            <p className="text-sm text-green-700">
              Não se preocupe com o valor - ele se paga em poucas operações bem-sucedidas! 
              Você agora tem acesso às melhores estratégias para multiplicar seus ganhos.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                // Simular delay de redirecionamento
                setLoadingMessage('Redirecionando para o dashboard...');
                setTimeout(() => {
                  window.location.href = '/dashboard';
                }, 1500);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              🚀 Acessar Dashboard
            </button>
            
            <button
              onClick={() => window.location.href = '/profile'}
              className="w-full bg-gray-100 text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm"
            >
              Ver detalhes da assinatura
            </button>
          </div>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pague com PIX</h2>
          <p className="text-gray-600 mb-6">
            Escaneie o QR Code com seu banco ou copie o código PIX
          </p>

          {/* QR Code real da API */}
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
              {pixData.qr_code ? (
                <img 
                  src={pixData.qr_code} 
                  alt="QR Code PIX" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <Smartphone className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Carregando QR Code...</p>
                </div>
              )}
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
            <p className="font-semibold text-gray-800 text-lg">R$ 197,00</p>
            <p>Válido até: {new Date(pixData.expires_at).toLocaleString('pt-BR')}</p>
          </div>

          {/* Botões de ação para status */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={async () => {
                if (!pixData?.order_id) return;
                try {
                  const res = await fetch(`/api/create-pix?order_id=${pixData.order_id}`, { method: 'PUT' });
                  const json = await res.json();
                  if (json.success && json.status === 'paid') {
                    window.location.href = `/checkout/success?order_id=${pixData.order_id}&mode=pix`;
                  }
                } catch {}
              }}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              Já paguei, verificar
            </button>
            <button
              onClick={() => {
                setPixData(null);
                setPaymentMethod('credit_card');
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Voltar para cartão
            </button>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Assine Agora</h1>
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
                  <h3 className="text-xl font-bold text-gray-800">Plano Professional</h3>
                  <p className="text-gray-600">Acesso completo à plataforma</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  {couponCalculation ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg text-gray-500 line-through">R$ {(couponCalculation.original_amount / 100).toFixed(2)}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          -{Math.round(couponCalculation.savings_percentage)}%
                        </span>
                      </div>
                      <span className="text-3xl font-bold text-green-600">R$ {(couponCalculation.final_amount / 100).toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-gray-800">R$ 197</span>
                  )}
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
                    <div className="flex items-center p-2 bg-green-50 rounded border border-green-200 text-xs">
                      <Shield className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-green-700 font-medium">SSL Seguro</span>
                    </div>
                    <div className="flex items-center p-2 bg-green-50 rounded border border-green-200 text-xs">
                      <Lock className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-green-700 font-medium">PCI Compliant</span>
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
                <h3 className="text-xl font-bold text-gray-800">Informações de Pagamento</h3>
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
                      className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${paymentMethod === 'credit_card'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      <span className="font-medium">Cartão</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${paymentMethod === 'pix'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                    >
                      <Smartphone className="w-5 h-5 mr-2" />
                      <span className="font-medium">PIX</span>
                    </button>
                  </div>
                </div>

                {/* Nome completo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${validations.fullName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="Seu nome completo"
                  />
                  {validations.fullName && (
                    <p className="mt-1 text-sm text-red-600">{validations.fullName}</p>
                  )}
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
                    className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${validations.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="seu@email.com"
                  />
                  {validations.email && (
                    <p className="mt-1 text-sm text-red-600">{validations.email}</p>
                  )}
                </div>

                {/* Confirmar Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Email
                  </label>
                  <input
                    type="email"
                    value={formData.emailConfirm}
                    onChange={(e) => handleInputChange('emailConfirm', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${validations.emailConfirm ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="repita seu@email.com"
                  />
                  {validations.emailConfirm && (
                    <p className="mt-1 text-sm text-red-600">{validations.emailConfirm}</p>
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
                    className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${validations.cpf ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="000.000.000-00"
                  />
                  {validations.cpf && (
                    <p className="mt-1 text-sm text-red-600">{validations.cpf}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${validations.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="(11) 99999-9999"
                  />
                  {validations.phone && (
                    <p className="mt-1 text-sm text-red-600">{validations.phone}</p>
                  )}
                </div>

                {/* Campo de Cupom */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCoupon(!showCoupon)}
                    className="flex items-center text-green-600 hover:text-green-700 font-medium mb-2"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Tenho um cupom de desconto
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
                  </button>

                  {showCoupon && (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.coupon}
                          onChange={(e) => handleInputChange('coupon', e.target.value.toUpperCase())}
                          className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${
                            couponError ? 'border-red-300' : couponData ? 'border-green-300' : 'border-gray-300'
                          }`}
                          placeholder="Digite seu código do cupom"
                        />
                        {couponLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          </div>
                        )}
                      </div>

                      {/* Feedback do cupom */}
                      {couponError && (
                        <div className="flex items-center text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {couponError}
                        </div>
                      )}

                      {couponData && couponCalculation && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center text-green-700 text-sm font-medium mb-2">
                            <Check className="w-4 h-4 mr-2" />
                            Cupom "{couponData.code}" aplicado!
                          </div>
                          <div className="text-sm text-green-600">
                            <p>{couponData.description}</p>
                            <div className="flex justify-between mt-2">
                              <span>Desconto:</span>
                              <span className="font-medium">
                                {couponData.type === 'percentage' 
                                  ? `${couponData.discount}%` 
                                  : `R$ ${(couponData.discount / 100).toFixed(2)}`
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Valor original:</span>
                              <span>R$ {(couponCalculation.original_amount / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-medium text-green-700">
                              <span>Valor final:</span>
                              <span>R$ {(couponCalculation.final_amount / 100).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Campos específicos para cartão de crédito */}
                {paymentMethod === 'credit_card' && (
                  <>
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
                          className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${validations.cardNumber ? 'border-red-300' : 'border-gray-300'
                            }`}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                        />
                      </div>
                      <CardIcons />
                      {validations.cardNumber && (
                        <p className="mt-1 text-sm text-red-600">{validations.cardNumber}</p>
                      )}
                    </div>

                    {/* Nome no Cartão */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome no Cartão
                      </label>
                      <input
                        type="text"
                        value={formData.cardName}
                        onChange={(e) => handleInputChange('cardName', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${validations.cardName ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Nome como aparece no cartão"
                      />
                      {validations.cardName && (
                        <p className="mt-1 text-sm text-red-600">{validations.cardName}</p>
                      )}
                    </div>

                    {/* Data de Expiração e CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiração
                        </label>
                        <input
                          type="text"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${validations.expiryDate ? 'border-red-300' : 'border-gray-300'
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
                          className={`w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${validations.cvv ? 'border-red-300' : 'border-gray-300'
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

                {/* Botão de Pagamento */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {processingStep || 'Processando...'}
                      </div>
                      {loadingMessage && (
                        <span className="text-sm opacity-80">{loadingMessage}</span>
                      )}
                    </div>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      {paymentMethod === 'credit_card' ? 'Confirmar Assinatura' : 'Gerar PIX'} - 
                      {couponCalculation ? 
                        ` R$ ${(couponCalculation.final_amount / 100).toFixed(2)}/mês` : 
                        ' R$ 197/mês'
                      }
                    </>
                  )}
                </button>

                {/* Informações de Segurança */}
                 <div className="text-center text-sm text-gray-600">
                   <div className="flex items-center justify-center mb-2">
                     <Shield className="w-4 h-4 text-green-600 mr-1" />
                     <span>Pagamento seguro e criptografado</span>
                   </div>
                   <p>
                     Ao continuar, você concorda com nossos{' '}
                     <a href="#" className="text-green-600 hover:underline">
                       Termos de Serviço
                     </a>
                   </p>
                 </div>
               </div>
             </div>
           </div>
           
           {/* Rodapé com logo da Pagar.me */}
           <div className="mt-12 border-t border-gray-200 pt-8">
             <div className="max-w-4xl mx-auto text-center">
               <div className="flex flex-col items-center space-y-4">
                 <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>Powered by</span>
                    <img
                      src="https://assets.decocache.com/payme/ab015445-0855-45b7-9abb-0df413196ca2/pagarme-logo-main.svg"
                      alt="Pagar.me"
                      className="h-4 w-auto"
                    />
                  </div>
                 <div className="flex items-center space-x-4 text-xs text-gray-500">
                   <a href="#" className="hover:text-gray-700 transition-colors">Legal</a>
                   <span>|</span>
                   <a href="#" className="hover:text-gray-700 transition-colors">Returns</a>
                   <span>|</span>
                   <a href="#" className="hover:text-gray-700 transition-colors">Contact</a>
                 </div>
                 <p className="text-xs text-gray-500">
                   © 2025 Umbrella Tecnologia. - Todos os direitos reservados.
                 </p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
}