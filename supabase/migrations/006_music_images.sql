-- music_images: TM 뮤직 이벤트 이미지 캐시 테이블
CREATE TABLE IF NOT EXISTS music_images (
  event_id     TEXT         PRIMARY KEY,
  image_url    TEXT         NOT NULL,
  event_name   TEXT,
  genre        TEXT,
  country      TEXT,
  scraped_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_images_genre   ON music_images(genre);
CREATE INDEX IF NOT EXISTS idx_music_images_country ON music_images(country);

ALTER TABLE music_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_music_images"
  ON music_images FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION update_music_images_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER music_images_updated_at
  BEFORE UPDATE ON music_images
  FOR EACH ROW EXECUTE FUNCTION update_music_images_updated_at();
