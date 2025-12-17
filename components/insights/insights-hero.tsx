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
    <div className="relative w-full h-[45vh] md:h-[55vh] rounded-xl overflow-hidden mb-8 group bg-black">
      {/* Background Video with Gradient Overlay */}
      <div className="absolute inset-0">
        <video 
          key={id} // Force re-render on id change
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          poster="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-white-network-connection-dots-and-lines-2988-large.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient Overlays for Readability (Netflix style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-10 max-w-3xl">
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-emerald-500/20 w-fit">
            {badge}
          </Badge>
          
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-white drop-shadow-2xl leading-[1.1]">
            {title}
          </h1>
          
          <p className="text-sm md:text-base text-zinc-300 max-w-xl leading-relaxed drop-shadow-md line-clamp-3 md:line-clamp-none">
            {description}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild className="h-9 px-5 text-sm bg-white text-black hover:bg-zinc-200 font-bold rounded-md gap-2 transition-transform hover:scale-105">
              <Link href={`/insights/${id}`}>
                <Play className="w-3.5 h-3.5 fill-black" />
                Assistir Agora
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-9 px-5 text-sm bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 font-semibold rounded-md gap-2">
              <Link href={`/insights/${id}`}>
                <Info className="w-3.5 h-3.5" />
                Mais Detalhes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
