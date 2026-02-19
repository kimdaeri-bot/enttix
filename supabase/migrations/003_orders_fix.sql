-- 003_orders_fix.sql
-- api_source 컬럼 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS api_source TEXT DEFAULT 'manual';

-- 기존 테이블에 빠진 컬럼들 추가 (있으면 무시)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS event_id TEXT;

-- 서버사이드(anon key) 백오피스 INSERT를 위한 RLS 정책 추가
-- user_id가 null인 경우도 허용 (admin seed, API-placed orders)
DROP POLICY IF EXISTS "Allow server insert orders" ON orders;
CREATE POLICY "Allow server insert orders" ON orders
  FOR INSERT
  WITH CHECK (true);

-- anon key로 SELECT도 허용 (admin 페이지용)
DROP POLICY IF EXISTS "Allow server select orders" ON orders;
CREATE POLICY "Allow server select orders" ON orders
  FOR SELECT
  USING (true);

-- anon key로 UPDATE도 허용 (status 변경)
DROP POLICY IF EXISTS "Allow server update orders" ON orders;
CREATE POLICY "Allow server update orders" ON orders
  FOR UPDATE
  USING (true);

-- anon key로 DELETE도 허용
DROP POLICY IF EXISTS "Allow server delete orders" ON orders;
CREATE POLICY "Allow server delete orders" ON orders
  FOR DELETE
  USING (true);
