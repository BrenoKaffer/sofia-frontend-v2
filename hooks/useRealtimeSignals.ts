'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { apiClient } from '@/lib/api-client';

export type RealtimeStatus = 'connected' | 'reconnecting' | 'disconnected';

interface UseRealtimeSignalsOptions {
  tableId?: string;
  confidenceMin?: number;
  limit?: number;
  batchMs?: number; // debounce/batch window for high-volume updates
}

interface GeneratedSignal {
  id: string;
  strategy_id: string;
  strategy_name?: string;
  table_id: string;
  bet_numbers: (string | number)[];
  suggested_units?: number;
  confidence_level: number;
  confidence_score?: number;
  timestamp_generated: string;
  expires_at: string;
  expected_return?: number;
  is_validated?: boolean;
  type?: string;
  message?: string;
  status?: string;
}

export function useRealtimeSignals(options: UseRealtimeSignalsOptions = {}) {
  const { tableId, confidenceMin = 0, limit = 50, batchMs = 500 } = options;
  const [signals, setSignals] = useState<GeneratedSignal[]>([]);
  const [lastUpdateTs, setLastUpdateTs] = useState<number | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>('disconnected');

  const bufferRef = useRef<GeneratedSignal[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedConnectRef = useRef<boolean>(false);

  // Underlying WS client
  const { isConnected, status: wsStatus, subscribe } = useWebSocket({ autoConnect: true });

  // Map WS status → RealtimeStatus
  useEffect(() => {
    const mapped: RealtimeStatus = wsStatus === 'connected'
      ? 'connected'
      : wsStatus === 'reconnecting'
      ? 'reconnecting'
      : 'disconnected';
    setStatus(mapped);
  }, [wsStatus]);

  // Optional audit log when connection established
  useEffect(() => {
    if (isConnected && !hasLoggedConnectRef.current) {
      hasLoggedConnectRef.current = true;
      // Best-effort fire-and-forget
      apiClient.post('/logs', {
        level: 'info',
        source: 'frontend',
        category: 'realtime',
        message: 'Conectado ao Realtime (WebSocket)',
        metadata: { tableId }
      }).catch(() => void 0);
    }
  }, [isConnected, tableId]);

  // Helper to normalize incoming payloads
  const normalizeSignal = useCallback((raw: any): GeneratedSignal | null => {
    if (!raw) return null;
    const s: GeneratedSignal = {
      id: String(raw.id ?? `${Date.now()}_${Math.random().toString(36).slice(2,6)}`),
      strategy_id: String(raw.strategy_id ?? raw.strategy_name ?? 'unknown'),
      strategy_name: raw.strategy_name,
      table_id: String(raw.table_id ?? raw.tableId ?? ''),
      bet_numbers: Array.isArray(raw.bet_numbers) ? raw.bet_numbers : Array.isArray(raw.suggested_bets) ? raw.suggested_bets : [],
      suggested_units: typeof raw.suggested_units === 'number' ? raw.suggested_units : undefined,
      confidence_level: typeof raw.confidence_level === 'number' ? raw.confidence_level : (typeof raw.confidence === 'number' ? raw.confidence : 0),
      confidence_score: typeof raw.confidence_score === 'number' ? raw.confidence_score : undefined,
      timestamp_generated: String(raw.timestamp_generated ?? raw.created_at ?? new Date().toISOString()),
      expires_at: String(raw.expires_at ?? new Date(Date.now() + 60_000).toISOString()),
      expected_return: typeof raw.expected_return === 'number' ? raw.expected_return : undefined,
      is_validated: !!raw.is_validated,
      type: raw.type,
      message: raw.message,
      status: raw.status
    };
    return s;
  }, []);

  // Batch-flush function
  const flushBuffer = useCallback(() => {
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
    const buffer = bufferRef.current;
    if (!buffer.length) return;

    setSignals(prev => {
      // prepend new batch, enforce limit
      const merged = [...buffer, ...prev];
      // Deduplicate by id
      const seen = new Set<string>();
      const unique = [] as GeneratedSignal[];
      for (const item of merged) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          unique.push(item);
        }
      }
      return unique.slice(0, limit);
    });
    bufferRef.current = [];
    setLastUpdateTs(Date.now());
  }, [limit]);

  // Subscribe to realtime signals channel
  useEffect(() => {
    const unsubscribe = subscribe('signal', (data: any) => {
      // Normalize
      const normalized = normalizeSignal(data);
      if (!normalized) return;

      // Filter by tableId
      if (tableId && normalized.table_id !== tableId) return;
      // Filter by confidence
      if (normalized.confidence_level < confidenceMin) return;

      // Push to buffer
      bufferRef.current.push(normalized);

      // Schedule flush (debounced)
      if (!flushTimeoutRef.current) {
        flushTimeoutRef.current = setTimeout(flushBuffer, Math.max(100, batchMs));
      }
    });

    return () => {
      // Cleanup
      unsubscribe?.();
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }
      bufferRef.current = [];
    };
  }, [subscribe, tableId, confidenceMin, batchMs, flushBuffer, normalizeSignal]);

  // Memo exposed values
  const exposed = useMemo(() => ({ signals, status, lastUpdate: lastUpdateTs }), [signals, status, lastUpdateTs]);
  return exposed;
}