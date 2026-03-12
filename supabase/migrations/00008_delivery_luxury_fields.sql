-- Optional fields for luxury delivery page
-- Albums: walkthrough video URL
ALTER TABLE albums ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Realtors: branding and contact
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS brokerage_logo_url TEXT;
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS linkedin TEXT;
