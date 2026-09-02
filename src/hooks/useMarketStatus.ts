'use client';

import { useState, useEffect } from 'react';
import { isMarketOpen } from '@/services/market/status';

export function useMarketStatus() {
  const [status, setStatus] = useState(isMarketOpen());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(isMarketOpen());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
