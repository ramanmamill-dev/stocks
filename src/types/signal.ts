/**
 * Domain types for AI-generated trading signals.
 *
 * Signal strength ladder (5 levels) maps to UI badges:
 *   STRONG_BUY  -> #00E6A0 (success)
 *   BUY         -> #00B386 (primary)
 *   HOLD        -> #F0B90B (warning)
 *   SELL        -> #F23645 (danger)
 *   STRONG_SELL -> #FF2D4B (deep danger)
 */

export type SignalType =
  | 'STRONG_BUY'
  | 'BUY'
  | 'HOLD'
  | 'SELL'
  | 'STRONG_SELL';

export const SIGNAL_VALUES: readonly SignalType[] = [
  'STRONG_BUY',
  'BUY',
  'HOLD',
  'SELL',
  'STRONG_SELL',
] as const;

export interface SignalResult {
  symbol: string;
  signal: SignalType;
  confidence: number; // 0-100
  reasoning: string;
  timeframe: string;
  indicators?: {
    rsi?: number;
    macd?: number;
    macdSignal?: number;
    sma20?: number;
    sma50?: number;
    sma200?: number;
  };
  generatedAt: string; // ISO 8601
}

export interface ScreenerFilter {
  signal?: SignalType | 'ANY';
  peRatio?: { min?: number; max?: number };
  roe?: { min?: number; max?: number };
  debtToEquity?: { min?: number; max?: number };
  rsi?: { min?: number; max?: number };
  marketCap?: { min?: number; max?: number };
  sector?: string;
  exchange?: 'NSE' | 'BSE' | 'ANY';
}

export interface ScreenerResult {
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

export interface MarketStatus {
  open: boolean;
  message: string;
  /** ISO 8601 UTC timestamp of the status check */
  timestamp: string;
  /** Whether the close was triggered by a holiday (vs weekend / after-hours) */
  reason?: 'OPEN' | 'WEEKEND' | 'HOLIDAY' | 'PRE_MARKET' | 'POST_MARKET';
}

export interface CircuitInfo {
  hit: boolean;
  direction: 'upper' | 'lower' | null;
  changePercent: number;
  limit: number;
}
