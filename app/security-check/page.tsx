'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

function SecurityCheckContent() {
  const searchParams = useSearchParams();
  const target = searchParams.get('target');

  if (!target) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-red-500">Link Inválido</CardTitle>
          <CardDescription>
            O link de verificação está incompleto. Por favor, solicite uma nova recuperação de senha.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full mb-4 mx-auto">
          <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <CardTitle className="text-2xl font-heading">Verificação de Segurança</CardTitle>
        <CardDescription className="font-sans">
          Para proteger sua conta contra verificações automáticas, confirme que você é humano clicando abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 transition-all font-sans text-base"
          onClick={() => {
            window.location.href = target;
          }}
        >
          Continuar para Recuperação
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-4 font-sans">
          Você será redirecionado para a página de definição de senha.
        </p>
      </CardContent>
    </Card>
  );
}

export default function SecurityCheckPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="inline-flex items-center justify-center mb-2"
          >
            <div className="relative w-[180px] h-[50px] mx-auto">
              <Image
                src="/logo_sofia.png"
                alt="SOFIA"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
        </div>

        <Suspense fallback={
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-2">Carregando...</p>
          </div>
        }>
          <SecurityCheckContent />
        </Suspense>
      </div>
    </div>
  );
}
