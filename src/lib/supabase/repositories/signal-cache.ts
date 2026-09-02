import { supabase } from '@/lib/supabase';

export interface CachedSignal {
  id: string;
  symbol: string;
  signal_type: string;
  confidence: number;
  reasoning: string;
  indicators: Record<string, unknown> | null;
  timeframe: string;
  generated_at: string;
  expires_at: string;
}

export async function getCachedSignal(symbol: string): Promise<CachedSignal | null> {
  const { data, error } = await supabase
    .from('cached_signals')
    .select('*')
    .eq('symbol', symbol)
    .gt('expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function upsertCachedSignal(signal: Omit<CachedSignal, 'id'>): Promise<CachedSignal> {
  const { data, error } = await supabase
    .from('cached_signals')
    .upsert(signal)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExpiredSignals(): Promise<void> {
  const { error } = await supabase
    .from('cached_signals')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) throw error;
}
