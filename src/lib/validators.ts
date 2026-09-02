import type { Exchange, Timeframe } from '@/types/stock';
import type { SignalType } from '@/types/signal';

/**
 * Validation & sanitization utilities.
 *
 * All functions are pure and throw `InvalidSymbolError` (or `ValidationError`)
 * on bad input so callers can decide whether to return 400, log, or fallback.
 */

export class ValidationError extends Error {
  readonly code: string;
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

export class InvalidSymbolError extends ValidationError {
  constructor(symbol: string) {
    super(
      `Invalid symbol: "${symbol}". Expected format: SYMBOL.NS or SYMBOL.BO (1-20 alphanumeric chars before the dot).`,
      'INVALID_SYMBOL'
    );
    this.name = 'InvalidSymbolError';
  }
}

/**
 * Strict symbol regex. Allows:
 *   - 1-20 alphanumeric characters
 *   - Suffix `.NS` (NSE) or `.BO` (BSE)
 */
export const SYMBOL_REGEX = /^[A-Z0-9]{1,20}\.(NS|BO)$/;

/**
 * Normalize a user-provided symbol string.
 *
 *   sanitizeSymbol('RELIANCE.NS') -> 'RELIANCE.NS'
 *   sanitizeSymbol(' reliance.ns ') -> 'RELIANCE.NS'
 *   sanitizeSymbol('INVALID!')     -> throws InvalidSymbolError
 */
export function sanitizeSymbol(input: unknown): string {
  if (typeof input !== 'string') {
    throw new InvalidSymbolError(String(input));
  }
  const cleaned = input.toUpperCase().trim();
  if (!SYMBOL_REGEX.test(cleaned)) {
    throw new InvalidSymbolError(input);
  }
  return cleaned;
}

/** Returns the exchange for a sanitized symbol. Throws if the symbol is invalid. */
export function getExchange(symbol: string): Exchange {
  const clean = sanitizeSymbol(symbol);
  return clean.endsWith('.NS') ? 'NSE' : 'BSE';
}

/** Returns the bare ticker without the exchange suffix. Throws if invalid. */
export function getBaseSymbol(symbol: string): string {
  const clean = sanitizeSymbol(symbol);
  return clean.replace(/\.(NS|BO)$/, '');
}

const TIMEFRAMES: readonly Timeframe[] = ['1m', '5m', '15m', '1h', '1d'] as const;

export function isValidTimeframe(value: unknown): value is Timeframe {
  return typeof value === 'string' && (TIMEFRAMES as readonly string[]).includes(value);
}

export function sanitizeTimeframe(value: unknown, fallback: Timeframe = '1d'): Timeframe {
  return isValidTimeframe(value) ? value : fallback;
}

const SIGNALS: readonly SignalType[] = [
  'STRONG_BUY',
  'BUY',
  'HOLD',
  'SELL',
  'STRONG_SELL',
] as const;

export function isValidSignal(value: unknown): value is SignalType {
  return typeof value === 'string' && (SIGNALS as readonly string[]).includes(value);
}

/**
 * Lightweight email validation for user-facing forms (e.g. alerts).
 * Intentionally permissive; not RFC 5322 compliant.
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Validate a non-negative finite number. Returns the number or throws.
 */
export function ensureFiniteNumber(value: unknown, field = 'value'): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${field} must be a finite number`);
  }
  return value;
}

/**
 * Clamp `value` into the inclusive range [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}
