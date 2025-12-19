'use client';

import React from 'react';
import { InsightCard } from '@/components/insights/insight-card';
import { InsightsHero } from '@/components/insights/insights-hero';
import { InsightsCarousel } from '@/components/insights/insights-carousel';
import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { NetflixTopBar } from '@/components/layout/netflix-top-bar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { insightsData } from '@/lib/insights-data';

// Featured Hero Insight (can be dynamic later, hardcoded for now as "Masterclass")
const featuredInsight = {
  id: "hero-insight",
  title: "O Segredo da Virada de Mesa",
  description: "Descubra como identificar o exato momento em que o algoritmo da roleta muda de padrão e posicione-se para lucrar quando a maioria perde.\n\nUm método prático para leitura de padrões, controle emocional e execução estratégica na roleta online, criado por quem vive isso todos os dias.",
  badge: "Masterclass Exclusiva",
  duration: "45 min",
  muxEmbedUrl: "https://player.mux.com/83jNROLYYRGW5iiJjXMAGuxJYyt3cgJ02M602XTXCXFzc?autoplay=true&muted=true&loop=true&controls=false&showTitle=false",
  // desktopVideoUrl: "https://1070b3c91b7bf5b20c984a1e76117a3e.cdn.bubble.io/f1723084944802x317908004711442440/Hero_App_BigGreenAcademy.mp4?_gl=1*ty36dd*_gcl_au*MTk2Njk5MTU4LjE3MjI5MDc4NTk.*_ga*NzQ0OTU0NjcwLjE3MjI5MDc4NTk.*_ga_BFPVR2DEE2*MTcyMzA0MTAwMS4zLjEuMTcyMzA4NDc2NC41My4wLjA.",
  // desktopVideoEndAt: 11,
  // mobileVideoUrl: "https://1070b3c91b7bf5b20c984a1e76117a3e.cdn.bubble.io/f1723643117960x798699798734225000/Sequ%C3%AAncia%2003_1.mp4?_gl=1*1uzr9om*_gcl_au*MTQwODc4MjU3MS4xNzIzNjQxMTQx*_ga*MTc0Mzc5ODA5Ni4xNzIzNDgyNzkz*_ga_BFPVR2DEE2*MTcyMzY0MTE0MC4xLjEuMTcyMzY0MzA5MC42MC4wLjA.",
  // mobileVideoEndAt: 11
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
    progress: 45,
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop"
  }
];

export default function InsightsPage() {
  const router = useRouter();
  // Separate the first module (Onboarding) to feature it
  const [firstModule, ...otherModules] = insightsData;

  return (
    <div className="min-h-screen bg-black text-foreground pb-20 overflow-x-hidden">
      
      <NetflixTopBar />

      {/* Hero Section with bottom margin for breathing room */}
      <div className="mb-0">
        <InsightsHero 
          id={featuredInsight.id}
          title={featuredInsight.title}
          description={featuredInsight.description}
          badge={featuredInsight.badge}
          duration={featuredInsight.duration}
          muxEmbedUrl={featuredInsight.muxEmbedUrl}
          // desktopVideoUrl={featuredInsight.desktopVideoUrl}
          // desktopVideoEndAt={featuredInsight.desktopVideoEndAt}
          // mobileVideoUrl={featuredInsight.mobileVideoUrl}
          // mobileVideoEndAt={featuredInsight.mobileVideoEndAt}
        />
      </div>

      {/* Content Rows */}
      <div className="relative z-20 space-y-12 pl-4 md:pl-12 lg:pl-16 -mt-32">
        
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

        {/* Featured First Row - "Comece por Aqui" */}
        {firstModule && (
          <div className="relative">
             <div className="absolute -left-4 md:-left-12 lg:-left-16 top-0 bottom-0 w-1 bg-primary/50 rounded-r-full" />
             <InsightsCarousel title="Comece por Aqui">
              {firstModule.lessons.map((lesson) => (
                <div key={lesson.id} className="min-w-[280px] md:min-w-[320px]">
                  <InsightCard 
                    {...lesson}
                    // Make the first row cards slightly more distinct if needed, 
                    // or just rely on the section header
                  />
                </div>
              ))}
            </InsightsCarousel>
          </div>
        )}

        {/* Remaining Rows */}
        {otherModules.map((module, index) => (
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
         <div className="p-12 rounded-2xl bg-gradient-to-r from-primary/20 to-black border border-primary/20 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold group-hover:text-primary transition-colors">Não perca nenhum conteúdo</h2>
              <p className="text-muted-foreground text-lg">
                Torne-se membro PRO e desbloqueie acesso ilimitado a todas as aulas, estratégias e ferramentas da SOFIA.
              </p>
              <ShinyButton 
                className="font-bold px-10 py-6 text-lg h-auto shadow-xl shadow-primary/20 hover:scale-105 transition-transform w-full sm:w-auto"
                onClick={() => router.push('/account/upgrade')}
              >
                Assinar SOFIA PRO
              </ShinyButton>
            </div>
         </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#141414] py-6 mt-12">
        <div className="text-center text-[10px] text-zinc-500">
          © 2025 Umbrella Tecnologia. - Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
