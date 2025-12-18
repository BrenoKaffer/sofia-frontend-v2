'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/ui/video-player';
import { MuxVideoPlayer } from '@/components/ui/mux-video-player';
import { NetflixTopBar } from '@/components/layout/netflix-top-bar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { insightsData, Lesson } from '@/lib/insights-data';

// Helper to find lesson by ID from the structured data
const getLessonById = (id: string) => {
  for (const module of insightsData) {
    const lesson = module.lessons.find(l => l.id === id);
    if (lesson) return lesson;
  }
  // Fallback for the hardcoded hero insight if it's not in the list
  if (id === 'hero-insight') {
    return {
      id: "hero-insight",
      title: "O Segredo da Virada de Mesa",
      subtitle: "Descubra como identificar o exato momento em que o algoritmo da roleta muda de padrão.",
      description: "Descubra como identificar o exato momento em que o algoritmo da roleta muda de padrão e posicione-se para lucrar quando a maioria perde.",
      duration: "45 min",
      locked: false,
      category: "Masterclass"
    } as Lesson;
  }
  return null;
};

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const lessonData = getLessonById(id);

  if (!lessonData) {
    return (
      <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Aula não encontrada</h1>
        <Button onClick={() => router.push('/insights')}>Voltar para Insights</Button>
      </div>
    );
  }

  // Enrich with placeholder media if not present (since our data file is text-only for now)
  const lesson = {
    ...lessonData,
    description: lessonData.subtitle || lessonData.title, // Ensure description exists
    videoUrl: lessonData.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ", // Use provided video or fallback
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" // Tech placeholder
  };

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
            {/* Using Mux Player if available, otherwise fallback to standard VideoPlayer */}
            {lesson.muxPlaybackId ? (
              <MuxVideoPlayer
                playbackId={lesson.muxPlaybackId}
                title={lesson.title}
                className="w-full aspect-video shadow-2xl shadow-emerald-900/20"
              />
            ) : (
              <VideoPlayer 
                title={lesson.title}
                description={lesson.description}
                videoUrl={lesson.videoUrl}
                thumbnailUrl={lesson.thumbnailUrl}
                className="w-full aspect-video shadow-2xl shadow-emerald-900/20"
              />
            )}

            <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{lesson.title}</h1>
                <p className="text-lg text-zinc-300 leading-relaxed max-w-3xl">
                    {lesson.subtitle}
                </p>
            </div>

            {/* Additional content area (resources, comments, etc.) could go here */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-zinc-800">
                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-xl font-semibold">Resumo da Aula</h3>
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <p className="text-zinc-400">
                            Nesta aula do módulo <strong>{lesson.category}</strong>, você aprenderá os fundamentos essenciais.
                            {lesson.locked && " Esta é uma aula exclusiva para membros PRO."}
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
