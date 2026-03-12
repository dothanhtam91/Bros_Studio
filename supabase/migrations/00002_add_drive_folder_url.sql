-- Add optional Google Drive folder link to projects
-- Run in Supabase SQL editor if you already applied 00001

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;

COMMENT ON COLUMN projects.drive_folder_url IS 'Optional: shared Google Drive folder link for delivery. When set, client sees a direct download link.';
