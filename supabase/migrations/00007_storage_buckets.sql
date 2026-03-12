-- Create storage buckets for album images and portfolio (required for uploads)
-- Run in Supabase SQL Editor if you haven't applied migrations, or create buckets manually in Dashboard → Storage

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('albums', 'albums', true),
  ('portfolio', 'portfolio', true),
  ('realtors', 'realtors', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read for public buckets; service role can upload via API
-- (Supabase default RLS on storage.objects often allows service role full access)
