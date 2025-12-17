'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Download, Calendar, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BoletoFormProps {
  amount: number;
  onSubmit: (paymentData: any) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function BoletoForm({ amount, onSubmit, loading = false, disabled = false }: BoletoFormProps) {
  const [boletoData, setBoletoData] = useState<{
    url?: string;
    barcode?: string;
    dueDate?: string;
    nossoNumero?: string;
  } | null>(null);

  const handleGenerateBoleto = async () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // Vencimento em 3 dias

    const paymentData = {
      payment_method: 'boleto',
      boleto: {
        instructions: 'Pagamento referente à compra na SOFIA',
        due_at: dueDate.toISOString(),
      },
      amount: amount,
    };

    onSubmit(paymentData);
  };

  const handleDownloadBoleto = () => {
    if (boletoData?.url) {
      window.open(boletoData.url, '_blank');
    }
  };

  const copyBarcode = async () => {
    if (boletoData?.barcode) {
      try {
        await navigator.clipboard.writeText(boletoData.barcode);
        toast.success('Código de barras copiado!');
      } catch (err) {
        toast.error('Erro ao copiar código de barras');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateBoleto();
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (boletoData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold">Boleto Gerado com Sucesso!</h3>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    R$ {(amount / 100).toFixed(2)}
                  </p>
                  {boletoData.dueDate && (
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {formatDueDate(boletoData.dueDate)}
                    </p>
                  )}
                </div>

                {boletoData.nossoNumero && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Nosso Número: {boletoData.nossoNumero}
                    </p>
                  </div>
                )}

                <div className="flex flex-col space-y-3">
                  {boletoData.url && (
                    <Button
                      onClick={handleDownloadBoleto}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Boleto (PDF)
                    </Button>
                  )}

                  {boletoData.barcode && (
                    <Button
                      variant="outline"
                      onClick={copyBarcode}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Copiar Código de Barras
                    </Button>
                  )}
                </div>

                {boletoData.barcode && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Código de Barras:</p>
                    <div className="p-3 bg-gray-50 rounded-lg border text-xs font-mono break-all">
                      {boletoData.barcode}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h4 className="font-medium">Instruções de Pagamento</h4>
              </div>

              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <span>Baixe o boleto clicando no botão "Baixar Boleto (PDF)" acima</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <span>Pague em qualquer banco, casa lotérica ou pelo internet banking</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <span>Você também pode usar o código de barras para pagamento via app do banco</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                  <span>O pagamento será confirmado em até 2 dias úteis após a compensação</span>
                </li>
              </ol>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Atenção ao prazo de vencimento</p>
                    <p className="text-yellow-700">
                      Boletos vencidos não serão aceitos. Em caso de vencimento, 
                      será necessário gerar um novo boleto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center">
          <p>🔒 Boleto processado de forma segura via Pagar.me</p>
          <p>Você receberá a confirmação por email assim que o pagamento for compensado</p>
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
              <FileText className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold">Pagamento via Boleto</h3>
            </div>
            
            <p className="text-muted-foreground">
              Pague em qualquer banco, casa lotérica ou internet banking
            </p>

            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                R$ {(amount / 100).toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-left">Informações do Boleto:</h4>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Vencimento em 3 dias úteis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Sem taxas adicionais</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Confirmação em até 2 dias úteis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Pagamento em qualquer banco</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-left">
                  <p className="font-medium text-blue-800">Como funciona:</p>
                  <p className="text-blue-700">
                    Após gerar o boleto, você poderá baixá-lo em PDF ou copiar o código de barras 
                    para pagamento via app do banco.
                  </p>
                </div>
              </div>
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
            Gerando Boleto...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            Gerar Boleto
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground text-center">
        <p>🔒 Transação segura processada via Pagar.me</p>
      </div>
    </form>
  );
}