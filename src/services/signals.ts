import type { SignalResult, ScreenerFilter } from '@/types/signal';
import type { Candle, Timeframe } from '@/types/stock';
import { sanitizeSymbol } from '@/lib/validators';
import { getCached, setCached } from './cache';
import { getHistoricalData } from './yahoo-finance';
import {
  calculateRSI,
  calculateMACD,
  calculateMovingAverages,
} from './technical-indicators';
import {
  scoreToSignal,
  calculateConfidence,
  generateReasoning,
} from './ai-reasoning';

const SIGNAL_TTL_SECONDS = 600; // 10 minutes

interface SignalCacheEntry {
  result: SignalResult;
  cachedAt: string;
}

export async function generateSignal(
  symbol: string,
  timeframe: Timeframe = '1d'
): Promise<SignalResult> {
  const cleanSymbol = sanitizeSymbol(symbol);
  const cacheKey = `signal:${cleanSymbol}:${timeframe}`;

  const cached = await getCached<SignalCacheEntry>(cacheKey);
  if (cached.data && !cached.stale) {
    return cached.data.result;
  }

  const historical = await getHistoricalData(cleanSymbol, timeframe);
  const closes = historical.candles.map((c) => c.close);

  const rsiValues = calculateRSI(closes, 14);
  const macdValues = calculateMACD(closes);
  const mas = calculateMovingAverages(closes, [20, 50, 200]);

  const currentPrice = closes[closes.length - 1] ?? 0;
  const currentRsi = rsiValues[rsiValues.length - 1];
  const currentMacd = macdValues.macd[macdValues.macd.length - 1];
  const currentMacdSignal = macdValues.signal[macdValues.signal.length - 1];
  const sma20 = mas[20]?.[mas[20].length - 1];
  const sma50 = mas[50]?.[mas[50].length - 1];
  const sma200 = mas[200]?.[mas[200].length - 1];

  const indicators = {
    rsi: currentRsi,
    macd: currentMacd,
    macdSignal: currentMacdSignal,
    sma20,
    sma50,
    sma200,
    price: currentPrice,
  };

  const confidence = calculateConfidence(indicators);
  const score = 50 + (confidence - 50) * 2;
  const signal = scoreToSignal(score);
  const reasoning = generateReasoning(signal, indicators);

  const result: SignalResult = {
    symbol: cleanSymbol,
    signal,
    confidence,
    reasoning,
    timeframe,
    indicators: {
      rsi: currentRsi,
      macd: currentMacd,
      macdSignal: currentMacdSignal,
      sma20,
      sma50,
      sma200,
    },
    generatedAt: new Date().toISOString(),
  };

  await setCached(cacheKey, { result, cachedAt: result.generatedAt }, SIGNAL_TTL_SECONDS);

  return result;
}

const DEFAULT_WATCHLIST = [
  'RELIANCE.NS',
  'TCS.NS',
  'HDFCBANK.NS',
  'INFY.NS',
  'ICICIBANK.NS',
  'SBIN.NS',
  'BHARTIARTL.NS',
  'ITC.NS',
];

export async function getTopSignals(limit: number = 10): Promise<SignalResult[]> {
  const cacheKey = `top-signals:${limit}`;

  const cached = await getCached<SignalResult[]>(cacheKey);
  if (cached.data && !cached.stale) {
    return cached.data;
  }

  const results: SignalResult[] = [];

  const symbols = DEFAULT_WATCHLIST.slice(0, limit);
  for (const symbol of symbols) {
    try {
      const signal = await generateSignal(symbol);
      results.push(signal);
    } catch {
      // Skip symbols that fail
    }
  }

  await setCached(cacheKey, results, SIGNAL_TTL_SECONDS);

  return results;
}

export async function runScreener(_filters: ScreenerFilter): Promise<SignalResult[]> {
  return [];
}
