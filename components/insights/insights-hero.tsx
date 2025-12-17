import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Info, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface InsightsHeroProps {
  id: string;
  title: string;
  description: string;
  badge: string;
  duration: string;
}

export function InsightsHero({ id, title, description, badge, duration }: InsightsHeroProps) {
  return (
    <div className="relative w-full h-[50vh] md:h-[60vh] rounded-2xl overflow-hidden mb-8 group">
      {/* Background Video with Gradient Overlay */}
      <div className="absolute inset-0 bg-black">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-blue-particles-996-large.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient Overlays for Readability (Netflix style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 max-w-4xl">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none px-3 py-0.5 text-xs uppercase tracking-widest font-bold shadow-lg shadow-emerald-500/20 w-fit">
            {badge}
          </Badge>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-white drop-shadow-2xl leading-[1.1]">
            {title}
          </h1>
          
          <p className="text-base md:text-lg text-zinc-300 max-w-2xl leading-relaxed drop-shadow-md">
            {description}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild className="h-10 px-6 text-base bg-white text-black hover:bg-zinc-200 font-bold rounded-md gap-2 transition-transform hover:scale-105">
              <Link href={`/insights/${id}`}>
                <Play className="w-4 h-4 fill-black" />
                Assistir Agora
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-10 px-6 text-base bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 font-semibold rounded-md gap-2">
              <Link href={`/insights/${id}`}>
                <Info className="w-4 h-4" />
                Mais Detalhes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
