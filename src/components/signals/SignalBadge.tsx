'use client';

import type { SignalType } from '@/types/signal';

const signalConfig: Record<SignalType, { label: string; color: string }> = {
  STRONG_BUY: { label: 'STRONG BUY', color: 'bg-[#00E6A0] text-black' },
  BUY: { label: 'BUY', color: 'bg-[#00B386] text-white' },
  HOLD: { label: 'HOLD', color: 'bg-[#F0B90B] text-black' },
  SELL: { label: 'SELL', color: 'bg-[#F23645] text-white' },
  STRONG_SELL: { label: 'STRONG SELL', color: 'bg-[#FF2D4B] text-white' },
};

export function SignalBadge({ signal }: { signal: SignalType }) {
  const config = signalConfig[signal];
  return (
    <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}
