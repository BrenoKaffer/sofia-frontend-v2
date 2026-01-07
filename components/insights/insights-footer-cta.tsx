'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShinyButton } from '@/components/ui/shiny-button';

export function InsightsFooterCTA() {
  const router = useRouter();

  return (
    <ShinyButton 
      className="font-bold px-10 py-6 text-lg h-auto shadow-xl shadow-primary/20 hover:scale-105 transition-transform w-full sm:w-auto"
      onClick={() => window.location.href = 'https://pay.v1sofia.com/?plan=premium&price_id=sofia-premium-mensal'}
    >
      Assinar SOFIA PRO
    </ShinyButton>
  );
}
