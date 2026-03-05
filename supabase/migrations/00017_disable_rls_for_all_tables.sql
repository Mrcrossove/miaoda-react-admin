-- 禁用所有使用auth.uid()的表的RLS，以支持账号密码登录系统
-- 问题：多个表的RLS策略使用auth.uid()，但账号密码登录用户没有Supabase认证会话
-- 解决：禁用这些表的RLS，使用应用层权限控制

-- 1. 禁用product_materials表的RLS
DROP POLICY IF EXISTS "用户可以查看自己产品的素材" ON public.product_materials;
DROP POLICY IF EXISTS "用户可以创建自己产品的素材" ON public.product_materials;
DROP POLICY IF EXISTS "用户可以更新自己产品的素材" ON public.product_materials;
DROP POLICY IF EXISTS "用户可以删除自己产品的素材" ON public.product_materials;

ALTER TABLE public.product_materials DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.product_materials IS '产品素材表 - RLS已禁用，使用应用层权限控制（账号密码登录系统）';

-- 2. 禁用user_credits表的RLS（如果存在）
DROP POLICY IF EXISTS "用户可以查看自己的灵感值" ON public.user_credits;
DROP POLICY IF EXISTS "用户可以更新自己的灵感值" ON public.user_credits;

ALTER TABLE public.user_credits DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.user_credits IS '用户灵感值表 - RLS已禁用，使用应用层权限控制（账号密码登录系统）';

-- 3. 禁用credit_orders表的RLS（如果存在）
DROP POLICY IF EXISTS "用户可以查看自己的订单" ON public.credit_orders;

ALTER TABLE public.credit_orders DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.credit_orders IS '充值订单表 - RLS已禁用，使用应用层权限控制（账号密码登录系统）';

-- 4. 禁用credit_usage表的RLS（如果存在）
DROP POLICY IF EXISTS "用户可以查看自己的消费记录" ON public.credit_usage;

ALTER TABLE public.credit_usage DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.credit_usage IS '消费记录表 - RLS已禁用，使用应用层权限控制（账号密码登录系统）';

-- 5. 禁用image_factory_usage表的RLS（如果存在）
ALTER TABLE public.image_factory_usage DISABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.image_factory_usage IS '图片工厂使用记录表 - RLS已禁用，使用应用层权限控制（账号密码登录系统）';
