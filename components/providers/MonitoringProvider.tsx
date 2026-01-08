'use client';

import React from 'react';
import { getMonitoringService } from '@/lib/monitoring';
import { supabase } from '@/lib/supabase';

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

      supabase.auth.onAuthStateChange(async (_event, session) => {
        let userId: string | null = session?.user?.id || null
        try {
          if (session?.access_token && session?.refresh_token) {
            const maxAge = 60 * 60 * 24 * 7 // 7 dias
            document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${maxAge}; samesite=lax`
            document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=${maxAge}; samesite=lax`
          }
          if (!userId) return
        } catch { }
        const channel = supabase.channel('user_status_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles', filter: `user_id=eq.${userId}` }, payload => {
          try {
            const newData = (payload?.new as any) || {};
            
            // New Schema Cookies
            if (newData.status) document.cookie = `sofia_status=${newData.status}; path=/; max-age=${60 * 60 * 24 * 30}`;
            if (newData.plan) document.cookie = `sofia_plan=${newData.plan}; path=/; max-age=${60 * 60 * 24 * 30}`;
            if (newData.role) document.cookie = `sofia_role=${newData.role}; path=/; max-age=${60 * 60 * 24 * 30}`;
          } catch { }
        })
        await channel.subscribe()
      })
    } catch (error) {
      console.error('MonitoringProvider: Erro ao inicializar:', error);
    }
  }, []);

  return <>{children}</>;
}
