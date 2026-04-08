-- 创建允许普通用户自行注册的函数
CREATE OR REPLACE FUNCTION public.register_user_account(
  p_username TEXT,
  p_password TEXT,
  p_display_name TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_display_name TEXT;
BEGIN
  -- 检查用户名是否已存在
  IF EXISTS (SELECT 1 FROM user_accounts WHERE user_accounts.username = p_username) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, '用户名已存在'::TEXT;
    RETURN;
  END IF;

  -- 设置默认显示名
  v_display_name := COALESCE(p_display_name, p_username);

  -- 插入账号（密码使用pgcrypto加密）
  INSERT INTO user_accounts (username, password_hash, display_name, notes)
  VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    v_display_name,
    '用户自行注册'
  )
  RETURNING id INTO v_user_id;

  -- 为新用户初始化算力记录（可选：赠送初始算力）
  INSERT INTO user_credits (user_id, credits)
  VALUES (v_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY SELECT true, v_user_id, p_username, v_display_name, '注册成功'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.register_user_account(TEXT, TEXT, TEXT) IS '允许普通用户自行注册账号';