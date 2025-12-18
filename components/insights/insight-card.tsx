'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Progress } from '@/components/ui/progress';
import { Lock, Clock, Play, TrendingUp, Zap, ShieldCheck } from 'lucide-react';
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
}

export function InsightCard({
  id,
  title,
  subtitle,
  duration,
  locked,
  category,
  progress = 0,
  featured = false,
}: InsightCardProps) {
  const router = useRouter();

  if (locked) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Card className={`group relative overflow-hidden cursor-pointer border-border/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.02] bg-card/50 backdrop-blur-sm h-full flex flex-col ${featured ? 'md:flex-row md:h-64' : ''}`}>
            {/* Content (duplicated for now to ensure exact structure) */}
            <CardContentInner 
              title={title} 
              subtitle={subtitle} 
              duration={duration} 
              locked={locked} 
              category={category} 
              progress={progress} 
              featured={featured} 
            />
          </Card>
        </DialogTrigger>

        {/* Paywall Modal */}
        <DialogContent className="sm:max-w-md border-emerald-500/20 bg-zinc-950/95 backdrop-blur-xl">
          <DialogHeader>
            <div className="mx-auto bg-emerald-500/10 p-3 rounded-full mb-4 w-fit">
              <Lock className="w-8 h-8 text-emerald-500" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">Conteúdo Exclusivo PRO</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              Este insight estratégico está reservado para membros do plano SOFIA PRO.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <Zap className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-sm">Acesso a todos os aprendizados avançados</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-sm">Estratégias validadas por especialistas</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-sm">Aumente sua assertividade com leitura profissional</span>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <ShinyButton 
              className="w-full font-bold h-11 shadow-lg shadow-emerald-900/20"
              onClick={() => router.push('/account/upgrade')}
            >
              Ativar SOFIA PRO Agora
            </ShinyButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Link href={`/insights/${id}`}>
      <Card className={`group relative overflow-hidden cursor-pointer border-border/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.02] bg-card/50 backdrop-blur-sm h-full flex flex-col ${featured ? 'md:flex-row md:h-64' : ''}`}>
        <CardContentInner 
          title={title} 
          subtitle={subtitle} 
          duration={duration} 
          locked={locked} 
          category={category} 
          progress={progress} 
          featured={featured} 
        />
      </Card>
    </Link>
  );
}

// Helper component to avoid code duplication
function CardContentInner({ title, subtitle, duration, locked, category, progress, featured }: any) {
  return (
    <>
      {/* Thumbnail Area */}
      <div className={`relative bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden ${featured ? 'w-full md:w-1/2 h-48 md:h-full' : 'h-40 w-full'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-900/0 to-zinc-900/0" />
        
        {/* Abstract shapes/Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
           <TrendingUp className={`${featured ? 'w-32 h-32' : 'w-16 h-16'} text-emerald-500`} />
        </div>

        {/* Locked State: Discreet Lock Icon */}
        {locked && (
          <>
            {/* Discreet Lock Icon in Corner */}
            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm p-1.5 rounded-full border border-white/5 z-10">
              <Lock className="w-3 h-3 text-white/50" />
            </div>
            
            {/* Hover Reveal Message - Only appears on interaction */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-[1px] z-20">
               <div className="flex items-center gap-2 text-emerald-400 font-medium px-3 py-1.5 rounded-full border border-emerald-500/30 bg-black/80 backdrop-blur-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-xs">Exclusivo PRO</span>
               </div>
            </div>
          </>
        )}

        {/* Progress Bar (if unlocked and in progress) */}
        {!locked && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
            <div 
              className="h-full bg-emerald-500" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        )}
        
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-xs text-zinc-300 font-medium flex items-center gap-1 border border-white/5">
          <Clock className="w-3 h-3" />
          {duration}
        </div>
      </div>

      <div className={`flex flex-col flex-1 ${featured ? 'p-6 justify-center' : ''}`}>
        <CardHeader className={`space-y-1 pb-2 ${featured ? 'pt-0' : ''}`}>
          <div className="flex justify-between items-start">
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20 bg-emerald-500/5 mb-2">
              {category}
            </Badge>
          </div>
          <h3 className={`font-bold leading-tight group-hover:text-emerald-400 transition-colors ${featured ? 'text-2xl' : 'text-base'}`}>
            {title}
          </h3>
        </CardHeader>

        <CardContent className="pb-4 flex-1">
          <p className="text-muted-foreground text-sm line-clamp-2">
            {subtitle}
          </p>
        </CardContent>
        
        {!locked && progress > 0 && (
           <div className="px-6 pb-4 pt-0">
              <p className="text-xs text-emerald-400 font-medium mb-1.5">
                {progress < 100 ? `Continue assistindo: ${progress}%` : 'Concluído'}
              </p>
           </div>
        )}
      </div>
    </>
  );
}
