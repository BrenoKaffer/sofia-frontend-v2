'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShinyButton } from '@/components/ui/shiny-button';

export function InsightsFooterCTA() {
  const router = useRouter();

  return (
    <ShinyButton 
      className="font-bold px-10 py-6 text-lg h-auto shadow-xl shadow-primary/20 hover:scale-105 transition-transform w-full sm:w-auto"
      onClick={() => router.push('/account/upgrade')}
    >
      Assinar SOFIA PRO
    </ShinyButton>
  );
}
