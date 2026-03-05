-- 修复create_user_account函数中的字段名错误
-- 问题：函数中使用user_id字段，但表结构中主键是id字段
-- 解决：将INSERT语句中的user_id改为id

CREATE OR REPLACE FUNCTION public.create_user_account(
  p_username TEXT,
  p_password TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_password_hash TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- 生成UUID
  v_user_id := gen_random_uuid();
  
  -- 计算过期时间（30天后）
  v_expires_at := NOW() + INTERVAL '30 days';
  
  -- 使用crypt函数加密密码
  v_password_hash := crypt(p_password, gen_salt('bf'));
  
  -- 插入账号记录（使用id而不是user_id）
  INSERT INTO public.user_accounts (
    id,
    username,
    password_hash,
    display_name,
    created_by,
    expires_at
  ) VALUES (
    v_user_id,
    p_username,
    v_password_hash,
    COALESCE(p_display_name, p_username),
    p_created_by,
    v_expires_at
  );
  
  -- 返回创建的账号信息
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'username', p_username,
    'display_name', COALESCE(p_display_name, p_username),
    'expires_at', v_expires_at
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '用户名已存在'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '创建账号失败: ' || SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.create_user_account IS '创建用户账号，自动设置30天有效期';
