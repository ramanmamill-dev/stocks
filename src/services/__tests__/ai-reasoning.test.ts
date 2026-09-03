import { describe, it, expect } from 'vitest';
import { scoreToSignal, calculateConfidence, generateReasoning } from '../ai-reasoning';

describe('ai-reasoning.ts', () => {
  describe('scoreToSignal', () => {
    it('returns STRONG_BUY for scores 80-99', () => {
      expect(scoreToSignal(80)).toBe('STRONG_BUY');
      expect(scoreToSignal(99)).toBe('STRONG_BUY');
    });

    it('returns BUY for scores 60-79', () => {
      expect(scoreToSignal(60)).toBe('BUY');
      expect(scoreToSignal(61)).toBe('BUY');
      expect(scoreToSignal(79)).toBe('BUY');
    });

    it('returns HOLD for scores 40-59', () => {
      expect(scoreToSignal(40)).toBe('HOLD');
      expect(scoreToSignal(50)).toBe('HOLD');
      expect(scoreToSignal(59)).toBe('HOLD');
    });

    it('returns SELL for scores 20-39', () => {
      expect(scoreToSignal(20)).toBe('SELL');
      expect(scoreToSignal(30)).toBe('SELL');
      expect(scoreToSignal(39)).toBe('SELL');
    });

    it('returns STRONG_SELL for scores 0-19', () => {
      expect(scoreToSignal(0)).toBe('STRONG_SELL');
      expect(scoreToSignal(10)).toBe('STRONG_SELL');
      expect(scoreToSignal(19)).toBe('STRONG_SELL');
    });

    it('clamps scores below 0 to STRONG_SELL', () => {
      expect(scoreToSignal(-50)).toBe('STRONG_SELL');
    });

    it('clamps scores above 100 to HOLD (boundary case: 100 falls to HOLD)', () => {
      expect(scoreToSignal(100)).toBe('HOLD');
      expect(scoreToSignal(150)).toBe('HOLD');
    });

    it('boundary: score 40 is HOLD (inclusive on min)', () => {
      expect(scoreToSignal(40)).toBe('HOLD');
    });

    it('boundary: score 60 is BUY (inclusive on min)', () => {
      expect(scoreToSignal(60)).toBe('BUY');
    });
  });

  describe('calculateConfidence', () => {
    it('returns 50 when no indicators provided', () => {
      expect(calculateConfidence({})).toBe(50);
    });

    it('returns 50 when no indicators are defined', () => {
      const result = calculateConfidence({
        rsi: undefined,
        macd: undefined,
        macdSignal: undefined,
        sma20: undefined,
        sma50: undefined,
        sma200: undefined,
        price: undefined,
      });
      expect(result).toBe(50);
    });

    it('handles RSI below 30 (oversold - bullish)', () => {
      const result = calculateConfidence({ rsi: 20 });
      expect(result).toBeGreaterThan(50);
    });

    it('handles RSI above 70 (overbought - bearish)', () => {
      const result = calculateConfidence({ rsi: 85 });
      expect(result).toBeLessThan(50);
    });

    it('does not adjust score when RSI is neutral (30-70)', () => {
      const result = calculateConfidence({ rsi: 50 });
      expect(result).toBe(50);
    });

    it('handles MACD above signal line (bullish)', () => {
      const result = calculateConfidence({ macd: 2, macdSignal: 1 });
      expect(result).toBeGreaterThan(50);
    });

    it('handles MACD below signal line (bearish)', () => {
      const result = calculateConfidence({ macd: 1, macdSignal: 2 });
      expect(result).toBeLessThan(50);
    });

    it('rewards price above SMA20', () => {
      const result = calculateConfidence({ price: 110, sma20: 100 });
      expect(result).toBe(60);
    });

    it('penalizes price below SMA20', () => {
      const result = calculateConfidence({ price: 90, sma20: 100 });
      expect(result).toBe(40);
    });

    it('handles all SMAs', () => {
      const result = calculateConfidence({ price: 110, sma20: 100, sma50: 95, sma200: 90 });
      expect(result).toBe(85);
    });

    it('clamps result to 0-100 range', () => {
      const result = calculateConfidence({
        rsi: 10,
        macd: 10,
        macdSignal: 0,
        price: 200,
        sma20: 100,
        sma50: 100,
        sma200: 100,
      });
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('clamps to 100 when all factors are maximally bullish', () => {
      const result = calculateConfidence({
        rsi: 5,
        macd: 10,
        macdSignal: 0,
        price: 200,
        sma20: 100,
        sma50: 100,
        sma200: 100,
      });
      expect(result).toBe(100);
    });

    it('clamps to 0 when all factors are maximally bearish', () => {
      const result = calculateConfidence({
        rsi: 95,
        macd: 0,
        macdSignal: 10,
        price: 50,
        sma20: 100,
        sma50: 100,
        sma200: 100,
      });
      expect(result).toBe(0);
    });
  });

  describe('generateReasoning', () => {
    it('returns default message when no indicators provided', () => {
      const result = generateReasoning('BUY', {});
      expect(result).toBe('Signal generated based on consolidated technical analysis.');
    });

    it('includes RSI overbought message', () => {
      const result = generateReasoning('SELL', { rsi: 75 });
      expect(result).toContain('overbought');
    });

    it('includes RSI oversold message', () => {
      const result = generateReasoning('BUY', { rsi: 25 });
      expect(result).toContain('oversold');
    });

    it('includes RSI neutral message', () => {
      const result = generateReasoning('HOLD', { rsi: 50 });
      expect(result).toContain('neutral territory');
    });

    it('includes bullish MACD message', () => {
      const result = generateReasoning('BUY', { macd: 2, macdSignal: 1 });
      expect(result).toContain('bullish');
    });

    it('includes bearish MACD message', () => {
      const result = generateReasoning('SELL', { macd: 1, macdSignal: 2 });
      expect(result).toContain('bearish');
    });

    it('includes price vs SMA20 message', () => {
      const result = generateReasoning('BUY', { price: 110, sma20: 100 });
      expect(result).toContain('Price above 20-day SMA');
    });

    it('includes price below SMA20 message', () => {
      const result = generateReasoning('SELL', { price: 90, sma20: 100 });
      expect(result).toContain('Price below 20-day SMA');
    });

    it('includes SMA50 message', () => {
      const result = generateReasoning('BUY', { price: 110, sma50: 100 });
      expect(result).toContain('medium-term uptrend');
    });

    it('includes SMA200 message', () => {
      const result = generateReasoning('BUY', { price: 110, sma200: 100 });
      expect(result).toContain('long-term bullish');
    });

    it('combines multiple indicators', () => {
      const result = generateReasoning('BUY', {
        rsi: 25,
        macd: 2,
        macdSignal: 1,
        price: 110,
        sma20: 100,
        sma50: 95,
        sma200: 90,
      });
      expect(result).toContain('oversold');
      expect(result).toContain('bullish');
      expect(result).toContain('Price above 20-day SMA');
      expect(result).toContain('medium-term uptrend');
      expect(result).toContain('long-term bullish');
    });

    it('formats RSI value to 1 decimal place', () => {
      const result = generateReasoning('BUY', { rsi: 25.567 });
      expect(result).toContain('25.6');
    });
  });
});
