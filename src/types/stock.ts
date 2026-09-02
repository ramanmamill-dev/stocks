/**
 * Domain types for stock-related data structures.
 *
 * All timestamps are ISO 8601 UTC strings (e.g. "2026-09-02T09:30:00Z").
 * All prices are in INR (Indian Rupee) unless otherwise noted.
 */

export type Exchange = 'NSE' | 'BSE';

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1d';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  isEOD: boolean;
  lastUpdated: string; // ISO 8601
}

export interface Candle {
  time: number; // unix seconds (Lightweight Charts convention)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalData {
  symbol: string;
  timeframe: Timeframe;
  candles: Candle[];
}

export interface StockFundamentals {
  symbol: string;
  name: string;
  exchange: Exchange;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  eps: number;
  roe: number;
  roce: number;
  debtToEquity: number;
  dividendYield: number;
  bookValue: number;
  faceValue: number;
  lotSize: number;
}

export interface StockMeta {
  symbol: string;
  name: string;
  exchange: Exchange;
  sector?: string;
}
