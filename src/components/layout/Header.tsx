'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = searchQuery.toUpperCase().trim();
    if (symbol) {
      router.push(`/stock/${symbol}`);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="text-xl font-bold text-[#0b0e11] hover:opacity-80 transition-opacity"
        >
          StockSignal AI
        </button>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol (e.g., RELIANCE)"
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00b386] focus:border-transparent w-64"
            aria-label="Search stock symbol"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#00b386] text-white rounded-md text-sm font-medium hover:bg-[#009970] transition-colors"
          >
            Search
          </button>
        </form>
      </div>
    </header>
  );
}
