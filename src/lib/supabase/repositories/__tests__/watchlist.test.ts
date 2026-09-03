import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function createSupabaseMock() {
  const responses: Record<string, Record<string, unknown>> = {};

  const mockFrom = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn((col: string, val: unknown) => {
        const key = `${table}.select.eq:${col}`;
        const resolver = responses[key];
        if (resolver) {
          return {
            order: vi.fn(() => Promise.resolve(resolver)),
            single: vi.fn(() => Promise.resolve(resolver)),
          };
        }
        return {
          order: vi.fn(() => Promise.resolve(resolver ?? { data: null, error: null })),
          single: vi.fn(() => Promise.resolve(resolver ?? { data: null, error: null })),
        };
      }),
    })),
    insert: vi.fn((data: Record<string, unknown>) => ({
      select: vi.fn(() => ({
        single: vi.fn(() => {
          const key = `${table}.insert.single`;
          return Promise.resolve(responses[key] ?? { data: { ...data, id: 'mock-id' }, error: null });
        }),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn((col: string, val: unknown) => {
        const key = `${table}.delete.eq:${col}`;
        return Promise.resolve(responses[key] ?? { error: null });
      }),
    })),
    upsert: vi.fn((data: Record<string, unknown>) => ({
      select: vi.fn(() => ({
        single: vi.fn(() => {
          const key = `${table}.upsert.single`;
          return Promise.resolve(responses[key] ?? { data: { ...data, id: 'mock-id' }, error: null });
        }),
      })),
    })),
  }));

  const supabase = { from: mockFrom };
  const setResponse = (key: string, value: unknown) => {
    responses[key] = value as Record<string, unknown>;
  };

  return { supabase, setResponse, mockFrom };
}

describe('watchlist repository', () => {
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

  describe('getUserWatchlists', () => {
    it('fetches watchlists for a user', async () => {
      const mockData = [{ id: '1', user_id: 'user1', name: 'My List', created_at: '2026-01-01', updated_at: '2026-01-01' }];
      supabaseMock.setResponse('watchlists.select.eq:user_id', { data: mockData, error: null });

      const { getUserWatchlists } = await import('../watchlist');
      const result = await getUserWatchlists('user1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My List');
    });

    it('returns empty array when no data', async () => {
      supabaseMock.setResponse('watchlists.select.eq:user_id', { data: null, error: null });

      const { getUserWatchlists } = await import('../watchlist');
      const result = await getUserWatchlists('user1');
      expect(result).toEqual([]);
    });

    it('throws on supabase error', async () => {
      supabaseMock.setResponse('watchlists.select.eq:user_id', { data: null, error: { message: 'DB error' } });

      const { getUserWatchlists } = await import('../watchlist');
      await expect(getUserWatchlists('user1')).rejects.toThrow('DB error');
    });
  });

  describe('createWatchlist', () => {
    it('creates a watchlist', async () => {
      const mockData = { id: '1', user_id: 'user1', name: 'New List', created_at: '2026-01-01', updated_at: '2026-01-01' };
      supabaseMock.setResponse('watchlists.insert.single', { data: mockData, error: null });

      const { createWatchlist } = await import('../watchlist');
      const result = await createWatchlist('user1', 'New List');

      expect(result.name).toBe('New List');
      expect(result.id).toBe('1');
    });

    it('throws on supabase error', async () => {
      supabaseMock.setResponse('watchlists.insert.single', { data: null, error: { message: 'Insert failed' } });

      const { createWatchlist } = await import('../watchlist');
      await expect(createWatchlist('user1', 'New List')).rejects.toThrow('Insert failed');
    });
  });

  describe('deleteWatchlist', () => {
    it('deletes a watchlist', async () => {
      supabaseMock.setResponse('watchlists.delete.eq:id', { error: null });

      const { deleteWatchlist } = await import('../watchlist');
      await deleteWatchlist('wl-1');

      expect(supabaseMock.mockFrom).toHaveBeenCalledWith('watchlists');
    });

    it('throws on supabase error', async () => {
      supabaseMock.setResponse('watchlists.delete.eq:id', { error: { message: 'Delete failed' } });

      const { deleteWatchlist } = await import('../watchlist');
      await expect(deleteWatchlist('wl-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('getWatchlistItems', () => {
    it('fetches watchlist items', async () => {
      const mockData = [{ id: '1', watchlist_id: 'wl-1', symbol: 'RELIANCE.NS', added_at: '2026-01-01', notes: null }];
      supabaseMock.setResponse('watchlist_items.select.eq:watchlist_id', { data: mockData, error: null });

      const { getWatchlistItems } = await import('../watchlist');
      const result = await getWatchlistItems('wl-1');

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('RELIANCE.NS');
    });

    it('returns empty array when no data', async () => {
      supabaseMock.setResponse('watchlist_items.select.eq:watchlist_id', { data: null, error: null });

      const { getWatchlistItems } = await import('../watchlist');
      const result = await getWatchlistItems('wl-1');
      expect(result).toEqual([]);
    });

    it('throws on supabase error', async () => {
      supabaseMock.setResponse('watchlist_items.select.eq:watchlist_id', { data: null, error: { message: 'Fetch failed' } });

      const { getWatchlistItems } = await import('../watchlist');
      await expect(getWatchlistItems('wl-1')).rejects.toThrow('Fetch failed');
    });
  });

  describe('addWatchlistItem', () => {
    it('adds an item to watchlist', async () => {
      const mockData = { id: 'item-1', watchlist_id: 'wl-1', symbol: 'RELIANCE.NS', added_at: '2026-01-01', notes: null };
      supabaseMock.setResponse('watchlist_items.insert.single', { data: mockData, error: null });

      const { addWatchlistItem } = await import('../watchlist');
      const result = await addWatchlistItem('wl-1', 'RELIANCE.NS');

      expect(result.symbol).toBe('RELIANCE.NS');
      expect(result.id).toBe('item-1');
    });

    it('adds an item with notes', async () => {
      const mockData = { id: 'item-1', watchlist_id: 'wl-1', symbol: 'TCS.NS', added_at: '2026-01-01', notes: 'Long term hold' };
      supabaseMock.setResponse('watchlist_items.insert.single', { data: mockData, error: null });

      const { addWatchlistItem } = await import('../watchlist');
      const result = await addWatchlistItem('wl-1', 'TCS.NS', 'Long term hold');

      expect(result.notes).toBe('Long term hold');
    });

    it('throws on supabase error', async () => {
      supabaseMock.setResponse('watchlist_items.insert.single', { data: null, error: { message: 'Insert failed' } });

      const { addWatchlistItem } = await import('../watchlist');
      await expect(addWatchlistItem('wl-1', 'RELIANCE.NS')).rejects.toThrow('Insert failed');
    });
  });

  describe('removeWatchlistItem', () => {
    it('removes an item from watchlist', async () => {
      supabaseMock.setResponse('watchlist_items.delete.eq:id', { error: null });

      const { removeWatchlistItem } = await import('../watchlist');
      await removeWatchlistItem('item-1');

      expect(supabaseMock.mockFrom).toHaveBeenCalledWith('watchlist_items');
    });

    it('throws on supabase error', async () => {
      supabaseMock.setResponse('watchlist_items.delete.eq:id', { error: { message: 'Delete failed' } });

      const { removeWatchlistItem } = await import('../watchlist');
      await expect(removeWatchlistItem('item-1')).rejects.toThrow('Delete failed');
    });
  });
});
