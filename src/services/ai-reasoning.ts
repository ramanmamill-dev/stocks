import type { SignalType } from '@/types/signal';

const SIGNAL_THRESHOLDS: { min: number; max: number; signal: SignalType }[] = [
  { min: 80, max: 100, signal: 'STRONG_BUY' },
  { min: 60, max: 80, signal: 'BUY' },
  { min: 40, max: 60, signal: 'HOLD' },
  { min: 20, max: 40, signal: 'SELL' },
  { min: 0, max: 20, signal: 'STRONG_SELL' },
];

export function scoreToSignal(score: number): SignalType {
  const clamped = Math.max(0, Math.min(100, score));
  for (const t of SIGNAL_THRESHOLDS) {
    if (clamped >= t.min && clamped < t.max) return t.signal;
  }
  return 'HOLD';
}

export function generateReasoning(
  signal: SignalType,
  indicators: {
    rsi?: number;
    macd?: number;
    macdSignal?: number;
    sma20?: number;
    sma50?: number;
    sma200?: number;
    price?: number;
  }
): string {
  const parts: string[] = [];

  if (indicators.rsi !== undefined) {
    if (indicators.rsi > 70) parts.push(`RSI at ${indicators.rsi.toFixed(1)} indicates overbought conditions`);
    else if (indicators.rsi < 30) parts.push(`RSI at ${indicators.rsi.toFixed(1)} indicates oversold conditions`);
    else parts.push(`RSI at ${indicators.rsi.toFixed(1)} is in neutral territory`);
  }

  if (indicators.macd !== undefined && indicators.macdSignal !== undefined) {
    if (indicators.macd > indicators.macdSignal) {
      parts.push('MACD line crossed above signal line (bullish)');
    } else {
      parts.push('MACD line crossed below signal line (bearish)');
    }
  }

  if (indicators.price !== undefined) {
    if (indicators.sma20 !== undefined) {
      if (indicators.price > indicators.sma20) parts.push('Price above 20-day SMA');
      else parts.push('Price below 20-day SMA');
    }
    if (indicators.sma50 !== undefined) {
      if (indicators.price > indicators.sma50) parts.push('Price above 50-day SMA (medium-term uptrend)');
      else parts.push('Price below 50-day SMA (medium-term downtrend)');
    }
    if (indicators.sma200 !== undefined) {
      if (indicators.price > indicators.sma200) parts.push('Price above 200-day SMA (long-term bullish)');
      else parts.push('Price below 200-day SMA (long-term bearish)');
    }
  }

  if (parts.length === 0) {
    return 'Signal generated based on consolidated technical analysis.';
  }

  return parts.join('. ') + '.';
}

export function calculateConfidence(
  indicators: {
    rsi?: number;
    macd?: number;
    macdSignal?: number;
    sma20?: number;
    sma50?: number;
    sma200?: number;
    price?: number;
  }
): number {
  let score = 50;
  let factors = 0;

  if (indicators.rsi !== undefined) {
    if (indicators.rsi < 30) {
      score += (30 - indicators.rsi) * 1.5;
    } else if (indicators.rsi > 70) {
      score -= (indicators.rsi - 70) * 1.5;
    }
    factors++;
  }

  if (indicators.macd !== undefined && indicators.macdSignal !== undefined) {
    const macdDiff = indicators.macd - indicators.macdSignal;
    score += macdDiff * 5;
    factors++;
  }

  if (indicators.price !== undefined) {
    if (indicators.sma20 !== undefined) {
      score += indicators.price > indicators.sma20 ? 10 : -10;
      factors++;
    }
    if (indicators.sma50 !== undefined) {
      score += indicators.price > indicators.sma50 ? 10 : -10;
      factors++;
    }
    if (indicators.sma200 !== undefined) {
      score += indicators.price > indicators.sma200 ? 15 : -15;
      factors++;
    }
  }

  if (factors === 0) return 50;

  return Math.max(0, Math.min(100, Math.round(score)));
}
