
-- 添加产品72小时自动过期策略

-- 1. 删除旧的RLS策略（如果存在）
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

-- 2. 创建新的RLS策略，只显示72小时内的产品
CREATE POLICY "products_select_policy" ON products
  FOR SELECT
  USING (
    auth.uid() = user_id 
    AND created_at > (now() - interval '72 hours')
  );

CREATE POLICY "products_insert_policy" ON products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_update_policy" ON products
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND created_at > (now() - interval '72 hours')
  );

CREATE POLICY "products_delete_policy" ON products
  FOR DELETE
  USING (auth.uid() = user_id);

-- 3. 创建清理过期产品的函数
CREATE OR REPLACE FUNCTION cleanup_expired_products()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 删除超过72小时的产品
  DELETE FROM products
  WHERE created_at < (now() - interval '72 hours');
  
  -- 记录日志
  RAISE NOTICE '已清理过期产品';
END;
$$;

-- 4. 添加注释
COMMENT ON FUNCTION cleanup_expired_products() IS '清理超过72小时的产品';
COMMENT ON POLICY "products_select_policy" ON products IS '用户只能查看自己72小时内创建的产品';
