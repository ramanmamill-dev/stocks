export interface ScreenerFilter {
  signal?: string;
  peRatio?: { min?: number; max?: number };
  roe?: { min?: number; max?: number };
  debtToEquity?: { min?: number; max?: number };
  rsi?: { min?: number; max?: number };
  marketCap?: { min?: number; max?: number };
  sector?: string;
}

export interface ScreenerResult {
  symbol: string;
  name: string;
  signal: string;
  confidence: number;
  price: number;
  peRatio: number;
  roe: number;
  marketCap: number;
  sector: string;
}
