'use client';

import React from 'react';
import { getMonitoringService } from '@/lib/monitoring';

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    try {
      console.log('MonitoringProvider: Iniciando verificações...');
      
      if (typeof getMonitoringService !== 'function') {
        console.error('getMonitoringService não é uma função');
        return;
      }
      
      const service = getMonitoringService();
      console.log('MonitoringProvider: Serviço inicializado com sucesso', service);
    } catch (error) {
      console.error('MonitoringProvider: Erro ao inicializar:', error);
    }
  }, []);

  return <>{children}</>;
}