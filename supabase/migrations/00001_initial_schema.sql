-- BrosStudio initial schema
-- Run in Supabase SQL editor or via supabase db push

-- Custom types
CREATE TYPE user_role AS ENUM ('client', 'admin');
CREATE TYPE project_status AS ENUM ('draft', 'uploaded', 'processing', 'delivered');
CREATE TYPE asset_type AS ENUM ('photo', 'video', 'reel');
CREATE TYPE asset_variant AS ENUM ('original', 'mls', 'web', 'print');
CREATE TYPE ai_result_type AS ENUM ('cover_rank', 'quality_flag', 'caption', 'alt_text', 'description', 'captions');

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients (brokerage/contact info)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brokerage TEXT,
  contact_email TEXT NOT NULL,
  phone TEXT,
  billing_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON clients(user_id);

-- Bookings (lead form submissions before they become projects)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  sq_ft INTEGER,
  property_type TEXT,
  preferred_time_windows TEXT[],
  addons JSONB DEFAULT '[]',
  package_id TEXT,
  quote_cents INTEGER,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id UUID -- set when converted to project
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  mls_number TEXT,
  shoot_date DATE,
  status project_status NOT NULL DEFAULT 'draft',
  delivery_status TEXT DEFAULT 'pending',
  tags TEXT[] DEFAULT '{}',
  addons JSONB DEFAULT '[]',
  first_download_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  drive_folder_url TEXT
);

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_client_status ON projects(client_id, status);

-- Assets
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type asset_type NOT NULL DEFAULT 'photo',
  variant asset_variant NOT NULL DEFAULT 'original',
  storage_key TEXT NOT NULL,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  watermark_applied BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  mls_filename TEXT,
  processing_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_assets_project_type_variant ON assets(project_id, type, variant);

-- Downloads (audit)
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip TEXT
);

CREATE INDEX idx_downloads_project_id ON downloads(project_id);
CREATE INDEX idx_downloads_downloaded_at ON downloads(project_id, downloaded_at);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_project_id ON invoices(project_id);

-- Reviews / approvals
CREATE TABLE reviews_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL,
  requested_changes TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reviews_project_id ON reviews_approvals(project_id);

-- AI results
CREATE TABLE ai_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  type ai_result_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_results_project_id ON ai_results(project_id);

-- Activity log (optional audit)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_project_id ON activity_log(project_id);

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own
CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);

-- Clients: admins all; clients own (via user_id)
CREATE POLICY clients_admin_all ON clients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY clients_select_own ON clients FOR SELECT USING (user_id = auth.uid());

-- Bookings: admins all; insert for anyone (public form)
CREATE POLICY bookings_admin_all ON bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY bookings_insert_public ON bookings FOR INSERT WITH CHECK (true);

-- Projects: admins all; clients see only their client_id's projects
CREATE POLICY projects_admin_all ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY projects_client_select ON projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = projects.client_id AND clients.user_id = auth.uid())
);

-- Assets: same as projects (via project_id)
CREATE POLICY assets_admin_all ON assets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY assets_client_select ON assets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN clients c ON c.id = p.client_id AND c.user_id = auth.uid()
    WHERE p.id = assets.project_id
  )
);

-- Downloads: admin all; clients can insert (track own downloads)
CREATE POLICY downloads_admin_all ON downloads FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY downloads_client_insert ON downloads FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN clients c ON c.id = p.client_id AND c.user_id = auth.uid()
    WHERE p.id = project_id
  )
);

-- Invoices: same as projects
CREATE POLICY invoices_admin_all ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY invoices_client_select ON invoices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN clients c ON c.id = p.client_id AND c.user_id = auth.uid()
    WHERE p.id = invoices.project_id
  )
);

-- Reviews: clients can insert/update for own projects; admins all
CREATE POLICY reviews_admin_all ON reviews_approvals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY reviews_client_select_insert ON reviews_approvals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN clients c ON c.id = p.client_id AND c.user_id = auth.uid()
    WHERE p.id = project_id
  )
);
CREATE POLICY reviews_client_insert ON reviews_approvals FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN clients c ON c.id = p.client_id AND c.user_id = auth.uid()
    WHERE p.id = project_id
  )
);

-- AI results: same visibility as projects
CREATE POLICY ai_results_admin_all ON ai_results FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY ai_results_client_select ON ai_results FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN clients c ON c.id = p.client_id AND c.user_id = auth.uid()
    WHERE p.id = project_id
  )
);

-- Activity log: admin only
CREATE POLICY activity_log_admin_all ON activity_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
