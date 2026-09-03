import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockLogRequest } = vi.hoisted(() => ({
  mockLogRequest: vi.fn(),
}));

vi.mock('@/lib/sentry', () => ({
  logRequest: mockLogRequest,
  initSentry: vi.fn(),
}));

import { GET } from '../health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with health status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
    expect(data.memory).toBeDefined();
    expect(data.uptime).toBeDefined();
  });

  it('includes memory usage with rss, heapTotal, heapUsed, external', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.memory).toHaveProperty('rss');
    expect(data.memory).toHaveProperty('heapTotal');
    expect(data.memory).toHaveProperty('heapUsed');
    expect(data.memory).toHaveProperty('external');
  });

  it('includes uptime as a number', async () => {
    const response = await GET();
    const data = await response.json();

    expect(typeof data.uptime).toBe('number');
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });

  it('calls logRequest with correct parameters', async () => {
    await GET();

    expect(mockLogRequest).toHaveBeenCalledTimes(1);
    const entry = mockLogRequest.mock.calls[0][0];
    expect(entry.level).toBe('info');
    expect(entry.endpoint).toBe('/api/health');
    expect(typeof entry.duration).toBe('number');
    expect(entry.message).toBe('Health check OK');
  });

  it('sets Cache-Control header to no-store', async () => {
    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
