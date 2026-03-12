-- Link auth users to realtors so returning users go straight to portfolio
ALTER TABLE realtors
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_realtors_user_id ON realtors(user_id);

-- Optional: allow realtor to update own row (e.g. profile) when linked
-- Admin and service role can already do everything
CREATE POLICY realtors_update_own ON realtors FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
