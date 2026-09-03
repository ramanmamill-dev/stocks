import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  mockIsMarketOpen,
  mockGetLiveQuote,
  mockGenerateSignal,
  mockGetHistoricalData,
  mockGetCached,
  mockSetCached,
  mockCalculateRSI,
  mockCalculateMACD,
  mockCalculateMovingAverages,
  mockScoreToSignal,
  mockCalculateConfidence,
  mockGenerateReasoning,
  mockGetTopSignals,
} = vi.hoisted(() => ({
  mockIsMarketOpen: vi.fn(),
  mockGetLiveQuote: vi.fn(),
  mockGenerateSignal: vi.fn(),
  mockGetHistoricalData: vi.fn(),
  mockGetCached: vi.fn(),
  mockSetCached: vi.fn(),
  mockCalculateRSI: vi.fn(),
  mockCalculateMACD: vi.fn(),
  mockCalculateMovingAverages: vi.fn(),
  mockScoreToSignal: vi.fn(),
  mockCalculateConfidence: vi.fn(),
  mockGenerateReasoning: vi.fn(),
  mockGetTopSignals: vi.fn(),
}));

vi.mock('@/services/market/status', () => ({
  isMarketOpen: mockIsMarketOpen,
}));

vi.mock('@/services/yahoo-finance', () => ({
  getLiveQuote: mockGetLiveQuote,
  getHistoricalData: mockGetHistoricalData,
  YahooFinanceError: class YahooFinanceError extends Error {
    constructor(message: string, cause?: unknown) {
      super(message);
      this.name = 'YahooFinanceError';
    }
  },
}));

vi.mock('@/services/signals', () => ({
  generateSignal: mockGenerateSignal,
  getTopSignals: mockGetTopSignals,
  runScreener: vi.fn(),
}));

vi.mock('@/services/cache', () => ({
  getCached: mockGetCached,
  setCached: mockSetCached,
  quoteCacheKey: vi.fn((s: string) => `quote:${s}`),
  historicalCacheKey: vi.fn((s: string, t: string) => `historical:${s}:${t}`),
  QUOTE_TTL_SECONDS: 300,
  HISTORICAL_TTL_SECONDS: 3600,
}));

vi.mock('@/services/technical-indicators', () => ({
  calculateRSI: mockCalculateRSI,
  calculateMACD: mockCalculateMACD,
  calculateMovingAverages: mockCalculateMovingAverages,
  calculateBollingerBands: vi.fn(),
}));

vi.mock('@/services/ai-reasoning', () => ({
  scoreToSignal: mockScoreToSignal,
  calculateConfidence: mockCalculateConfidence,
  generateReasoning: mockGenerateReasoning,
}));

vi.mock('@/services/indian-stock-market-api', () => ({
  getLiveQuoteFallback: vi.fn(),
  getHistoricalDataFallback: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  sleep: vi.fn(),
  checkCircuit: vi.fn(),
  formatPrice: vi.fn(),
  formatPercent: vi.fn(),
  formatNumber: vi.fn(),
  formatVolume: vi.fn(),
  toISTParts: vi.fn(),
  toISTDateString: vi.fn(),
  formatIST: vi.fn(),
  shortId: vi.fn(),
  STALENESS_POLICY: {},
  classifyFreshness: vi.fn(),
}));

vi.mock('@/lib/validators', () => {
  class InvalidSymbolError extends Error {
    code = 'INVALID_SYMBOL';
    constructor(s: string) { super(`Invalid symbol: "${s}"`); this.name = 'InvalidSymbolError'; }
  }
  const SYMBOL_REGEX = /^[A-Z0-9]{1,20}\.(NS|BO)$/;
  return {
    sanitizeSymbol: (s: string) => {
      const cleaned = s.toUpperCase().trim();
      if (!SYMBOL_REGEX.test(cleaned)) throw new InvalidSymbolError(s);
      return cleaned;
    },
    InvalidSymbolError,
    sanitizeTimeframe: vi.fn(),
    isValidTimeframe: vi.fn(),
  };
});

vi.mock('@/lib/sentry', () => ({
  logRequest: vi.fn(),
  initSentry: vi.fn(),
  captureError: vi.fn(),
}));

describe('E2E: Full signal flow (market status -> quote -> signal)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('happy path: market open -> fetch quote -> generate signal -> return response', async () => {
    mockIsMarketOpen.mockReturnValue({
      open: true,
      message: 'Market Open',
      timestamp: new Date().toISOString(),
      reason: 'OPEN',
    });

    mockGetCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });

    mockGetLiveQuote.mockResolvedValue({
      symbol: 'RELIANCE.NS',
      price: 2500,
      change: 50,
      changePercent: 2.05,
      previousClose: 2450,
      dayHigh: 2520,
      dayLow: 2480,
      volume: 1000000,
      isEOD: false,
      lastUpdated: new Date().toISOString(),
    });

    mockGenerateSignal.mockResolvedValue({
      symbol: 'RELIANCE.NS',
      signal: 'BUY',
      confidence: 75,
      reasoning: 'Strong bullish signal detected from technical analysis.',
      timeframe: '1d',
      indicators: { rsi: 65, macd: 2.5, macdSignal: 1.8, sma20: 2480, sma50: 2450, sma200: 2400 },
      generatedAt: new Date().toISOString(),
    });

    const { GET } = await import('@/app/api/signal/[symbol]/route');
    const request = new Request('http://localhost:3000/api/signal/RELIANCE.NS');
    const response = await GET(request, { params: { symbol: 'RELIANCE.NS' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.symbol).toBe('RELIANCE.NS');
    expect(data.marketStatus).toBe('OPEN');
    expect(data.quote.price).toBe(2500);
    expect(data.quote.change).toBe(50);
    expect(data.quote.isEOD).toBe(false);
    expect(data.signal.type).toBe('BUY');
    expect(data.signal.confidence).toBe(75);
    expect(data.signal.indicators?.rsi).toBe(65);
  });

  it('market closed flow: zeros out change and sets isEOD=true', async () => {
    mockIsMarketOpen.mockReturnValue({
      open: false,
      message: 'Market Closed (After Hours)',
      timestamp: new Date().toISOString(),
      reason: 'POST_MARKET',
    });

    mockGetCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });

    mockGetLiveQuote.mockResolvedValue({
      symbol: 'RELIANCE.NS',
      price: 2500,
      change: 50,
      changePercent: 2.05,
      previousClose: 2450,
      dayHigh: 2520,
      dayLow: 2480,
      volume: 1000000,
      isEOD: false,
      lastUpdated: new Date().toISOString(),
    });

    mockGenerateSignal.mockResolvedValue({
      symbol: 'RELIANCE.NS',
      signal: 'HOLD',
      confidence: 50,
      reasoning: 'Market closed, no live signal.',
      timeframe: '1d',
      indicators: {},
      generatedAt: new Date().toISOString(),
    });

    const { GET } = await import('@/app/api/signal/[symbol]/route');
    const request = new Request('http://localhost:3000/api/signal/RELIANCE.NS');
    const response = await GET(request, { params: { symbol: 'RELIANCE.NS' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.marketStatus).toBe('CLOSED');
    expect(data.quote.change).toBe(0);
    expect(data.quote.changePercent).toBe(0);
    expect(data.quote.isEOD).toBe(true);
  });

  it('screener flow: getTopSignals -> filter -> paginate', async () => {
    mockGetTopSignals.mockResolvedValue([
      {
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 90,
        reasoning: 'Strong buy',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 2500 },
        generatedAt: new Date().toISOString(),
      },
      {
        symbol: 'TCS.NS',
        signal: 'SELL',
        confidence: 20,
        reasoning: 'Strong sell',
        timeframe: '1d',
        indicators: { rsi: 85, sma20: 3500 },
        generatedAt: new Date().toISOString(),
      },
    ]);

    const { GET: screenerGET } = await import('@/app/api/screener/route');
    const request = new Request('http://localhost:3000/api/screener?signal=BUY');
    const response = await screenerGET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.length).toBe(1);
    expect(data.results[0].symbol).toBe('RELIANCE.NS');
    expect(data.results[0].confidence).toBe(90);
  });

  it('market status flow: returns OPEN/CLOSED correctly', async () => {
    mockIsMarketOpen.mockReturnValue({
      open: true,
      message: 'Market Open',
      timestamp: new Date().toISOString(),
      reason: 'OPEN',
    });

    const { GET: statusGET } = await import('@/app/api/market/status/route');
    const response = await statusGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.open).toBe(true);
    expect(data.reason).toBe('OPEN');
  });

  it('health check flow: returns system metrics', async () => {
    const { GET: healthGET } = await import('@/app/api/health/route');
    const response = await healthGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.uptime).toBeGreaterThanOrEqual(0);
    expect(data.memory).toBeDefined();
  });
});

describe('E2E: Error handling flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalid symbol returns 400', async () => {
    const { GET } = await import('@/app/api/signal/[symbol]/route');
    const request = new Request('http://localhost:3000/api/signal/INVALID!');
    const response = await GET(request, { params: { symbol: 'INVALID!' } });

    expect(response.status).toBe(400);
  });

  it('quote fetch failure returns 503', async () => {
    mockIsMarketOpen.mockReturnValue({
      open: true,
      message: 'Market Open',
      timestamp: new Date().toISOString(),
      reason: 'OPEN',
    });

    mockGetCached.mockResolvedValue({ data: null, stale: false, source: 'fresh' });
    mockGetLiveQuote.mockRejectedValue(new Error('API failure'));

    const { GET } = await import('@/app/api/signal/[symbol]/route');
    const request = new Request('http://localhost:3000/api/signal/RELIANCE.NS');
    const response = await GET(request, { params: { symbol: 'RELIANCE.NS' } });
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.code).toBe('SERVICE_UNAVAILABLE');
    expect(data.retryable).toBe(true);
  });
});
