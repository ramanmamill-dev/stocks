'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SignalResult } from '@/types/signal';
import { getTopSignals } from '@/services/signals';

interface WatchlistItem {
  symbol: string;
  signal: SignalResult | null;
  loading: boolean;
}

interface Return {
  items: WatchlistItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWatchlist(symbols: string[] = []): Return {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (symbols.length === 0) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const watchlistItems: WatchlistItem[] = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const res = await fetch(`/api/signal/${symbol}`);
            if (!res.ok) throw new Error(`Failed to fetch ${symbol}`);
            const data = await res.json();
            return {
              symbol,
              signal: data.signal || null,
              loading: false,
            };
          } catch {
            return { symbol, signal: null, loading: false };
          }
        })
      );

      setItems(watchlistItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function useTopSignalsWatchlist(limit: number = 5): Return {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const signals = await getTopSignals(limit);
      const watchlistItems: WatchlistItem[] = signals.map((signal) => ({
        symbol: signal.symbol,
        signal,
        loading: false,
      }));
      setItems(watchlistItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
