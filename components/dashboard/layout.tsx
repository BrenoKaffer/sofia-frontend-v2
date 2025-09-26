'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { OnboardingTrigger } from '@/components/onboarding/onboarding-trigger';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 lg:p-8 min-h-full flex flex-col"
          >
            <div className="flex-1">
              {children}
            </div>
            
            {/* Footer */}
            <footer className="border-t bg-background px- py-6">
              <div className="text-center text-[10px] text-muted-foreground">
                © 2025 Umbrella Tecnologia. - Todos os direitos reservados.
              </div>
            </footer>
          </motion.div>
        </main>
      </div>
      
      {/* Onboarding Trigger */}
      <OnboardingTrigger />
    </div>
  );
}