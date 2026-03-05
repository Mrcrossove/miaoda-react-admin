-- 电商视频使用记录表
CREATE TABLE IF NOT EXISTS public.video_generation_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 1 CHECK (usage_count > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_video_generation_usage_user_id_date ON public.video_generation_usage(user_id, usage_date);

-- 创建RLS策略
ALTER TABLE public.video_generation_usage ENABLE ROW LEVEL SECURITY;

-- video_generation_usage策略：用户只能查看自己的使用记录
CREATE POLICY "用户可以查看自己的电商视频使用记录" ON public.video_generation_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 创建RPC函数：获取电商视频今日使用次数
CREATE OR REPLACE FUNCTION public.get_video_generation_usage_today()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_count_today INTEGER;
BEGIN
  SELECT usage_count INTO usage_count_today
  FROM public.video_generation_usage
  WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE;
  
  IF usage_count_today IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN usage_count_today;
END;
$$;

-- 创建RPC函数：记录电商视频使用次数
CREATE OR REPLACE FUNCTION public.record_video_generation_usage()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage_count INTEGER;
  new_usage_count INTEGER;
BEGIN
  -- 获取今日使用次数
  SELECT usage_count INTO current_usage_count
  FROM public.video_generation_usage
  WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE
  FOR UPDATE; -- 行锁，防止并发问题

  -- 如果今天还没有使用记录，创建一个
  IF current_usage_count IS NULL THEN
    INSERT INTO public.video_generation_usage (user_id, usage_date, usage_count)
    VALUES (auth.uid(), CURRENT_DATE, 1);
    new_usage_count := 1;
  ELSE
    -- 增加使用次数
    new_usage_count := current_usage_count + 1;
    UPDATE public.video_generation_usage
    SET usage_count = new_usage_count
    WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'usage_count', new_usage_count
  );
END;
$$;

-- 创建RPC函数：检查电商视频使用次数（每天1次免费）
CREATE OR REPLACE FUNCTION public.check_video_generation_usage()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage_count INTEGER;
BEGIN
  -- 获取今日使用次数
  SELECT usage_count INTO current_usage_count
  FROM public.video_generation_usage
  WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE;

  -- 如果今天还没有使用记录，使用次数为0
  IF current_usage_count IS NULL THEN
    current_usage_count := 0;
  END IF;

  -- 检查是否超过每日限制（1次）
  IF current_usage_count >= 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'can_use', false,
      'error', '今日免费次数已用完',
      'usage_count', current_usage_count,
      'daily_limit', 1
    );
  END IF;

  -- 可以使用
  RETURN jsonb_build_object(
    'success', true,
    'can_use', true,
    'usage_count', current_usage_count,
    'daily_limit', 1
  );
END;
$$;

COMMENT ON TABLE public.video_generation_usage IS '电商视频使用记录表';
COMMENT ON FUNCTION public.get_video_generation_usage_today IS '获取电商视频今日使用次数';
COMMENT ON FUNCTION public.record_video_generation_usage IS '记录电商视频使用次数';
COMMENT ON FUNCTION public.check_video_generation_usage IS '检查电商视频使用次数（每天1次免费）';