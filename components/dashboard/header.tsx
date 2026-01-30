'use client';

import { useEffect, useState } from 'react';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Array de frases de boas-vindas que rotacionam a cada 24h
const welcomePhrases = [
  "virar a sorte!",
  "desafiar a roleta!",
  "girar com ousadia.",
  "apostar com confiança.",
  "seguir sua intuição.",
  "mudar seu destino.",
  "mostrar quem manda na roleta.",
  "sentir a adrenalina do giro.",
  "vencer com estilo.",
  "confiar na sua sorte.",
  "testar sua estratégia.",
  "acertar aquele número premiado.",
  "dar um show na roleta.",
  "surpreender a banca!",
  "girar até ganhar!",
  "fazer história no jogo.",
  "mostrar que você domina o jogo.",
  "buscar aquele giro perfeito.",
  "deixar a sorte falar mais alto.",
  "fazer a roleta sorrir pra você.",
  "dar aquele giro maroto.",
  "mostrar que número quente é com você.",
  "dar o famoso 'giro da virada'.",
  "virar o jogo a seu favor.",
  "jogar com coragem e estratégia.",
  "fazer a sorte acontecer.",
  "transformar giros em vitórias.",
  "mostrar que ninguém segura sua maré de sorte.",
  "reinar absoluto na roleta.",
  "mostrar quem manda na mesa.",
  "girar como um verdadeiro mestre.",
  "fazer a banca tremer!",
  "deixar sua marca no jogo."
];

// Função para obter a data atual formatada
function getCurrentDateFormatted() {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  return today.toLocaleDateString('pt-BR', options);
}

// Função para obter a frase do dia
function getDailyWelcomePhrase() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const phraseIndex = dayOfYear % welcomePhrases.length;
  return welcomePhrases[phraseIndex];
}

// Função para obter o primeiro nome
function getFirstName(fullName: string | undefined): string {
  if (!fullName) return 'Usuário';
  return fullName.split(' ')[0];
}

interface HeaderProps {
  onMenuClick: () => void;
}

type BankrollTransactionType = 'profit' | 'loss' | 'deposit' | 'withdraw';

type BankrollAuditEntry = {
  id: string;
  createdAt: string;
  type: BankrollTransactionType;
  amount: number;
  description: string;
  source: 'profit' | 'bankroll';
};

type BankrollSummary = {
  initialBankroll?: number;
  balance?: number;
};

const DEFAULT_MILESTONES = [5000, 10000, 15000, 20000, 30000, 50000, 100000];

type AchievementTier = {
  id: string;
  title: string;
  imageSrc: string;
  minBalance: number;
};

const ACHIEVEMENT_TIERS: AchievementTier[] = [
  { id: 'starter', title: 'Starter', imageSrc: '/game_starter_1.png', minBalance: 0 },
  { id: 'bronze', title: 'Bronze', imageSrc: '/game_bronze.png', minBalance: 5000 },
  { id: 'gold', title: 'Gold', imageSrc: '/game_gold.png', minBalance: 10000 },
  { id: 'platinum', title: 'Platinum', imageSrc: '/game_%20platinum.png', minBalance: 15000 },
  { id: 'black', title: 'Black', imageSrc: '/game_black.png', minBalance: 20000 },
  { id: 'diamond', title: 'Diamond', imageSrc: '/game_diamond.png', minBalance: 30000 },
  { id: 'sapphire', title: 'Sapphire', imageSrc: '/game_sapphire.png', minBalance: 50000 },
];

const ACHIEVEMENT_TEST_SEQUENCE: Omit<AchievementTier, 'minBalance'>[] = [
  { id: 'starter-1', title: 'Starter', imageSrc: '/game_starter_1.png' },
  { id: 'starter-2', title: 'Starter', imageSrc: '/game_starter.png' },
  { id: 'bronze', title: 'Bronze', imageSrc: '/game_bronze.png' },
  { id: 'gold', title: 'Gold', imageSrc: '/game_gold.png' },
  { id: 'platinum', title: 'Platinum', imageSrc: '/game_%20platinum.png' },
  { id: 'black', title: 'Black', imageSrc: '/game_black.png' },
  { id: 'diamond', title: 'Diamond', imageSrc: '/game_diamond.png' },
  { id: 'sapphire', title: 'Sapphire', imageSrc: '/game_sapphire.png' },
];

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatMilestoneLabel(target: number) {
  if (target >= 1000) {
    const k = target / 1000;
    const formatted = Number.isInteger(k) ? String(k) : k.toFixed(1).replace('.', ',');
    return `R$ ${formatted}k`;
  }
  return formatBRL(target);
}

function safeParseJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeBankrollEntries(input: unknown): BankrollAuditEntry[] {
  if (!Array.isArray(input)) return [];
  const entries = input.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    const v = item as any;
    if (typeof v.id !== 'string') return false;
    if (typeof v.createdAt !== 'string') return false;
    if (typeof v.type !== 'string') return false;
    if (typeof v.amount !== 'number' || !Number.isFinite(v.amount)) return false;
    if (typeof v.description !== 'string') return false;
    if (v.source !== 'bankroll') return false;
    return v.type === 'deposit' || v.type === 'withdraw';
  }) as BankrollAuditEntry[];

  return entries;
}

function normalizeProfitEntries(input: unknown): BankrollAuditEntry[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const v = item as any;
      if (typeof v.id !== 'string') return false;
      if (typeof v.createdAt !== 'string') return false;
      if (typeof v.strategy !== 'string') return false;
      if (typeof v.profit !== 'number' || !Number.isFinite(v.profit) || v.profit === 0) return false;
      return true;
    })
    .slice(0, 500)
    .map((session: any) => {
      const isLoss = session.profit < 0;
      const amount = session.profit;
      return {
        id: session.id,
        createdAt: session.createdAt,
        type: isLoss ? 'loss' : 'profit',
        amount,
        description: `Sessão • ${session.strategy}`,
        source: 'profit',
      } satisfies BankrollAuditEntry;
    });
}

function computeNextMilestone(balance: number, milestones: number[]) {
  const sorted = [...milestones].filter((m) => Number.isFinite(m) && m > 0).sort((a, b) => a - b);
  const next = sorted.find((m) => balance < m);
  if (next) return next;
  const last = sorted[sorted.length - 1] ?? 100000;
  return Math.max(last * 2, 100000);
}

function resolveAchievementTier(balance: number) {
  const sorted = [...ACHIEVEMENT_TIERS].sort((a, b) => a.minBalance - b.minBalance);
  let current = sorted[0] ?? ACHIEVEMENT_TIERS[0];
  for (const tier of sorted) {
    if (balance >= tier.minBalance) current = tier;
  }
  return current;
}

type TierGradient = {
  from: string;
  to: string;
};

type TierBackground =
  | { mode: 'legacy' }
  | { mode: 'gradient'; gradient: TierGradient };

function hexToRgb(hex: string) {
  const c = hex.trim();
  if (!c.startsWith('#') || c.length !== 7) return null;
  const r = Number.parseInt(c.slice(1, 3), 16);
  const g = Number.parseInt(c.slice(3, 5), 16);
  const b = Number.parseInt(c.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const to2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function mixRgb(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    r: a.r + (b.r - a.r) * clamped,
    g: a.g + (b.g - a.g) * clamped,
    b: a.b + (b.b - a.b) * clamped,
  };
}

function accentTextFromHex(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#FFFFFF';
  const lum = relativeLuminance(rgb);
  if (lum < 0.15) return rgbToHex(mixRgb(rgb, { r: 255, g: 255, b: 255 }, 0.78));
  if (lum < 0.25) return rgbToHex(mixRgb(rgb, { r: 255, g: 255, b: 255 }, 0.62));
  if (lum < 0.35) return rgbToHex(mixRgb(rgb, { r: 255, g: 255, b: 255 }, 0.46));
  return hex.toUpperCase();
}

function resolveTierBackground(achievement: { id?: string; title?: string }): TierBackground {
  const id = String(achievement?.id || '').toLowerCase();
  const title = String(achievement?.title || '').toLowerCase();
  const key = id || title;

  if (key.includes('starter') || title.includes('starter')) {
    return { mode: 'legacy' };
  }
  if (key.includes('bronze') || title.includes('bronze')) {
    return { mode: 'gradient', gradient: { from: '#3C240C', to: '#110A03' } };
  }
  if (key.includes('gold') || title.includes('gold')) {
    return { mode: 'gradient', gradient: { from: '#3F330E', to: '#120E03' } };
  }
  if (key.includes('platinum') || title.includes('platinum')) {
    return { mode: 'gradient', gradient: { from: '#2F3540', to: '#0F1216' } };
  }
  if (key.includes('black') || title.includes('black')) {
    return { mode: 'gradient', gradient: { from: '#2E2E2E', to: '#050505' } };
  }
  if (key.includes('sapphire')) {
    return { mode: 'gradient', gradient: { from: '#142946', to: '#060B14' } };
  }
  if (key.includes('diamond') || title.includes('disciplina')) {
    return { mode: 'gradient', gradient: { from: '#0B1A33', to: '#02050C' } };
  }

  return { mode: 'legacy' };
}

function resolveTierAccent(achievement: { id?: string; title?: string }) {
  const id = String(achievement?.id || '').toLowerCase();
  const title = String(achievement?.title || '').toLowerCase();
  const key = id || title;

  if (key.includes('starter') || title.includes('starter')) {
    const progress = '#22C55E';
    return { progress, linkColor: accentTextFromHex(progress) };
  }
  if (key.includes('black') || title.includes('black')) {
    const progress = '#121212';
    return { progress, linkColor: accentTextFromHex(progress) };
  }
  if (key.includes('bronze') || title.includes('bronze')) {
    const progress = '#6B3F16';
    return { progress, linkColor: accentTextFromHex(progress) };
  }
  if (key.includes('gold') || title.includes('gold')) {
    const progress = '#6B561A';
    return { progress, linkColor: accentTextFromHex(progress) };
  }
  if (key.includes('platinum') || title.includes('platinum')) {
    const progress = '#5A6475';
    return { progress, linkColor: accentTextFromHex(progress) };
  }
  if (key.includes('sapphire')) {
    const progress = '#2B4F86';
    return { progress, linkColor: accentTextFromHex(progress) };
  }
  if (key.includes('diamond') || title.includes('disciplina')) {
    const progress = '#24406D';
    return { progress, linkColor: accentTextFromHex(progress) };
  }

  const progress = '#2B4F86';
  return { progress, linkColor: accentTextFromHex(progress) };
}

function BankrollStatusPill() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [nextTarget, setNextTarget] = useState<number | null>(null);
  const [testAchievementIndex, setTestAchievementIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setHasError(false);

      try {
        const res = await fetch('/api/bankroll/summary', { cache: 'no-store' });
        const summary: BankrollSummary | null = res.ok ? await res.json() : null;
        const computedBalance = Number(summary?.balance ?? 0) || 0;
        const computedTarget = computeNextMilestone(computedBalance, DEFAULT_MILESTONES);

        if (!isMounted) return;
        setBalance(computedBalance);
        setNextTarget(computedTarget);
      } catch {
        if (!isMounted) return;
        setHasError(true);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const interval = window.setInterval(() => {
      setTestAchievementIndex((idx) => (idx + 1) % ACHIEVEMENT_TEST_SEQUENCE.length);
    }, 1600);
    return () => window.clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="h-9 w-[300px] rounded-xl border border-[#16303d] bg-[#0b1a21] px-3 py-2 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.75)]">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full bg-white/10" />
              <Skeleton className="h-4 w-24 rounded bg-white/10" />
            </div>
            <Skeleton className="h-2 w-full rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (hasError || typeof balance !== 'number' || typeof nextTarget !== 'number') {
    return (
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-center gap-2"
      >
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-sm text-muted-foreground font-sans">Sistema ativo</span>
      </motion.div>
    );
  }

  const progressPercentage = Math.min(100, Math.max(0, (balance / nextTarget) * 100));
  const achievement =
    process.env.NODE_ENV === 'development'
      ? ACHIEVEMENT_TEST_SEQUENCE[testAchievementIndex] ?? ACHIEVEMENT_TEST_SEQUENCE[0]
      : resolveAchievementTier(balance);
  const tierBackground = resolveTierBackground(achievement);
  const tierAccent = resolveTierAccent(achievement);

  return (
    <div className="block w-[300px]">
      <div
        className="relative overflow-visible rounded-[5px] shadow-[0_18px_45px_-22px_rgba(0,0,0,0.9)]"
        style={
          tierBackground.mode === 'gradient'
            ? { backgroundImage: `linear-gradient(90deg, ${tierBackground.gradient.from}, ${tierBackground.gradient.to})` }
            : { backgroundImage: 'linear-gradient(90deg, #0b2a1a, #071c12)', backgroundColor: '#071c12' }
        }
      >
        <div className="relative min-h-[72px] px-3 py-2 pl-11">
          <div className="absolute -left-8 top-1/2 -translate-y-1/2">
            <Image
              src={achievement.imageSrc}
              alt={achievement.title}
              width={60}
              height={60}
              className="h-[60px] w-[60px] object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.55)]"
              priority
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="shrink-0 font-sans text-[13px] font-bold text-white">
              {achievement.title}
            </span>
            <div className="flex min-w-0 items-center justify-end gap-2">
              <span className="shrink-0 font-sans text-[10px] font-normal text-white/55">
                Seu Saldo
              </span>
              <span className="truncate font-sans text-[13px] font-bold text-white">
                {formatBRL(balance)}
              </span>
            </div>
          </div>

          <div className="mt-1.5 h-[4px] w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="relative h-full overflow-hidden rounded-full"
              style={{ width: `${progressPercentage}%`, backgroundColor: tierAccent.progress }}
            >
              <div className="sofia-pill-progress-shimmer absolute inset-0" />
            </div>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 font-sans text-[10px] font-normal text-white/55">
                Próximo Passo:
              </span>
              <span className="truncate font-sans text-[13px] font-bold text-white">
                {formatMilestoneLabel(nextTarget)}
              </span>
            </div>
            <Link
              href="/bankroll"
              className="shrink-0 font-sans text-[10px] font-bold underline-offset-2 hover:underline hover:opacity-90"
              style={{ color: tierAccent.linkColor }}
            >
              Ver Banca
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-24 border-b" style={{backgroundColor: '#151516'}}>
      <div className="flex h-full items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Center - Welcome message */}
        <div className="flex-1 flex justify-start">
          <div className="hidden sm:block">
            {/* Welcome message */}
            <div className="text-xs text-gray-400 font-sans">
              Olá, <span className="text-green-500 font-medium">{getFirstName(user?.name)}</span>! Hoje é {getCurrentDateFormatted()}, dia de {getDailyWelcomePhrase()}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="-mt-0.5">
            <BankrollStatusPill />
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                  <AvatarFallback>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none font-heading">{user?.name || 'Usuário'}</p>
                  <p className="text-xs leading-none text-muted-foreground font-sans">
                    {user?.email || 'N/A'}
                  </p>
                  <Badge variant="outline" className="w-fit mt-1 font-sans">
                    Básico
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-sans">Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <span className="font-sans">Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <span className="font-sans">Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
