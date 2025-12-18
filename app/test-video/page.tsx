'use client';

import React from 'react';
import { VideoPlayer } from '@/components/ui/video-player';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function TestVideoPage() {
  const router = useRouter();
  const rawUrl = "https://www.youtube.com/embed/u31qwQUeGuM?si=6OXq0jdXKTzFCVrE";
  const manualEmbedUrl = "https://www.youtube.com/embed/u31qwQUeGuM?si=6OXq0jdXKTzFCVrE";

  return (
    <div className="min-h-screen bg-[#141414] text-white p-8 space-y-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Teste de Vídeo Isolado</h1>
          <Button onClick={() => router.push('/insights')} variant="outline">
            Voltar
          </Button>
        </div>

        {/* Teste 1: Componente da Interface Atual */}
        <section className="space-y-4 border-b border-zinc-800 pb-8">
          <h2 className="text-xl font-semibold text-emerald-400">1. Componente VideoPlayer (Interface Atual)</h2>
          <p className="text-zinc-400">Testando a URL original: <code className="bg-zinc-900 px-2 py-1 rounded text-xs">{rawUrl}</code></p>
          
          <div className="w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
            <VideoPlayer 
              title="Teste de Vídeo"
              description="Verificando se o player carrega corretamente"
              videoUrl={rawUrl}
              thumbnailUrl="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop"
              className="w-full h-full"
            />
          </div>
        </section>

        {/* Teste 2: Iframe Direto (Controle) */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-400">2. Iframe Direto (Controle)</h2>
          <p className="text-zinc-400">Testando embed direto: <code className="bg-zinc-900 px-2 py-1 rounded text-xs">{manualEmbedUrl}</code></p>
          
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800">
            <iframe
              width="100%"
              height="100%"
              src={manualEmbedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <p className="text-sm text-zinc-500 mt-2">
            * Se o vídeo de baixo funcionar e o de cima não, o problema está no componente `VideoPlayer` ou na função de conversão de URL.
            <br />
            * Se nenhum dos dois funcionar, o vídeo pode estar privado, restrito ou bloqueado para embed.
          </p>
        </section>
      </div>
    </div>
  );
}
