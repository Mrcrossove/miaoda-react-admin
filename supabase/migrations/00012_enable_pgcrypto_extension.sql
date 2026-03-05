-- 启用 pgcrypto 扩展（用于密码加密）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 验证扩展是否启用
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    RAISE EXCEPTION 'pgcrypto extension is not available';
  END IF;
END $$;

-- 重新插入默认管理员账号（确保使用正确的加密）
DELETE FROM admin_users WHERE username = 'admin';

INSERT INTO admin_users (username, password_hash, display_name, is_super_admin, is_active)
VALUES (
  'admin',
  crypt('admin123', gen_salt('bf')),
  '超级管理员',
  true,
  true
);

-- 验证管理员账号是否创建成功
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM admin_users WHERE username = 'admin';
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Failed to create admin user';
  END IF;
  RAISE NOTICE 'Admin user created successfully';
END $$;