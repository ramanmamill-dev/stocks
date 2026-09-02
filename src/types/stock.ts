export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  isEOD: boolean;
  lastUpdated: string;
}

export interface SignalResult {
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  reasoning: string;
  timeframe: string;
}

export interface MarketStatus {
  open: boolean;
  message: string;
}
