'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Lock, Clock, TrendingUp, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InsightCardProps {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  locked: boolean;
  category: string;
  progress?: number;
  featured?: boolean;
  thumbnailUrl?: string;
}

export function InsightCard({
  id,
  title,
  subtitle,
  duration,
  locked,
  category,
  progress = 0,
  thumbnailUrl,
}: InsightCardProps) {
  const router = useRouter();

  const CardContentInner = () => (
    <div className="flex flex-col h-full group/card">
      {/* Thumbnail / Poster Area - Vertical Aspect Ratio 9:16 */}
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-md bg-muted/20">
        {thumbnailUrl ? (
          <>
            <img 
              src={thumbnailUrl} 
              alt={title} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
            />
            <div className="absolute inset-0 bg-black/10 group-hover/card:bg-black/0 transition-colors" />
          </>
        ) : (
          <img 
            src={`https://picsum.photos/seed/${encodeURIComponent(id)}-sofia/360/640`} 
            alt={title} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="text-[10px] font-medium bg-black/60 backdrop-blur-sm text-white border-none hover:bg-black/80">
            {category}
          </Badge>
        </div>

        {/* Lock Icon */}
        {locked && (
          <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-sm p-1.5 rounded-full">
            <Lock className="w-3 h-3 text-white/80" />
          </div>
        )}

        {/* Progress Bar (Overlay at bottom of image) */}
        {!locked && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        )}

        {/* Duration Badge (Bottom Right) */}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white/90 font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {duration}
        </div>
        
        {/* Hover Overlay with Description (Desktop) */}
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end hidden md:flex">
             <p className="text-xs text-white/90 line-clamp-4 leading-relaxed mb-2">
               {subtitle}
             </p>
             {locked && (
                <div className="flex items-center gap-1.5 text-primary text-xs font-bold mt-2">
                   <Lock className="w-3 h-3" />
                   Exclusivo PRO
                </div>
             )}
        </div>
      </div>

      {/* Content Below Image */}
      <div className="pt-3 flex-1 flex flex-col">
        <h3 className="font-bold text-sm leading-tight text-foreground group-hover/card:text-primary transition-colors line-clamp-2 mb-1">
          {title}
        </h3>
        
        {/* Mobile-only subtitle preview (very short) if needed, currently hiding to match "clean" look */}
        
        {/* Progress Text */}
        {!locked && progress > 0 && (
           <p className="text-[10px] text-primary font-medium mt-auto pt-1">
             {progress < 100 ? `${progress}% concluído` : 'Concluído'}
           </p>
        )}
      </div>
    </div>
  );

  if (locked) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer w-full h-full">
            <CardContentInner />
          </div>
        </DialogTrigger>

        {/* Paywall Modal */}
        <DialogContent className="sm:max-w-md border-primary/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">Conteúdo Exclusivo PRO</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Este insight estratégico está reservado para membros do plano SOFIA PRO.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <Zap className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm">Acesso a todos os aprendizados avançados</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm">Estratégias validadas por especialistas</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <TrendingUp className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm">Aumente sua assertividade com leitura profissional</span>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <ShinyButton 
              className="w-full font-bold h-11 shadow-lg shadow-primary/20"
              onClick={() => router.push('/checkout')}
            >
              Ativar SOFIA PRO Agora
            </ShinyButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Link href={`/insights/${id}`} className="block w-full h-full">
      <CardContentInner />
    </Link>
  );
}
