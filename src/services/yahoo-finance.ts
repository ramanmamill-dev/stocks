import yahooFinance from 'yahoo-finance2';
import type { StockQuote, Candle, HistoricalData, Timeframe } from '@/types/stock';
import { sanitizeSymbol } from '@/lib/validators';
import { sleep } from '@/lib/utils';
import {
  getCached,
  setCached,
  quoteCacheKey,
  historicalCacheKey,
  QUOTE_TTL_SECONDS,
  HISTORICAL_TTL_SECONDS,
} from './cache';
import { getLiveQuoteFallback, getHistoricalDataFallback } from './indian-stock-market-api';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const TIMEFRAME_INTERVAL_MAP: Record<Timeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '1d': '1d',
};

const TIMEFRAME_RANGE_MAP: Record<Timeframe, string> = {
  '1m': '1d',
  '5m': '5d',
  '15m': '5d',
  '1h': '1mo',
  '1d': '1y',
};

export class YahooFinanceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'YahooFinanceError';
  }
}

async function withBackoff<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw new YahooFinanceError(`Failed after ${retries + 1} attempts`, lastError);
}

export async function getLiveQuote(symbol: string): Promise<StockQuote> {
  const cleanSymbol = sanitizeSymbol(symbol);
  const cacheKey = quoteCacheKey(cleanSymbol);

  const cached = await getCached<StockQuote>(cacheKey);
  if (cached.data && !cached.stale) {
    return cached.data;
  }

  try {
    const quote = await withBackoff(() =>
      yahooFinance.quote(cleanSymbol)
    );

    const stockQuote: StockQuote = {
      symbol: cleanSymbol,
      price: quote.regularMarketPrice ?? 0,
      change: quote.regularMarketChange ?? 0,
      changePercent: quote.regularMarketChangePercent ?? 0,
      previousClose: quote.regularMarketPreviousClose ?? 0,
      dayHigh: quote.regularMarketDayHigh ?? 0,
      dayLow: quote.regularMarketDayLow ?? 0,
      volume: quote.regularMarketVolume ?? 0,
      isEOD: false,
      lastUpdated: new Date().toISOString(),
    };

    await setCached(cacheKey, stockQuote, QUOTE_TTL_SECONDS);
    return stockQuote;
  } catch {
    if (cached.data) {
      return { ...cached.data, isEOD: true };
    }

    const fallback = await getLiveQuoteFallback(cleanSymbol);
    if (fallback) {
      await setCached(cacheKey, fallback, QUOTE_TTL_SECONDS);
      return fallback;
    }

    throw new YahooFinanceError(`Unable to fetch quote for ${cleanSymbol}`);
  }
}

export async function getHistoricalData(
  symbol: string,
  timeframe: Timeframe
): Promise<HistoricalData> {
  const cleanSymbol = sanitizeSymbol(symbol);
  const cacheKey = historicalCacheKey(cleanSymbol, timeframe);

  const cached = await getCached<HistoricalData>(cacheKey);
  if (cached.data && !cached.stale) {
    return cached.data;
  }

  try {
    const result = await withBackoff(() =>
      yahooFinance.historical(cleanSymbol, {
        period1: getStartDate(timeframe),
        interval: TIMEFRAME_INTERVAL_MAP[timeframe] as any,
      })
    );

    const candles: Candle[] = result
      .filter((row) => row.open != null && row.close != null)
      .map((row) => ({
        time: Math.floor(new Date(row.date).getTime() / 1000),
        open: row.open ?? 0,
        high: row.high ?? 0,
        low: row.low ?? 0,
        close: row.close ?? 0,
        volume: row.volume ?? 0,
      }));

    const historicalData: HistoricalData = {
      symbol: cleanSymbol,
      timeframe,
      candles,
    };

    await setCached(cacheKey, historicalData, HISTORICAL_TTL_SECONDS);
    return historicalData;
  } catch {
    if (cached.data) {
      return cached.data;
    }

    const fallbackCandles = await getHistoricalDataFallback(cleanSymbol, timeframe);
    if (fallbackCandles.length > 0) {
      const historicalData: HistoricalData = {
        symbol: cleanSymbol,
        timeframe,
        candles: fallbackCandles,
      };
      await setCached(cacheKey, historicalData, HISTORICAL_TTL_SECONDS);
      return historicalData;
    }

    throw new YahooFinanceError(`Unable to fetch historical data for ${cleanSymbol}`);
  }
}

function getStartDate(timeframe: Timeframe): Date {
  const now = new Date();
  const range = TIMEFRAME_RANGE_MAP[timeframe];

  if (range === '1d') {
    now.setDate(now.getDate() - 1);
  } else if (range === '5d') {
    now.setDate(now.getDate() - 5);
  } else if (range === '1mo') {
    now.setMonth(now.getMonth() - 1);
  } else if (range === '1y') {
    now.setFullYear(now.getFullYear() - 1);
  }

  return now;
}
