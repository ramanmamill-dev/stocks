import { describe, it, expect, vi } from 'vitest';
import {
  getDecimalPlaces,
  formatPrice,
  formatPercent,
  formatNumber,
  formatVolume,
  toISTParts,
  toISTDateString,
  formatIST,
  sleep,
  shortId,
  checkCircuit,
  STALENESS_POLICY,
  classifyFreshness,
  type StalenessPolicy,
} from '../utils';

describe('utils.ts', () => {
  describe('getDecimalPlaces', () => {
    it('returns 2 for large-cap NSE stocks', () => {
      expect(getDecimalPlaces('RELIANCE.NS')).toBe(2);
      expect(getDecimalPlaces('TCS.NS')).toBe(2);
    });

    it('returns 1 for TATASTEEL', () => {
      expect(getDecimalPlaces('TATASTEEL.NS')).toBe(1);
    });

    it('returns 2 for unknown symbols (default)', () => {
      expect(getDecimalPlaces('UNKNOWN.NS')).toBe(2);
    });

    it('returns 0 for lowercase symbols (after normalization)', () => {
      expect(getDecimalPlaces('reliance.ns')).toBe(2);
    });
  });

  describe('formatPrice', () => {
    it('formats price with 2 decimal places for large-cap', () => {
      expect(formatPrice(1234.5, 'RELIANCE.NS')).toBe('1234.50');
    });

    it('formats price with 1 decimal place for TATASTEEL', () => {
      expect(formatPrice(1234.5, 'TATASTEEL.NS')).toBe('1234.5');
    });

    it('returns en-dash for NaN', () => {
      expect(formatPrice(NaN, 'RELIANCE.NS')).toBe('—');
    });

    it('returns en-dash for Infinity', () => {
      expect(formatPrice(Infinity, 'RELIANCE.NS')).toBe('—');
    });

    it('formats zero correctly', () => {
      expect(formatPrice(0, 'RELIANCE.NS')).toBe('0.00');
    });

    it('uses custom precision when provided', () => {
      expect(formatPrice(123.456, 'RELIANCE.NS', 3)).toBe('123.456');
    });

    it('formats negative prices', () => {
      expect(formatPrice(-100.5, 'RELIANCE.NS')).toBe('-100.50');
    });
  });

  describe('formatPercent', () => {
    it('formats positive percent with + sign', () => {
      expect(formatPercent(1.23)).toBe('+1.23%');
    });

    it('formats negative percent with - sign', () => {
      expect(formatPercent(-0.45)).toBe('-0.45%');
    });

    it('formats zero percent', () => {
      expect(formatPercent(0)).toBe('0.00%');
    });

    it('formats without sign when withSign is false', () => {
      expect(formatPercent(1.23, { withSign: false })).toBe('1.23%');
    });

    it('returns en-dash for NaN', () => {
      expect(formatPercent(NaN)).toBe('—');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with Indian grouping', () => {
      const result = formatNumber(1234567.89);
      expect(result).toContain('12,34,567.89');
    });

    it('formats small numbers', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('returns en-dash for NaN', () => {
      expect(formatNumber(NaN)).toBe('—');
    });

    it('respects custom options', () => {
      const result = formatNumber(1000.5, { maximumFractionDigits: 0 });
      expect(result).toContain('1,001');
    });
  });

  describe('formatVolume', () => {
    it('formats crores for large volumes', () => {
      expect(formatVolume(1e7)).toBe('1.00Cr');
      expect(formatVolume(1.5e7)).toBe('1.50Cr');
    });

    it('formats lakhs for medium volumes', () => {
      expect(formatVolume(1e5)).toBe('1.00L');
      expect(formatVolume(4.5e5)).toBe('4.50L');
    });

    it('formats thousands for small volumes', () => {
      expect(formatVolume(1e3)).toBe('1.00K');
      expect(formatVolume(5.5e3)).toBe('5.50K');
    });

    it('returns string for plain numbers', () => {
      expect(formatVolume(500)).toBe('500');
    });

    it('returns 0 for zero volume', () => {
      expect(formatVolume(0)).toBe('0');
    });

    it('returns 0 for negative volume', () => {
      expect(formatVolume(-100)).toBe('0');
    });

    it('returns 0 for NaN volume', () => {
      expect(formatVolume(NaN)).toBe('0');
    });
  });

  describe('toISTParts', () => {
    it('returns IST date parts for a UTC date', () => {
      const d = new Date(Date.UTC(2026, 8, 2, 4, 0, 0)); // 09:30 IST
      const parts = toISTParts(d);
      expect(parts.year).toBe(2026);
      expect(parts.month).toBe(9);
      expect(parts.day).toBe(2);
      expect(parts.hour).toBe(9);
      expect(parts.minute).toBe(30);
      expect(parts.second).toBe(0);
    });

    it('uses current date when no argument provided', () => {
      const parts = toISTParts();
      expect(parts.year).toBeGreaterThan(2025);
    });
  });

  describe('toISTDateString', () => {
    it('returns YYYY-MM-DD string in IST', () => {
      const d = new Date(Date.UTC(2026, 0, 26, 4, 30, 0)); // 10:00 IST on Jan 26
      expect(toISTDateString(d)).toBe('2026-01-26');
    });
  });

  describe('formatIST', () => {
    it('formats ISO string to IST display string', () => {
      const iso = new Date(Date.UTC(2026, 8, 2, 4, 30, 0)).toISOString();
      const result = formatIST(iso);
      expect(result).toMatch(/2026/);
      expect(result).toContain('10:00');
    });

    it('formats Date object', () => {
      const d = new Date(Date.UTC(2026, 8, 2, 4, 30, 0));
      const result = formatIST(d);
      expect(result).toMatch(/2026/);
    });

    it('returns en-dash for invalid date string', () => {
      expect(formatIST('invalid-date')).toBe('—');
    });
  });

  describe('sleep', () => {
    it('resolves after specified milliseconds', async () => {
      const start = Date.now();
      await sleep(10);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(5);
    });

    it('resolves immediately for ms <= 0', async () => {
      await expect(sleep(0)).resolves.toBeUndefined();
      await expect(sleep(-100)).resolves.toBeUndefined();
    });
  });

  describe('shortId', () => {
    it('generates id with default prefix', () => {
      const id = shortId();
      expect(id).toMatch(/^id_\w+_\w+$/);
    });

    it('generates id with custom prefix', () => {
      const id = shortId('stock');
      expect(id).toMatch(/^stock_\w+_\w+$/);
    });

    it('generates unique ids', () => {
      const a = shortId();
      const b = shortId();
      expect(a).not.toBe(b);
    });
  });

  describe('checkCircuit', () => {
    it('returns hit=false when price is within bounds', () => {
      const result = checkCircuit(100, 110, 20);
      expect(result.hit).toBe(false);
      expect(result.direction).toBeNull();
      expect(result.limit).toBe(20);
    });

    it('detects upper circuit', () => {
      const result = checkCircuit(100, 130, 20);
      expect(result.hit).toBe(true);
      expect(result.direction).toBe('upper');
      expect(result.changePercent).toBe(30);
    });

    it('detects lower circuit', () => {
      const result = checkCircuit(100, 70, 20);
      expect(result.hit).toBe(true);
      expect(result.direction).toBe('lower');
      expect(result.changePercent).toBe(-30);
    });

    it('uses custom limit', () => {
      const result = checkCircuit(100, 115, 10);
      expect(result.hit).toBe(true);
      expect(result.direction).toBe('upper');
      expect(result.limit).toBe(10);
    });

    it('returns hit=false when previousClose is 0', () => {
      const result = checkCircuit(0, 100, 20);
      expect(result.hit).toBe(false);
      expect(result.direction).toBeNull();
    });

    it('returns hit=false when previousClose is negative', () => {
      const result = checkCircuit(-50, 100, 20);
      expect(result.hit).toBe(false);
    });

    it('returns hit=false when previousClose is NaN', () => {
      const result = checkCircuit(NaN, 100, 20);
      expect(result.hit).toBe(false);
    });

    it('exactly at upper limit triggers circuit', () => {
      const result = checkCircuit(100, 120, 20);
      expect(result.hit).toBe(true);
      expect(result.direction).toBe('upper');
    });

    it('exactly at lower limit triggers circuit', () => {
      const result = checkCircuit(100, 80, 20);
      expect(result.hit).toBe(true);
      expect(result.direction).toBe('lower');
    });
  });

  describe('STALENESS_POLICY', () => {
    it('defines policies for live, eod, and holiday', () => {
      expect(STALENESS_POLICY.live).toEqual({ maxAgeMinutes: 5, warningThresholdMinutes: 2 });
      expect(STALENESS_POLICY.eod).toEqual({ maxAgeMinutes: 1440, warningThresholdMinutes: 720 });
      expect(STALENESS_POLICY.holiday).toEqual({ maxAgeMinutes: 2880, warningThresholdMinutes: 1440 });
    });
  });

  describe('classifyFreshness', () => {
    it('returns "fresh" for recently updated data', () => {
      const now = new Date('2026-09-02T12:00:00Z');
      const oneMinuteAgo = new Date(now.getTime() - 60000).toISOString();
      const policy: StalenessPolicy = { maxAgeMinutes: 5, warningThresholdMinutes: 2 };
      expect(classifyFreshness(oneMinuteAgo, policy, now)).toBe('fresh');
    });

    it('returns "stale" for data past warning threshold but before max age', () => {
      const now = new Date('2026-09-02T12:00:00Z');
      const threeMinutesAgo = new Date(now.getTime() - 3 * 60000).toISOString();
      const policy: StalenessPolicy = { maxAgeMinutes: 5, warningThresholdMinutes: 2 };
      expect(classifyFreshness(threeMinutesAgo, policy, now)).toBe('stale');
    });

    it('returns "expired" for data past max age', () => {
      const now = new Date('2026-09-02T12:00:00Z');
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60000).toISOString();
      const policy: StalenessPolicy = { maxAgeMinutes: 5, warningThresholdMinutes: 2 };
      expect(classifyFreshness(tenMinutesAgo, policy, now)).toBe('expired');
    });

    it('returns "expired" for invalid date string', () => {
      const policy: StalenessPolicy = { maxAgeMinutes: 5, warningThresholdMinutes: 2 };
      expect(classifyFreshness('invalid', policy)).toBe('expired');
    });

    it('uses current time when now is not provided', () => {
      const recentIso = new Date(Date.now() - 1000).toISOString();
      const policy: StalenessPolicy = { maxAgeMinutes: 5, warningThresholdMinutes: 2 };
      expect(classifyFreshness(recentIso, policy)).toBe('fresh');
    });

    it('boundary: exactly at warning threshold returns stale', () => {
      const now = new Date('2026-09-02T12:00:00Z');
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60000).toISOString();
      const policy: StalenessPolicy = { maxAgeMinutes: 5, warningThresholdMinutes: 2 };
      expect(classifyFreshness(twoMinutesAgo, policy, now)).toBe('stale');
    });

    it('boundary: exactly at max age returns expired', () => {
      const now = new Date('2026-09-02T12:00:00Z');
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000).toISOString();
      const policy: StalenessPolicy = { maxAgeMinutes: 5, warningThresholdMinutes: 2 };
      expect(classifyFreshness(fiveMinutesAgo, policy, now)).toBe('expired');
    });
  });
});
