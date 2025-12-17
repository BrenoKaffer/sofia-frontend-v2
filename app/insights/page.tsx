'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Clock, ShieldCheck, TrendingUp, Zap, Play, Info, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Mock data as requested
const insights = [
  {
    id: "aprendizado-01",
    title: "Leitura Avançada de Terminais",
    subtitle: "Como identificar desequilíbrios antes do mercado reagir. Uma análise profunda dos indicadores ocultos.",
    duration: "18 min",
    locked: true,
    badge: "Especialista",
    category: "Análise Técnica",
    image: "from-emerald-900 to-zinc-900"
  },
  {
    id: "aprendizado-02",
    title: "O Padrão Fantasma",
    subtitle: "Detectando tendências que as ferramentas comuns ignoram. Aprenda a ver o invisível.",
    duration: "24 min",
    locked: true,
    badge: "Análise Profissional",
    category: "Estratégia",
    image: "from-purple-900 to-zinc-900"
  },
  {
    id: "aprendizado-03",
    title: "Gestão de Banca Dinâmica",
    subtitle: "Ajustando sua exposição baseada na volatilidade da mesa. Proteja seu capital.",
    duration: "15 min",
    locked: true,
    badge: "Especialista",
    category: "Gestão",
    image: "from-blue-900 to-zinc-900"
  },
  {
    id: "aprendizado-04",
    title: "Gatilhos de Entrada de Alta Precisão",
    subtitle: "O momento exato de entrar para maximizar o ROI. Timing é tudo.",
    duration: "32 min",
    locked: true,
    badge: "Análise Profissional",
    category: "Execução",
    image: "from-orange-900 to-zinc-900"
  },
  {
    id: "aprendizado-05",
    title: "Psicologia do Jogador Profissional",
    subtitle: "Como manter a frieza quando o mercado está contra você. O mindset vencedor.",
    duration: "20 min",
    locked: true,
    badge: "Mentalidade",
    category: "Psicologia",
    image: "from-rose-900 to-zinc-900"
  },
  {
    id: "aprendizado-06",
    title: "Arquitetura de Padrões Complexos",
    subtitle: "Cruzando dados de múltiplos terminais para prever resultados com alta assertividade.",
    duration: "45 min",
    locked: true,
    badge: "Masterclass",
    category: "Avançado",
    image: "from-indigo-900 to-zinc-900"
  }
];

const featuredInsight = insights[0];

const categories = [
  { title: "Tendências Agora", items: [insights[1], insights[2], insights[3], insights[4]] },
  { title: "Estratégias Vencedoras", items: [insights[5], insights[0], insights[1], insights[3]] },
  { title: "Gestão e Psicologia", items: [insights[2], insights[4], insights[0], insights[5]] },
  { title: "Novos Lançamentos", items: [insights[3], insights[1], insights[4], insights[2]] },
];

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-[#141414] text-white pb-20">
      
      {/* Hero Section */}
      <div className="relative h-[80vh] w-full overflow-hidden">
        {/* Background Gradient/Image */}
        <div className={`absolute inset-0 bg-gradient-to-br ${featuredInsight.image} opacity-80`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent" />
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 p-12 opacity-30 animate-pulse">
           <TrendingUp className="w-96 h-96 text-emerald-500/20" />
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full md:w-2/3 lg:w-1/2 space-y-6 z-10">
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/50 uppercase tracking-widest mb-2">
            Destaque da Semana
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none shadow-black drop-shadow-2xl">
            {featuredInsight.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 line-clamp-3 shadow-black drop-shadow-md">
            {featuredInsight.subtitle}
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-white text-black hover:bg-white/90 font-bold px-8 text-lg h-14 gap-2">
                  <Play className="w-6 h-6 fill-black" /> Assistir
                </Button>
              </DialogTrigger>
              <PaywallModal />
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" variant="secondary" className="bg-gray-500/70 text-white hover:bg-gray-500/50 font-bold px-8 text-lg h-14 gap-2 backdrop-blur-sm">
                  <Info className="w-6 h-6" /> Mais Informações
                </Button>
              </DialogTrigger>
               <PaywallModal />
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <div className="relative z-20 -mt-24 space-y-12 pl-8 md:pl-16 overflow-hidden">
        {categories.map((category, index) => (
          <div key={index} className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-100 hover:text-white transition-colors cursor-pointer flex items-center gap-2 group">
              {category.title}
              <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
            </h2>
            
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {category.items.map((item, i) => (
                  <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="group relative aspect-video cursor-pointer rounded-md overflow-hidden transition-all duration-300 hover:scale-105 hover:z-50 hover:shadow-2xl hover:ring-2 hover:ring-emerald-500">
                          {/* Card Background */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${item.image}`} />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30">
                              <Lock className="w-6 h-6 text-white" />
                            </div>
                          </div>

                          {/* Content Overlay */}
                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/60 to-transparent opacity-100 group-hover:opacity-100 transition-opacity">
                            <h3 className="text-sm font-bold text-white leading-tight mb-1">{item.title}</h3>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-gray-300">
                              <span className="text-emerald-400">98% Relevante</span>
                              <span>{item.duration}</span>
                              <span className="border border-gray-500 px-1 rounded text-[9px] uppercase">{item.category}</span>
                            </div>
                          </div>

                          {/* Badge Top Left */}
                           <div className="absolute top-2 left-2">
                             {i === 0 && (
                               <Badge className="bg-emerald-600 text-[10px] font-bold h-5 px-1.5 rounded-sm">
                                 NOVO
                               </Badge>
                             )}
                           </div>
                        </div>
                      </DialogTrigger>
                      <PaywallModal />
                    </Dialog>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-black/50 border-none text-white hover:bg-black/70 hover:text-emerald-500 hidden group-hover:flex" />
              <CarouselNext className="right-4 bg-black/50 border-none text-white hover:bg-black/70 hover:text-emerald-500 hidden group-hover:flex" />
            </Carousel>
          </div>
        ))}
      </div>
      
      {/* Footer / CTA Area */}
      <div className="container mx-auto mt-24 px-8 mb-12">
         <div className="p-12 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-black border border-emerald-500/20 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold">Não perca nenhum conteúdo</h2>
              <p className="text-gray-400 text-lg">
                Torne-se membro PRO e desbloqueie acesso ilimitado a todas as aulas, estratégias e ferramentas da SOFIA.
              </p>
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 py-6 text-lg shadow-xl shadow-emerald-900/20">
                <Link href="/account/upgrade">
                  Assinar SOFIA PRO
                </Link>
              </Button>
            </div>
         </div>
      </div>
    </div>
  );
}

function PaywallModal() {
  return (
    <DialogContent className="sm:max-w-md border-emerald-500/20 bg-zinc-950/95 backdrop-blur-xl text-white">
      <DialogHeader>
        <div className="mx-auto bg-emerald-500/10 p-4 rounded-full mb-4 w-fit">
          <Lock className="w-10 h-10 text-emerald-500" />
        </div>
        <DialogTitle className="text-center text-2xl font-bold">Conteúdo Exclusivo PRO</DialogTitle>
        <DialogDescription className="text-center text-base pt-2 text-gray-400">
          Este insight estratégico está reservado para membros do plano SOFIA PRO.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          <Zap className="w-6 h-6 text-emerald-500 shrink-0" />
          <span className="text-sm font-medium">Acesso ilimitado a todas as aulas</span>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
          <span className="text-sm font-medium">Estratégias validadas por especialistas</span>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          <TrendingUp className="w-6 h-6 text-emerald-500 shrink-0" />
          <span className="text-sm font-medium">Análises de mercado em tempo real</span>
        </div>
      </div>

      <DialogFooter className="sm:justify-center">
        <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-lg shadow-lg shadow-emerald-900/20">
          <Link href="/account/upgrade">
            Ativar SOFIA PRO Agora
          </Link>
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
