-- 实现账号30天有效期功能
-- 需求：账号创建后30天失效，无法登录

-- ==================== 添加过期时间字段 ====================

-- 添加账号过期时间字段
ALTER TABLE public.user_accounts
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 为现有账号设置过期时间（创建时间 + 30天）
UPDATE public.user_accounts
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- 设置expires_at为NOT NULL
ALTER TABLE public.user_accounts
ALTER COLUMN expires_at SET NOT NULL;

-- 添加注释
COMMENT ON COLUMN public.user_accounts.expires_at IS '账号过期时间，创建后30天失效';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_accounts_expires_at ON public.user_accounts(expires_at);

-- ==================== 修改创建账号函数 ====================

-- 修改创建账号函数，自动设置30天过期时间
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

-- ==================== 修改登录验证函数 ====================

-- 修改登录验证函数，检查账号是否过期
CREATE OR REPLACE FUNCTION public.verify_user_account(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_password_match BOOLEAN;
BEGIN
  -- 查询用户账号
  SELECT 
    user_id,
    username,
    password_hash,
    display_name,
    is_active,
    expires_at
  INTO v_user_record
  FROM public.user_accounts
  WHERE username = p_username;
  
  -- 检查用户是否存在
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '用户名或密码错误'
    );
  END IF;
  
  -- 检查账号是否已过期
  IF v_user_record.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '账号已过期，请联系管理员'
    );
  END IF;
  
  -- 检查账号是否被禁用
  IF NOT v_user_record.is_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '账号已被禁用'
    );
  END IF;
  
  -- 验证密码
  v_password_match := (v_user_record.password_hash = crypt(p_password, v_user_record.password_hash));
  
  IF NOT v_password_match THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '用户名或密码错误'
    );
  END IF;
  
  -- 更新最后登录时间
  UPDATE public.user_accounts
  SET last_login_at = NOW()
  WHERE user_id = v_user_record.user_id;
  
  -- 返回成功信息
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_record.user_id,
    'username', v_user_record.username,
    'display_name', v_user_record.display_name,
    'expires_at', v_user_record.expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.verify_user_account IS '验证用户账号密码，检查是否过期和是否被禁用';

-- ==================== 创建续期函数 ====================

-- 创建账号续期函数
CREATE OR REPLACE FUNCTION public.extend_account_expiry(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_expires_at TIMESTAMPTZ;
  v_old_expires_at TIMESTAMPTZ;
BEGIN
  -- 获取当前过期时间
  SELECT expires_at INTO v_old_expires_at
  FROM public.user_accounts
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', '账号不存在'
    );
  END IF;
  
  -- 计算新的过期时间（从当前过期时间延长，如果已过期则从现在开始）
  IF v_old_expires_at > NOW() THEN
    v_new_expires_at := v_old_expires_at + (p_days || ' days')::INTERVAL;
  ELSE
    v_new_expires_at := NOW() + (p_days || ' days')::INTERVAL;
  END IF;
  
  -- 更新过期时间
  UPDATE public.user_accounts
  SET expires_at = v_new_expires_at
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'old_expires_at', v_old_expires_at,
    'new_expires_at', v_new_expires_at,
    'message', '续期成功'
  );
END;
$$;

COMMENT ON FUNCTION public.extend_account_expiry IS '延长账号有效期，默认延长30天';
