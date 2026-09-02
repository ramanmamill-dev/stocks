import { supabase } from '@/lib/supabase';

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  symbol: string;
  added_at: string;
  notes: string | null;
}

export async function getUserWatchlists(userId: string): Promise<Watchlist[]> {
  const { data, error } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createWatchlist(userId: string, name: string): Promise<Watchlist> {
  const { data, error } = await supabase
    .from('watchlists')
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWatchlist(watchlistId: string): Promise<void> {
  const { error } = await supabase.from('watchlists').delete().eq('id', watchlistId);
  if (error) throw error;
}

export async function getWatchlistItems(watchlistId: string): Promise<WatchlistItem[]> {
  const { data, error } = await supabase
    .from('watchlist_items')
    .select('*')
    .eq('watchlist_id', watchlistId)
    .order('added_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addWatchlistItem(
  watchlistId: string,
  symbol: string,
  notes?: string
): Promise<WatchlistItem> {
  const { data, error } = await supabase
    .from('watchlist_items')
    .insert({ watchlist_id: watchlistId, symbol, notes: notes ?? null })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeWatchlistItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('watchlist_items').delete().eq('id', itemId);
  if (error) throw error;
}
