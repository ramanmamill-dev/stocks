import type { StockQuote, Candle, Timeframe } from '@/types/stock';

const INDIAN_STOCK_API_BASE = 'https://indian-stock-market-api.onrender.com';

interface IndianStockQuoteResponse {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
}

export async function getLiveQuoteFallback(symbol: string): Promise<StockQuote | null> {
  try {
    const response = await fetch(`${INDIAN_STOCK_API_BASE}/quote/${encodeURIComponent(symbol)}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data: IndianStockQuoteResponse = await response.json();

    return {
      symbol,
      price: data.price ?? 0,
      change: data.change ?? 0,
      changePercent: data.changePercent ?? 0,
      previousClose: data.previousClose ?? 0,
      dayHigh: data.dayHigh ?? 0,
      dayLow: data.dayLow ?? 0,
      volume: data.volume ?? 0,
      isEOD: false,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getHistoricalDataFallback(
  _symbol: string,
  _timeframe: Timeframe
): Promise<Candle[]> {
  return [];
}
