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

-- 注意：
-- 不在本迁移里调用 crypt/gen_salt，避免不同 schema/search_path 导致的函数不可见问题。
-- 管理员加密重建在后续 00013_fix_pgcrypto_schema_issue.sql 中统一处理。

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
