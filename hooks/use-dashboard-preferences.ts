'use client';

import { useState, useEffect } from 'react';
import { useSofiaPreferences } from '@/contexts/sofia-context';

interface DashboardPreferences {
  showStatsCards: boolean;
  showLiveSignals: boolean;
  showPerformanceChart: boolean;
  showRouletteStatus: boolean;
  showRecentActivity: boolean;
}

const defaultPreferences: DashboardPreferences = {
  showStatsCards: true,
  showLiveSignals: true,
  showPerformanceChart: true,
  showRouletteStatus: true,
  showRecentActivity: true,
};

export function useDashboardPreferences() {
  const { preferences: userPreferences, updatePreferences: updateUserPreferences } = useSofiaPreferences();
  const [preferences, setPreferences] = useState<DashboardPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar preferências com o contexto SOFIA
  useEffect(() => {
    if (userPreferences?.dashboard_config) {
      setPreferences({
        showStatsCards: userPreferences.dashboard_config.stats_cards_visible ?? true,
        showLiveSignals: userPreferences.dashboard_config.live_signals_visible ?? true,
        showPerformanceChart: userPreferences.dashboard_config.performance_chart_visible ?? true,
        showRouletteStatus: userPreferences.dashboard_config.roulette_status_visible ?? true,
        showRecentActivity: userPreferences.dashboard_config.recent_activity_visible ?? true,
      });
    } else {
      setPreferences(defaultPreferences);
    }
    setLoading(false);
  }, [userPreferences]);

  // Salvar preferências
  const updatePreferences = async (newPreferences: Partial<DashboardPreferences>) => {
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      // Atualizar via contexto SOFIA
      await updateUserPreferences({
        dashboard_config: {
          stats_cards_visible: updatedPreferences.showStatsCards,
          live_signals_visible: updatedPreferences.showLiveSignals,
          performance_chart_visible: updatedPreferences.showPerformanceChart,
          roulette_status_visible: updatedPreferences.showRouletteStatus,
          recent_activity_visible: updatedPreferences.showRecentActivity,
        }
      });

      setPreferences(updatedPreferences);
      return true;
    } catch (err) {
      // Erro ao salvar preferências do dashboard
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      return false;
    }
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
  };
}