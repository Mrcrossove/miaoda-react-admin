-- 创建用户角色枚举
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- 创建profiles表
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  email text,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 创建辅助函数检查是否为管理员
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'::public.user_role
  );
$$;

-- 创建profiles的RLS策略
CREATE POLICY "管理员拥有完全访问权限" ON public.profiles
  FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的资料" ON public.profiles
  FOR SELECT TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON public.profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- 创建公开视图
CREATE VIEW public.public_profiles AS
  SELECT id, role FROM public.profiles;

-- 创建用户同步函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- 插入新用户资料，第一个用户为管理员
  INSERT INTO public.profiles (id, email, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  
  RETURN NEW;
END;
$$;

-- 创建触发器：仅在用户确认后同步
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();