import { describe, it, expect } from 'vitest';
import { isMarketOpen } from '../status';
import { MARKET_HOLIDAYS_2026 } from '../holidays';

/**
 * Helper: build a UTC Date that corresponds to a specific IST wall-clock time
 * on the given Y-M-D. IST = UTC+5:30, so utcMs = istMs - 5h30m.
 *
 * We avoid relying on the host machine's timezone so the suite is deterministic
 * regardless of where CI runs.
 */
function ist(year: number, month: number, day: number, hour: number, minute = 0): Date {
  const istAsUtcMs = Date.UTC(year, month - 1, day, hour, minute);
  return new Date(istAsUtcMs - 5.5 * 60 * 60 * 1000);
}

describe('isMarketOpen()', () => {
  describe('happy path on a weekday', () => {
    it('returns OPEN at 09:30 IST on a weekday', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 9, 30)); // Wed
      expect(s.open).toBe(true);
      expect(s.reason).toBe('OPEN');
      expect(s.message).toBe('Market Open');
    });

    it('returns OPEN at 12:00 IST on a weekday (mid-session)', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 12, 0));
      expect(s.open).toBe(true);
      expect(s.reason).toBe('OPEN');
    });

    it('returns OPEN at 15:29 IST (one minute before close)', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 15, 29));
      expect(s.open).toBe(true);
      expect(s.reason).toBe('OPEN');
    });
  });

  describe('pre-market on a weekday', () => {
    it('returns CLOSED at 00:00 IST on a weekday', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 0, 0));
      expect(s.open).toBe(false);
      expect(s.reason).toBe('PRE_MARKET');
    });

    it('returns CLOSED at 09:14 IST (one minute before open)', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 9, 14));
      expect(s.open).toBe(false);
      expect(s.reason).toBe('PRE_MARKET');
    });
  });

  describe('boundary conditions', () => {
    it('09:15 IST is OPEN (inclusive open boundary)', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 9, 15));
      expect(s.open).toBe(true);
      expect(s.reason).toBe('OPEN');
    });

    it('15:30 IST is CLOSED (exclusive close boundary)', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 15, 30));
      expect(s.open).toBe(false);
      expect(s.reason).toBe('POST_MARKET');
    });
  });

  describe('post-market on a weekday', () => {
    it('returns CLOSED at 15:31 IST (one minute after close)', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 15, 31));
      expect(s.open).toBe(false);
      expect(s.reason).toBe('POST_MARKET');
    });

    it('returns CLOSED at 23:59 IST', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 23, 59));
      expect(s.open).toBe(false);
      expect(s.reason).toBe('POST_MARKET');
    });
  });

  describe('weekend handling', () => {
    it('returns CLOSED on Saturday (any time)', () => {
      const s = isMarketOpen(ist(2026, 9, 5, 10, 0)); // Sat
      expect(s.open).toBe(false);
      expect(s.reason).toBe('WEEKEND');
      expect(s.message).toContain('Weekend');
    });

    it('returns CLOSED on Sunday (any time)', () => {
      const s = isMarketOpen(ist(2026, 9, 6, 10, 0)); // Sun
      expect(s.open).toBe(false);
      expect(s.reason).toBe('WEEKEND');
    });

    it('returns CLOSED on Saturday even during trading hours', () => {
      const s = isMarketOpen(ist(2026, 9, 5, 12, 0));
      expect(s.open).toBe(false);
      expect(s.reason).toBe('WEEKEND');
    });
  });

  describe('holiday handling', () => {
    it('returns CLOSED with reason=HOLIDAY on Republic Day 2026-01-26 (Monday)', () => {
      const s = isMarketOpen(ist(2026, 1, 26, 10, 0));
      expect(s.open).toBe(false);
      expect(s.reason).toBe('HOLIDAY');
      expect(s.message).toContain('2026-01-26');
    });

    it('returns CLOSED with reason=HOLIDAY on Independence Day 2026-08-15 (Saturday — both reasons but WEEKEND wins)', () => {
      // 2026-08-15 is a Saturday; the function checks weekend before holiday,
      // so the result is WEEKEND. The order is intentional (weekend is the
      // more user-friendly message).
      const s = isMarketOpen(ist(2026, 8, 15, 10, 0));
      expect(s.open).toBe(false);
      expect(['WEEKEND', 'HOLIDAY']).toContain(s.reason);
    });

    it('returns CLOSED on a mid-week holiday (Holi 2026-03-18, Wednesday)', () => {
      const s = isMarketOpen(ist(2026, 3, 18, 10, 0));
      expect(s.open).toBe(false);
      expect(s.reason).toBe('HOLIDAY');
    });

    it('holiday list is non-empty and well-formed', () => {
      expect(MARKET_HOLIDAYS_2026.length).toBeGreaterThan(0);
      for (const d of MARKET_HOLIDAYS_2026) {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('response shape', () => {
    it('returns a MarketStatus with ISO timestamp and reason', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 10, 0));
      expect(s).toMatchObject({
        open: expect.any(Boolean),
        message: expect.any(String),
        timestamp: expect.any(String),
        reason: expect.stringMatching(
          /^(OPEN|WEEKEND|HOLIDAY|PRE_MARKET|POST_MARKET)$/
        ),
      });
      // ISO 8601 with Z suffix
      expect(s.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('message is a non-empty string', () => {
      const s = isMarketOpen(ist(2026, 9, 2, 10, 0));
      expect(typeof s.message).toBe('string');
      expect(s.message.length).toBeGreaterThan(0);
    });
  });

  describe('default argument (no `now`)', () => {
    it('returns a valid MarketStatus when called with no argument', () => {
      const s = isMarketOpen();
      expect(s).toHaveProperty('open');
      expect(s).toHaveProperty('message');
      expect(s).toHaveProperty('timestamp');
      expect(s).toHaveProperty('reason');
    });
  });
});
