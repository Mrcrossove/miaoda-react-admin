-- 创建用户账号表
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  last_login_at TIMESTAMPTZ,
  notes TEXT
);

-- 创建管理员表
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON user_accounts(username);
CREATE INDEX IF NOT EXISTS idx_user_accounts_is_active ON user_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- 启用RLS
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- user_accounts RLS策略
-- 允许所有人查询活跃账号（用于登录验证）
CREATE POLICY "允许查询活跃账号" ON user_accounts
  FOR SELECT
  USING (is_active = true);

-- 只有管理员可以插入、更新、删除
CREATE POLICY "管理员可以管理账号" ON user_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- admin_users RLS策略
-- 只有超级管理员可以查看所有管理员
CREATE POLICY "超级管理员可以查看所有管理员" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_super_admin = true AND is_active = true
    )
  );

-- 管理员可以查看自己的信息
CREATE POLICY "管理员可以查看自己" ON admin_users
  FOR SELECT
  USING (id = auth.uid());

-- 只有超级管理员可以插入、更新、删除管理员
CREATE POLICY "超级管理员可以管理管理员" ON admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() AND is_super_admin = true AND is_active = true
    )
  );

-- 创建登录验证函数
CREATE OR REPLACE FUNCTION verify_user_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  message TEXT
) AS $$
DECLARE
  v_account user_accounts;
BEGIN
  -- 查询账号
  SELECT * INTO v_account
  FROM user_accounts
  WHERE user_accounts.username = p_username
    AND is_active = true;
  
  -- 账号不存在
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, '账号不存在或已被禁用'::TEXT;
    RETURN;
  END IF;
  
  -- 验证密码（使用pgcrypto的crypt函数）
  IF v_account.password_hash = crypt(p_password, v_account.password_hash) THEN
    -- 更新最后登录时间
    UPDATE user_accounts
    SET last_login_at = now()
    WHERE id = v_account.id;
    
    RETURN QUERY SELECT 
      true,
      v_account.id,
      v_account.username,
      v_account.display_name,
      '登录成功'::TEXT;
  ELSE
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, '密码错误'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建管理员登录验证函数
CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  admin_id UUID,
  username TEXT,
  display_name TEXT,
  is_super_admin BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_admin admin_users;
BEGIN
  -- 查询管理员
  SELECT * INTO v_admin
  FROM admin_users
  WHERE admin_users.username = p_username
    AND is_active = true;
  
  -- 管理员不存在
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, false, '管理员账号不存在或已被禁用'::TEXT;
    RETURN;
  END IF;
  
  -- 验证密码
  IF v_admin.password_hash = crypt(p_password, v_admin.password_hash) THEN
    -- 更新最后登录时间
    UPDATE admin_users
    SET last_login_at = now()
    WHERE id = v_admin.id;
    
    RETURN QUERY SELECT 
      true,
      v_admin.id,
      v_admin.username,
      v_admin.display_name,
      v_admin.is_super_admin,
      '登录成功'::TEXT;
  ELSE
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, false, '密码错误'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建生成账号函数
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
  -- 检查是否是管理员调用
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND is_active = true
  ) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, '无权限操作'::TEXT;
    RETURN;
  END IF;
  
  -- 检查用户名是否已存在
  IF EXISTS (SELECT 1 FROM user_accounts WHERE user_accounts.username = p_username) THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, '用户名已存在'::TEXT;
    RETURN;
  END IF;
  
  -- 插入账号（密码使用pgcrypto加密）
  INSERT INTO user_accounts (username, password_hash, display_name, notes, created_by)
  VALUES (
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_display_name,
    p_notes,
    auth.uid()
  )
  RETURNING id INTO v_account_id;
  
  RETURN QUERY SELECT true, v_account_id, p_username, '账号创建成功'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 插入默认超级管理员（用户名：admin，密码：admin123）
INSERT INTO admin_users (username, password_hash, display_name, is_super_admin, is_active)
VALUES (
  'admin',
  crypt('admin123', gen_salt('bf')),
  '超级管理员',
  true,
  true
)
ON CONFLICT (username) DO NOTHING;

-- 添加注释
COMMENT ON TABLE user_accounts IS '用户账号表';
COMMENT ON TABLE admin_users IS '管理员表';
COMMENT ON FUNCTION verify_user_login IS '验证用户登录';
COMMENT ON FUNCTION verify_admin_login IS '验证管理员登录';
COMMENT ON FUNCTION generate_user_account IS '生成用户账号';