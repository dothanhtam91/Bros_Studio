-- Personal portfolio: each user can have their own portfolio (user_id set).
-- Studio/public portfolio = rows where user_id IS NULL.

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_portfolio_items_user_id ON portfolio_items(user_id);

-- Drop old policies
DROP POLICY IF EXISTS portfolio_items_select_public ON portfolio_items;
DROP POLICY IF EXISTS portfolio_items_admin_write ON portfolio_items;

-- SELECT: public sees studio items (user_id IS NULL); users see their own
CREATE POLICY portfolio_items_select ON portfolio_items FOR SELECT USING (
  (user_id IS NULL) OR (user_id = auth.uid())
);

-- INSERT: authenticated users can insert their own (user_id = auth.uid()); admin uses service role
CREATE POLICY portfolio_items_insert_own ON portfolio_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- UPDATE: users can update own; admins via service role
CREATE POLICY portfolio_items_update_own ON portfolio_items FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: users can delete own; admins via service role
CREATE POLICY portfolio_items_delete_own ON portfolio_items FOR DELETE
  USING (user_id = auth.uid());

-- Admin: allow admin role to do everything (for dashboard; API often uses service role)
CREATE POLICY portfolio_items_admin_all ON portfolio_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
