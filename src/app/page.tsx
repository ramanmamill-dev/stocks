'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MarketStatusBanner from '@/components/layout/MarketStatusBanner';
import { useMarketStatus } from '@/hooks/useMarketStatus';

export default function Home() {
  const { open, message } = useMarketStatus();

  return (
    <div className="min-h-screen bg-background">
      <MarketStatusBanner
        isOpen={open}
        message={message}
        lastUpdated={new Date().toISOString()}
      />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">📈 StockSignal AI</h1>
        <p className="text-lg text-gray-600 mb-8">
          Enterprise-Grade Web App for NSE &amp; BSE Stock Analysis
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Market Status</h2>
            <p className={open ? 'text-green-600' : 'text-red-600'}>
              {open ? '🟢 Market Open' : '🔴 Market Closed'}
            </p>
            <p className="text-sm text-gray-500 mt-2">{message}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Top Signals</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Watchlist</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
