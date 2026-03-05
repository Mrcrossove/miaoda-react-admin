-- 创建重置用户密码函数
CREATE OR REPLACE FUNCTION reset_user_password(
  p_account_id UUID,
  p_new_password TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- 检查是否是管理员调用
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND is_active = true
  ) THEN
    RETURN QUERY SELECT false, '无权限操作'::TEXT;
    RETURN;
  END IF;
  
  -- 检查账号是否存在
  IF NOT EXISTS (SELECT 1 FROM user_accounts WHERE id = p_account_id) THEN
    RETURN QUERY SELECT false, '账号不存在'::TEXT;
    RETURN;
  END IF;
  
  -- 更新密码
  UPDATE user_accounts
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_account_id;
  
  RETURN QUERY SELECT true, '密码重置成功'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_user_password IS '重置用户密码';