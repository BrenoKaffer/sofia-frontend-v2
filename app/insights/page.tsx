import React from 'react';
import { InsightCard } from '@/components/insights/insight-card';
import { InsightsHero } from '@/components/insights/insights-hero';
import { InsightsCarousel } from '@/components/insights/insights-carousel';
import { NetflixTopBar } from '@/components/layout/netflix-top-bar';
import { getModulesWithLessons, getContinueWatching } from '@/lib/services/lessons';
import { InsightsFooterCTA } from '@/components/insights/insights-footer-cta';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// Fallback Featured Hero Insight (if no continue watching or specific feature)
const defaultFeaturedInsight = {
  id: "hero-insight",
  title: "O Segredo da Virada de Mesa",
  description: "Descubra como identificar o exato momento em que o algoritmo da roleta muda de padrão e posicione-se para lucrar quando a maioria perde.\n\nUm método prático para leitura de padrões, controle emocional e execução estratégica na roleta online, criado por quem vive isso todos os dias.",
  badge: "Masterclass Exclusiva",
  duration: "45 min",
  muxEmbedUrl: "https://player.mux.com/83jNROLYYRGW5iiJjXMAGuxJYyt3cgJ02M602XTXCXFzc?autoplay=true&muted=true&loop=true&controls=false&showTitle=false",
};

export const revalidate = 60; // Revalidate data every 60 seconds

export default async function InsightsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  // Fetch modules and continue watching in parallel
  const [modules, continueWatchingData] = await Promise.all([
    getModulesWithLessons(userId),
    userId ? getContinueWatching(userId) : Promise.resolve([])
  ]);
  
  // Separate the first module (Onboarding) to feature it
  const [firstModule, ...otherModules] = modules;

  // Determine Hero Content
  // Priority: 1. Continue Watching (most recent), 2. Default Featured
  let heroContent = defaultFeaturedInsight;
  
  if (continueWatchingData.length > 0) {
      const lastWatched = continueWatchingData[0];
      const muxUrl = lastWatched.mux_playback_id 
        ? `https://player.mux.com/${lastWatched.mux_playback_id}?autoplay=true&muted=true&loop=true&controls=false&showTitle=false` 
        : undefined;

      heroContent = {
          id: lastWatched.id,
          title: lastWatched.title,
          description: lastWatched.subtitle || "Continue assistindo de onde parou.",
          badge: "Continue Assistindo",
          duration: lastWatched.duration,
          muxEmbedUrl: muxUrl || defaultFeaturedInsight.muxEmbedUrl
      };
  }

  const badgeArtworkSrc = heroContent.badge === 'Masterclass Exclusiva' ? '/logo_noalvoclass.png' : undefined;

  const continueItems =
    continueWatchingData.length > 0
      ? continueWatchingData
      : firstModule?.lessons?.length
        ? [
            {
              ...firstModule.lessons[0],
              id: firstModule.lessons[0].slug || firstModule.lessons[0].id,
              subtitle: firstModule.lessons[0].subtitle || 'Assista sua primeira aula para começar.',
              progress: 0,
            },
          ]
        : [];

  return (
    <div className="min-h-screen bg-black text-foreground pb-20 overflow-x-hidden">
      
      <NetflixTopBar />

      {/* Hero Section with bottom margin for breathing room */}
      <div className="mb-0">
        <InsightsHero 
          id={heroContent.id}
          title={heroContent.title}
          description={heroContent.description}
          badge={heroContent.badge}
          badgeArtworkSrc={badgeArtworkSrc}
          badgeArtworkAlt="NoAlvoClass"
          duration={heroContent.duration}
          muxEmbedUrl={heroContent.muxEmbedUrl}
        />
      </div>

      {/* Content Rows */}
      <div className="relative z-20 space-y-12 pl-4 md:pl-12 lg:pl-16 -mt-32">
        
        {/* Continue de Onde Parou */}
        {continueItems.length > 0 && (
          <InsightsCarousel title="Continue de Onde Parou">
            {continueItems.map((lesson) => (
              <div key={lesson.id} className="min-w-[240px] md:min-w-[320px]">
                <InsightCard
                  {...lesson}
                  id={lesson.slug || lesson.id}
                  subtitle={lesson.subtitle || ''}
                />
              </div>
            ))}
          </InsightsCarousel>
        )}

        {/* Featured First Row - "Comece por Aqui" */}
        {firstModule && (
          <div className="relative">
             <div className="absolute -left-4 md:-left-12 lg:-left-16 top-0 bottom-0 w-1 bg-primary/50 rounded-r-full" />
             <InsightsCarousel title="Comece por Aqui">
              {firstModule.lessons.map((lesson) => (
                <div key={lesson.id} className="min-w-[240px] md:min-w-[320px]">
                  <InsightCard 
                    id={lesson.slug || lesson.id}
                    title={lesson.title}
                    subtitle={lesson.subtitle || ''}
                    duration={lesson.duration}
                    locked={lesson.locked}
                    category={lesson.category}
                    thumbnailUrl={lesson.thumbnail_url}
                  />
                </div>
              ))}
            </InsightsCarousel>
          </div>
        )}

        {/* Remaining Rows */}
        {otherModules.map((module) => (
          <InsightsCarousel key={module.id} title={module.title}>
            {module.lessons.map((lesson) => (
              <div key={lesson.id} className="min-w-[240px] md:min-w-[320px]">
                <InsightCard 
                   id={lesson.id}
                   title={lesson.title}
                   subtitle={lesson.subtitle || ''}
                   duration={lesson.duration}
                   locked={lesson.locked}
                   category={lesson.category}
                   thumbnailUrl={lesson.thumbnail_url}
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
              <InsightsFooterCTA />
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
