-- Migration: 002_cached_signals
-- Creates the cached_signals table for storing computed signals

CREATE TABLE IF NOT EXISTS cached_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  reasoning TEXT NOT NULL DEFAULT '',
  indicators JSONB,
  timeframe TEXT NOT NULL DEFAULT '1d',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cached_signals_symbol ON cached_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_cached_signals_expires ON cached_signals(expires_at);

ALTER TABLE cached_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cached signals"
  ON cached_signals FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert cached signals"
  ON cached_signals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can delete expired signals"
  ON cached_signals FOR DELETE
  USING (expires_at < NOW());
