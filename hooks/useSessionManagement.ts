import { useState, useEffect, useCallback } from 'react';
import { Session, Strategy, SessionTemplate, SessionMetrics, SessionLog } from '@/types/session-management';

export function useSessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadSessions();
    loadStrategies();
    loadTemplates();
    loadMetrics();
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sessions');
      if (!response.ok) throw new Error('Erro ao carregar sessões');
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStrategies = useCallback(async () => {
    try {
      const response = await fetch('/api/strategies');
      if (!response.ok) throw new Error('Erro ao carregar estratégias');
      const data = await response.json();
      setStrategies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estratégias');
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/session-templates');
      if (!response.ok) throw new Error('Erro ao carregar templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar templates');
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/session-metrics');
      if (!response.ok) throw new Error('Erro ao carregar métricas');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas');
    }
  }, []);

  // Gerenciamento de sessões
  const createSession = useCallback(async (sessionData: Partial<Session>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      if (!response.ok) throw new Error('Erro ao criar sessão');
      const newSession = await response.json();
      setSessions(prev => [...prev, newSession]);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sessão');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<Session>) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Erro ao atualizar sessão');
      const updatedSession = await response.json();
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar sessão');
      throw err;
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar sessão');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar sessão');
      throw err;
    }
  }, []);

  const startSession = useCallback(async (sessionId: string) => {
    return updateSession(sessionId, { status: 'active', startTime: new Date() });
  }, [updateSession]);

  const pauseSession = useCallback(async (sessionId: string) => {
    return updateSession(sessionId, { status: 'paused' });
  }, [updateSession]);

  const stopSession = useCallback(async (sessionId: string) => {
    return updateSession(sessionId, { status: 'stopped', endTime: new Date() });
  }, [updateSession]);

  // Gerenciamento de estratégias
  const createStrategy = useCallback(async (strategyData: Omit<Strategy, 'id' | 'performance'>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategyData)
      });
      if (!response.ok) throw new Error('Erro ao criar estratégia');
      const newStrategy = await response.json();
      setStrategies(prev => [...prev, newStrategy]);
      return newStrategy;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar estratégia');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStrategy = useCallback(async (strategyId: string, updates: Partial<Strategy>) => {
    try {
      const response = await fetch(`/api/strategies/${strategyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Erro ao atualizar estratégia');
      const updatedStrategy = await response.json();
      setStrategies(prev => prev.map(s => s.id === strategyId ? updatedStrategy : s));
      return updatedStrategy;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar estratégia');
      throw err;
    }
  }, []);

  // Logs de sessão
  const addSessionLog = useCallback(async (sessionId: string, log: Omit<SessionLog, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
      if (!response.ok) throw new Error('Erro ao adicionar log');
      const newLog = await response.json();
      
      // Atualizar sessão local com novo log
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, logs: [...session.logs, newLog] }
          : session
      ));
      
      return newLog;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar log');
      throw err;
    }
  }, []);

  // Utilitários
  const getActiveSession = useCallback(() => {
    return sessions.find(session => session.status === 'active');
  }, [sessions]);

  const getSessionsByStrategy = useCallback((strategyId: string) => {
    return sessions.filter(session => session.strategy.id === strategyId);
  }, [sessions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    sessions,
    strategies,
    templates,
    metrics,
    loading,
    error,
    
    // Ações de sessão
    createSession,
    updateSession,
    deleteSession,
    startSession,
    pauseSession,
    stopSession,
    
    // Ações de estratégia
    createStrategy,
    updateStrategy,
    
    // Logs
    addSessionLog,
    
    // Utilitários
    getActiveSession,
    getSessionsByStrategy,
    clearError,
    
    // Recarregar dados
    loadSessions,
    loadStrategies,
    loadTemplates,
    loadMetrics
  };
}