'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import type { StockMeta } from '@/types/stock';

const STOCK_LIST: StockMeta[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', sector: 'Energy' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'Technology' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE', sector: 'Financial' },
  { symbol: 'INFY.NS', name: 'Infosys', exchange: 'NSE', sector: 'Technology' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', exchange: 'NSE', sector: 'Financial' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', sector: 'Financial' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', exchange: 'NSE', sector: 'Telecom' },
  { symbol: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE', sector: 'Consumer' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', exchange: 'NSE', sector: 'Financial' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro', exchange: 'NSE', sector: 'Infrastructure' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank', exchange: 'NSE', sector: 'Financial' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', exchange: 'NSE', sector: 'Consumer' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', exchange: 'NSE', sector: 'Auto' },
  { symbol: 'WIPRO.NS', name: 'Wipro', exchange: 'NSE', sector: 'Technology' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies', exchange: 'NSE', sector: 'Technology' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', exchange: 'NSE', sector: 'Financial' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', exchange: 'NSE', sector: 'Financial' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India', exchange: 'NSE', sector: 'Consumer' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', exchange: 'NSE', sector: 'Materials' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', exchange: 'NSE', sector: 'Healthcare' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel', exchange: 'NSE', sector: 'Materials' },
  { symbol: 'TITAN.NS', name: 'Titan Company', exchange: 'NSE', sector: 'Consumer' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corp', exchange: 'NSE', sector: 'Utilities' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', exchange: 'NSE', sector: 'Utilities' },
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corp', exchange: 'NSE', sector: 'Energy' },
];

const fuse = new Fuse(STOCK_LIST, {
  keys: ['symbol', 'name'],
  threshold: 0.4,
  includeScore: true,
});

export function SearchModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const results = query.length > 0
    ? fuse.search(query).map((r) => r.item).slice(0, 8)
    : STOCK_LIST.slice(0, 8);

  const openModal = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const navigateToStock = useCallback((symbol: string) => {
    closeModal();
    router.push(`/stock/${symbol}`);
  }, [router, closeModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          closeModal();
        } else {
          openModal();
        }
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        closeModal();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        navigateToStock(results[selectedIndex].symbol);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal, openModal, navigateToStock, results, selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={closeModal}
    >
      <div className="fixed inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-lg bg-white rounded-lg shadow-xl border border-[#E0E3EB] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[#E0E3EB]">
          <svg
            className="w-5 h-5 text-[#787B86] mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks (e.g., RELIANCE, TCS)..."
            className="flex-1 text-sm outline-none placeholder-[#787B86]"
            aria-label="Search stocks"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-[#787B86] bg-gray-100 rounded">
            ESC
          </kbd>
        </div>

        <div ref={resultsRef} className="max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#787B86]">
              No results found
            </div>
          ) : (
            results.map((stock, index) => (
              <button
                key={stock.symbol}
                onClick={() => navigateToStock(stock.symbol)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-[#00B386]/10'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#0B0E11]">
                    {stock.symbol.replace('.NS', '').replace('.BO', '')}
                  </span>
                  <span className="text-xs text-[#787B86]">{stock.name}</span>
                </div>
                <span className="text-xs text-[#787B86] bg-gray-100 px-2 py-0.5 rounded">
                  {stock.exchange}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-[#E0E3EB] flex items-center justify-between text-xs text-[#787B86]">
          <span>Press Ctrl+K to toggle</span>
          <div className="flex items-center gap-2">
            <span>Navigate</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">↓</kbd>
            <span>Select</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">↵</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
