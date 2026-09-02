'use client';

import { useMarketStatus } from '@/hooks/useMarketStatus';

export default function Home() {
  const { open, message } = useMarketStatus();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">StockSignal AI</h1>
      <p className="text-lg text-[#787B86] mb-8">
        Enterprise-Grade Web App for NSE &amp; BSE Stock Analysis
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
          <h2 className="text-xl font-semibold mb-2">Market Status</h2>
          <p className={open ? 'text-[#00B386]' : 'text-[#F23645]'}>
            {open ? 'Market Open' : 'Market Closed'}
          </p>
          <p className="text-sm text-[#787B86] mt-2">{message}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
          <h2 className="text-xl font-semibold mb-2">Top Signals</h2>
          <p className="text-[#787B86]">Coming soon...</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
          <h2 className="text-xl font-semibold mb-2">Watchlist</h2>
          <p className="text-[#787B86]">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
