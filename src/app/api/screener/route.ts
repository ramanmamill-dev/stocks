import { NextResponse } from 'next/server';
import type { SignalType, ScreenerFilter } from '@/types/signal';
import { getTopSignals } from '@/services/signals';

export const runtime = 'nodejs';

interface StockMeta {
  symbol: string;
  name: string;
  sector: string;
  exchange: 'NSE' | 'BSE';
  marketCap: number;
  peRatio: number;
}

interface ScreenerResult {
  symbol: string;
  name: string;
  signal: SignalType;
  confidence: number;
  price: number;
  peRatio: number;
  roe: number;
  marketCap: number;
  sector: string;
  exchange: 'NSE' | 'BSE';
}

const STOCK_UNIVERSE: StockMeta[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy', exchange: 'NSE', marketCap: 1800000, peRatio: 25 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'Technology', exchange: 'NSE', marketCap: 1600000, peRatio: 30 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Financial', exchange: 'NSE', marketCap: 1500000, peRatio: 20 },
  { symbol: 'INFY.NS', name: 'Infosys', sector: 'Technology', exchange: 'NSE', marketCap: 700000, peRatio: 28 },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Financial', exchange: 'NSE', marketCap: 750000, peRatio: 18 },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Financial', exchange: 'NSE', marketCap: 600000, peRatio: 15 },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom', exchange: 'NSE', marketCap: 550000, peRatio: 45 },
  { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'Consumer', exchange: 'NSE', marketCap: 450000, peRatio: 22 },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Financial', exchange: 'NSE', marketCap: 400000, peRatio: 20 },
  { symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Infrastructure', exchange: 'NSE', marketCap: 420000, peRatio: 30 },
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const signalParam = searchParams.get('signal');
    const sectorParam = searchParams.get('sector');
    const exchangeParam = searchParams.get('exchange');

    const filters: ScreenerFilter = {
      signal: signalParam === null ? 'ANY' : (signalParam as SignalType | 'ANY'),
      peRatio:
        searchParams.has('peMin') || searchParams.has('peMax')
          ? {
              min: searchParams.has('peMin') ? Number(searchParams.get('peMin')) : undefined,
              max: searchParams.has('peMax') ? Number(searchParams.get('peMax')) : undefined,
            }
          : undefined,
      sector: sectorParam ?? undefined,
      exchange: (exchangeParam as 'NSE' | 'BSE' | 'ANY') || 'ANY',
    };

    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '10');
    const sortBy = searchParams.get('sortBy') || 'confidence';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const results: ScreenerResult[] = [];

    try {
      const signals = await getTopSignals(50);

      for (const signal of signals) {
        const stock = STOCK_UNIVERSE.find((s) => s.symbol === signal.symbol);
        if (!stock) continue;

        results.push({
          symbol: stock.symbol,
          name: stock.name,
          signal: signal.signal,
          confidence: signal.confidence,
          price: signal.indicators?.sma20 ?? 0,
          peRatio: stock.peRatio,
          roe: 0,
          marketCap: stock.marketCap,
          sector: stock.sector,
          exchange: stock.exchange,
        });
      }
    } catch {
      // Return empty results on API failure, still apply sorting/pagination
    }

    const filtered = filterResults(results, filters);
    const sorted = sortResults(filtered, sortBy, sortOrder);
    const total = sorted.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paged = sorted.slice(startIndex, startIndex + pageSize);

    return NextResponse.json(
      {
        results: paged,
        page,
        pageSize,
        total,
        totalPages,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

function filterResults(items: ScreenerResult[], filters: ScreenerFilter): ScreenerResult[] {
  return items.filter((item) => {
    if (filters.signal && filters.signal !== 'ANY' && item.signal !== filters.signal) {
      return false;
    }
    if (filters.peRatio) {
      if (filters.peRatio.min !== undefined && item.peRatio < filters.peRatio.min) return false;
      if (filters.peRatio.max !== undefined && item.peRatio > filters.peRatio.max) return false;
    }
    if (filters.sector && item.sector !== filters.sector) return false;
    if (filters.exchange && filters.exchange !== 'ANY' && item.exchange !== filters.exchange) return false;
    return true;
  });
}

function sortResults(
  items: ScreenerResult[],
  sortBy: string,
  sortOrder: string
): ScreenerResult[] {
  const keyMap: Record<string, keyof ScreenerResult> = {
    confidence: 'confidence',
    symbol: 'symbol',
    peRatio: 'peRatio',
    marketCap: 'marketCap',
    price: 'price',
  };

  const key = keyMap[sortBy] ?? 'confidence';
  const multiplier = sortOrder === 'asc' ? 1 : -1;

  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * multiplier;
    }
    return (Number(aVal) - Number(bVal)) * multiplier;
  });
}
