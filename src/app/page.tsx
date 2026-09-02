'use client';

import { useState } from 'react';
import { SearchModal } from '@/components/search/SearchModal';
import { useTopSignalsWatchlist } from '@/hooks/useWatchlist';
import { SignalBadge } from '@/components/signals/SignalBadge';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { items, loading } = useTopSignalsWatchlist(5);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">StockSignal AI</h1>
          <p className="text-lg text-[#787B86]">
            Enterprise-Grade Web App for NSE &amp; BSE Stock Analysis
          </p>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-[#787B86] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-200 rounded ml-2">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
            <h2 className="text-xl font-semibold mb-4">Top Signals</h2>
            {loading && <p className="text-[#787B86]">Loading signals...</p>}
            {!loading && items.length === 0 && (
              <p className="text-[#787B86]">No signals available</p>
            )}
            <div className="space-y-3">
              {items.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => router.push(`/stock/${item.symbol}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{item.symbol.replace('.NS', '')}</span>
                    {item.signal && (
                      <span className="text-xs text-[#787B86]">{item.signal.reasoning.slice(0, 50)}...</span>
                    )}
                  </div>
                  {item.signal && <SignalBadge signal={item.signal.signal} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
            <div className="space-y-2">
              {['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS'].map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => router.push(`/stock/${symbol}`)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm transition-colors"
                >
                  {symbol.replace('.NS', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
            <h2 className="text-xl font-semibold mb-4">Watchlist</h2>
            <p className="text-[#787B86] text-sm">
              Sign in to create and manage your watchlist. Your watchlists will appear here.
            </p>
          </div>
        </div>
      </div>

      <SearchModal />
    </div>
  );
}
