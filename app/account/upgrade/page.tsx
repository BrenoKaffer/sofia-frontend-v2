'use client';

import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Zap, Shield, BarChart3, Clock, Users, Smartphone } from 'lucide-react';
import { useCurrentUserStatus } from '@/hooks/useUserStatus';
import { useRouter } from 'next/navigation';

export default function AccountUpgradePage() {
  const { status } = useCurrentUserStatus();
  const router = useRouter();

  const isPremium = !!status?.isPremium;

  const handleUpgrade = () => {
    window.location.href = 'https://pay.v1sofia.com/?plan=premium&price_id=sofia-premium-mensal';
  };

  const features = [
    { name: 'Sinais ilimitados', free: true, premium: true },
    { name: 'Estratégias avançadas', free: false, premium: true },
    { name: 'Insights avançados (PRO)', free: false, premium: true },
    { name: 'Histórico completo', free: 'Limitado', premium: true },
    { name: 'Prioridade na Fila de Execução', free: false, premium: true },
    { name: 'Dashboard completo', free: true, premium: true },
    { name: 'Sem anúncios', free: false, premium: true },
    { name: 'Suporte Premium', free: false, premium: true },
  ];

  const benefits = [
    { icon: <Zap className="w-5 h-5" />, title: 'Processamento em tempo real' },
    { icon: <Shield className="w-5 h-5" />, title: 'Segurança avançada' },
    { icon: <Clock className="w-5 h-5" />, title: 'Acesso ilimitado' },
    { icon: <BarChart3 className="w-5 h-5" />, title: 'Analytics profissional' },
    { icon: <Users className="w-5 h-5" />, title: 'Suporte priorizado' },
    { icon: <Smartphone className="w-5 h-5" />, title: 'Multi-plataforma' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos e Preços</h1>
          <p className="text-muted-foreground">
            Escolha o plano que melhor se adapta à sua jornada dentro da Sofia.
          </p>
        </div>

        {/* Current Plan Status */}
        {isPremium && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-green-600" />
                <CardTitle className="text-green-800">Plano Premium Ativo</CardTitle>
              </div>
              <CardDescription className="text-green-700">
                Você tem acesso completo a todos os recursos premium
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className={isPremium ? 'opacity-60' : 'border-green-200'}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Plano Gratuito</CardTitle>
                {!isPremium && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Usando agora
                  </Badge>
                )}
              </div>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">R$0</span>
                <span className="text-muted-foreground ml-1">/mês</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant={isPremium ? "outline" : "default"}
                disabled={!isPremium}
                onClick={() => !isPremium && router.push('/dashboard')}
              >
                {isPremium ? 'Plano Atual' : 'Usando agora'}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className={isPremium ? 'border-purple-200 bg-purple-50/50' : 'relative'}>
            {!isPremium && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 hover:bg-purple-600">
                  <Crown className="w-3 h-3 mr-1" />
                  Recomendado
                </Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                Plano Premium
              </CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">R$29,90</span>
                <span className="text-muted-foreground ml-1">/mês</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleUpgrade}
                disabled={isPremium}
              >
                {isPremium ? 'Plano Ativo' : 'Ativar Premium'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="text-purple-600">{benefit.icon}</div>
              <span className="text-sm font-medium">{benefit.title}</span>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <span className="text-sm font-medium">{feature.name}</span>
                  <div className="flex items-center gap-4">
                    {/* Free Plan */}
                    <div className="w-16 text-center">
                      {feature.free === true ? (
                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                      ) : feature.free === false ? (
                        <X className="w-4 h-4 text-gray-400 mx-auto" />
                      ) : (
                        <span className="text-xs text-gray-500">{feature.free}</span>
                      )}
                    </div>
                    {/* Premium Plan */}
                    <div className="w-16 text-center">
                      {feature.premium === true ? (
                        <Check className="w-4 h-4 text-purple-600 mx-auto" />
                      ) : feature.premium === false ? (
                        <X className="w-4 h-4 text-gray-400 mx-auto" />
                      ) : (
                        <span className="text-xs text-purple-600">{feature.premium}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t">
              <span className="text-sm font-semibold">Plano</span>
              <div className="flex gap-4">
                <span className="w-16 text-center text-sm font-semibold">Gratuito</span>
                <span className="w-16 text-center text-sm font-semibold text-purple-600">Premium</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Como funciona o upgrade?</h4>
              <p className="text-sm text-muted-foreground">
                O upgrade é instantâneo. Após a confirmação do pagamento, você terá acesso imediato a todos os recursos premium.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Posso cancelar quando quiser?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Você pode cancelar a qualquer momento sem taxas. O acesso continua até o final do período pago.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Qual é a garantia?</h4>
              <p className="text-sm text-muted-foreground">
                Oferecemos garantia de 30 dias. Se não estiver satisfeito, devolvemos 100% do seu dinheiro.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        {!isPremium && (
          <Card className="bg-gradient-to-r from-[#8A3FF5] to-[#E53B78] text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Desbloqueie todo o poder do Sofia Premium</h3>
                  <p className="text-purple-100">R$ 29,90/mês — Cancelamento imediato.</p>
                </div>
                <Button
                  className="bg-white text-[#8A3FF5] hover:bg-gray-100"
                  onClick={handleUpgrade}
                >
                  Ativar Premium
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
