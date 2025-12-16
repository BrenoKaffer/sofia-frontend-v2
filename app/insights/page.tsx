import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Clock, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Mock data as requested
const insights = [
  {
    id: "aprendizado-01",
    title: "Leitura Avançada de Terminais",
    subtitle: "Como identificar desequilíbrios antes do mercado reagir",
    duration: "18 min",
    locked: true,
    badge: "Especialista",
    category: "Análise Técnica"
  },
  {
    id: "aprendizado-02",
    title: "O Padrão Fantasma",
    subtitle: "Detectando tendências que as ferramentas comuns ignoram",
    duration: "24 min",
    locked: true,
    badge: "Análise Profissional",
    category: "Estratégia"
  },
  {
    id: "aprendizado-03",
    title: "Gestão de Banca Dinâmica",
    subtitle: "Ajustando sua exposição baseada na volatilidade da mesa",
    duration: "15 min",
    locked: true,
    badge: "Especialista",
    category: "Gestão"
  },
  {
    id: "aprendizado-04",
    title: "Gatilhos de Entrada de Alta Precisão",
    subtitle: "O momento exato de entrar para maximizar o ROI",
    duration: "32 min",
    locked: true,
    badge: "Análise Profissional",
    category: "Execução"
  },
  {
    id: "aprendizado-05",
    title: "Psicologia do Jogador Profissional",
    subtitle: "Como manter a frieza quando o mercado está contra você",
    duration: "20 min",
    locked: true,
    badge: "Mentalidade",
    category: "Psicologia"
  },
  {
    id: "aprendizado-06",
    title: "Arquitetura de Padrões Complexos",
    subtitle: "Cruzando dados de múltiplos terminais para prever resultados",
    duration: "45 min",
    locked: true,
    badge: "Masterclass",
    category: "Avançado"
  }
];

export default function InsightsPage() {
  return (
    <div className="container mx-auto p-6 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Aprendizados Profissionais</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Insights reais usados por especialistas para identificar padrões antes do mercado.
          </p>
        </div>
        <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/20">
          <Link href="/account/upgrade">
            Desbloquear Acesso Total
          </Link>
        </Button>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((insight) => (
          <Dialog key={insight.id}>
            <DialogTrigger asChild>
              <Card className="group relative overflow-hidden cursor-pointer border-border/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.02] bg-card/50 backdrop-blur-sm">
                
                {/* Thumbnail Placeholder with Abstract Art */}
                <div className="relative h-48 w-full bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-900/0 to-zinc-900/0" />
                  
                  {/* Abstract shapes */}
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
                    <TrendingUp className="w-24 h-24 text-emerald-500" />
                  </div>
                  
                  <div className="absolute bottom-4 left-4 z-10 flex gap-2">
                     <Badge variant="secondary" className="bg-black/60 backdrop-blur-md border-emerald-500/30 text-emerald-400 font-medium">
                      {insight.badge}
                    </Badge>
                  </div>
                  
                  {/* Lock Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                    <div className="bg-black/60 p-3 rounded-full backdrop-blur-sm border border-white/10 group-hover:border-emerald-500/50 group-hover:scale-110 transition-all duration-300">
                      <Lock className="w-6 h-6 text-white/80 group-hover:text-emerald-400" />
                    </div>
                  </div>
                </div>

                <CardHeader className="space-y-1 pb-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xl leading-tight group-hover:text-emerald-400 transition-colors">
                      {insight.title}
                    </h3>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {insight.subtitle}
                  </p>
                </CardContent>

                <CardFooter className="pt-0 flex justify-between items-center text-sm text-muted-foreground border-t border-border/30 mt-auto p-4 bg-muted/20">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{insight.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-500/80 font-medium">
                    <span className="text-xs uppercase tracking-wider">Disponível no PRO</span>
                  </div>
                </CardFooter>
              </Card>
            </DialogTrigger>

            {/* Micro-modal (Paywall) */}
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
                  <span className="text-sm">Acesso a todos os {insights.length} aprendizados avançados</span>
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
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 shadow-lg shadow-emerald-900/20">
                  <Link href="/account/upgrade">
                    Ativar SOFIA PRO Agora
                  </Link>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {/* Global CTA Bottom */}
      <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-emerald-900/20 to-zinc-900 border border-emerald-500/20 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold">Pronto para elevar o nível do seu jogo?</h2>
          <p className="text-muted-foreground">
            Desbloqueie agora todos os insights, estratégias e ferramentas profissionais da plataforma SOFIA.
          </p>
          <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 shadow-xl shadow-emerald-500/20">
            <Link href="/account/upgrade">
              Desbloquear Aprendizados Profissionais
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
