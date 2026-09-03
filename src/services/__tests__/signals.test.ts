import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('signals.ts', () => {
  let cacheMock: {
    getCached: ReturnType<typeof vi.fn>;
    setCached: ReturnType<typeof vi.fn>;
    QUOTE_TTL_SECONDS: number;
    HISTORICAL_TTL_SECONDS: number;
  };
  let yahooFinanceMock: {
    getHistoricalData: ReturnType<typeof vi.fn>;
  };
  let indicatorsMock: {
    calculateRSI: ReturnType<typeof vi.fn>;
    calculateMACD: ReturnType<typeof vi.fn>;
    calculateMovingAverages: ReturnType<typeof vi.fn>;
  };
  let aiReasoningMock: {
    scoreToSignal: ReturnType<typeof vi.fn>;
    calculateConfidence: ReturnType<typeof vi.fn>;
    generateReasoning: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.resetModules();

    cacheMock = {
      getCached: vi.fn(),
      setCached: vi.fn(),
      QUOTE_TTL_SECONDS: 300,
      HISTORICAL_TTL_SECONDS: 3600,
    };
    vi.doMock('@/services/cache', () => cacheMock);

    yahooFinanceMock = {
      getHistoricalData: vi.fn(),
    };
    vi.doMock('@/services/yahoo-finance', () => yahooFinanceMock);

    indicatorsMock = {
      calculateRSI: vi.fn(),
      calculateMACD: vi.fn(),
      calculateMovingAverages: vi.fn(),
    };
    vi.doMock('@/services/technical-indicators', () => indicatorsMock);

    aiReasoningMock = {
      scoreToSignal: vi.fn(),
      calculateConfidence: vi.fn(),
      generateReasoning: vi.fn(),
    };
    vi.doMock('@/services/ai-reasoning', () => aiReasoningMock);

    vi.doMock('@/lib/validators', () => ({
      sanitizeSymbol: (s: string) => s.toUpperCase().trim(),
    }));
  });

  afterEach(() => {
    vi.doUnmock('@/services/cache');
    vi.doUnmock('@/services/yahoo-finance');
    vi.doUnmock('@/services/technical-indicators');
    vi.doUnmock('@/services/ai-reasoning');
    vi.doUnmock('@/lib/validators');
  });

  function makeHistorical(candles: number[]) {
    return {
      symbol: 'RELIANCE.NS',
      timeframe: '1d' as const,
      candles: candles.map((c) => ({ time: 0, open: c, high: c, low: c, close: c, volume: 0 })),
    };
  }

  describe('generateSignal', () => {
    it('returns cached signal when cache has fresh data', async () => {
      const cachedSignal = {
        symbol: 'RELIANCE.NS',
        signal: 'BUY' as const,
        confidence: 75,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60 },
        generatedAt: new Date().toISOString(),
      };
      cacheMock.getCached.mockResolvedValue({
        data: { result: cachedSignal, cachedAt: cachedSignal.generatedAt },
        stale: false,
        source: 'cache',
      });

      const mod = await import('../signals');
      const result = await mod.generateSignal('RELIANCE.NS');

      expect(result.signal).toBe('BUY');
      expect(result.confidence).toBe(75);
      expect(yahooFinanceMock.getHistoricalData).not.toHaveBeenCalled();
    });

    it('generates new signal with all indicators', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      cacheMock.setCached.mockResolvedValue(undefined);

      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
      yahooFinanceMock.getHistoricalData.mockResolvedValue(makeHistorical(prices));
      indicatorsMock.calculateRSI.mockReturnValue([50, 55, 60]);
      indicatorsMock.calculateMACD.mockReturnValue({
        macd: [1, 2, 3],
        signal: [0.5, 1, 1.5],
        histogram: [0.5, 1, 1.5],
      });
      indicatorsMock.calculateMovingAverages.mockReturnValue({
        20: [100, 101, 102],
        50: [99, 100, 101],
        200: [98, 99, 100],
      });
      aiReasoningMock.calculateConfidence.mockReturnValue(75);
      aiReasoningMock.scoreToSignal.mockReturnValue('BUY');
      aiReasoningMock.generateReasoning.mockReturnValue('Bullish signal detected.');

      const mod = await import('../signals');
      const result = await mod.generateSignal('RELIANCE.NS');

      expect(result).toMatchObject({
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 75,
        reasoning: 'Bullish signal detected.',
        timeframe: '1d',
      });
      expect(result.indicators?.rsi).toBe(60);
      expect(result.indicators?.macd).toBe(3);
      expect(result.indicators?.sma20).toBe(102);
      expect(result.indicators?.sma50).toBe(101);
      expect(result.indicators?.sma200).toBe(100);
      expect(result.generatedAt).toBeDefined();
    });

    it('handles missing indicator values gracefully', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      cacheMock.setCached.mockResolvedValue(undefined);

      yahooFinanceMock.getHistoricalData.mockResolvedValue(makeHistorical([100]));
      indicatorsMock.calculateRSI.mockReturnValue([undefined]);
      indicatorsMock.calculateMACD.mockReturnValue({
        macd: [undefined],
        signal: [undefined],
        histogram: [],
      });
      indicatorsMock.calculateMovingAverages.mockReturnValue({});
      aiReasoningMock.calculateConfidence.mockReturnValue(50);
      aiReasoningMock.scoreToSignal.mockReturnValue('HOLD');
      aiReasoningMock.generateReasoning.mockReturnValue('Neutral signal.');

      const mod = await import('../signals');
      const result = await mod.generateSignal('TCS.NS');

      expect(result.signal).toBe('HOLD');
      expect(result.confidence).toBe(50);
      expect(result.indicators?.sma20).toBeUndefined();
    });

    it('fetches fresh data when cache is stale (does not return stale data)', async () => {
      cacheMock.getCached.mockResolvedValueOnce({
        data: null,
        stale: false,
        source: 'fresh',
      });
      cacheMock.getCached.mockResolvedValueOnce({
        data: null,
        stale: false,
        source: 'fresh',
      });
      cacheMock.setCached.mockResolvedValue(undefined);

      yahooFinanceMock.getHistoricalData.mockResolvedValue(makeHistorical(Array.from({ length: 50 }, (_, i) => 100 + i)));
      indicatorsMock.calculateRSI.mockReturnValue([50, 55, 60]);
      indicatorsMock.calculateMACD.mockReturnValue({ macd: [1], signal: [1], histogram: [0] });
      indicatorsMock.calculateMovingAverages.mockReturnValue({ 20: [100], 50: [100], 200: [100] });
      aiReasoningMock.calculateConfidence.mockReturnValue(50);
      aiReasoningMock.scoreToSignal.mockReturnValue('HOLD');
      aiReasoningMock.generateReasoning.mockReturnValue('Neutral signal.');

      const mod = await import('../signals');
      const result = await mod.generateSignal('RELIANCE.NS');

      expect(result.signal).toBe('HOLD');
      expect(yahooFinanceMock.getHistoricalData).toHaveBeenCalled();
    });
  });

  describe('getTopSignals', () => {
    it('returns cached top signals when available', async () => {
      const cachedSignals = [
        { symbol: 'RELIANCE.NS', signal: 'BUY' as const, confidence: 75, reasoning: 'test', timeframe: '1d', indicators: { rsi: 60 }, generatedAt: new Date().toISOString() },
      ];
      cacheMock.getCached.mockResolvedValue({
        data: cachedSignals,
        stale: false,
        source: 'cache',
      });

      const mod = await import('../signals');
      const result = await mod.getTopSignals(10);

      expect(result).toEqual(cachedSignals);
      expect(yahooFinanceMock.getHistoricalData).not.toHaveBeenCalled();
    });

    it('generates signals for default watchlist', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      cacheMock.setCached.mockResolvedValue(undefined);

      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
      yahooFinanceMock.getHistoricalData.mockResolvedValue(makeHistorical(prices));
      indicatorsMock.calculateRSI.mockReturnValue([50]);
      indicatorsMock.calculateMACD.mockReturnValue({ macd: [1], signal: [1], histogram: [0] });
      indicatorsMock.calculateMovingAverages.mockReturnValue({ 20: [100], 50: [100], 200: [100] });
      aiReasoningMock.calculateConfidence.mockReturnValue(75);
      aiReasoningMock.scoreToSignal.mockReturnValue('BUY');
      aiReasoningMock.generateReasoning.mockReturnValue('Bullish.');

      const mod = await import('../signals');
      const result = await mod.getTopSignals(5);

      expect(result.length).toBe(5);
      expect(yahooFinanceMock.getHistoricalData).toHaveBeenCalledTimes(5);
    });

    it('skips symbols that fail and continues with others', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      cacheMock.setCached.mockResolvedValue(undefined);

      yahooFinanceMock.getHistoricalData
        .mockResolvedValueOnce(makeHistorical(Array(50).fill(100)))
        .mockRejectedValueOnce(new Error('API failure'))
        .mockResolvedValueOnce(makeHistorical(Array(50).fill(100)));

      indicatorsMock.calculateRSI.mockReturnValue([50]);
      indicatorsMock.calculateMACD.mockReturnValue({ macd: [1], signal: [1], histogram: [0] });
      indicatorsMock.calculateMovingAverages.mockReturnValue({ 20: [100], 50: [100], 200: [100] });
      aiReasoningMock.calculateConfidence.mockReturnValue(75);
      aiReasoningMock.scoreToSignal.mockReturnValue('BUY');
      aiReasoningMock.generateReasoning.mockReturnValue('Bullish.');

      const mod = await import('../signals');
      const result = await mod.getTopSignals(3);

      expect(result.length).toBe(2);
    });

    it('uses cache key based on limit', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      cacheMock.setCached.mockResolvedValue(undefined);

      yahooFinanceMock.getHistoricalData.mockResolvedValue(makeHistorical([100]));
      indicatorsMock.calculateRSI.mockReturnValue([50]);
      indicatorsMock.calculateMACD.mockReturnValue({ macd: [1], signal: [1], histogram: [0] });
      indicatorsMock.calculateMovingAverages.mockReturnValue({ 20: [100], 50: [100], 200: [100] });
      aiReasoningMock.calculateConfidence.mockReturnValue(75);
      aiReasoningMock.scoreToSignal.mockReturnValue('BUY');
      aiReasoningMock.generateReasoning.mockReturnValue('Bullish.');

      const mod = await import('../signals');
      await mod.getTopSignals(10);

      expect(cacheMock.setCached).toHaveBeenCalledWith(
        'top-signals:10',
        expect.any(Array),
        600
      );
    });

    it('defaults limit to 10 when not specified', async () => {
      cacheMock.getCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
      cacheMock.setCached.mockResolvedValue(undefined);

      yahooFinanceMock.getHistoricalData.mockResolvedValue(makeHistorical([100]));
      indicatorsMock.calculateRSI.mockReturnValue([50]);
      indicatorsMock.calculateMACD.mockReturnValue({ macd: [1], signal: [1], histogram: [0] });
      indicatorsMock.calculateMovingAverages.mockReturnValue({ 20: [100], 50: [100], 200: [100] });
      aiReasoningMock.calculateConfidence.mockReturnValue(75);
      aiReasoningMock.scoreToSignal.mockReturnValue('BUY');
      aiReasoningMock.generateReasoning.mockReturnValue('Bullish.');

      const mod = await import('../signals');
      await mod.getTopSignals();

      expect(cacheMock.setCached).toHaveBeenCalledWith(
        'top-signals:10',
        expect.any(Array),
        600
      );
    });
  });

  describe('runScreener', () => {
    it('returns empty array', async () => {
      const mod = await import('../signals');
      const result = await mod.runScreener({});
      expect(result).toEqual([]);
    });
  });
});
