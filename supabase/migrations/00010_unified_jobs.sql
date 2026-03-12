-- Unified job management: customers, jobs, timeline, revisions, notifications
-- Jobs link to realtors (or customers), albums, and drive the same workflow for admin + website bookings.

-- 1) Customers (website bookings that don't match an existing realtor)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- 2) Jobs (unified: admin_created + website_booking)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('admin_created', 'website_booking')),
  realtor_id UUID REFERENCES realtors(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  property_address TEXT NOT NULL,
  listing_title TEXT,
  service_type TEXT,
  shooting_date DATE,
  delivery_deadline DATE,
  delivered_at TIMESTAMPTZ,
  total_price NUMERIC(12, 2),
  priority TEXT DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'new_booking',
  notes TEXT,
  assigned_photographer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_editor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Lifecycle timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  shooting_started_at TIMESTAMPTZ,
  shooting_completed_at TIMESTAMPTZ,
  editing_started_at TIMESTAMPTZ,
  review_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  CONSTRAINT jobs_realtor_or_customer CHECK (
    (realtor_id IS NOT NULL AND customer_id IS NULL) OR
    (realtor_id IS NULL AND customer_id IS NOT NULL)
  )
);

CREATE INDEX idx_jobs_realtor ON jobs(realtor_id);
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_album ON jobs(album_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_jobs_shooting_date ON jobs(shooting_date);
CREATE INDEX idx_jobs_delivery_deadline ON jobs(delivery_deadline);

-- Optional: link album back to job (one-to-one)
ALTER TABLE albums ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;
CREATE INDEX idx_albums_job ON albums(job_id);

-- 3) Job timeline events (activity log per job)
CREATE TABLE job_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_timeline_job ON job_timeline_events(job_id);
CREATE INDEX idx_job_timeline_created ON job_timeline_events(created_at DESC);

-- 4) Revision requests (attached to job)
CREATE TABLE revision_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  realtor_id UUID REFERENCES realtors(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_revision_requests_job ON revision_requests(job_id);

-- 5) Admin notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  realtor_id UUID REFERENCES realtors(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_job ON notifications(job_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Customers: admin all; allow public insert for booking form (or use service role in API)
CREATE POLICY customers_admin_all ON customers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY customers_insert_public ON customers FOR INSERT WITH CHECK (true);

-- Jobs: admin all; public can only insert (website booking) via API with checks
CREATE POLICY jobs_admin_all ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY jobs_insert_public ON jobs FOR INSERT WITH CHECK (true);

-- Timeline: admin only (insert/update via API with admin or service role)
CREATE POLICY job_timeline_admin_all ON job_timeline_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Revisions: admin all
CREATE POLICY revision_requests_admin_all ON revision_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications: admin only
CREATE POLICY notifications_admin_all ON notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: jobs.updated_at
CREATE OR REPLACE FUNCTION set_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE PROCEDURE set_jobs_updated_at();

-- Trigger: customers.updated_at
CREATE OR REPLACE FUNCTION set_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE PROCEDURE set_customers_updated_at();
