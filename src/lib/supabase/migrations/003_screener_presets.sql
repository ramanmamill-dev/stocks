-- Migration: 003_screener_presets
-- Creates the screener_presets table for saved screener configurations

CREATE TABLE IF NOT EXISTS screener_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screener_presets_user ON screener_presets(user_id);

ALTER TABLE screener_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screener presets"
  ON screener_presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screener presets"
  ON screener_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screener presets"
  ON screener_presets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own screener presets"
  ON screener_presets FOR DELETE
  USING (auth.uid() = user_id);
