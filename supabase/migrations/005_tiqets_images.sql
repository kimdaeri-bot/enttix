-- tiqets_images: 상품 이미지 영구 캐시 테이블
-- source: 'scraped' = 자동 스크래핑, 'manual' = 수동 업로드

CREATE TABLE IF NOT EXISTS tiqets_images (
  product_id   BIGINT       PRIMARY KEY,
  image_url    TEXT         NOT NULL,
  city_id      INTEGER,
  source       TEXT         DEFAULT 'scraped'  CHECK (source IN ('scraped', 'manual')),
  scraped_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tiqets_images_city_id ON tiqets_images(city_id);
CREATE INDEX IF NOT EXISTS idx_tiqets_images_source  ON tiqets_images(source);

-- RLS: SELECT는 누구나, INSERT/UPDATE는 service_role만
ALTER TABLE tiqets_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_tiqets_images"
  ON tiqets_images FOR SELECT
  USING (true);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_tiqets_images_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER tiqets_images_updated_at
  BEFORE UPDATE ON tiqets_images
  FOR EACH ROW EXECUTE FUNCTION update_tiqets_images_updated_at();
