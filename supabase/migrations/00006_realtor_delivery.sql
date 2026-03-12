-- Realtor delivery: realtors, albums, album_images (secret-link only, no login)
-- Run after 00001 (profiles for admin check)

-- A) Realtor
CREATE TABLE realtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  headshot_url TEXT,
  brokerage TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_realtors_slug ON realtors(slug);

-- B) Album (one property shoot per realtor)
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  address TEXT NOT NULL,
  shoot_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(realtor_id, slug)
);

CREATE INDEX idx_albums_realtor ON albums(realtor_id);

-- C) Images (belong to an album)
CREATE TABLE album_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_album_images_album ON album_images(album_id);

-- Cover image for album card (optional FK to album_images)
ALTER TABLE albums ADD COLUMN cover_image_id UUID REFERENCES album_images(id) ON DELETE SET NULL;

-- RLS: public read (anyone with link); admin write via service role / API
ALTER TABLE realtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY realtors_select ON realtors FOR SELECT USING (true);
CREATE POLICY albums_select ON albums FOR SELECT USING (true);
CREATE POLICY album_images_select ON album_images FOR SELECT USING (true);

CREATE POLICY realtors_admin ON realtors FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY albums_admin ON albums FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY album_images_admin ON album_images FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
