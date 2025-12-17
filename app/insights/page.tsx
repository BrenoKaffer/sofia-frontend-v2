'use client';

import React from 'react';
import { InsightCard } from '@/components/insights/insight-card';
import { InsightsHero } from '@/components/insights/insights-hero';
import { InsightsCarousel } from '@/components/insights/insights-carousel';
import { NetflixTopBar } from '@/components/layout/netflix-top-bar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { insightsData } from '@/lib/insights-data';

// Featured Hero Insight (can be dynamic later, hardcoded for now as "Masterclass")
const featuredInsight = {
  id: "hero-insight",
  title: "O Segredo da Virada de Mesa",
  description: "Descubra como identificar o exato momento em que o algoritmo da roleta muda de padrão e posicione-se para lucrar quando a maioria perde.",
  badge: "Masterclass Exclusiva",
  duration: "45 min"
};

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-[#141414] text-white pb-20 overflow-x-hidden">
      <NetflixTopBar />
      <InsightsHero 
        id={featuredInsight.id}
        title={featuredInsight.title}
        description={featuredInsight.description}
        badge={featuredInsight.badge}
        duration={featuredInsight.duration}
      />

      {/* Content Rows */}
      <div className="relative z-20 -mt-24 space-y-8 pl-4 md:pl-12 lg:pl-16">
        
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
    </div>
  );
}
