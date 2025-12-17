'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LiveChat } from '@/components/chat/live-chat';
import { Search, Play, BookOpen, MessageSquare, HelpCircle, Video, FileText, Lightbulb, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';

const faqs = [
  {
    question: 'Como interpretar os padrões gerados pela SOFIA?',
    answer: 'Os padrões da SOFIA indicam oportunidades de apostas baseadas em análises estatísticas. Cada padrão inclui: (1) A estratégia que o gerou, (2) Os números sugeridos para apostar, (3) O tempo estimado para realizar a aposta, e (4) A roleta recomendada. Para melhores resultados, siga exatamente as recomendações de timing e valores.'
  },
  {
    question: 'Como ativar uma estratégia?',
    answer: 'Para ativar uma estratégia, acesse a seção "Estratégias" no menu lateral, selecione a estratégia desejada e clique no botão de toggle para ativá-la. Você também pode personalizar parâmetros como valores de aposta e limites de perda/ganho antes de ativar.'
  },
  {
    question: 'Qual a diferença entre as estratégias disponíveis?',
    answer: 'A SOFIA oferece diferentes tipos de estratégias: (1) Baseadas em sequências numéricas, (2) Baseadas em cores, (3) Baseadas em padrões estatísticos, e (4) Estratégias híbridas. Cada uma tem diferentes taxas de assertividade e frequência de padrões. Recomendamos testar diferentes estratégias no Simulador antes de utilizá-las com apostas reais.'
  },
  {
    question: 'Como funciona o sistema de monitoramento de roletas?',
    answer: 'O sistema monitora continuamente as roletas selecionadas, analisando os resultados em tempo real. Quando um padrão correspondente a uma estratégia ativa é identificado, um padrão é gerado. Você pode escolher quais roletas monitorar na seção "Status das Roletas", clicando no botão "Monitorar" em cada roleta.'
  },
  {
    question: 'Como interpretar os gráficos de análise?',
    answer: 'Os gráficos na seção "Relatórios e Análises" mostram o desempenho histórico das estratégias. A linha de assertividade mostra a porcentagem de acertos ao longo do tempo. O gráfico de ROI por roleta indica quais roletas têm sido mais lucrativas. O gráfico de distribuição mostra a proporção entre acertos e erros.'
  },
  {
    question: 'Como exportar meus resultados?',
    answer: 'Você pode exportar seus resultados em formato CSV na seção "Histórico de Padrões", clicando no botão "Exportar para CSV". Também é possível exportar relatórios completos na seção "Relatórios e Análises", incluindo gráficos e estatísticas detalhadas.'
  },
  {
    question: 'O que significa a "Assertividade Global"?',
    answer: 'A Assertividade Global é a porcentagem de padrões que resultaram em acertos em relação ao total de padrões gerados. Por exemplo, uma assertividade de 70% significa que 7 em cada 10 padrões resultaram em acertos. Este é um indicador importante da eficácia das estratégias ativas.'
  },
  {
    question: 'Como usar o Simulador de Estratégias?',
    answer: 'O Simulador permite testar estratégias com dados históricos antes de usá-las em apostas reais. Configure os parâmetros da estratégia (números alvo, progressão de apostas, etc.), clique em "Executar Simulação" e analise os resultados. Isso ajuda a identificar as estratégias mais promissoras sem risco financeiro.'
  },
  {
    question: 'Posso usar a SOFIA em múltiplos dispositivos?',
    answer: 'Sim, a SOFIA é uma plataforma baseada em web e pode ser acessada de qualquer dispositivo com um navegador moderno. Seu perfil, configurações e histórico são sincronizados automaticamente entre todos os dispositivos que você utilizar.'
  },
  {
    question: 'Como funciona a integração com a Lastlink?',
    answer: 'A integração com a Lastlink permite verificar a autenticidade da sua assinatura e desbloquear recursos premium. Para configurar, acesse a seção "Configurações > Integrações" e siga as instruções para vincular sua conta Lastlink à SOFIA.'
  },
];

const tutorials = [
  {
    title: 'Introdução à SOFIA',
    description: 'Conheça as principais funcionalidades da plataforma',
    duration: '3:45',
    thumbnail: '/thumbnails/intro.jpg',
    level: 'Iniciante'
  },
  {
    title: 'Configurando sua primeira estratégia',
    description: 'Aprenda a configurar e ativar estratégias eficientes',
    duration: '5:12',
    thumbnail: '/thumbnails/strategy.jpg',
    level: 'Iniciante'
  },
  {
    title: 'Interpretando padrões e resultados',
    description: 'Como entender e agir com base nos padrões gerados',
    duration: '4:30',
    thumbnail: '/thumbnails/signals.jpg',
    level: 'Intermediário'
  },
  {
    title: 'Análise avançada de padrões',
    description: 'Técnicas avançadas para identificar padrões lucrativos',
    duration: '7:18',
    thumbnail: '/thumbnails/patterns.jpg',
    level: 'Avançado'
  },
  {
    title: 'Gerenciamento de banca eficiente',
    description: 'Estratégias para maximizar ganhos e minimizar perdas',
    duration: '6:45',
    thumbnail: '/thumbnails/bankroll.jpg',
    level: 'Intermediário'
  },
  {
    title: 'Usando o Simulador para otimização',
    description: 'Como testar e refinar estratégias no simulador',
    duration: '5:50',
    thumbnail: '/thumbnails/simulator.jpg',
    level: 'Intermediário'
  },
];

const guides = [
  {
    title: 'Guia do Iniciante',
    description: 'Primeiros passos com a plataforma SOFIA',
    icon: BookOpen,
    color: 'bg-blue-500'
  },
  {
    title: 'Estratégias Recomendadas',
    description: 'As melhores estratégias para começar',
    icon: Lightbulb,
    color: 'bg-yellow-500'
  },
  {
    title: 'Glossário de Termos',
    description: 'Entenda os termos técnicos utilizados',
    icon: FileText,
    color: 'bg-purple-500'
  },
  {
    title: 'Melhores Práticas',
    description: 'Dicas para maximizar seus resultados',
    icon: HelpCircle,
    color: 'bg-green-500'
  },
];

const onboardingSteps = [
  {
    title: 'Bem-vindo à SOFIA',
    description: 'Conheça a plataforma que vai transformar sua experiência com roletas online',
    action: 'Próximo'
  },
  {
    title: 'Dashboard Principal',
    description: 'Aqui você encontra os padrões ativos, estatísticas de desempenho e acesso rápido às principais funcionalidades',
    action: 'Próximo'
  },
  {
    title: 'Estratégias',
    description: 'Explore e ative diferentes estratégias baseadas em análises estatísticas avançadas',
    action: 'Próximo'
  },
  {
    title: 'Monitoramento de Roletas',
    description: 'Acompanhe em tempo real os resultados das roletas e identifique padrões favoráveis',
    action: 'Próximo'
  },
  {
    title: 'Simulador',
    description: 'Teste suas estratégias com dados históricos antes de aplicá-las em apostas reais',
    action: 'Próximo'
  },
  {
    title: 'Relatórios e Análises',
    description: 'Visualize seu desempenho através de gráficos interativos e métricas detalhadas',
    action: 'Concluir'
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startOnboarding = () => {
    setShowOnboarding(true);
    setCurrentOnboardingStep(0);
  };

  const nextOnboardingStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1);
    } else {
      setShowOnboarding(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight font-urbanist">Central de Ajuda</h1>
          <div className="flex gap-2">
            <Button onClick={startOnboarding} variant="outline" className="gap-2">
              <Play className="h-4 w-4" />
              Tour Rápido
            </Button>
            <Button onClick={() => window.location.href = '/onboarding'} className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              <Sparkles className="h-4 w-4" />
              Onboarding Completo
            </Button>
          </div>
        </div>

        {showOnboarding && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary">
                  <span className="text-2xl font-bold">{currentOnboardingStep + 1}</span>
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h2 className="text-2xl font-bold font-urbanist">{onboardingSteps[currentOnboardingStep].title}</h2>
                  <p className="text-muted-foreground font-plus-jakarta">
                    {onboardingSteps[currentOnboardingStep].description}
                  </p>
                </div>
                <Button onClick={nextOnboardingStep} className="font-plus-jakarta">
                  {onboardingSteps[currentOnboardingStep].action}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar na Central de Ajuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-plus-jakarta"
          />
        </div>

        <Tabs defaultValue="faq">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq" className="gap-2 font-plus-jakarta">
              <MessageSquare className="h-4 w-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="gap-2 font-plus-jakarta">
              <Video className="h-4 w-4" />
              Tutoriais
            </TabsTrigger>
            <TabsTrigger value="guides" className="gap-2 font-plus-jakarta">
              <BookOpen className="h-4 w-4" />
              Guias
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2 font-plus-jakarta">
              <HelpCircle className="h-4 w-4" />
              Suporte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-urbanist">Perguntas Frequentes</CardTitle>
                <CardDescription className="font-plus-jakarta">
                  Respostas para as dúvidas mais comuns sobre a plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left font-plus-jakarta">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground font-plus-jakarta">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))
                  ) : (
                    <div className="py-4 text-center text-muted-foreground font-plus-jakarta">
                      Nenhum resultado encontrado para &quot;{searchQuery}&quot;
                    </div>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutorials" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-urbanist">Vídeos Tutoriais</CardTitle>
                <CardDescription className="font-plus-jakarta">
                  Aprenda a utilizar a plataforma com nossos vídeos explicativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tutorials.map((tutorial, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="relative aspect-video bg-muted">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="h-12 w-12 text-primary opacity-80" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-plus-jakarta">
                          {tutorial.duration}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium font-urbanist">{tutorial.title}</h3>
                            <Badge variant="outline" className="font-plus-jakarta">{tutorial.level}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-plus-jakarta">
                            {tutorial.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guides" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guides.map((guide, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className={`${guide.color} p-6 flex items-center justify-center`}>
                        <guide.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium text-lg font-urbanist">{guide.title}</h3>
                          <p className="text-sm text-muted-foreground font-plus-jakarta">
                            {guide.description}
                          </p>
                        </div>
                        <Button variant="ghost" className="self-start mt-4 gap-2 font-plus-jakarta">
                          Ler Guia
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-urbanist">Documentação Completa</CardTitle>
                <CardDescription className="font-plus-jakarta">
                  Acesse nossa documentação detalhada sobre todas as funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['Estratégias', 'Análise de Dados', 'Gerenciamento de Banca', 'Configurações Avançadas', 'API e Integrações', 'Glossário'].map((topic, index) => (
                    <Button key={index} variant="outline" className="h-auto py-4 px-6 justify-start gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-medium font-urbanist">{topic}</div>
                        <div className="text-xs text-muted-foreground font-plus-jakarta">Documentação detalhada</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-urbanist">Chat com IA</CardTitle>
                  <CardDescription className="font-plus-jakarta">
                    Tire suas dúvidas com nosso assistente virtual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <Avatar className="h-16 w-16 mx-auto mb-4">
                        <AvatarImage src="/sofia-avatar.png" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">IA</AvatarFallback>
                      </Avatar>
                      <h3 className="font-medium font-urbanist mb-2">Assistente Virtual SOFIA</h3>
                      <p className="text-sm text-muted-foreground font-plus-jakarta mb-4">
                        Disponível 24/7 para ajudar com suas dúvidas sobre estratégias, padrões e funcionalidades da plataforma.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setIsChatOpen(true)}
                      className="font-plus-jakarta"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Iniciar Conversa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-urbanist">Suporte Técnico</CardTitle>
                  <CardDescription className="font-plus-jakarta">
                    Entre em contato com nossa equipe de suporte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium font-urbanist">Canais de Atendimento</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium font-plus-jakarta">Chat ao Vivo</div>
                          <div className="text-sm text-muted-foreground font-plus-jakarta">Disponível 24/7</div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="ml-auto font-plus-jakarta"
                          onClick={() => setIsChatOpen(true)}
                        >
                          Iniciar Chat
                        </Button>
                      </div>

                      <Separator />

                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium font-plus-jakarta">Ticket de Suporte</div>
                          <div className="text-sm text-muted-foreground font-plus-jakarta">Resposta em até 24h</div>
                        </div>
                        <Button variant="outline" className="ml-auto font-plus-jakarta">
                          Abrir Ticket
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium font-urbanist">Recursos Adicionais</h3>
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full justify-start gap-2 font-plus-jakarta">
                        <ExternalLink className="h-4 w-4" />
                        Fórum da Comunidade
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2 font-plus-jakarta">
                        <ExternalLink className="h-4 w-4" />
                        Base de Conhecimento
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-2 font-plus-jakarta">
                        <ExternalLink className="h-4 w-4" />
                        Tutoriais em Vídeo
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 flex justify-between">
                  <div className="text-sm text-muted-foreground font-plus-jakarta">
                    Tempo médio de resposta: <span className="font-medium">15 minutos</span>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-plus-jakarta">
                    Online
                  </Badge>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <LiveChat 
          isOpen={isChatOpen} 
          minimized={isChatMinimized}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          onMinimize={() => setIsChatMinimized(!isChatMinimized)}
        />
    </DashboardLayout>
  );
}