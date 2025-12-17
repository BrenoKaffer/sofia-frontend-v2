'use client';

import React from 'react';
import { InsightCard } from '@/components/insights/insight-card';
import { InsightsHero } from '@/components/insights/insights-hero';
import { InsightsCarousel } from '@/components/insights/insights-carousel';
import { NetflixTopBar } from '@/components/layout/netflix-top-bar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { insightsData } from '@/lib/insights-data';

// Featured Hero Insight (updated per PROMPT FRONT.html)
const featuredInsight = {
  id: "hero-insight",
  title: "DOMINE A ROLETA COM PRECISÃO CIRÚRGICA.",
  description: "Não é sorte, é método. Aprenda a ler a mesa, controlar sua banca e operar como um profissional.",
  badge: "Destaque",
  duration: "Módulo Inicial"
};

// Mock data for "Continue de Onde Parou"
const continueWatching = [
  {
    id: "control-07",
    title: "Gestão de Banca",
    subtitle: "O pilar mais importante: como gerenciar seu capital para longevidade.",
    duration: "Restam 12 min",
    locked: false,
    category: "Gestão",
    badge: "Em Progresso",
    progress: 45 // Add progress bar support to InsightCard if possible, or just mock it visually
  }
];

// Mock data for "Recomendado para Você"
const recommendedForYou = [
  {
    id: "base-01",
    title: "Estratégia de Dúzias",
    subtitle: "Consistência e controle para entradas mais seguras.",
    duration: "12 min",
    locked: true,
    category: "Dúzias",
    badge: "Técnica"
  },
  {
    id: "adv-01",
    title: "Terminais",
    subtitle: "Onde o dinheiro realmente está quando poucos enxergam.",
    duration: "18 min",
    locked: true,
    category: "Terminais",
    badge: "Avançado"
  },
  {
    id: "flow-01",
    title: "Casa dos 20",
    subtitle: "Controle estatístico aplicado a sessões longas.",
    duration: "18 min",
    locked: true,
    category: "Casa dos 20",
    badge: "Zona"
  }
];

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-[#141414] text-white pb-20 overflow-x-hidden">
      <NetflixTopBar />
      
      {/* Hero Section with bottom margin for breathing room */}
      <div className="mb-12 md:mb-20">
        <InsightsHero 
          id={featuredInsight.id}
          title={featuredInsight.title}
          description={featuredInsight.description}
          badge={featuredInsight.badge}
          duration={featuredInsight.duration}
        />
      </div>

      {/* Content Rows */}
      <div className="relative z-20 space-y-12 pl-4 md:pl-12 lg:pl-16">
        
        {/* Continue de Onde Parou */}
        <InsightsCarousel title="Continue de Onde Parou">
          {continueWatching.map((lesson) => (
            <div key={lesson.id} className="min-w-[280px] md:min-w-[320px]">
              <InsightCard 
                {...lesson}
              />
            </div>
          ))}
        </InsightsCarousel>

        {/* Recomendado para Você */}
        <InsightsCarousel title="Recomendado para Você">
          {recommendedForYou.map((lesson) => (
            <div key={lesson.id} className="min-w-[280px] md:min-w-[320px]">
              <InsightCard 
                {...lesson}
              />
            </div>
          ))}
        </InsightsCarousel>

        {/* All Modules from Data */}
        {insightsData.map((module, index) => (
          <InsightsCarousel key={index} title={module.title}>
            {module.lessons.map((lesson) => (
              <div key={lesson.id} className="min-w-[280px] md:min-w-[320px]">
                <InsightCard 
                  {...lesson}
                />
              </div>
            ))}
          </InsightsCarousel>
        ))}

      </div>
      
      {/* Footer / CTA Area */}
      <div className="container mx-auto mt-24 px-8 mb-12">
         <div className="p-12 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-black border border-emerald-500/20 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold group-hover:text-emerald-400 transition-colors">Não perca nenhum conteúdo</h2>
              <p className="text-gray-400 text-lg">
                Torne-se membro PRO e desbloqueie acesso ilimitado a todas as aulas, estratégias e ferramentas da SOFIA.
              </p>
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 py-6 text-lg shadow-xl shadow-emerald-900/20 hover:scale-105 transition-transform">
                <Link href="/account/upgrade">
                  Assinar SOFIA PRO
                </Link>
              </Button>
            </div>
         </div>
      </div>

      {/* Copyright Footer */}
      <footer className="py-8 text-center text-zinc-600 text-sm">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} No Alvo da Roleta. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
