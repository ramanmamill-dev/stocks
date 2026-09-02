'use client';

import type { SignalResult } from '@/types/signal';
import { SignalBadge } from './SignalBadge';

interface Props {
  signal: SignalResult;
}

export function SignalCard({ signal }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Signal</h3>
        <SignalBadge signal={signal.signal} />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-[#787B86] mb-1">
          <span>Confidence</span>
          <span>{signal.confidence}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-[#00B386] transition-all"
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-[#787B86]">Reasoning</p>
          <p className="text-sm mt-1">{signal.reasoning}</p>
        </div>

        {signal.indicators && (
          <div className="pt-3 border-t border-[#E0E3EB]">
            <p className="text-sm font-medium text-[#787B86] mb-2">Indicators</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {signal.indicators.rsi !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#787B86]">RSI</span>
                  <span className="font-medium">{signal.indicators.rsi.toFixed(1)}</span>
                </div>
              )}
              {signal.indicators.macd !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#787B86]">MACD</span>
                  <span className="font-medium">{signal.indicators.macd.toFixed(2)}</span>
                </div>
              )}
              {signal.indicators.sma20 !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#787B86]">SMA 20</span>
                  <span className="font-medium">{signal.indicators.sma20.toFixed(2)}</span>
                </div>
              )}
              {signal.indicators.sma50 !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#787B86]">SMA 50</span>
                  <span className="font-medium">{signal.indicators.sma50.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#E0E3EB] text-xs text-[#787B86]">
          Generated: {new Date(signal.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </div>
      </div>
    </div>
  );
}
