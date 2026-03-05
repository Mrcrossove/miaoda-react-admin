-- 禁用admin_users表的RLS，以支持账号密码登录系统
-- 管理员登录不使用Supabase Auth，而是使用自定义的verify_admin_login函数
-- RLS策略会阻止函数访问表数据，导致登录失败

-- 删除现有的RLS策略
DROP POLICY IF EXISTS "超级管理员可以查看所有管理员" ON admin_users;
DROP POLICY IF EXISTS "管理员可以查看自己" ON admin_users;
DROP POLICY IF EXISTS "超级管理员可以管理管理员" ON admin_users;

-- 禁用RLS
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- 添加注释说明
COMMENT ON TABLE admin_users IS '管理员用户表 - RLS已禁用以支持账号密码登录系统';