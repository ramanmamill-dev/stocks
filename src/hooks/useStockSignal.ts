'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SignalResult } from '@/types/signal';
import type { Timeframe } from '@/types/stock';

export interface StockSignalData {
  symbol: string;
  marketStatus: 'OPEN' | 'CLOSED';
  marketMessage: string;
  marketReason: string | null;
  quote: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    dayHigh: number;
    dayLow: number;
    volume: number;
    isEOD: boolean;
    lastUpdated: string;
  };
  signal: SignalResult;
}

interface Return {
  data: StockSignalData | null;
  loading: boolean;
  error: string | null;
  fetchSignal: (timeframe?: Timeframe) => Promise<void>;
}

export function useStockSignal(symbol: string): Return {
  const [data, setData] = useState<StockSignalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignal = useCallback(async (timeframe?: Timeframe) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/signal/${symbol}${timeframe ? `?timeframe=${timeframe}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch signal (${res.status})`);
      }
      const json: StockSignalData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchSignal();
  }, [fetchSignal]);

  return { data, loading, error, fetchSignal };
}
