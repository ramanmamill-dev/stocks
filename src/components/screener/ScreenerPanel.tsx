'use client';

import { useState } from 'react';
import type { SignalType, ScreenerFilter } from '@/types/signal';

interface Props {
  filters: ScreenerFilter;
  onChange: (filters: ScreenerFilter) => void;
  onApply: () => void;
}

const SIGNAL_OPTIONS: { value: SignalType | 'ANY'; label: string }[] = [
  { value: 'ANY', label: 'Any Signal' },
  { value: 'STRONG_BUY', label: 'Strong Buy' },
  { value: 'BUY', label: 'Buy' },
  { value: 'HOLD', label: 'Hold' },
  { value: 'SELL', label: 'Sell' },
  { value: 'STRONG_SELL', label: 'Strong Sell' },
];

export function ScreenerPanel({ filters, onChange, onApply }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof ScreenerFilter, value: unknown) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      signal: 'ANY',
      peRatio: undefined,
      roe: undefined,
      debtToEquity: undefined,
      rsi: undefined,
      marketCap: undefined,
      sector: undefined,
      exchange: 'ANY',
    });
  };

  const hasActiveFilters = filters.signal !== 'ANY' || filters.peRatio || filters.roe || filters.debtToEquity || filters.rsi || filters.marketCap || filters.sector || filters.exchange !== 'ANY';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#0B0E11] mb-1">
            Signal
          </label>
          <select
            value={filters.signal || 'ANY'}
            onChange={(e) => updateFilter('signal', e.target.value)}
            className="w-full px-3 py-2 border border-[#E0E3EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00B386] focus:border-transparent"
          >
            {SIGNAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {showAdvanced && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0B0E11] mb-1">
                  P/E Ratio (min-max)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="min"
                    value={filters.peRatio?.min ?? ''}
                    onChange={(e) =>
                      updateFilter('peRatio', {
                        ...filters.peRatio,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="flex-1 px-2 py-1.5 border border-[#E0E3EB] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#00B386]"
                  />
                  <input
                    type="number"
                    placeholder="max"
                    value={filters.peRatio?.max ?? ''}
                    onChange={(e) =>
                      updateFilter('peRatio', {
                        ...filters.peRatio,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="flex-1 px-2 py-1.5 border border-[#E0E3EB] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#00B386]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B0E11] mb-1">
                  RSI (min-max)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="min"
                    value={filters.rsi?.min ?? ''}
                    onChange={(e) =>
                      updateFilter('rsi', {
                        ...filters.rsi,
                        min: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="flex-1 px-2 py-1.5 border border-[#E0E3EB] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#00B386]"
                  />
                  <input
                    type="number"
                    placeholder="max"
                    value={filters.rsi?.max ?? ''}
                    onChange={(e) =>
                      updateFilter('rsi', {
                        ...filters.rsi,
                        max: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="flex-1 px-2 py-1.5 border border-[#E0E3EB] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#00B386]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B0E11] mb-1">
                Sector
              </label>
              <input
                type="text"
                placeholder="e.g., Technology, Financial"
                value={filters.sector ?? ''}
                onChange={(e) => updateFilter('sector', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-[#E0E3EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00B386] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B0E11] mb-1">
                Exchange
              </label>
              <div className="flex gap-2">
                {(['ANY', 'NSE', 'BSE'] as const).map((exchange) => (
                  <button
                    key={exchange}
                    onClick={() => updateFilter('exchange', exchange)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      (filters.exchange || 'ANY') === exchange
                        ? 'bg-[#00B386] text-white'
                        : 'bg-gray-100 text-[#787B86] hover:bg-gray-200'
                    }`}
                  >
                    {exchange}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-[#00B386] hover:text-[#009970] transition-colors"
          >
            {showAdvanced ? 'Hide Advanced' : 'Advanced Filters'}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#787B86] hover:text-[#F23645] transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <button
          onClick={onApply}
          className="w-full px-4 py-2 bg-[#00B386] text-white rounded-md text-sm font-medium hover:bg-[#009970] transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
