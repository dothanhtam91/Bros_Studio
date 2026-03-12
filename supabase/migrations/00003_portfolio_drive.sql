-- Portfolio items synced from Google Drive (and optional local)
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_file_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  folder_label TEXT DEFAULT 'Portfolio',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_folder ON portfolio_items(folder_label);

-- Store the Drive folder ID used for sync (one folder for now)
CREATE TABLE IF NOT EXISTS portfolio_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO portfolio_settings (key, value) VALUES ('drive_folder_id', '')
ON CONFLICT (key) DO NOTHING;

-- RLS: public read for portfolio; only admins can write (via service role in API)
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY portfolio_items_select_public ON portfolio_items FOR SELECT USING (true);
CREATE POLICY portfolio_settings_select_public ON portfolio_settings FOR SELECT USING (true);

CREATE POLICY portfolio_items_admin_write ON portfolio_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY portfolio_settings_admin_write ON portfolio_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
