'use client';

import { useMarketStatus } from '@/hooks/useMarketStatus';

export default function MarketStatusBanner() {
  const { open, message, timestamp } = useMarketStatus();

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
          Updated:{' '}
          {new Date(timestamp).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
          })}
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
        Updated:{' '}
        {new Date(timestamp).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
        })}
      </span>
    </div>
  );
}
