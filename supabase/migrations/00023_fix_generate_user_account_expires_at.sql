-- 修复 generate_user_account 函数未写入 expires_at 导致账号创建失败
-- 问题：user_accounts.expires_at 已是 NOT NULL，但函数 INSERT 未包含该字段

CREATE OR REPLACE FUNCTION public.generate_user_account(
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
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- 检查用户名是否已存在
  IF EXISTS (SELECT 1 FROM public.user_accounts WHERE public.user_accounts.username = p_username) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, '用户名已存在'::TEXT;
    RETURN;
  END IF;

  -- 默认有效期 30 天
  v_expires_at := NOW() + INTERVAL '30 days';

  -- 创建账号
  INSERT INTO public.user_accounts (
    username,
    password_hash,
    display_name,
    notes,
    created_by,
    expires_at
  )
  VALUES (
    p_username,
    public.crypt(p_password, public.gen_salt('bf')),
    p_display_name,
    p_notes,
    NULL,
    v_expires_at
  )
  RETURNING id INTO v_account_id;

  RETURN QUERY SELECT true, v_account_id, p_username, '账号创建成功'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_user_account(TEXT, TEXT, TEXT, TEXT)
IS '生成账号（含30天过期时间），适配 user_accounts.expires_at 非空约束';
