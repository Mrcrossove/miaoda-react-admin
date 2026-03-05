-- 创建RPC函数：获取用户统计数据
CREATE OR REPLACE FUNCTION public.get_user_statistics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_count INTEGER;
  creation_count INTEGER;
  analysis_count INTEGER;
  image_factory_count INTEGER;
  video_generation_count INTEGER;
BEGIN
  -- 统计产品数（products表）
  SELECT COUNT(*) INTO product_count
  FROM public.products
  WHERE user_id = auth.uid();

  -- 统计图片工厂使用总次数
  SELECT COALESCE(SUM(usage_count), 0) INTO image_factory_count
  FROM public.image_factory_usage
  WHERE user_id = auth.uid();

  -- 统计电商视频生成总次数
  SELECT COALESCE(SUM(usage_count), 0) INTO video_generation_count
  FROM public.video_generation_usage
  WHERE user_id = auth.uid();

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

COMMENT ON FUNCTION public.get_user_statistics IS '获取用户统计数据：产品数、创作数、分析数';