import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  InvalidSymbolError,
  SYMBOL_REGEX,
  sanitizeSymbol,
  getExchange,
  getBaseSymbol,
  isValidTimeframe,
  sanitizeTimeframe,
  isValidSignal,
  isValidEmail,
  ensureFiniteNumber,
  clamp,
} from '../validators';

describe('validators.ts', () => {
  describe('ValidationError', () => {
    it('creates error with default code', () => {
      const err = new ValidationError('test message');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.name).toBe('ValidationError');
      expect(err.message).toBe('test message');
      expect(err.code).toBe('VALIDATION_ERROR');
    });

    it('creates error with custom code', () => {
      const err = new ValidationError('custom', 'CUSTOM_CODE');
      expect(err.code).toBe('CUSTOM_CODE');
    });
  });

  describe('InvalidSymbolError', () => {
    it('creates error with INVALID_SYMBOL code', () => {
      const err = new InvalidSymbolError('BAD!');
      expect(err).toBeInstanceOf(ValidationError);
      expect(err).toBeInstanceOf(InvalidSymbolError);
      expect(err.name).toBe('InvalidSymbolError');
      expect(err.code).toBe('INVALID_SYMBOL');
      expect(err.message).toContain('BAD!');
      expect(err.message).toContain('SYMBOL.NS or SYMBOL.BO');
    });
  });

  describe('SYMBOL_REGEX', () => {
    it('matches valid NSE symbol', () => {
      expect(SYMBOL_REGEX.test('RELIANCE.NS')).toBe(true);
    });

    it('matches valid BSE symbol', () => {
      expect(SYMBOL_REGEX.test('RELIANCE.BO')).toBe(true);
    });

    it('matches short symbol', () => {
      expect(SYMBOL_REGEX.test('TCS.NS')).toBe(true);
    });

    it('matches numeric symbol', () => {
      expect(SYMBOL_REGEX.test('500001.BO')).toBe(true);
    });

    it('does not match lowercase', () => {
      expect(SYMBOL_REGEX.test('reliance.ns')).toBe(false);
    });

    it('does not match empty string', () => {
      expect(SYMBOL_REGEX.test('')).toBe(false);
    });

    it('does not match symbol without exchange suffix', () => {
      expect(SYMBOL_REGEX.test('RELIANCE')).toBe(false);
    });

    it('does not match symbol with invalid exchange', () => {
      expect(SYMBOL_REGEX.test('RELIANCE.NYSE')).toBe(false);
    });
  });

  describe('sanitizeSymbol', () => {
    it('returns uppercase trimmed symbol', () => {
      expect(sanitizeSymbol('RELIANCE.NS')).toBe('RELIANCE.NS');
    });

    it('normalizes lowercase to uppercase', () => {
      expect(sanitizeSymbol('reliance.ns')).toBe('RELIANCE.NS');
    });

    it('trims whitespace', () => {
      expect(sanitizeSymbol('  RELIANCE.NS  ')).toBe('RELIANCE.NS');
    });

    it('throws InvalidSymbolError for non-string input', () => {
      expect(() => sanitizeSymbol(123)).toThrow(InvalidSymbolError);
      expect(() => sanitizeSymbol(null)).toThrow(InvalidSymbolError);
      expect(() => sanitizeSymbol(undefined)).toThrow(InvalidSymbolError);
    });

    it('throws InvalidSymbolError for invalid symbols', () => {
      expect(() => sanitizeSymbol('INVALID!')).toThrow(InvalidSymbolError);
      expect(() => sanitizeSymbol('TCS')).toThrow(InvalidSymbolError);
      expect(() => sanitizeSymbol('TCS.NYSE')).toThrow(InvalidSymbolError);
    });
  });

  describe('getExchange', () => {
    it('returns NSE for .NS symbols', () => {
      expect(getExchange('RELIANCE.NS')).toBe('NSE');
    });

    it('returns BSE for .BO symbols', () => {
      expect(getExchange('RELIANCE.BO')).toBe('BSE');
    });

    it('returns NSE for lowercase input after normalization', () => {
      expect(getExchange('tcs.ns')).toBe('NSE');
    });

    it('throws InvalidSymbolError for invalid symbol', () => {
      expect(() => getExchange('INVALID')).toThrow(InvalidSymbolError);
    });
  });

  describe('getBaseSymbol', () => {
    it('strips .NS suffix', () => {
      expect(getBaseSymbol('RELIANCE.NS')).toBe('RELIANCE');
    });

    it('strips .BO suffix', () => {
      expect(getBaseSymbol('RELIANCE.BO')).toBe('RELIANCE');
    });

    it('throws InvalidSymbolError for invalid symbol', () => {
      expect(() => getBaseSymbol('INVALID')).toThrow(InvalidSymbolError);
    });
  });

  describe('isValidTimeframe', () => {
    it('returns true for valid timeframes', () => {
      expect(isValidTimeframe('1m')).toBe(true);
      expect(isValidTimeframe('5m')).toBe(true);
      expect(isValidTimeframe('15m')).toBe(true);
      expect(isValidTimeframe('1h')).toBe(true);
      expect(isValidTimeframe('1d')).toBe(true);
    });

    it('returns false for invalid timeframes', () => {
      expect(isValidTimeframe('2m')).toBe(false);
      expect(isValidTimeframe('1w')).toBe(false);
      expect(isValidTimeframe('1mo')).toBe(false);
      expect(isValidTimeframe('')).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(isValidTimeframe(null)).toBe(false);
      expect(isValidTimeframe(undefined)).toBe(false);
      expect(isValidTimeframe(123)).toBe(false);
    });
  });

  describe('sanitizeTimeframe', () => {
    it('returns the timeframe if valid', () => {
      expect(sanitizeTimeframe('1m')).toBe('1m');
      expect(sanitizeTimeframe('5m')).toBe('5m');
    });

    it('returns fallback for invalid timeframe', () => {
      expect(sanitizeTimeframe('invalid', '1d')).toBe('1d');
    });

    it('returns fallback for non-string', () => {
      expect(sanitizeTimeframe(null, '1h')).toBe('1h');
    });

    it('defaults to 1d when no fallback provided', () => {
      expect(sanitizeTimeframe('invalid')).toBe('1d');
    });
  });

  describe('isValidSignal', () => {
    it('returns true for all valid signal types', () => {
      expect(isValidSignal('STRONG_BUY')).toBe(true);
      expect(isValidSignal('BUY')).toBe(true);
      expect(isValidSignal('HOLD')).toBe(true);
      expect(isValidSignal('SELL')).toBe(true);
      expect(isValidSignal('STRONG_SELL')).toBe(true);
    });

    it('returns false for invalid signal types', () => {
      expect(isValidSignal('BUY1')).toBe(false);
      expect(isValidSignal('')).toBe(false);
      expect(isValidSignal('buy')).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(isValidSignal(null)).toBe(false);
      expect(isValidSignal(undefined)).toBe(false);
      expect(isValidSignal(123)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('returns true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('  name@company.org  ')).toBe(true);
    });

    it('returns false for invalid emails', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('a@b')).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
    });

    it('rejects emails that are too short', () => {
      expect(isValidEmail('a@')).toBe(false);
    });

    it('rejects emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@b.co';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('ensureFiniteNumber', () => {
    it('returns the number if finite', () => {
      expect(ensureFiniteNumber(42)).toBe(42);
      expect(ensureFiniteNumber(0)).toBe(0);
      expect(ensureFiniteNumber(-1)).toBe(-1);
      expect(ensureFiniteNumber(3.14)).toBe(3.14);
    });

    it('throws ValidationError for NaN', () => {
      expect(() => ensureFiniteNumber(NaN)).toThrow(ValidationError);
    });

    it('throws ValidationError for Infinity', () => {
      expect(() => ensureFiniteNumber(Infinity)).toThrow(ValidationError);
      expect(() => ensureFiniteNumber(-Infinity)).toThrow(ValidationError);
    });

    it('throws ValidationError for non-number values', () => {
      expect(() => ensureFiniteNumber('42')).toThrow(ValidationError);
      expect(() => ensureFiniteNumber(null)).toThrow(ValidationError);
      expect(() => ensureFiniteNumber(undefined)).toThrow(ValidationError);
    });

    it('uses custom field name in error message', () => {
      expect(() => ensureFiniteNumber('bad', 'price')).toThrow(/price must be a finite number/);
    });
  });

  describe('clamp', () => {
    it('clamps value below min to min', () => {
      expect(clamp(-5, 0, 100)).toBe(0);
    });

    it('clamps value above max to max', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('returns value when within range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('returns min when value equals min', () => {
      expect(clamp(0, 0, 100)).toBe(0);
    });

    it('returns max when value equals max', () => {
      expect(clamp(100, 0, 100)).toBe(100);
    });

    it('returns min when value is NaN', () => {
      expect(clamp(NaN, 0, 100)).toBe(0);
    });
  });
});
