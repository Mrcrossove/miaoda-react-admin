-- 创建订单状态枚举
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'expired');

-- 创建消费类型枚举
CREATE TYPE usage_type AS ENUM ('video_generation', 'image_factory');

-- 用户灵感值表
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 充值套餐表
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 充值订单表
CREATE TABLE IF NOT EXISTS public.credit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.credit_packages(id),
  credits INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  wechat_pay_url TEXT,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 消费记录表
CREATE TABLE IF NOT EXISTS public.credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL CHECK (credits > 0),
  usage_type usage_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 图片工厂使用记录表
CREATE TABLE IF NOT EXISTS public.image_factory_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 1 CHECK (usage_count > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_orders_user_id ON public.credit_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_orders_order_no ON public.credit_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_credit_orders_status ON public.credit_orders(status);
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON public.credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON public.credit_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_factory_usage_user_id_date ON public.image_factory_usage(user_id, usage_date);

-- 插入默认充值套餐
INSERT INTO public.credit_packages (name, credits, price, sort_order) VALUES
  ('20灵感', 20, 3.00, 1),
  ('60灵感', 60, 9.00, 2),
  ('100灵感', 100, 15.00, 3)
ON CONFLICT DO NOTHING;

-- 创建RLS策略
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_factory_usage ENABLE ROW LEVEL SECURITY;

-- user_credits策略：用户只能查看和更新自己的灵感值
CREATE POLICY "用户可以查看自己的灵感值" ON public.user_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的灵感值记录" ON public.user_credits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- credit_packages策略：所有认证用户可以查看套餐
CREATE POLICY "认证用户可以查看充值套餐" ON public.credit_packages
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- credit_orders策略：用户只能查看自己的订单
CREATE POLICY "用户可以查看自己的订单" ON public.credit_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- credit_usage策略：用户只能查看自己的消费记录
CREATE POLICY "用户可以查看自己的消费记录" ON public.credit_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- image_factory_usage策略：用户只能查看自己的使用记录
CREATE POLICY "用户可以查看自己的图片工厂使用记录" ON public.image_factory_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 创建函数：初始化用户灵感值（新用户注册时自动创建）
CREATE OR REPLACE FUNCTION public.init_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 创建触发器：用户注册时自动初始化灵感值
DROP TRIGGER IF EXISTS on_auth_user_created_init_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_init_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.init_user_credits();

-- 创建RPC函数：获取用户灵感值余额
CREATE OR REPLACE FUNCTION public.get_user_credits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_credits_count INTEGER;
BEGIN
  SELECT credits INTO user_credits_count
  FROM public.user_credits
  WHERE user_id = auth.uid();
  
  IF user_credits_count IS NULL THEN
    -- 如果用户没有灵感值记录，创建一个
    INSERT INTO public.user_credits (user_id, credits)
    VALUES (auth.uid(), 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN 0;
  END IF;
  
  RETURN user_credits_count;
END;
$$;

-- 创建RPC函数：检查图片工厂今日使用次数
CREATE OR REPLACE FUNCTION public.get_image_factory_usage_today()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_count_today INTEGER;
BEGIN
  SELECT usage_count INTO usage_count_today
  FROM public.image_factory_usage
  WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE;
  
  IF usage_count_today IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN usage_count_today;
END;
$$;

COMMENT ON TABLE public.user_credits IS '用户灵感值表';
COMMENT ON TABLE public.credit_packages IS '充值套餐表';
COMMENT ON TABLE public.credit_orders IS '充值订单表';
COMMENT ON TABLE public.credit_usage IS '消费记录表';
COMMENT ON TABLE public.image_factory_usage IS '图片工厂使用记录表';