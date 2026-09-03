import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('yahoo-finance.ts', () => {
  let yfMock: {
    quote: ReturnType<typeof vi.fn>;
    historical: ReturnType<typeof vi.fn>;
  };
  let cacheMock: {
    getCached: ReturnType<typeof vi.fn>;
    setCached: ReturnType<typeof vi.fn>;
    quoteCacheKey: ReturnType<typeof vi.fn>;
    historicalCacheKey: ReturnType<typeof vi.fn>;
    QUOTE_TTL_SECONDS: number;
    HISTORICAL_TTL_SECONDS: number;
  };
  let fallbackMock: {
    getLiveQuoteFallback: ReturnType<typeof vi.fn>;
    getHistoricalDataFallback: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.resetModules();

    yfMock = {
      quote: vi.fn(),
      historical: vi.fn(),
    };
    vi.doMock('yahoo-finance2', () => ({
      default: yfMock,
    }));

    cacheMock = {
      getCached: vi.fn(),
      setCached: vi.fn(),
      quoteCacheKey: vi.fn((s: string) => `quote:${s}`),
      historicalCacheKey: vi.fn((s: string, t: string) => `historical:${s}:${t}`),
      QUOTE_TTL_SECONDS: 300,
      HISTORICAL_TTL_SECONDS: 3600,
    };
    vi.doMock('@/services/cache', () => cacheMock);

    fallbackMock = {
      getLiveQuoteFallback: vi.fn(),
      getHistoricalDataFallback: vi.fn(),
    };
    vi.doMock('@/services/indian-stock-market-api', () => fallbackMock);

    vi.doMock('@/lib/validators', () => ({
      sanitizeSymbol: (s: string) => s.toUpperCase().trim(),
      InvalidSymbolError: class InvalidSymbolError extends Error {
        code = 'INVALID_SYMBOL';
        constructor(public symbol: string) {
          super(`Invalid symbol: "${symbol}"`);
          this.name = 'InvalidSymbolError';
        }
      },
    }));

    vi.doMock('@/lib/utils', () => ({
      sleep: () => Promise.resolve(),
      checkCircuit: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.doUnmock('yahoo-finance2');
    vi.doUnmock('@/services/cache');
    vi.doUnmock('@/services/indian-stock-market-api');
    vi.doUnmock('@/lib/validators');
    vi.doUnmock('@/lib/utils');
  });

  describe('YahooFinanceError', () => {
    it('is an Error subclass with name YahooFinanceError', async () => {
      const mod = await import('../yahoo-finance');
      const err = new mod.YahooFinanceError('test', new Error('cause'));
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('YahooFinanceError');
      expect(err.message).toBe('test');
      expect(err.cause).toBeInstanceOf(Error);
    });
  });

  describe('getLiveQuote', () => {
    it('returns cached data when cache has fresh data', async () => {
      const mockQuote = { symbol: 'RELIANCE.NS', price: 2500 };
      cacheMock.getCached.mockResolvedValue({
        data: mockQuote,
        stale: false,
        source: 'cache',
      });

      const mod = await import('../yahoo-finance');
      const result = await mod.getLiveQuote('RELIANCE.NS');

      expect(result).toEqual(mockQuote);
      expect(yfMock.quote).not.toHaveBeenCalled();
    });

    it('fetches fresh data from Yahoo Finance and caches it', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      cacheMock.quoteCacheKey.mockReturnValue('quote:RELIANCE.NS');
      yfMock.quote.mockResolvedValue({
        regularMarketPrice: 2500,
        regularMarketChange: 50,
        regularMarketChangePercent: 2,
        regularMarketPreviousClose: 2450,
        regularMarketDayHigh: 2520,
        regularMarketDayLow: 2480,
        regularMarketVolume: 1000000,
      });
      cacheMock.setCached.mockResolvedValue(undefined);

      const mod = await import('../yahoo-finance');
      const result = await mod.getLiveQuote('RELIANCE.NS');

      expect(result).toMatchObject({
        symbol: 'RELIANCE.NS',
        price: 2500,
        change: 50,
        changePercent: 2,
        previousClose: 2450,
        dayHigh: 2520,
        dayLow: 2480,
        volume: 1000000,
        isEOD: false,
      });
      expect(result.lastUpdated).toBeDefined();
      expect(cacheMock.setCached).toHaveBeenCalled();
    });

    it('falls back to cached stale data when API fails and cache has data', async () => {
      cacheMock.getCached.mockResolvedValue({
        data: { price: 2400, isEOD: false },
        stale: true,
        source: 'stale-cache',
      });
      yfMock.quote.mockRejectedValue(new Error('API failure'));

      const mod = await import('../yahoo-finance');
      const result = await mod.getLiveQuote('RELIANCE.NS');

      expect(result.price).toBe(2400);
      expect(result.isEOD).toBe(true);
    });

    it('falls back to Indian Stock Market API when Yahoo Finance and cache fail', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      yfMock.quote.mockRejectedValue(new Error('Yahoo API failure'));
      fallbackMock.getLiveQuoteFallback.mockResolvedValue({
        symbol: 'RELIANCE.NS',
        price: 2500,
        change: 50,
        changePercent: 2,
        previousClose: 2450,
        dayHigh: 2520,
        dayLow: 2480,
        volume: 1000000,
        isEOD: false,
        lastUpdated: new Date().toISOString(),
      });

      const mod = await import('../yahoo-finance');
      const result = await mod.getLiveQuote('RELIANCE.NS');

      expect(result.price).toBe(2500);
      expect(result.symbol).toBe('RELIANCE.NS');
    });

    it('throws YahooFinanceError when all sources fail', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      yfMock.quote.mockRejectedValue(new Error('Yahoo API failure'));
      fallbackMock.getLiveQuoteFallback.mockResolvedValue(null);

      const mod = await import('../yahoo-finance');
      await expect(mod.getLiveQuote('RELIANCE.NS')).rejects.toThrow(mod.YahooFinanceError);
    });
  });

  describe('getHistoricalData', () => {
    it('returns cached data when cache has fresh data', async () => {
      const mockHistorical = {
        symbol: 'RELIANCE.NS',
        timeframe: '1d',
        candles: [{ time: 1000, open: 100, high: 105, low: 95, close: 100, volume: 1000 }],
      };
      cacheMock.getCached.mockResolvedValue({
        data: mockHistorical,
        stale: false,
        source: 'cache',
      });

      const mod = await import('../yahoo-finance');
      const result = await mod.getHistoricalData('RELIANCE.NS', '1d');

      expect(result).toEqual(mockHistorical);
      expect(yfMock.historical).not.toHaveBeenCalled();
    });

    it('fetches and transforms historical data from Yahoo Finance', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      yfMock.historical.mockResolvedValue([
        { open: 100, high: 105, low: 95, close: 100, volume: 1000, date: new Date('2026-01-01') },
        { open: 101, high: 106, low: 96, close: 101, volume: 1100, date: new Date('2026-01-02') },
      ]);
      cacheMock.historicalCacheKey.mockReturnValue('historical:RELIANCE.NS:1d');
      cacheMock.setCached.mockResolvedValue(undefined);

      const mod = await import('../yahoo-finance');
      const result = await mod.getHistoricalData('RELIANCE.NS', '1d');

      expect(result.symbol).toBe('RELIANCE.NS');
      expect(result.timeframe).toBe('1d');
      expect(result.candles.length).toBe(2);
      expect(result.candles[0]).toMatchObject({
        open: 100,
        high: 105,
        low: 95,
        close: 100,
        volume: 1000,
      });
    });

    it('falls back to cached stale data when Yahoo Finance fails', async () => {
      const staleData = {
        symbol: 'RELIANCE.NS',
        timeframe: '1d',
        candles: [{ time: 1000, open: 100, high: 105, low: 95, close: 100, volume: 1000 }],
      };
      cacheMock.getCached.mockResolvedValue({ data: staleData, stale: true, source: 'stale-cache' });
      yfMock.historical.mockRejectedValue(new Error('fail'));

      const mod = await import('../yahoo-finance');
      const result = await mod.getHistoricalData('RELIANCE.NS', '1d');

      expect(result.candles.length).toBe(1);
      expect(result.candles[0].close).toBe(100);
    });

    it('falls back to Indian Stock Market API when Yahoo Finance and cache fail', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      yfMock.historical.mockRejectedValue(new Error('Yahoo API failure'));
      fallbackMock.getHistoricalDataFallback.mockResolvedValue([
        { time: 1000, open: 100, high: 105, low: 95, close: 100, volume: 1000 },
      ]);

      const mod = await import('../yahoo-finance');
      const result = await mod.getHistoricalData('RELIANCE.NS', '1d');

      expect(result.candles.length).toBe(1);
      expect(fallbackMock.getHistoricalDataFallback).toHaveBeenCalled();
    });

    it('throws YahooFinanceError when all sources fail', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      yfMock.historical.mockRejectedValue(new Error('Yahoo API failure'));
      fallbackMock.getHistoricalDataFallback.mockResolvedValue([]);

      const mod = await import('../yahoo-finance');
      await expect(mod.getHistoricalData('RELIANCE.NS', '1d')).rejects.toThrow(mod.YahooFinanceError);
    });
  });

  describe('withBackoff (via getLiveQuote)', () => {
    it('retries on failure and succeeds eventually', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      cacheMock.quoteCacheKey.mockReturnValue('quote:RELIANCE.NS');
      yfMock.quote
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce({
          regularMarketPrice: 100,
          regularMarketChange: 1,
          regularMarketChangePercent: 1,
          regularMarketPreviousClose: 99,
          regularMarketDayHigh: 101,
          regularMarketDayLow: 99,
          regularMarketVolume: 1000,
        });
      cacheMock.setCached.mockResolvedValue(undefined);

      const mod = await import('../yahoo-finance');
      const result = await mod.getLiveQuote('RELIANCE.NS');
      expect(result.price).toBe(100);
      expect(yfMock.quote).toHaveBeenCalledTimes(3);
    });

    it('falls back after exhausting retries and cache has no data', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      cacheMock.quoteCacheKey.mockReturnValue('quote:RELIANCE.NS');
      yfMock.quote.mockRejectedValue(new Error('always fails'));
      fallbackMock.getLiveQuoteFallback.mockResolvedValue({
        symbol: 'RELIANCE.NS',
        price: 2500,
        change: 50,
        changePercent: 2,
        previousClose: 2450,
        dayHigh: 2520,
        dayLow: 2480,
        volume: 1000000,
        isEOD: false,
        lastUpdated: new Date().toISOString(),
      });
      cacheMock.setCached.mockResolvedValue(undefined);

      const mod = await import('../yahoo-finance');
      const result = await mod.getLiveQuote('RELIANCE.NS');
      expect(result.price).toBe(2500);
      expect(yfMock.quote).toHaveBeenCalledTimes(4);
    });
  });
});
