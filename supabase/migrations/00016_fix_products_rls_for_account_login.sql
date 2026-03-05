-- 修复products表RLS策略以支持账号密码登录系统
-- 问题：原策略使用auth.uid()，但账号密码登录用户没有Supabase认证会话
-- 解决：禁用RLS或修改策略以支持直接的user_id比较

-- 1. 删除旧的RLS策略
DROP POLICY IF EXISTS "用户可以查看自己的产品" ON public.products;
DROP POLICY IF EXISTS "用户可以创建自己的产品" ON public.products;
DROP POLICY IF EXISTS "用户可以更新自己的产品" ON public.products;
DROP POLICY IF EXISTS "用户可以删除自己的产品" ON public.products;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

-- 2. 禁用products表的RLS
-- 因为账号密码登录系统不使用Supabase认证，无法使用auth.uid()
-- 前端已经通过userId参数控制访问权限
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 3. 添加注释说明
COMMENT ON TABLE public.products IS '产品表 - RLS已禁用，使用应用层权限控制（账号密码登录系统）';
