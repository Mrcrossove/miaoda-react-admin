-- 修复RLS策略和外键约束以支持账号密码登录
-- 问题1：Storage的RLS策略只允许authenticated用户上传，账号密码登录用户无法上传
-- 问题2：多个表的外键约束引用users表，但账号密码登录用户不在users表中

-- ==================== 修复Storage RLS策略 ====================

-- 删除旧的INSERT策略（只允许authenticated用户）
DROP POLICY IF EXISTS "认证用户可以上传产品图片" ON storage.objects;

-- 创建新的INSERT策略（允许所有用户）
CREATE POLICY "允许所有用户上传产品图片"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'app-8sm6r7tdrncx_product_images');

-- 删除旧的DELETE策略（只允许authenticated用户删除自己的图片）
DROP POLICY IF EXISTS "用户可以删除自己的产品图片" ON storage.objects;

-- 创建新的DELETE策略（允许所有用户删除产品图片）
CREATE POLICY "允许所有用户删除产品图片"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'app-8sm6r7tdrncx_product_images');

-- ==================== 删除外键约束 ====================
-- 原因：应用有两套用户系统（Supabase认证的users表 + 账号密码登录的user_accounts表）
-- 外键约束只引用users表，导致账号密码登录用户无法创建相关记录

-- 删除user_credits表的外键约束
ALTER TABLE public.user_credits
DROP CONSTRAINT IF EXISTS user_credits_user_id_fkey;

-- 删除credit_orders表的外键约束
ALTER TABLE public.credit_orders
DROP CONSTRAINT IF EXISTS credit_orders_user_id_fkey;

-- 删除credit_usage表的外键约束
ALTER TABLE public.credit_usage
DROP CONSTRAINT IF EXISTS credit_usage_user_id_fkey;

-- 删除image_factory_usage表的外键约束
ALTER TABLE public.image_factory_usage
DROP CONSTRAINT IF EXISTS image_factory_usage_user_id_fkey;

-- 删除video_generation_usage表的外键约束
ALTER TABLE public.video_generation_usage
DROP CONSTRAINT IF EXISTS video_generation_usage_user_id_fkey;

-- 删除products表的外键约束
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_user_id_fkey;

-- 注意：保留profiles表和user_accounts表的外键约束，因为它们是Supabase认证系统专用的

COMMENT ON TABLE public.user_credits IS '用户灵感值表，支持两套用户系统（Supabase认证 + 账号密码登录）';
COMMENT ON TABLE public.products IS '产品表，支持两套用户系统（Supabase认证 + 账号密码登录）';
