'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Play, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface InsightsHeroProps {
  id: string;
  title: string;
  description: string;
  badge: string;
  duration?: string;
  muxEmbedUrl?: string;
}

export function InsightsHero({ id, title, description, badge, muxEmbedUrl }: InsightsHeroProps) {
  const router = useRouter();

  return (
    <div className="relative w-full h-[80vh] md:h-[95vh] rounded-xl overflow-hidden mb-0 group bg-black shadow-2xl shadow-black/50">
      {/* Background Video with Gradient Overlay */}
      <div className="absolute inset-0">
        {muxEmbedUrl ? (
          <iframe
            key={id}
            src={muxEmbedUrl}
            className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-[40%] -translate-y-1/2 object-cover opacity-60 pointer-events-none"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            tabIndex={-1}
          />
        ) : (
          <video 
            key={id} // Force re-render on id change
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            poster="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-white-network-connection-dots-and-lines-2988-large.mp4" type="video/mp4" />
          </video>
        )}
        
        {/* Gradient Overlays for Readability (Netflix style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-48 md:px-12 md:pb-40 lg:px-16 lg:pb-56 max-w-4xl">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <Badge className="bg-emerald-500/90 hover:bg-emerald-600 border-none px-3 py-1 text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-emerald-500/20 w-fit backdrop-blur-sm">
            {badge}
          </Badge>
          
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-white drop-shadow-2xl leading-[1.1]">
            {title}
          </h1>
          
          <div className="text-sm md:text-base text-zinc-300 max-w-xl leading-relaxed drop-shadow-md">
            {description.split('\n').map((paragraph, index) => (
              paragraph ? <p key={index} className="mb-6 last:mb-0">{paragraph}</p> : null
            ))}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <ShinyButton 
              className="h-10 px-6 min-w-[140px]" 
              onClick={() => router.push(`/insights/${id}`)}
            >
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                Assistir
              </div>
            </ShinyButton>
            
            <Button asChild variant="outline" className="h-10 px-6 text-sm bg-zinc-800/60 backdrop-blur-md border-zinc-700/50 text-white hover:bg-zinc-700/60 font-semibold rounded-md gap-2">
              <Link href={`/insights/${id}`}>
                <Info className="w-4 h-4" />
                Mais Informações
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
