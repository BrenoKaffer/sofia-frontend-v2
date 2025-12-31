'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { Play, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface InsightsHeroProps {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeArtworkSrc?: string;
  badgeArtworkAlt?: string;
  duration?: string;
  muxEmbedUrl?: string;
  desktopVideoUrl?: string;
  desktopVideoEndAt?: number;
  mobileVideoUrl?: string;
  mobileVideoEndAt?: number;
}

export function InsightsHero({ 
  id, 
  title, 
  description, 
  badge, 
  badgeArtworkSrc,
  badgeArtworkAlt,
  muxEmbedUrl, 
  desktopVideoUrl, 
  desktopVideoEndAt, 
  mobileVideoUrl, 
  mobileVideoEndAt 
}: InsightsHeroProps) {
  const router = useRouter();

  const handleMobileTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (mobileVideoEndAt) {
      const video = e.currentTarget;
      if (video.currentTime >= mobileVideoEndAt) {
        video.currentTime = 0;
        video.play();
      }
    }
  };

  const handleDesktopTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (desktopVideoEndAt) {
      const video = e.currentTarget;
      if (video.currentTime >= desktopVideoEndAt) {
        video.currentTime = 0;
        video.play();
      }
    }
  };

  return (
    <div className="relative w-full h-[80vh] md:h-[95vh] rounded-xl overflow-hidden mb-0 group bg-black shadow-2xl shadow-black/50">
      {/* Background Video with Gradient Overlay */}
      <div className="absolute inset-0">
        {/* Desktop Video (Hidden on Mobile if mobileVideoUrl is provided) */}
        <div className={`w-full h-full ${mobileVideoUrl ? 'hidden md:block' : 'block'}`}>
          {desktopVideoUrl ? (
            <video 
              key={`desktop-custom-${id}`}
              autoPlay 
              loop 
              muted 
              playsInline 
              onTimeUpdate={handleDesktopTimeUpdate}
              className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-[40%] -translate-y-1/2 object-cover opacity-100 pointer-events-none"
              poster="/hero-poster.jpg"
            >
              <source src={desktopVideoUrl} type="video/mp4" />
            </video>
          ) : muxEmbedUrl ? (
            <iframe
              key={`desktop-mux-${id}`}
              src={muxEmbedUrl}
              className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-[40%] -translate-y-1/2 object-cover opacity-100 pointer-events-none"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              tabIndex={-1}
            />
          ) : (
            <video 
              key={`desktop-fallback-${id}`} // Force re-render on id change
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              poster="/hero-poster.jpg"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-white-network-connection-dots-and-lines-2988-large.mp4" type="video/mp4" />
            </video>
          )}
        </div>

        {/* Mobile Video (Visible only on Mobile) */}
        {mobileVideoUrl && (
          <div className="block md:hidden w-full h-full">
            <video 
              key={`mobile-${id}`}
              autoPlay 
              loop 
              muted 
              playsInline 
              onTimeUpdate={handleMobileTimeUpdate}
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              poster="/hero-poster.jpg"
            >
              <source src={mobileVideoUrl} type="video/mp4" />
            </video>
          </div>
        )}
        
        {/* Gradient Overlays for Readability (Netflix style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-48 md:px-12 md:pb-40 lg:px-16 lg:pb-56 max-w-4xl">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          {badgeArtworkSrc && (
            <div className="w-[260px] md:w-[360px] lg:w-[480px] -mb-2">
              <Image
                src={badgeArtworkSrc}
                alt={badgeArtworkAlt ?? ''}
                width={1536}
                height={1024}
                sizes="(min-width: 1024px) 480px, (min-width: 768px) 360px, 260px"
                className="w-full h-auto"
                priority
              />
            </div>
          )}

          <Badge className="bg-primary/90 hover:bg-primary border-none px-3 py-1 text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-primary/20 w-fit backdrop-blur-sm">
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
