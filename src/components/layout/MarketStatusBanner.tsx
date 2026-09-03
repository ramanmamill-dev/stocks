'use client';

import { useMarketStatus } from '@/hooks/useMarketStatus';
import { useState, useEffect } from 'react';
import { formatIST } from '@/lib/utils';

export default function MarketStatusBanner() {
  const { open, message } = useMarketStatus();
  const [displayTime, setDisplayTime] = useState('');

  useEffect(() => {
    setDisplayTime(formatIST(new Date()));
  }, []);

  if (open) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-[#00E6A0]/10 border-b border-[#00E6A0] text-center py-2 px-4 text-sm text-[#00B386]"
      >
        <span className="font-medium">Market Open</span>
        <span className="mx-2">·</span>
        <span>Live market data</span>
        <span className="mx-2">·</span>
        <span className="text-[#787B86]">
          Updated: {displayTime}
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#F23645]/10 border-b border-[#F23645] text-center py-2 px-4 text-sm text-[#F23645]"
    >
      <span className="font-medium">{message}</span>
      <span className="mx-2">·</span>
      <span>Showing Last Traded Price (EOD)</span>
      <span className="mx-2">·</span>
      <span className="text-[#787B86]">
        Updated: {displayTime}
      </span>
    </div>
  );
}
