'use client';

import { useState, useEffect } from 'react';
import { isMarketOpen } from '@/services/market/status';
import type { MarketStatus } from '@/types/signal';

/**
 * Client-side hook that re-evaluates market status every minute.
 */
export function useMarketStatus(): MarketStatus {
  const [status, setStatus] = useState<MarketStatus>(() => isMarketOpen());

  useEffect(() => {
    const tick = () => setStatus(isMarketOpen());
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
