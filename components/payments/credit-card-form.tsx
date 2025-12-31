'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Loader2 } from 'lucide-react';

interface CreditCardFormProps {
  amount: number;
  onSubmit: (paymentData: any) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function CreditCardForm({ amount, onSubmit, loading = false, disabled = false }: CreditCardFormProps) {
  const [cardData, setCardData] = useState({
    number: '',
    holderName: '',
    expMonth: '',
    expYear: '',
    cvv: '',
    installments: '1',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardData(prev => ({ ...prev, number: formatted }));
      if (errors.number) {
        setErrors(prev => ({ ...prev, number: '' }));
      }
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.length <= 5) {
      const [month, year] = formatted.split('/');
      setCardData(prev => ({ 
        ...prev, 
        expMonth: month || '',
        expYear: year || ''
      }));
      if (errors.expiry) {
        setErrors(prev => ({ ...prev, expiry: '' }));
      }
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setCardData(prev => ({ ...prev, cvv: value }));
      if (errors.cvv) {
        setErrors(prev => ({ ...prev, cvv: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!cardData.number || cardData.number.replace(/\s/g, '').length < 13) {
      newErrors.number = 'Número do cartão inválido';
    }

    if (!cardData.holderName || cardData.holderName.length < 2) {
      newErrors.holderName = 'Nome do portador é obrigatório';
    }

    if (!cardData.expMonth || !cardData.expYear) {
      newErrors.expiry = 'Data de validade é obrigatória';
    } else {
      const month = parseInt(cardData.expMonth);
      const year = parseInt(cardData.expYear);
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;

      if (month < 1 || month > 12) {
        newErrors.expiry = 'Mês inválido';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiry = 'Cartão expirado';
      }
    }

    if (!cardData.cvv || cardData.cvv.length < 3) {
      newErrors.cvv = 'CVV inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const paymentData = {
      payment_method: 'credit_card',
      credit_card: {
        installments: parseInt(cardData.installments),
        statement_descriptor: 'SOFIA',
        card: {
          number: cardData.number.replace(/\s/g, ''),
          holder_name: cardData.holderName,
          exp_month: parseInt(cardData.expMonth),
          exp_year: parseInt(`20${cardData.expYear}`),
          cvv: cardData.cvv,
        },
      },
      amount: amount,
    };

    onSubmit(paymentData);
  };

  const getInstallmentOptions = () => {
    const maxInstallments = Math.min(12, Math.floor(amount / 500)); // Mínimo R$ 5,00 por parcela
    const options = [];
    
    for (let i = 1; i <= maxInstallments; i++) {
      const installmentAmount = amount / i;
      options.push({
        value: i.toString(),
        label: i === 1 
          ? `À vista - R$ ${(amount / 100).toFixed(2)}`
          : `${i}x de R$ ${(installmentAmount / 100).toFixed(2)}`
      });
    }
    
    return options;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="cardNumber">Número do Cartão *</Label>
          <Input
            id="cardNumber"
            value={cardData.number}
            onChange={handleCardNumberChange}
            placeholder="0000 0000 0000 0000"
            className={errors.number ? 'border-red-500' : ''}
          />
          {errors.number && (
            <p className="text-sm text-red-500 mt-1">{errors.number}</p>
          )}
        </div>

        <div>
          <Label htmlFor="holderName">Nome do Portador *</Label>
          <Input
            id="holderName"
            value={cardData.holderName}
            onChange={(e) => {
              setCardData(prev => ({ ...prev, holderName: e.target.value.toUpperCase() }));
              if (errors.holderName) {
                setErrors(prev => ({ ...prev, holderName: '' }));
              }
            }}
            placeholder="NOME COMO NO CARTÃO"
            className={errors.holderName ? 'border-red-500' : ''}
          />
          {errors.holderName && (
            <p className="text-sm text-red-500 mt-1">{errors.holderName}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expiry">Validade *</Label>
            <Input
              id="expiry"
              value={cardData.expMonth && cardData.expYear ? `${cardData.expMonth}/${cardData.expYear}` : ''}
              onChange={handleExpiryChange}
              placeholder="MM/AA"
              maxLength={5}
              className={errors.expiry ? 'border-red-500' : ''}
            />
            {errors.expiry && (
              <p className="text-sm text-red-500 mt-1">{errors.expiry}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cvv">CVV *</Label>
            <Input
              id="cvv"
              value={cardData.cvv}
              onChange={handleCvvChange}
              placeholder="123"
              maxLength={4}
              className={errors.cvv ? 'border-red-500' : ''}
            />
            {errors.cvv && (
              <p className="text-sm text-red-500 mt-1">{errors.cvv}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="installments">Parcelas</Label>
          <Select
            value={cardData.installments}
            onValueChange={(value) => setCardData(prev => ({ ...prev, installments: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione as parcelas" />
            </SelectTrigger>
            <SelectContent>
              {getInstallmentOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || disabled}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pagar R$ {(amount / 100).toFixed(2)}
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground text-center">
        <p>🔒 Seus dados estão protegidos com criptografia SSL</p>
        <p>Processamento seguro via Pagar.me</p>
      </div>
    </form>
  );
}