-- 004_admin_fix.sql: Fix admin_users RLS circular reference

-- 1) Drop the broken circular policy
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;

-- 2) Allow authenticated users to see only their own row
CREATE POLICY "Users can see own admin row" ON admin_users
  FOR SELECT USING (auth.uid() = id);

-- 3) Insert first admin (boss account by email)
INSERT INTO admin_users (id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'info@londonshow.co.kr'
ON CONFLICT (id) DO NOTHING;
