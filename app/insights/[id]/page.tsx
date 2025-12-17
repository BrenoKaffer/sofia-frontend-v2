'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/ui/video-player';
import { NetflixTopBar } from '@/components/layout/netflix-top-bar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Mock data (should ideally come from a shared source or API)
const lessons = {
  'hero-insight': {
    title: "O Segredo da Virada de Mesa",
    description: "Descubra como identificar o exato momento em que o algoritmo da roleta muda de padrão e posicione-se para lucrar quando a maioria perde.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    thumbnailUrl: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2070&auto=format&fit=crop"
  },
  'cw-01': {
    title: "Recuperação de Red: O Protocolo",
    description: "Não entre em pânico. Siga este passo a passo matemático para recuperar perdas sem quebrar a banca.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1605870445919-838d190e8e1b?q=80&w=2072&auto=format&fit=crop"
  },
  'cw-02': {
    title: "Leitura de Terminais v2.0",
    description: "A nova forma de ler terminais que antecipa vizinhos do zero com 80% de precisão.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=2535&auto=format&fit=crop"
  },
  'rec-01': {
      title: "Gatilhos de Sniper",
      description: "Pare de jogar em toda rodada. Aprenda a esperar o tiro certo que garante sua meta do dia.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnailUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2574&auto=format&fit=crop"
  }
};

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const lesson = lessons[id as keyof typeof lessons];

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Aula não encontrada</h1>
        <Button onClick={() => router.push('/insights')}>Voltar para Insights</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <NetflixTopBar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Button 
            variant="ghost" 
            className="mb-6 text-zinc-400 hover:text-white pl-0 gap-2"
            onClick={() => router.back()}
        >
            <ArrowLeft className="w-5 h-5" />
            Voltar
        </Button>

        <div className="max-w-5xl mx-auto space-y-8">
            {/* Using the VideoPlayer component as requested */}
            <VideoPlayer 
                title={lesson.title}
                description={lesson.description}
                videoUrl={lesson.videoUrl}
                thumbnailUrl={lesson.thumbnailUrl}
                className="w-full aspect-video shadow-2xl shadow-emerald-900/20"
            />

            <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{lesson.title}</h1>
                <p className="text-lg text-zinc-300 leading-relaxed max-w-3xl">
                    {lesson.description}
                </p>
            </div>

            {/* Additional content area (resources, comments, etc.) could go here */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-zinc-800">
                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-xl font-semibold">Resumo da Aula</h3>
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <p className="text-zinc-400">
                            Nesta aula avançada, você aprenderá os fundamentos matemáticos e psicológicos por trás da estratégia.
                            Prepare-se para anotar os pontos chave e aplicar o conhecimento na prática.
                        </p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold">Materiais de Apoio</h3>
                    <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                            📄 PDF da Aula
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                            📊 Planilha de Gestão
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
