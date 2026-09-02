'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { ScreenerFilter } from '@/types/signal';
import { ScreenerPanel } from '@/components/screener/ScreenerPanel';
import { SignalBadge } from '@/components/signals/SignalBadge';
import { useRouter, usePathname } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ScreenerResult {
  symbol: string;
  name: string;
  signal: string;
  confidence: number;
  price: number;
  peRatio: number;
  roe: number;
  marketCap: number;
  sector: string;
  exchange: 'NSE' | 'BSE';
}

interface ApiResponse {
  results: ScreenerResult[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function ScreenerPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [filters, setFilters] = useState<ScreenerFilter>({
    signal: 'ANY',
    peRatio: undefined,
    roe: undefined,
    debtToEquity: undefined,
    rsi: undefined,
    marketCap: undefined,
    sector: undefined,
    exchange: 'ANY',
  });

  const fetchResults = useCallback(async (currentFilters: ScreenerFilter, currentPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFilters.signal && currentFilters.signal !== 'ANY') params.set('signal', currentFilters.signal);
      if (currentFilters.peRatio) {
        if (currentFilters.peRatio.min) params.set('peMin', String(currentFilters.peRatio.min));
        if (currentFilters.peRatio.max) params.set('peMax', String(currentFilters.peRatio.max));
      }
      if (currentFilters.sector) params.set('sector', currentFilters.sector);
      if (currentFilters.exchange && currentFilters.exchange !== 'ANY') params.set('exchange', currentFilters.exchange);
      params.set('page', String(currentPage));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/screener?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch screener results');
      const data: ApiResponse = await res.json();

      setResults(data.results);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setResults([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const applyFilters = () => {
    setPage(1);
    fetchResults(filters, 1);
    const params = new URLSearchParams();
    if (filters.signal && filters.signal !== 'ANY') params.set('signal', filters.signal);
    if (filters.sector) params.set('sector', filters.sector);
    if (filters.exchange && filters.exchange !== 'ANY') params.set('exchange', filters.exchange);
    router.push(`${pathname}?${params.toString()}`);
  };

  const goToPage = (newPage: number) => {
    setPage(newPage);
    fetchResults(filters, newPage);
  };

  useEffect(() => {
    fetchResults(filters, page);
  }, [fetchResults, filters, page]);

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B0E11]">Stock Screener</h1>
        <p className="text-sm text-[#787B86] mt-1">
          Filter stocks by signal, fundamentals, and sector
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ScreenerPanel
            filters={filters}
            onChange={setFilters}
            onApply={applyFilters}
          />
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-[#787B86]">
                  Loading screener results...
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#E0E3EB]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#787B86] uppercase">
                        Symbol
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#787B86] uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[#787B86] uppercase">
                        Signal
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#787B86] uppercase">
                        Confidence
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#787B86] uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#787B86] uppercase">
                        P/E
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[#787B86]">
                          No stocks match your filters
                        </td>
                      </tr>
                    ) : (
                      results.map((stock) => (
                        <tr
                          key={stock.symbol}
                          onClick={() => router.push(`/stock/${stock.symbol}`)}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#0B0E11]">
                              {stock.symbol.replace('.NS', '').replace('.BO', '')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#787B86]">{stock.name}</td>
                          <td className="px-4 py-3 text-center">
                            <SignalBadge signal={stock.signal as 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'} />
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{stock.confidence}%</td>
                          <td className="px-4 py-3 text-right font-medium">
                            ₹{stock.price.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{stock.peRatio.toFixed(1)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-4 border-t border-[#E0E3EB] bg-gray-50">
              <p className="text-sm text-[#787B86]">
                Showing {startIndex}-{endIndex} of {total} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                  className="px-3 py-1 text-sm border border-[#E0E3EB] rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-[#787B86]">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-1 text-sm border border-[#E0E3EB] rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
