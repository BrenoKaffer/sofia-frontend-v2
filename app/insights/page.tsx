'use client';

import React from 'react';
import { InsightCard } from '@/components/insights/insight-card';
import { InsightsHero } from '@/components/insights/insights-hero';
import { InsightsCarousel } from '@/components/insights/insights-carousel';
import { NetflixTopBar } from '@/components/layout/netflix-top-bar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Mock Data Refined for "Netflix Style"
const featuredInsight = {
  id: "hero-insight",
  title: "O Segredo da Virada de Mesa",
  description: "Descubra como identificar o exato momento em que o algoritmo da roleta muda de padrão e posicione-se para lucrar quando a maioria perde.",
  badge: "Masterclass Exclusiva",
  duration: "45 min"
};

const continueWatching = [
  {
    id: "cw-01",
    title: "Recuperação de Red: O Protocolo",
    subtitle: "Não entre em pânico. Siga este passo a passo matemático para recuperar perdas sem quebrar a banca.",
    duration: "18 min",
    locked: false,
    badge: "Essencial",
    category: "Gestão",
    progress: 62
  },
  {
    id: "cw-02",
    title: "Leitura de Terminais v2.0",
    subtitle: "A nova forma de ler terminais que antecipa vizinhos do zero com 80% de precisão.",
    duration: "24 min",
    locked: false,
    badge: "Técnica",
    category: "Análise",
    progress: 30
  }
];

const recommended = [
  {
    id: "rec-01",
    title: "Gatilhos de Sniper",
    subtitle: "Pare de jogar em toda rodada. Aprenda a esperar o tiro certo que garante sua meta do dia.",
    duration: "15 min",
    locked: true,
    badge: "Estratégia",
    category: "Execução"
  },
  {
    id: "rec-02",
    title: "A Mente da Baleia",
    subtitle: "Como os jogadores que apostam alto pensam e por que eles ganham mais (não é só dinheiro).",
    duration: "32 min",
    locked: true,
    badge: "Mentalidade",
    category: "Psicologia"
  },
  {
    id: "rec-03",
    title: "Padrão Espelho Reverso",
    subtitle: "Uma falha comum em roletas automáticas que paga 36x se você souber identificar.",
    duration: "12 min",
    locked: true,
    badge: "Glitch",
    category: "Padrões"
  },
  {
    id: "rec-04",
    title: "Proteção de Lucro",
    subtitle: "Você ganhou. E agora? Como sair da mesa com o dinheiro no bolso antes da devolução.",
    duration: "10 min",
    locked: true,
    badge: "Gestão",
    category: "Segurança"
  }
];

const trending = [
  {
    id: "tr-01",
    title: "Roletas Imersivas: O Guia",
    subtitle: "Por que as imersivas pagam mais e como explorar o delay da câmera lenta.",
    duration: "28 min",
    locked: true,
    badge: "Especialista",
    category: "Mesas"
  },
  {
    id: "tr-02",
    title: "O Mito dos Números Quentes",
    subtitle: "Por que seguir números quentes vai quebrar você e o que olhar em vez disso.",
    duration: "20 min",
    locked: true,
    badge: "Mito",
    category: "Conceito"
  },
  {
    id: "tr-03",
    title: "Ciclos de Pagamento",
    subtitle: "Identifique se a mesa está em ciclo de pagamento ou de coleta em 3 rodadas.",
    duration: "40 min",
    locked: true,
    badge: "Pro",
    category: "Análise"
  }
];

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-[#141414] text-white pb-20 overflow-x-hidden">
      <NetflixTopBar />
      <InsightsHero 
        title={featuredInsight.title}
        description={featuredInsight.description}
        badge={featuredInsight.badge}
        duration={featuredInsight.duration}
      />

      {/* Content Rows */}
      <div className="relative z-20 -mt-24 space-y-8 pl-4 md:pl-12 lg:pl-16">
        
        {/* Continue Watching Swimlane */}
        <InsightsCarousel title="Continue de onde parou">
          {continueWatching.map((item) => (
            <div key={item.id} className="min-w-[280px] md:min-w-[320px]">
              <InsightCard 
                {...item}
              />
            </div>
          ))}
        </InsightsCarousel>

        {/* Recommended Swimlane */}
        <InsightsCarousel title="Recomendado para você">
          {recommended.map((item) => (
            <div key={item.id} className="min-w-[280px] md:min-w-[320px]">
              <InsightCard 
                {...item}
              />
            </div>
          ))}
        </InsightsCarousel>

        {/* Trending Swimlane */}
        <InsightsCarousel title="Em Alta na Comunidade">
          {trending.map((item) => (
            <div key={item.id} className="min-w-[280px] md:min-w-[320px]">
              <InsightCard 
                {...item}
              />
            </div>
          ))}
        </InsightsCarousel>

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
