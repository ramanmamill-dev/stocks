export function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) return [];

  const rsi: number[] = [];
  const changes: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  const firstRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  rsi.push(firstRsi);

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rsiValue = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    rsi.push(rsiValue);
  }

  return rsi;
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export function calculateMACD(prices: number[]): MACDResult {
  if (prices.length < 26) return { macd: [], signal: [], histogram: [] };

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  const macdLine: number[] = [];
  const offset = 26 - 12;

  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }

  const signalLine = calculateEMA(macdLine, 9);

  const histogram: number[] = [];
  const signalOffset = macdLine.length - signalLine.length;

  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + signalOffset] - signalLine[i]);
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}

function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) return [];

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);

  for (let i = period; i < data.length; i++) {
    const value = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(value);
  }

  return ema;
}

export interface BollingerBands {
  upper: number[];
  middle: number[];
  lower: number[];
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBands {
  if (prices.length < period) return { upper: [], middle: [], lower: [] };

  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((sum, p) => sum + p, 0) / period;

    const squaredDiffs = slice.map((p) => Math.pow(p - sma, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / period;
    const stdDev = Math.sqrt(variance);

    middle.push(sma);
    upper.push(sma + stdDevMultiplier * stdDev);
    lower.push(sma - stdDevMultiplier * stdDev);
  }

  return { upper, middle, lower };
}

export function calculateMovingAverages(
  prices: number[],
  periods: number[]
): Record<number, number[]> {
  const result: Record<number, number[]> = {};

  for (const period of periods) {
    if (prices.length < period) {
      result[period] = [];
      continue;
    }

    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, p) => sum + p, 0) / period;
      sma.push(avg);
    }
    result[period] = sma;
  }

  return result;
}
