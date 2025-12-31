'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  CreditCard,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Início', href: '/dashboard' },
  { name: 'Aulas', href: '/insights' },
  { name: 'Estratégias', href: '/strategies' },
  { name: 'Comunidade', href: '/community' },
  { name: 'Ao Vivo', href: '/live' },
];

export function NetflixTopBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500 ease-in-out px-6 md:px-16 h-16 flex items-center justify-between",
        isScrolled 
          ? "bg-[#0f1113]/60 backdrop-blur-md border-b border-white/5 shadow-lg" 
          : "bg-gradient-to-b from-black/80 to-transparent"
      )}
    >
      {/* Left Section: Logo + Nav */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="shrink-0 hover:opacity-80 transition-opacity">
          <div className="relative w-[135px] h-[32px]">
            <Image
              src="/logo_sofia.png"
              alt="SOFIA"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white/80",
                pathname === item.href ? "text-white font-bold" : "text-gray-300"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Center Section: Search (Optional/Expandable) */}
      <div className={`flex-1 max-w-xl mx-4 transition-all duration-300 ${isSearchOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 hidden md:block'}`}>
         {isSearchOpen && (
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-white transition-colors" />
              <Input 
                placeholder="Buscar aulas, estratégias ou conceitos..." 
                className="bg-black/40 border-white/10 text-white placeholder:text-gray-500 pl-10 h-9 focus-visible:ring-emerald-500/50 rounded-full backdrop-blur-sm"
                autoFocus
                onBlur={() => !isScrolled && setIsSearchOpen(false)}
              />
            </div>
         )}
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Search Toggle (Mobile/Desktop) */}
        {!isSearchOpen && (
           <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setIsSearchOpen(true)}>
             <Search className="w-5 h-5" />
           </Button>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-black" />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer group">
              <Avatar className="w-8 h-8 border border-white/10 group-hover:border-white/30 transition-colors rounded-md">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-md">
                  {user?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-white group-hover:rotate-180 transition-transform duration-300" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-950/95 backdrop-blur-xl border-white/10 text-white">
            <DropdownMenuLabel>
               <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
               </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Minha Conta</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Assinatura</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={logout} className="text-red-400 focus:bg-red-950/30 focus:text-red-300 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
