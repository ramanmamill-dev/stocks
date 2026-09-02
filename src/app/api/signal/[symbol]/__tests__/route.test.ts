import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/market/status', () => ({
  isMarketOpen: vi.fn(),
}));

vi.mock('@/services/yahoo-finance', () => ({
  getLiveQuote: vi.fn(),
}));

vi.mock('@/services/signals', () => ({
  generateSignal: vi.fn(),
}));

import { isMarketOpen } from '@/services/market/status';
import { getLiveQuote } from '@/services/yahoo-finance';
import { generateSignal } from '@/services/signals';
import { GET } from '../route';

const mockMarketOpen = vi.mocked(isMarketOpen);
const mockGetLiveQuote = vi.mocked(getLiveQuote);
const mockGenerateSignal = vi.mocked(generateSignal);

describe('GET /api/signal/[symbol]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns valid signal response for valid symbol', async () => {
    mockMarketOpen.mockReturnValue({
      open: true,
      message: 'Market Open',
      timestamp: new Date().toISOString(),
      reason: 'OPEN',
    });

    mockGetLiveQuote.mockResolvedValue({
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

    mockGenerateSignal.mockResolvedValue({
      symbol: 'RELIANCE.NS',
      signal: 'BUY',
      confidence: 75,
      reasoning: 'Strong bullish signal.',
      timeframe: '1d',
      indicators: { rsi: 60 },
      generatedAt: new Date().toISOString(),
    });

    const request = new Request('http://localhost:3000/api/signal/RELIANCE.NS');
    const response = await GET(request, { params: { symbol: 'RELIANCE.NS' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.symbol).toBe('RELIANCE.NS');
    expect(data.marketStatus).toBe('OPEN');
    expect(data.quote.price).toBe(2500);
    expect(data.quote.change).toBe(50);
    expect(data.signal.type).toBe('BUY');
    expect(data.signal.confidence).toBe(75);
  });

  it('zeros out change when market is closed', async () => {
    mockMarketOpen.mockReturnValue({
      open: false,
      message: 'Market Closed (After Hours)',
      timestamp: new Date().toISOString(),
      reason: 'POST_MARKET',
    });

    mockGetLiveQuote.mockResolvedValue({
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

    mockGenerateSignal.mockResolvedValue({
      symbol: 'RELIANCE.NS',
      signal: 'HOLD',
      confidence: 50,
      reasoning: 'Market closed.',
      timeframe: '1d',
      indicators: {},
      generatedAt: new Date().toISOString(),
    });

    const request = new Request('http://localhost:3000/api/signal/RELIANCE.NS');
    const response = await GET(request, { params: { symbol: 'RELIANCE.NS' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.marketStatus).toBe('CLOSED');
    expect(data.quote.change).toBe(0);
    expect(data.quote.changePercent).toBe(0);
    expect(data.quote.isEOD).toBe(true);
  });

  it('returns 400 for invalid symbol', async () => {
    const request = new Request('http://localhost:3000/api/signal/INVALID!');
    const response = await GET(request, { params: { symbol: 'INVALID!' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_SYMBOL');
  });

  it('returns 503 when quote fetch fails', async () => {
    mockMarketOpen.mockReturnValue({
      open: true,
      message: 'Market Open',
      timestamp: new Date().toISOString(),
      reason: 'OPEN',
    });

    mockGetLiveQuote.mockRejectedValue(new Error('API failure'));

    const request = new Request('http://localhost:3000/api/signal/RELIANCE.NS');
    const response = await GET(request, { params: { symbol: 'RELIANCE.NS' } });
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.code).toBe('SERVICE_UNAVAILABLE');
    expect(data.retryable).toBe(true);
  });
});
