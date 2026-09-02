'use client';

import { useState, Suspense } from 'react';
import type { Timeframe } from '@/types/stock';
import { useStockSignal } from '@/hooks/useStockSignal';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import { RSIChart } from '@/components/charts/RSIChart';
import { MACDChart } from '@/components/charts/MACDChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { SignalCard } from '@/components/signals/SignalCard';
import { SignalCardSkeleton } from '@/components/skeleton/SignalCardSkeleton';
import { sanitizeSymbol } from '@/lib/validators';
import { checkCircuit, classifyFreshness, STALENESS_POLICY } from '@/lib/utils';

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '1m', label: '1M' },
  { value: '5m', label: '5M' },
  { value: '15m', label: '15M' },
  { value: '1h', label: '1H' },
  { value: '1d', label: '1D' },
];

export default function StockDetailPage({ params }: { params: { symbol: string } }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1d');

  let symbol: string;
  let isValidSymbol = true;
  try {
    symbol = sanitizeSymbol(params.symbol);
  } catch {
    symbol = params.symbol;
    isValidSymbol = false;
  }

  const { data, loading, error, fetchSignal } = useStockSignal(symbol);

  if (!isValidSymbol) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
          <h1 className="text-xl font-semibold text-red-700">Invalid Symbol</h1>
          <p className="text-red-600 mt-2">
            &quot;{params.symbol}&quot; is not a valid stock symbol. Use format: SYMBOL.NS or SYMBOL.BO
          </p>
        </div>
      </div>
    );
  }

  const baseSymbol = symbol.replace('.NS', '').replace('.BO', '');

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    void fetchSignal(tf);
  };

  const mockCandles = [
    { time: 1704067200, open: 100, high: 105, low: 98, close: 103, volume: 1000000 },
    { time: 1704153600, open: 103, high: 108, low: 102, close: 106, volume: 1200000 },
    { time: 1704240000, open: 106, high: 110, low: 104, close: 108, volume: 1100000 },
    { time: 1704326400, open: 108, high: 112, low: 106, close: 110, volume: 1300000 },
    { time: 1704412800, open: 110, high: 115, low: 108, close: 112, volume: 1400000 },
  ];

  const mockRsiData = mockCandles.map((c) => ({ time: c.time, value: 50 + Math.random() * 30 }));
  const mockMacdData = mockCandles.map((c) => ({ time: c.time, value: Math.random() * 4 - 2 }));
  const mockSignalData = mockCandles.map((c) => ({ time: c.time, value: Math.random() * 4 - 2 }));
  const mockHistogramData = mockCandles.map((c) => ({
    time: c.time,
    value: Math.random() * 2,
    color: Math.random() > 0.5 ? '#00B386' : '#F23645',
  }));

  return (
    <div className="container mx-auto px-4 py-6" role="main">
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-[#787B86] hover:text-[#0B0E11] transition-colors"
          aria-label="Go back"
        >
          Back
        </button>
      </div>

      {data?.quote.isEOD && (
        <div
          className="bg-[#F23645]/10 border border-[#F23645] rounded-lg p-4 mb-6"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-[#F23645] font-medium">
            Market Closed — Showing Last Traded Price (EOD)
          </p>
        </div>
      )}

      {data?.quote.lastUpdated && (
        (() => {
          const freshness = classifyFreshness(data.quote.lastUpdated, data.quote.isEOD ? STALENESS_POLICY.holiday : STALENESS_POLICY.live);
          if (freshness === 'stale') {
            const age = (Date.now() - new Date(data.quote.lastUpdated).getTime()) / 60000;
            return (
              <div
                className="bg-[#F0B90B]/10 border border-[#F0B90B] rounded-lg p-3 mb-4"
                role="status"
                aria-live="polite"
              >
                <p className="text-xs text-[#F0B90B]">
                  Warning: Data is {age.toFixed(0)} minutes old (stale after 2 minutes).
                </p>
              </div>
            );
          }
          return null;
        })()
      )}

      {loading && (
        <div className="mb-6">
          <SignalCardSkeleton />
        </div>
      )}

      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {data?.quote && (
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0B0E11]" tabIndex={-1}>
                {baseSymbol}
              </h1>
              <p className="text-sm text-[#787B86]">{symbol}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">₹{data.quote.price.toLocaleString('en-IN')}</p>
              <p
                className={`text-sm ${data.quote.change >= 0 ? 'text-[#00B386]' : 'text-[#F23645]'}`}
                aria-label={data.quote.change >= 0 ? 'Price increased' : 'Price decreased'}
              >
                {data.quote.change >= 0 ? '+' : ''}{data.quote.change.toFixed(2)} ({data.quote.changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-[#787B86]">Timeframe:</span>
        <div className="flex gap-1" role="group" aria-label="Timeframe selector">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => handleTimeframeChange(tf.value)}
              aria-pressed={timeframe === tf.value}
              className={`px-3 py-1 text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#00B386] ${
                timeframe === tf.value
                  ? 'bg-[#00B386] text-white'
                  : 'bg-gray-100 text-[#787B86] hover:bg-gray-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-4">
            <CandlestickChart candles={mockCandles} />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-[#E0E3FB] p-4">
            <RSIChart data={mockRsiData} />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-4">
            <MACDChart
              macdData={mockMacdData}
              signalData={mockSignalData}
              histogramData={mockHistogramData}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-4">
            <VolumeChart candles={mockCandles} />
          </div>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<SignalCardSkeleton />}>
            {data?.signal && <SignalCard signal={data.signal} />}
          </Suspense>

          {data?.quote.previousClose && data?.quote.previousClose > 0 && (
            (() => {
              const circuit = checkCircuit(
                data.quote.previousClose,
                data.quote.price
              );
              return circuit.hit ? (
                <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        circuit.direction === 'upper'
                          ? 'bg-[#F23645] text-white'
                          : 'bg-[#00B386] text-white'
                      }`}
                      role="status"
                      aria-label={circuit.direction === 'upper' ? 'Upper Circuit' : 'Lower Circuit'}
                    >
                      {circuit.direction === 'upper' ? 'Upper Circuit' : 'Lower Circuit'}
                    </span>
                    <span className="text-xs text-[#787B86]">
                      {circuit.changePercent.toFixed(2)}% (limit: {circuit.limit}%)
                    </span>
                  </div>
                </div>
              ) : null;
            })()
          )}

          {data?.quote && (
            <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
              <h3 className="text-lg font-semibold mb-4">Key Data</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#787B86]">Previous Close</span>
                  <span className="font-medium">₹{data.quote.previousClose.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#787B86]">Day High</span>
                  <span className="font-medium">₹{data.quote.dayHigh.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#787B86]">Day Low</span>
                  <span className="font-medium">₹{data.quote.dayLow.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#787B86]">Volume</span>
                  <span className="font-medium">{data.quote.volume.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
