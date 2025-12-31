'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InsightsCarouselProps {
  title: string;
  children: React.ReactNode;
}

export function InsightsCarousel({ title, children }: InsightsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 600; // Approx 2 cards width
      const currentScroll = scrollContainerRef.current.scrollLeft;
      
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-4 py-4 group/carousel">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white/90 group-hover/carousel:text-white transition-colors">
          {title}
        </h2>
      </div>
      
      <div className="relative group">
        {/* Left Control */}
        <div className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            className="h-full w-8 rounded-none pointer-events-auto hover:bg-black/40 text-white"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        </div>

        {/* Scroll Container */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>

        {/* Right Control */}
        <div className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            className="h-full w-8 rounded-none pointer-events-auto hover:bg-black/40 text-white"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </div>
  );
}
