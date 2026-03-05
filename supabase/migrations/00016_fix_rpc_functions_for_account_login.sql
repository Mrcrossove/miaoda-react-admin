-- 修复RPC函数以支持账号密码登录
-- 问题：原函数只使用auth.uid()，账号密码登录时auth.uid()为null导致错误
-- 解决：添加可选的user_id参数，优先使用传入的参数，否则使用auth.uid()

-- 修改get_user_credits函数，支持传入user_id参数
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  user_credits_count INTEGER;
BEGIN
  -- 优先使用传入的user_id，否则使用auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT credits INTO user_credits_count
  FROM public.user_credits
  WHERE user_id = v_user_id;
  
  IF user_credits_count IS NULL THEN
    -- 如果用户没有灵感值记录，创建一个
    INSERT INTO public.user_credits (user_id, credits)
    VALUES (v_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN 0;
  END IF;
  
  RETURN user_credits_count;
END;
$$;

COMMENT ON FUNCTION public.get_user_credits(UUID) IS '获取用户灵感值余额，支持传入user_id参数或使用auth.uid()';

-- 修改get_user_statistics函数，支持传入user_id参数
CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  product_count INTEGER;
  creation_count INTEGER;
  analysis_count INTEGER;
  image_factory_count INTEGER;
  video_generation_count INTEGER;
BEGIN
  -- 优先使用传入的user_id，否则使用auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'product_count', 0,
      'creation_count', 0,
      'analysis_count', 0,
      'image_factory_count', 0,
      'video_generation_count', 0
    );
  END IF;

  -- 统计产品数（products表）
  SELECT COUNT(*) INTO product_count
  FROM public.products
  WHERE user_id = v_user_id;

  -- 统计图片工厂使用总次数
  SELECT COALESCE(SUM(usage_count), 0) INTO image_factory_count
  FROM public.image_factory_usage
  WHERE user_id = v_user_id;

  -- 统计电商视频生成总次数
  SELECT COALESCE(SUM(usage_count), 0) INTO video_generation_count
  FROM public.video_generation_usage
  WHERE user_id = v_user_id;

  -- 创作数 = 图片工厂 + 电商视频
  creation_count := image_factory_count + video_generation_count;

  -- 分析数（暂时设为0，后续可以添加分析同行的统计）
  analysis_count := 0;

  RETURN jsonb_build_object(
    'product_count', product_count,
    'creation_count', creation_count,
    'analysis_count', analysis_count,
    'image_factory_count', image_factory_count,
    'video_generation_count', video_generation_count
  );
END;
$$;

COMMENT ON FUNCTION public.get_user_statistics(UUID) IS '获取用户统计数据，支持传入user_id参数或使用auth.uid()';
