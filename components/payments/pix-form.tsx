'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Copy, CheckCircle, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface PixFormProps {
  amount: number;
  onSubmit: (paymentData: any) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PixForm({ amount, onSubmit, loading = false, disabled = false }: PixFormProps) {
  const [pixData, setPixData] = useState<{
    qrCode?: string;
    qrCodeText?: string;
    expiresAt?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pixData?.expiresAt && timeLeft !== null) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(pixData.expiresAt!).getTime();
        const difference = expiry - now;
        
        if (difference > 0) {
          setTimeLeft(Math.floor(difference / 1000));
        } else {
          setTimeLeft(0);
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pixData?.expiresAt, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleGeneratePix = async () => {
    const paymentData = {
      payment_method: 'pix',
      pix: {
        expires_in: 3600, // 1 hora
      },
      amount: amount,
    };

    onSubmit(paymentData);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar código PIX');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGeneratePix();
  };

  if (pixData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <QrCode className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">PIX Gerado com Sucesso!</h3>
              </div>
              
              {timeLeft !== null && timeLeft > 0 && (
                <div className="flex items-center justify-center space-x-2 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Expira em: {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {pixData.qrCode && (
                <div className="flex justify-center">
                  <img 
                    src={`data:image/png;base64,${pixData.qrCode}`}
                    alt="QR Code PIX"
                    className="w-64 h-64 border rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code com seu app do banco ou copie o código abaixo:
                </p>
                
                {pixData.qrCodeText && (
                  <div className="relative">
                    <div className="p-3 bg-gray-50 rounded-lg border text-xs font-mono break-all">
                      {pixData.qrCodeText}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(pixData.qrCodeText!)}
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold">
                  Valor: R$ {(amount / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h4 className="font-medium">Como pagar com PIX:</h4>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
              <span>Abra o app do seu banco ou carteira digital</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
              <span>Escolha a opção PIX e "Ler QR Code" ou "PIX Copia e Cola"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
              <span>Escaneie o QR Code ou cole o código copiado</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
              <span>Confirme o pagamento no seu app</span>
            </li>
          </ol>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>🔒 Pagamento processado de forma segura via Pagar.me</p>
          <p>Você receberá a confirmação por email assim que o pagamento for aprovado</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <QrCode className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold">Pagamento via PIX</h3>
            </div>
            
            <p className="text-muted-foreground">
              Pague de forma rápida e segura com PIX
            </p>

            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                R$ {(amount / 100).toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-left">Vantagens do PIX:</h4>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Pagamento instantâneo</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Disponível 24h por dia, 7 dias por semana</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Sem taxas adicionais</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Confirmação imediata</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || disabled}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando PIX...
          </>
        ) : (
          <>
            <QrCode className="w-4 h-4 mr-2" />
            Gerar PIX
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground text-center">
        <p>🔒 Transação segura processada via Pagar.me</p>
      </div>
    </form>
  );
}