import { getBaseSymbol } from './validators';
import type { CircuitInfo } from '@/types/signal';

/**
 * Display & formatting utilities. Pure, side-effect free, Edge-runtime safe.
 *
 * Conventions:
 *   - Server-side: always store/emit ISO 8601 UTC (`...Z`).
 *   - Client-side: render in IST via `toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })`.
 */

const LARGE_CAPS_2DP = new Set([
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'SBIN',
  'BHARTIARTL',
  'ITC',
  'KOTAKBANK',
  'LT',
  'AXISBANK',
  'ASIANPAINT',
  'MARUTI',
  'WIPRO',
  'HCLTECH',
  'BAJFINANCE',
  'BAJAJFINSV',
  'NESTLEIND',
  'ULTRACEMCO',
  'SUNPHARMA',
]);

const ONE_DP_STOCKS = new Set(['TATASTEEL']);

const ZERO_DP_STOCKS = new Set<string>([]); // populated as penny stocks are identified

/** Default decimal precision per symbol, per spec section 17.6. */
export function getDecimalPlaces(symbol: string): number {
  const base = getBaseSymbol(symbol);
  if (LARGE_CAPS_2DP.has(base)) return 2;
  if (ONE_DP_STOCKS.has(base)) return 1;
  if (ZERO_DP_STOCKS.has(base)) return 0;
  return 2;
}

/**
 * Format a price with the correct number of decimals for the given symbol.
 *
 *   formatPrice(1234.5, 'RELIANCE.NS')  -> '1234.50'
 *   formatPrice(1234.5,  'TATASTEEL.NS') -> '1234.5'
 *   formatPrice(0,       'FOO.NS')       -> '0.00'
 */
export function formatPrice(price: number, symbol: string, precision?: number): string {
  if (!Number.isFinite(price)) return '—';
  const dp = precision ?? getDecimalPlaces(symbol);
  return price.toFixed(dp);
}

/** Format a percentage with sign and 2 decimals: e.g. `+1.23%`, `-0.45%`. */
export function formatPercent(value: number, options: { withSign?: boolean } = {}): string {
  if (!Number.isFinite(value)) return '—';
  const { withSign = true } = options;
  const sign = withSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** Format a large number using Indian locale grouping: 1,23,456.78 */
export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/** Format volume compactly: 1.2Cr, 45L, 12K. */
export function formatVolume(volume: number): string {
  if (!Number.isFinite(volume) || volume <= 0) return '0';
  if (volume >= 1e7) return `${(volume / 1e7).toFixed(2)}Cr`;
  if (volume >= 1e5) return `${(volume / 1e5).toFixed(2)}L`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return String(volume);
}

/** Return the IST date components for the given UTC instant. */
export function toISTParts(date: Date = new Date()): {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
  weekday: number; // 0=Sun, 6=Sat
} {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '0';

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour') === '24' ? '0' : get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: weekdayMap[get('weekday')] ?? 0,
  };
}

/** Return YYYY-MM-DD in IST for the given UTC instant. */
export function toISTDateString(date: Date = new Date()): string {
  const p = toISTParts(date);
  return `${p.year.toString().padStart(4, '0')}-${p.month
    .toString()
    .padStart(2, '0')}-${p.day.toString().padStart(2, '0')}`;
}

/** Render a UTC instant as a human-friendly IST string for UI display. */
export function formatIST(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Sleep for the requested milliseconds. Resolves to `undefined`. */
export function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a short, non-cryptographic unique id (good enough for UI keys). */
export function shortId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}

/** Detect upper/lower circuit based on daily change percent. Default NSE band = 20%. */
export function checkCircuit(
  previousClose: number,
  currentPrice: number,
  limit = 20
): CircuitInfo {
  if (!Number.isFinite(previousClose) || previousClose <= 0) {
    return { hit: false, direction: null, changePercent: 0, limit };
  }
  const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
  if (changePercent >= limit) {
    return { hit: true, direction: 'upper', changePercent, limit };
  }
  if (changePercent <= -limit) {
    return { hit: true, direction: 'lower', changePercent, limit };
  }
  return { hit: false, direction: null, changePercent, limit };
}

/** Data staleness policy from README section 17.5. */
export interface StalenessPolicy {
  maxAgeMinutes: number;
  warningThresholdMinutes: number;
}

export const STALENESS_POLICY: Record<'live' | 'eod' | 'holiday', StalenessPolicy> = {
  live: { maxAgeMinutes: 5, warningThresholdMinutes: 2 },
  eod: { maxAgeMinutes: 1440, warningThresholdMinutes: 720 },
  holiday: { maxAgeMinutes: 2880, warningThresholdMinutes: 1440 },
};

export type DataFreshness = 'fresh' | 'stale' | 'expired';

/** Classify how stale a timestamp is under the given policy. */
export function classifyFreshness(
  lastUpdatedISO: string,
  policy: StalenessPolicy,
  now: Date = new Date()
): DataFreshness {
  const ts = new Date(lastUpdatedISO).getTime();
  if (Number.isNaN(ts)) return 'expired';
  const ageMinutes = (now.getTime() - ts) / 60000;
  if (ageMinutes >= policy.maxAgeMinutes) return 'expired';
  if (ageMinutes >= policy.warningThresholdMinutes) return 'stale';
  return 'fresh';
}
