import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Info, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface InsightsHeroProps {
  title: string;
  description: string;
  badge: string;
  duration: string;
}

export function InsightsHero({ title, description, badge, duration }: InsightsHeroProps) {
  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden mb-12 group">
      {/* Background Image/Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-zinc-900 to-black">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        
        {/* Abstract Hero Art */}
        <div className="absolute top-1/4 right-10 md:right-20 opacity-20 transform rotate-12 scale-150 transition-transform duration-[20s] ease-in-out group-hover:scale-125">
           <TrendingUp className="w-96 h-96 text-emerald-500 blur-3xl" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-16 max-w-4xl">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none px-4 py-1 text-sm uppercase tracking-widest font-bold shadow-lg shadow-emerald-500/20 w-fit">
            {badge}
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white drop-shadow-2xl leading-[1.1]">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl leading-relaxed drop-shadow-md">
            {description}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 text-lg bg-white text-black hover:bg-zinc-200 font-bold rounded-lg gap-2 transition-transform hover:scale-105">
              <Play className="w-6 h-6 fill-black" />
              Assistir Agora
            </Button>
            
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 font-semibold rounded-lg gap-2">
              <Info className="w-6 h-6" />
              Mais Detalhes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
