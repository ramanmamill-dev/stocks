import type { MarketStatus } from '@/types/signal';
import { toISTParts, toISTDateString } from '@/lib/utils';
import { MARKET_HOLIDAYS_2026 } from './holidays';

/**
 * NSE/BSE cash-market trading hours in IST: 09:15 - 15:30.
 */
const MARKET_OPEN_MINUTES = 9 * 60 + 15; // 555
const MARKET_CLOSE_MINUTES = 15 * 60 + 30; // 930

/**
 * Determine whether the Indian cash market is currently open.
 *
 * Uses `Intl.DateTimeFormat` (handles timezone math correctly) to derive
 * the current IST wall-clock time, then checks weekday, holiday list, and
 * trading hours.
 */
export function isMarketOpen(now: Date = new Date()): MarketStatus {
  const ist = toISTParts(now);
  const dateStr = toISTDateString(now);
  const currentMinutes = ist.hour * 60 + ist.minute;
  const timestamp = now.toISOString();

  if (ist.weekday === 0 || ist.weekday === 6) {
    return {
      open: false,
      message: 'Market Closed (Weekend)',
      timestamp,
      reason: 'WEEKEND',
    };
  }

  if (MARKET_HOLIDAYS_2026.includes(dateStr)) {
    return {
      open: false,
      message: `Market Closed (Holiday: ${dateStr})`,
      timestamp,
      reason: 'HOLIDAY',
    };
  }

  if (currentMinutes < MARKET_OPEN_MINUTES) {
    return {
      open: false,
      message: 'Market Closed (Pre-Market)',
      timestamp,
      reason: 'PRE_MARKET',
    };
  }

  if (currentMinutes >= MARKET_CLOSE_MINUTES) {
    return {
      open: false,
      message: 'Market Closed (After Hours)',
      timestamp,
      reason: 'POST_MARKET',
    };
  }

  return {
    open: true,
    message: 'Market Open',
    timestamp,
    reason: 'OPEN',
  };
}
