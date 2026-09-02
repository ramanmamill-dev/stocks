-- Migration: 001_watchlists
-- Creates the watchlists table for user stock watchlists

CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Watchlist',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  UNIQUE(watchlist_id, symbol)
);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlists"
  ON watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlists"
  ON watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists"
  ON watchlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists"
  ON watchlists FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own watchlist items"
  ON watchlist_items FOR SELECT
  USING (watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own watchlist items"
  ON watchlist_items FOR INSERT
  WITH CHECK (watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own watchlist items"
  ON watchlist_items FOR DELETE
  USING (watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid()));
