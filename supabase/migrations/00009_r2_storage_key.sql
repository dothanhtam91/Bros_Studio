-- R2 storage: key for album images (enables delete-from-R2 and CDN/origin path)
-- Nullable for existing rows that still use Supabase Storage URLs.
ALTER TABLE album_images ADD COLUMN IF NOT EXISTS storage_key TEXT;

COMMENT ON COLUMN album_images.storage_key IS 'R2 object key (e.g. albums/albumId/uuid.jpg). Null if legacy Supabase Storage.';
