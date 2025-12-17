'use client';

import { useEffect } from 'react';
import { extensionDetector } from '@/lib/extension-detector';

export function ExtensionHandler() {
  useEffect(() => {
    // Aplicar workarounds para extensões detectadas
    extensionDetector.applyWorkarounds();

    // Log de extensões detectadas (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      const report = extensionDetector.generateReport();
      if (report !== 'Nenhuma extensão interferente detectada.') {
        console.warn('[EXTENSION-DETECTOR]', report);
      }
    }

    // Verificar interferência ativa
    if (extensionDetector.hasActiveInterference()) {
      console.warn('[EXTENSION-DETECTOR] Extensões com alta interferência detectadas. Considere testar em modo incógnito.');
    }
  }, []);

  // Este componente não renderiza nada visível
  return null;
}