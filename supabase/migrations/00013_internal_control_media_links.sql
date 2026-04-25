-- Internal control media/deliverable links for Drive-backed delivery imports.
-- These columns keep lil_Bin's generic control endpoint from needing ad-hoc file-link endpoints.

ALTER TABLE albums ADD COLUMN IF NOT EXISTS mls_preview_url TEXT;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS drive_full_download_url TEXT;

COMMENT ON COLUMN albums.mls_preview_url IS 'Optional shared/embeddable preview URL for MLS-ready media, often a Google Drive preview folder or file link.';
COMMENT ON COLUMN albums.drive_full_download_url IS 'Optional full-resolution download URL, often a shared Google Drive folder or ZIP link.';

ALTER TABLE album_images ADD COLUMN IF NOT EXISTS drive_file_id TEXT;
ALTER TABLE album_images ADD COLUMN IF NOT EXISTS mls_preview_url TEXT;
ALTER TABLE album_images ADD COLUMN IF NOT EXISTS full_download_url TEXT;

CREATE INDEX IF NOT EXISTS idx_album_images_drive_file_id ON album_images(drive_file_id) WHERE drive_file_id IS NOT NULL;
