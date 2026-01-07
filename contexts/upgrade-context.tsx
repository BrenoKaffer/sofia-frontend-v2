'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PremiumGateModal } from '@/components/modals/premium-gate-modal';

interface UpgradeContextType {
  openUpgradeModal: (featureName?: string) => void;
  closeUpgradeModal: () => void;
  isUpgradeModalOpen: boolean;
}

const UpgradeContext = createContext<UpgradeContextType | undefined>(undefined);

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [featureName, setFeatureName] = useState<string | undefined>(undefined);

  const openUpgradeModal = (feature?: string) => {
    setFeatureName(feature);
    setIsOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsOpen(false);
    setTimeout(() => setFeatureName(undefined), 300);
  };

  return (
    <UpgradeContext.Provider value={{ openUpgradeModal, closeUpgradeModal, isUpgradeModalOpen: isOpen }}>
      {children}
      <PremiumGateModal 
        isOpen={isOpen} 
        onClose={closeUpgradeModal} 
        featureName={featureName} 
      />
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  const context = useContext(UpgradeContext);
  if (context === undefined) {
    throw new Error('useUpgrade must be used within an UpgradeProvider');
  }
  return context;
}
