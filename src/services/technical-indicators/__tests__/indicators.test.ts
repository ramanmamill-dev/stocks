import { describe, it, expect } from 'vitest';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateMovingAverages,
} from '../../technical-indicators';

describe('calculateRSI', () => {
  it('returns empty array for insufficient data', () => {
    expect(calculateRSI([1, 2, 3], 14)).toEqual([]);
  });

  it('calculates RSI for known dataset', () => {
    const prices = [
      44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08,
      45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64,
      46.21, 46.25, 45.71, 46.45, 45.78, 45.35, 44.03, 44.18, 44.22, 44.57,
      43.42, 42.66, 43.13,
    ];

    const rsi = calculateRSI(prices, 14);
    expect(rsi.length).toBeGreaterThan(0);
    expect(rsi[0]).toBeCloseTo(72.98, 1);
    expect(rsi[rsi.length - 1]).toBeGreaterThanOrEqual(0);
    expect(rsi[rsi.length - 1]).toBeLessThanOrEqual(100);
  });

  it('returns 100 when no losses', () => {
    const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
    const rsi = calculateRSI(prices, 14);
    expect(rsi[0]).toBe(100);
  });

  it('returns 0 when no gains', () => {
    const prices = [25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
    const rsi = calculateRSI(prices, 14);
    expect(rsi[0]).toBe(0);
  });
});

describe('calculateMACD', () => {
  it('returns empty arrays for insufficient data', () => {
    const result = calculateMACD([1, 2, 3]);
    expect(result.macd).toEqual([]);
    expect(result.signal).toEqual([]);
    expect(result.histogram).toEqual([]);
  });

  it('calculates MACD with signal and histogram', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.5) * 10 + i * 0.5);
    const result = calculateMACD(prices);

    expect(result.macd.length).toBeGreaterThan(0);
    expect(result.signal.length).toBeGreaterThan(0);
    expect(result.histogram.length).toBeGreaterThan(0);
    expect(result.histogram.length).toBe(result.signal.length);
  });

  it('histogram equals MACD minus signal', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.3 + Math.random() * 5);
    const result = calculateMACD(prices);

    for (let i = 0; i < result.histogram.length; i++) {
      const macdIndex = i + (result.macd.length - result.signal.length);
      expect(result.histogram[i]).toBeCloseTo(result.macd[macdIndex] - result.signal[i], 5);
    }
  });
});

describe('calculateBollingerBands', () => {
  it('returns empty arrays for insufficient data', () => {
    const result = calculateBollingerBands([1, 2, 3], 20);
    expect(result.upper).toEqual([]);
    expect(result.middle).toEqual([]);
    expect(result.lower).toEqual([]);
  });

  it('calculates bands with correct structure', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
    const result = calculateBollingerBands(prices, 20);

    expect(result.upper.length).toBe(11);
    expect(result.middle.length).toBe(11);
    expect(result.lower.length).toBe(11);
  });

  it('upper band is above middle, lower is below', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
    const result = calculateBollingerBands(prices, 20);

    for (let i = 0; i < result.upper.length; i++) {
      expect(result.upper[i]).toBeGreaterThan(result.middle[i]);
      expect(result.lower[i]).toBeLessThan(result.middle[i]);
    }
  });

  it('middle band equals SMA', () => {
    const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = calculateBollingerBands(prices, 5);

    expect(result.middle[0]).toBeCloseTo(3, 5);
    expect(result.middle[1]).toBeCloseTo(4, 5);
    expect(result.middle[5]).toBeCloseTo(8, 5);
  });
});

describe('calculateMovingAverages', () => {
  it('returns empty arrays for insufficient data', () => {
    const result = calculateMovingAverages([1, 2, 3], [5, 10]);
    expect(result[5]).toEqual([]);
    expect(result[10]).toEqual([]);
  });

  it('calculates SMA for given periods', () => {
    const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = calculateMovingAverages(prices, [3, 5]);

    expect(result[3]).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result[5]).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('SMA values are correct', () => {
    const prices = [10, 20, 30, 40, 50];
    const result = calculateMovingAverages(prices, [3]);

    expect(result[3][0]).toBeCloseTo(20, 5);
    expect(result[3][1]).toBeCloseTo(30, 5);
    expect(result[3][2]).toBeCloseTo(40, 5);
  });
});
