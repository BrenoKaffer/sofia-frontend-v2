import React from 'react';
import { VideoPlayer } from '@/components/ui/video-player';
import { NetflixTopBar } from '@/components/layout/netflix-top-bar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import { getLessonBySlug } from '@/lib/services/lessons';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { Lesson } from '@/types/lessons';

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;

  let lesson = await getLessonBySlug(id, userId);

  // Fallback for hero-insight if not found in DB/services
  if (!lesson && id === 'hero-insight') {
    lesson = {
      id: "hero-insight",
      module_id: "hero",
      title: "O Segredo da Virada de Mesa",
      subtitle: "Descubra como identificar o exato momento em que o algoritmo da roleta muda de padrão e posicione-se para lucrar quando a maioria perde.",
      slug: "hero-insight",
      duration: "45 min",
      duration_seconds: 2700,
      locked: false,
      category: "Masterclass",
      is_free: true,
      order: 0,
      mux_playback_id: "83jNROLYYRGW5iiJjXMAGuxJYyt3cgJ02M602XTXCXFzc" // Extracted from URL
    } as Lesson;
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Aula não encontrada</h1>
        <Link href="/insights">
          <Button>Voltar para Insights</Button>
        </Link>
      </div>
    );
  }

  const muxEmbedUrl = lesson.mux_playback_id 
    ? `https://player.mux.com/${lesson.mux_playback_id}`
    : undefined;

  return (
    <div className="min-h-screen bg-black text-foreground">
      <NetflixTopBar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Link href="/insights" className="inline-block mb-6">
            <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground pl-0 gap-2"
            >
                <ArrowLeft className="w-5 h-5" />
                Voltar
            </Button>
        </Link>

        <div className="max-w-5xl mx-auto space-y-8">
            {lesson.locked ? (
                 <div className="w-full aspect-video bg-muted/20 rounded-lg flex flex-col items-center justify-center gap-4 border border-white/10">
                    <div className="bg-black/50 p-4 rounded-full">
                        <Lock className="w-12 h-12 text-primary" />
                    </div>
                    <div className="text-center px-4">
                        <h3 className="text-2xl font-bold mb-2">Conteúdo Exclusivo</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                            Esta aula é exclusiva para assinantes PRO. Assine agora para desbloquear todo o conteúdo.
                        </p>
                        <Link href="/checkout">
                            <Button size="lg" className="font-semibold">
                                Desbloquear Acesso
                            </Button>
                        </Link>
                    </div>
                 </div>
            ) : (
                <VideoPlayer 
                  title={lesson.title}
                  description={lesson.subtitle || ""}
                  videoUrl={lesson.video_url || ""}
                  muxEmbedUrl={muxEmbedUrl}
                  thumbnailUrl={lesson.thumbnail_url || "/hero-poster.jpg"}
                  className="w-full aspect-video"
                  lessonId={lesson.id}
                />
            )}

            <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{lesson.title}</h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                    {lesson.subtitle}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border">
                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-xl font-semibold">Resumo da Aula</h3>
                    <div className="bg-card/50 p-6 rounded-xl border border-border">
                        <p className="text-muted-foreground">
                            Nesta aula do módulo <strong>{lesson.category}</strong>, você aprenderá os fundamentos essenciais.
                            {lesson.locked && " Esta é uma aula exclusiva para membros PRO."}
                        </p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold">Materiais de Apoio</h3>
                    <div className="space-y-3">
                         {/* Placeholder for resources */}
                         <div className="p-4 bg-muted/10 rounded-lg border border-white/5 text-sm text-muted-foreground">
                            Nenhum material disponível para esta aula.
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
