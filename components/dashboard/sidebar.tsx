'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  FileText, 
  User,
  Brain,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  Target,
  History,
  Dices,
  Wrench,
  HelpCircle,
  TestTubes,
  Puzzle,
  Upload,
  Download,
  Globe,
  Rocket,
  TrendingUp,
  Wallet,
  Trophy,
  Bell,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';

const navigationSections = [
  {
    title: 'Operação',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Registros de Padrões', href: '/registros-de-padroes', icon: Dices },
      { name: 'Histórico das Roletas', href: '/roulette-status', icon: History },
      { name: 'Estratégias Ativas', href: '/strategies', icon: Target },
      { name: 'Padrões Personalizados', href: '/custom-signals', icon: Bell },
    ]
  },
  {
    title: 'Performance Pessoal',
    items: [
      { name: 'Meu Lucro', href: '/profit', icon: TrendingUp },
      { name: 'Gestão de Banca', href: '/bankroll', icon: Wallet },
      { name: 'Metas Diárias', href: '/daily-goals', icon: Trophy },
      { name: 'Relatórios e Análises', href: '/analytics', icon: BarChart3 },
    ]
  },
  {
    title: 'Ferramentas Avançadas',
    items: [
      { name: 'Builder de Estratégias', href: '/builder', icon: Puzzle },
      { name: 'Simulador de Estratégias', href: '/simulator', icon: Activity },
      { name: 'Importar Dados', href: '/import', icon: Upload },
      { name: 'Exportar Relatórios', href: '/export', icon: Download },
      { name: 'Log do Sistema', href: '/logs', icon: FileText },
      { name: 'Métricas de Logs', href: '/logs/metrics', icon: BarChart3 },
      { name: 'Laboratório (Beta)', href: '/lab', icon: TestTubes },
    ]
  },
  {
    title: 'Conta e Configurações',
    items: [
      { name: 'Configurações', href: '/settings', icon: Settings },
      { name: 'Backup e Restauração', href: '/backup', icon: Database },
      { name: 'Meu Perfil', href: '/profile', icon: User },
    ]
  },
  {
    title: 'Ajuda e Comunidade',
    items: [
      { name: 'Central de Ajuda', href: '/help', icon: HelpCircle },
      { name: 'Comunidade', href: '/community', icon: Globe },
    ]
  },
  {
    title: 'Plano',
    items: [
      { name: 'Plano Premium', href: '/upgrade', icon: Rocket },
    ]
  }
];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navigationSections.forEach(section => {
      initialState[section.title] = true;
    });
    return initialState;
  });
  const { user } = useAuth();

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent">
            <Brain className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-xl font-bold font-urbanist bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent transition-opacity duration-200">
                SOFIA
              </h1>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto hidden lg:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-4">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {/* Section Header */}
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between px-2 py-1 text-xs font-semibold font-urbanist text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{section.title}</span>
                  {expandedSections[section.title] ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
              
              {/* Section Items */}
              {(collapsed || expandedSections[section.title]) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    // Mapear data-testid para links específicos exigidos pelos testes E2E
                    const testIdMap: Record<string, string> = {
                      '/dashboard': 'nav-dashboard',
                      '/analytics': 'nav-analytics',
                      '/settings': 'nav-settings',
                    };
                    const dataTestId = testIdMap[item.href];
                    return (
                      <Link key={item.name} href={item.href}>
                        <div
                          data-testid={dataTestId}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium font-sans transition-all hover:scale-[1.02]',
                            isActive
                              ? 'bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/20'
                              : 'text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground'
                          )}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!collapsed && (
                            <span className="transition-opacity duration-200">
                              {item.name}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        {!collapsed && (
          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 p-3 transition-opacity duration-200">
            <h3 className="text-sm font-medium font-urbanist">Versão Pro</h3>
            <p className="text-xs text-muted-foreground mt-1 font-jakarta">
              Recursos avançados de IA
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block border-r bg-card/50 backdrop-blur-sm"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}