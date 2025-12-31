'use client';

import { Bell, Menu, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertNotification } from '@/components/alerts/alert-notification';
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

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b" style={{backgroundColor: '#151516'}}>
      <div className="flex h-full items-center justify-between px-6">
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
          {/* Status indicator */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2"
          >
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-muted-foreground font-sans">Sistema ativo</span>
          </motion.div>

          {/* Notifications */}
          <AlertNotification />

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
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-sans">Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
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