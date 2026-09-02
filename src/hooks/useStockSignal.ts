'use client';

import { useState } from 'react';

export function useStockSignal(symbol: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSignal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/signal/${symbol}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, fetchSignal };
}
