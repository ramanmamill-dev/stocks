import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const CIRCUIT_BREAKER_THRESHOLD = 5;

describe('cache.ts', () => {
  let redis: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };
  let cache: typeof import('../cache');

  beforeEach(async () => {
    vi.resetModules();

    redis = { get: vi.fn(), set: vi.fn() };
    vi.doMock('@/lib/redis', () => ({ redis }));

    cache = await import('../cache');
  });

  afterEach(() => {
    vi.doUnmock('@/lib/redis');
  });

  describe('constants', () => {
    it('defines QUOTE_TTL_SECONDS as 300 (5 minutes)', () => {
      expect(cache.QUOTE_TTL_SECONDS).toBe(300);
    });

    it('defines HISTORICAL_TTL_SECONDS as 3600 (1 hour)', () => {
      expect(cache.HISTORICAL_TTL_SECONDS).toBe(3600);
    });
  });

  describe('cache key helpers', () => {
    it('quoteCacheKey returns "quote:<symbol>"', () => {
      expect(cache.quoteCacheKey('RELIANCE.NS')).toBe('quote:RELIANCE.NS');
    });

    it('historicalCacheKey returns "historical:<symbol>:<timeframe>"', () => {
      expect(cache.historicalCacheKey('TCS.NS', '1d')).toBe('historical:TCS.NS:1d');
    });
  });

  describe('getCached', () => {
    it('returns cached data with stale=false when redis has data and circuit is closed', async () => {
      redis.get.mockResolvedValue({ price: 1500, symbol: 'RELIANCE.NS' });

      const result = await cache.getCached('quote:RELIANCE.NS');

      expect(result).toEqual({
        data: { price: 1500, symbol: 'RELIANCE.NS' },
        stale: false,
        source: 'cache',
      });
      expect(redis.get).toHaveBeenCalledWith('quote:RELIANCE.NS');
    });

    it('returns fresh result when redis returns null', async () => {
      redis.get.mockResolvedValue(null);

      const result = await cache.getCached('quote:RELIANCE.NS');

      expect(result).toEqual({
        data: null,
        stale: false,
        source: 'fresh',
      });
    });

    it('records failure and returns fresh when redis throws', async () => {
      redis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await cache.getCached('quote:RELIANCE.NS');

      expect(result).toEqual({
        data: null,
        stale: false,
        source: 'fresh',
      });
      expect(cache.getCircuitBreakerState().failures).toBe(1);
    });

    it('opens circuit after 5 consecutive failures', async () => {
      redis.get.mockRejectedValue(new Error('Redis connection failed'));

      for (let i = 0; i < CIRCUIT_BREAKER_THRESHOLD; i++) {
        await cache.getCached(`key:${i}`);
      }

      const state = cache.getCircuitBreakerState();
      expect(state.open).toBe(true);
      expect(state.failures).toBe(CIRCUIT_BREAKER_THRESHOLD);
    });

    it('returns stale-cache data when circuit is open and redis has data', async () => {
      redis.get.mockRejectedValue(new Error('fail'));

      for (let i = 0; i < CIRCUIT_BREAKER_THRESHOLD; i++) {
        await cache.getCached('key');
      }

      const cachedData = { price: 2500, symbol: 'RELIANCE.NS' };
      redis.get.mockResolvedValue(cachedData);

      const result = await cache.getCached('quote:RELIANCE.NS');

      expect(result).toEqual({
        data: cachedData,
        stale: true,
        source: 'stale-cache',
      });
    });

    it('returns stale-cache with null data when circuit is open and redis throws', async () => {
      redis.get.mockRejectedValue(new Error('fail'));

      for (let i = 0; i < CIRCUIT_BREAKER_THRESHOLD; i++) {
        await cache.getCached('key');
      }

      redis.get.mockRejectedValue(new Error('still broken'));

      const result = await cache.getCached('quote:RELIANCE.NS');

      expect(result).toEqual({
        data: null,
        stale: true,
        source: 'stale-cache',
      });
    });
  });

  describe('setCached', () => {
    it('writes data to redis with TTL when circuit is closed', async () => {
      redis.set.mockResolvedValue('OK');

      await cache.setCached('quote:RELIANCE.NS', { price: 1500 }, 300);

      expect(redis.set).toHaveBeenCalledWith(
        'quote:RELIANCE.NS',
        { price: 1500 },
        { ex: 300 }
      );
    });

    it('does not write to redis when circuit is open', async () => {
      redis.get.mockRejectedValue(new Error('fail'));

      for (let i = 0; i < CIRCUIT_BREAKER_THRESHOLD; i++) {
        await cache.getCached('key').catch(() => {});
      }

      await cache.setCached('quote:RELIANCE.NS', { price: 1500 }, 300);

      expect(redis.set).not.toHaveBeenCalled();
    });

    it('records failure when redis.set throws', async () => {
      redis.set.mockRejectedValue(new Error('connection refused'));

      await cache.setCached('quote:RELIANCE.NS', { price: 1500 }, 300);

      expect(cache.getCircuitBreakerState().failures).toBe(1);
    });

    it('records success when redis.set succeeds and resets failures', async () => {
      redis.get.mockRejectedValue(new Error('fail'));

      await cache.getCached('fail-test').catch(() => {});
      expect(cache.getCircuitBreakerState().failures).toBe(1);

      redis.set.mockResolvedValue('OK');
      await cache.setCached('key', { data: true }, 60);
      expect(cache.getCircuitBreakerState().failures).toBe(0);
      expect(cache.getCircuitBreakerState().open).toBe(false);
    });
  });

  describe('getCircuitBreakerState', () => {
    it('returns open=false and failures=0 initially', async () => {
      const state = cache.getCircuitBreakerState();
      expect(state).toEqual({ open: false, failures: 0 });
    });

    it('returns cumulative failure count', async () => {
      redis.get.mockRejectedValue(new Error('fail'));

      await cache.getCached('key1').catch(() => {});
      await cache.getCached('key2').catch(() => {});

      expect(cache.getCircuitBreakerState().failures).toBe(2);
    });
  });
});
