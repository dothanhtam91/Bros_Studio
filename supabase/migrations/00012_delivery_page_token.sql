-- Unique token for the customer-facing delivery page (one per job, set when first sending delivery email)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS delivery_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_jobs_delivery_token ON jobs(delivery_token) WHERE delivery_token IS NOT NULL;
