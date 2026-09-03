import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockIsMarketOpen } = vi.hoisted(() => ({
  mockIsMarketOpen: vi.fn(),
}));

vi.mock('@/services/market/status', () => ({
  isMarketOpen: mockIsMarketOpen,
}));

import { GET } from '../market/status/route';

describe('GET /api/market/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with market open status', async () => {
    mockIsMarketOpen.mockReturnValue({
      open: true,
      message: 'Market Open',
      timestamp: new Date().toISOString(),
      reason: 'OPEN',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.open).toBe(true);
    expect(data.message).toBe('Market Open');
    expect(data.timestamp).toBeDefined();
    expect(data.reason).toBe('OPEN');
  });

  it('returns 200 with market closed status', async () => {
    mockIsMarketOpen.mockReturnValue({
      open: false,
      message: 'Market Closed (Weekend)',
      timestamp: new Date().toISOString(),
      reason: 'WEEKEND',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.open).toBe(false);
    expect(data.message).toBe('Market Closed (Weekend)');
    expect(data.reason).toBe('WEEKEND');
  });

  it('returns 200 with holidays status', async () => {
    mockIsMarketOpen.mockReturnValue({
      open: false,
      message: 'Market Closed (Holiday: 2026-01-26)',
      timestamp: new Date().toISOString(),
      reason: 'HOLIDAY',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.open).toBe(false);
    expect(data.reason).toBe('HOLIDAY');
  });

  it('sets Cache-Control header to no-store', async () => {
    mockIsMarketOpen.mockReturnValue({
      open: true,
      message: 'Market Open',
      timestamp: new Date().toISOString(),
      reason: 'OPEN',
    });

    const response = await GET();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('passes through the isMarketOpen result transparently', async () => {
    const mockResult = {
      open: false,
      message: 'Market Closed (After Hours)',
      timestamp: '2026-09-02T10:00:00.000Z',
      reason: 'POST_MARKET',
    };
    mockIsMarketOpen.mockReturnValue(mockResult);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual(mockResult);
  });
});
