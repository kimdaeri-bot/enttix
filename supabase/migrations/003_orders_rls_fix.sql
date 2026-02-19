-- ============================================================
-- 003_orders_rls_fix.sql
-- Orders RLS 정책 수정
-- 문제: user_id가 null이거나 email 불일치 시 INSERT/SELECT 차단
-- ============================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders;

-- SELECT: user_id 일치 OR 이메일 일치 (둘 중 하나라도 맞으면 조회 가능)
CREATE POLICY "Users can view own orders" ON orders FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.email() = customer_email
);

-- INSERT: 로그인 유저(user_id 일치) OR 비로그인(user_id IS NULL) 모두 허용
CREATE POLICY "Users can insert orders" ON orders FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR user_id IS NULL
);
