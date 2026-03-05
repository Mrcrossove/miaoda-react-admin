-- 确保pgcrypto扩展在public schema中可用
-- 方案1：在public schema中创建扩展（如果不存在）
DROP EXTENSION IF EXISTS pgcrypto CASCADE;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;

-- 或者创建包装函数来调用extensions schema中的函数
-- 如果上面的方案不行，使用这个备用方案

-- 删除旧的管理员账号
DELETE FROM admin_users WHERE username = 'admin';

-- 重新插入默认管理员账号，使用完整的schema路径
INSERT INTO admin_users (username, password_hash, display_name, is_super_admin, is_active)
VALUES (
  'admin',
  public.crypt('admin123', public.gen_salt('bf')),
  '超级管理员',
  true,
  true
);

-- 更新所有使用crypt的函数，添加schema前缀
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
  
  -- 验证密码（使用完整的schema路径）
  IF v_account.password_hash = public.crypt(p_password, v_account.password_hash) THEN
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

-- 更新管理员登录验证函数
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
  
  -- 验证密码（使用完整的schema路径）
  IF v_admin.password_hash = public.crypt(p_password, v_admin.password_hash) THEN
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

-- 更新生成账号函数
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
  
  -- 插入账号（使用完整的schema路径）
  INSERT INTO user_accounts (username, password_hash, display_name, notes, created_by)
  VALUES (
    p_username,
    public.crypt(p_password, public.gen_salt('bf')),
    p_display_name,
    p_notes,
    auth.uid()
  )
  RETURNING id INTO v_account_id;
  
  RETURN QUERY SELECT true, v_account_id, p_username, '账号创建成功'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新重置密码函数
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
  
  -- 更新密码（使用完整的schema路径）
  UPDATE user_accounts
  SET password_hash = public.crypt(p_new_password, public.gen_salt('bf'))
  WHERE id = p_account_id;
  
  RETURN QUERY SELECT true, '密码重置成功'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 验证管理员账号
SELECT username, display_name, is_super_admin, is_active 
FROM admin_users 
WHERE username = 'admin';