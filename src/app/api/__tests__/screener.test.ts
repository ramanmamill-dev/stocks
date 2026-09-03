import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetTopSignals } = vi.hoisted(() => ({
  mockGetTopSignals: vi.fn(),
}));

vi.mock('@/services/signals', () => ({
  getTopSignals: mockGetTopSignals,
}));

import { GET } from '../screener/route';

describe('GET /api/screener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with paginated results', async () => {
    mockGetTopSignals.mockResolvedValue([
      {
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 75,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 2500 },
        generatedAt: new Date().toISOString(),
      },
      {
        symbol: 'TCS.NS',
        signal: 'SELL',
        confidence: 30,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 80, sma20: 3500 },
        generatedAt: new Date().toISOString(),
      },
    ]);

    const request = new Request('http://localhost:3000/api/screener');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.length).toBe(2);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(10);
    expect(data.total).toBe(2);
    expect(data.totalPages).toBe(1);
  });

  it('filters by signal type', async () => {
    mockGetTopSignals.mockResolvedValue([
      {
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 75,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 2500 },
        generatedAt: new Date().toISOString(),
      },
      {
        symbol: 'TCS.NS',
        signal: 'SELL',
        confidence: 30,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 80, sma20: 3500 },
        generatedAt: new Date().toISOString(),
      },
    ]);

    const request = new Request('http://localhost:3000/api/screener?signal=BUY');
    const response = await GET(request);
    const data = await response.json();

    expect(data.results.length).toBe(1);
    expect(data.results[0].symbol).toBe('RELIANCE.NS');
  });

  it('filters by sector', async () => {
    mockGetTopSignals.mockResolvedValue([
      {
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 75,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 2500 },
        generatedAt: new Date().toISOString(),
      },
      {
        symbol: 'TCS.NS',
        signal: 'BUY',
        confidence: 75,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 3500 },
        generatedAt: new Date().toISOString(),
      },
    ]);

    const request = new Request('http://localhost:3000/api/screener?sector=Technology');
    const response = await GET(request);
    const data = await response.json();

    expect(data.results.length).toBe(1);
    expect(data.results[0].symbol).toBe('TCS.NS');
  });

  it('filters by PE ratio range', async () => {
    mockGetTopSignals.mockResolvedValue([
      {
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 75,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 2500 },
        generatedAt: new Date().toISOString(),
      },
      {
        symbol: 'TCS.NS',
        signal: 'BUY',
        confidence: 75,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 3500 },
        generatedAt: new Date().toISOString(),
      },
    ]);

    const request = new Request('http://localhost:3000/api/screener?peMin=20&peMax=30');
    const response = await GET(request);
    const data = await response.json();

    expect(data.results.length).toBe(2);
  });

  it('filters by exchange', async () => {
    mockGetTopSignals.mockResolvedValue([
      {
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 75,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 2500 },
        generatedAt: new Date().toISOString(),
      },
    ]);

    const request = new Request('http://localhost:3000/api/screener?exchange=NSE');
    const response = await GET(request);
    const data = await response.json();

    expect(data.results.length).toBe(1);
    expect(data.results[0].exchange).toBe('NSE');
  });

  it('handles no signal param (defaults to ANY)', async () => {
    mockGetTopSignals.mockResolvedValue([
      {
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 75,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 2500 },
        generatedAt: new Date().toISOString(),
      },
    ]);

    const request = new Request('http://localhost:3000/api/screener');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.length).toBe(1);
  });

  it('returns empty results on getTopSignals failure', async () => {
    mockGetTopSignals.mockRejectedValue(new Error('API failure'));

    const request = new Request('http://localhost:3000/api/screener');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
  });

  it('sorts by confidence descending by default', async () => {
    mockGetTopSignals.mockResolvedValue([
      {
        symbol: 'SBIN.NS',
        signal: 'BUY',
        confidence: 40,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 100 },
        generatedAt: new Date().toISOString(),
      },
      {
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 90,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 200 },
        generatedAt: new Date().toISOString(),
      },
    ]);

    const request = new Request('http://localhost:3000/api/screener');
    const response = await GET(request);
    const data = await response.json();

    expect(data.results[0].symbol).toBe('RELIANCE.NS');
    expect(data.results[1].symbol).toBe('SBIN.NS');
  });

  it('sorts ascending when sortOrder is asc', async () => {
    mockGetTopSignals.mockResolvedValue([
      {
        symbol: 'SBIN.NS',
        signal: 'BUY',
        confidence: 40,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 100 },
        generatedAt: new Date().toISOString(),
      },
      {
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 90,
        reasoning: 'test',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 200 },
        generatedAt: new Date().toISOString(),
      },
    ]);

    const request = new Request('http://localhost:3000/api/screener?sortOrder=asc&sortBy=confidence');
    const response = await GET(request);
    const data = await response.json();

    expect(data.results[0].symbol).toBe('SBIN.NS');
    expect(data.results[1].symbol).toBe('RELIANCE.NS');
  });

  it('supports pagination with default watchlist symbols', async () => {
    const signals = Array.from({ length: 10 }, (_, i) => ({
      symbol: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS', 'LT.NS'][i],
      signal: 'BUY' as const,
      confidence: 75,
      reasoning: 'test',
      timeframe: '1d' as const,
      indicators: { rsi: 60, sma20: 100 + i },
      generatedAt: new Date().toISOString(),
    }));
    mockGetTopSignals.mockResolvedValue(signals);

    const request = new Request('http://localhost:3000/api/screener?page=1&pageSize=5');
    const response = await GET(request);
    const data = await response.json();

    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(5);
    expect(data.total).toBe(10);
    expect(data.totalPages).toBe(2);
    expect(data.results.length).toBe(5);
  });

  it('returns result with correct fields', async () => {
    mockGetTopSignals.mockResolvedValue([
      {
        symbol: 'RELIANCE.NS',
        signal: 'BUY',
        confidence: 75,
        reasoning: 'Strong bullish signal.',
        timeframe: '1d',
        indicators: { rsi: 60, sma20: 2500 },
        generatedAt: '2026-09-02T10:00:00.000Z',
      },
    ]);

    const request = new Request('http://localhost:3000/api/screener');
    const response = await GET(request);
    const data = await response.json();

    expect(data.results[0]).toMatchObject({
      symbol: 'RELIANCE.NS',
      name: 'Reliance Industries',
      signal: 'BUY',
      confidence: 75,
      sector: 'Energy',
      exchange: 'NSE',
      peRatio: 25,
      marketCap: 1800000,
    });
  });
});
