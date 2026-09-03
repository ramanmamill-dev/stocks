import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function createSupabaseMock() {
  const responses: Record<string, unknown> = {};

  const mockFrom = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn((col: string, val: unknown) => {
        const key = `${table}.select.eq:${col}`;
        const resolver = responses[key] as { data: unknown; error: unknown } | undefined;
        const result = resolver ?? { data: null, error: null };
        return {
          gt: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(result)),
              })),
            })),
          })),
        };
      }),
    })),
    upsert: vi.fn((data: Record<string, unknown>) => ({
      select: vi.fn(() => ({
        single: vi.fn(() => {
          const key = `${table}.upsert.single`;
          const result = responses[key] as { data: unknown; error: unknown } | undefined;
          return Promise.resolve(result ?? { data: { ...data, id: 'mock-id' }, error: null });
        }),
      })),
    })),
    delete: vi.fn(() => ({
      lt: vi.fn(() => {
        const key = `${table}.delete.lt`;
        const result = responses[key] as { error: unknown } | undefined;
        return Promise.resolve(result ?? { error: null });
      }),
    })),
  }));

  const supabase = { from: mockFrom };
  const setResponse = (key: string, value: unknown) => {
    responses[key] = value;
  };

  return { supabase, setResponse, mockFrom };
}

describe('signal-cache repository', () => {
  let supabaseMock: ReturnType<typeof createSupabaseMock>;

  beforeEach(async () => {
    vi.resetModules();
    supabaseMock = createSupabaseMock();
    vi.doMock('@/lib/supabase', () => ({
      supabase: supabaseMock.supabase,
    }));
  });

  afterEach(() => {
    vi.doUnmock('@/lib/supabase');
  });

  describe('getCachedSignal', () => {
    it('fetches a cached signal for a symbol', async () => {
      const mockData = {
        id: '1',
        symbol: 'RELIANCE.NS',
        signal_type: 'BUY',
        confidence: 75,
        reasoning: 'Bullish',
        indicators: { rsi: 60 },
        timeframe: '1d',
        generated_at: '2026-01-01',
        expires_at: '2026-01-02',
      };
      supabaseMock.setResponse('cached_signals.select.eq:symbol', { data: mockData, error: null });

      const { getCachedSignal } = await import('../signal-cache');
      const result = await getCachedSignal('RELIANCE.NS');

      expect(supabaseMock.mockFrom).toHaveBeenCalledWith('cached_signals');
      expect(result?.symbol).toBe('RELIANCE.NS');
      expect(result?.signal_type).toBe('BUY');
    });

    it('returns null when no cached signal found (PGRST116)', async () => {
      supabaseMock.setResponse('cached_signals.select.eq:symbol', {
        data: null,
        error: { code: 'PGRST116', message: 'No rows' },
      });

      const { getCachedSignal } = await import('../signal-cache');
      const result = await getCachedSignal('RELIANCE.NS');
      expect(result).toBeNull();
    });

    it('throws on non-PGRST116 error', async () => {
      supabaseMock.setResponse('cached_signals.select.eq:symbol', {
        data: null,
        error: { code: '500', message: 'Database error' },
      });

      const { getCachedSignal } = await import('../signal-cache');
      await expect(getCachedSignal('RELIANCE.NS')).rejects.toThrow('Database error');
    });
  });

  describe('upsertCachedSignal', () => {
    it('inserts or updates a cached signal', async () => {
      const signalToUpsert = {
        symbol: 'RELIANCE.NS',
        signal_type: 'BUY',
        confidence: 75,
        reasoning: 'Bullish',
        indicators: { rsi: 60 },
        timeframe: '1d',
        generated_at: '2026-01-01',
        expires_at: '2026-01-02',
      };
      const mockResult = { ...signalToUpsert, id: '1' };
      supabaseMock.setResponse('cached_signals.upsert.single', { data: mockResult, error: null });

      const { upsertCachedSignal } = await import('../signal-cache');
      const result = await upsertCachedSignal(signalToUpsert);

      expect(supabaseMock.mockFrom).toHaveBeenCalledWith('cached_signals');
      expect(result.id).toBe('1');
      expect(result.signal_type).toBe('BUY');
    });

    it('throws on supabase error', async () => {
      const signalToUpsert = {
        symbol: 'RELIANCE.NS',
        signal_type: 'BUY',
        confidence: 75,
        reasoning: 'Bullish',
        indicators: null,
        timeframe: '1d',
        generated_at: '2026-01-01',
        expires_at: '2026-01-02',
      };
      supabaseMock.setResponse('cached_signals.upsert.single', { data: null, error: { message: 'Upsert failed' } });

      const { upsertCachedSignal } = await import('../signal-cache');
      await expect(upsertCachedSignal(signalToUpsert)).rejects.toThrow('Upsert failed');
    });
  });

  describe('deleteExpiredSignals', () => {
    it('deletes expired signals', async () => {
      supabaseMock.setResponse('cached_signals.delete.lt', { error: null });

      const { deleteExpiredSignals } = await import('../signal-cache');
      await deleteExpiredSignals();

      expect(supabaseMock.mockFrom).toHaveBeenCalledWith('cached_signals');
    });

    it('throws on supabase error', async () => {
      supabaseMock.setResponse('cached_signals.delete.lt', { error: { message: 'Delete failed' } });

      const { deleteExpiredSignals } = await import('../signal-cache');
      await expect(deleteExpiredSignals()).rejects.toThrow('Delete failed');
    });
  });
});
