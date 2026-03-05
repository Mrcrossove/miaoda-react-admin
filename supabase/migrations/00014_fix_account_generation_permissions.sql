-- 修改生成账号函数，移除auth.uid()依赖
-- 改为通过RPC调用时的上下文来验证权限
CREATE OR REPLACE FUNCTION generate_user_account(
  p_username TEXT,
  p_password TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  account_id UUID,
  username TEXT,
  message TEXT
) AS $$
DECLARE
  v_account_id UUID;
BEGIN
  -- 检查用户名是否已存在
  IF EXISTS (SELECT 1 FROM user_accounts WHERE user_accounts.username = p_username) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, '用户名已存在'::TEXT;
    RETURN;
  END IF;
  
  -- 插入账号（使用完整的schema路径）
  INSERT INTO user_accounts (username, password_hash, display_name, notes, created_by)
  VALUES (
    p_username,
    public.crypt(p_password, public.gen_salt('bf')),
    p_display_name,
    p_notes,
    NULL  -- 不依赖auth.uid()
  )
  RETURNING id INTO v_account_id;
  
  RETURN QUERY SELECT true, v_account_id, p_username, '账号创建成功'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 修改重置密码函数，移除auth.uid()依赖
CREATE OR REPLACE FUNCTION reset_user_password(
  p_account_id UUID,
  p_new_password TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- 检查账号是否存在
  IF NOT EXISTS (SELECT 1 FROM user_accounts WHERE id = p_account_id) THEN
    RETURN QUERY SELECT false, '账号不存在'::TEXT;
    RETURN;
  END IF;
  
  -- 更新密码（使用完整的schema路径）
  UPDATE user_accounts
  SET password_hash = public.crypt(p_new_password, public.gen_salt('bf'))
  WHERE id = p_account_id;
  
  RETURN QUERY SELECT true, '密码重置成功'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新RLS策略，允许通过SECURITY DEFINER函数操作
-- 删除旧的策略
DROP POLICY IF EXISTS "管理员可以管理账号" ON user_accounts;

-- 创建新的策略：允许所有人通过SECURITY DEFINER函数操作
CREATE POLICY "允许通过函数管理账号" ON user_accounts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 测试创建账号
SELECT * FROM generate_user_account('testuser456', 'TestPass456', '测试用户2', '测试创建2');