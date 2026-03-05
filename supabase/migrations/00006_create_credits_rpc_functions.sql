-- 创建RPC函数：支付成功后增加用户灵感值
CREATE OR REPLACE FUNCTION public.update_user_credits_after_payment(
  p_user_id UUID,
  p_credits INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 增加用户灵感值
  INSERT INTO public.user_credits (user_id, credits, updated_at)
  VALUES (p_user_id, p_credits, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits = public.user_credits.credits + p_credits,
    updated_at = NOW();
END;
$$;

-- 创建RPC函数：消费灵感值（电商视频、图片工厂）
CREATE OR REPLACE FUNCTION public.consume_user_credits(
  p_credits INTEGER,
  p_usage_type usage_type,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- 检查参数
  IF p_credits <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', '消费灵感值必须大于0');
  END IF;

  -- 获取当前灵感值
  SELECT credits INTO current_credits
  FROM public.user_credits
  WHERE user_id = auth.uid()
  FOR UPDATE; -- 行锁，防止并发问题

  -- 如果用户没有灵感值记录，创建一个
  IF current_credits IS NULL THEN
    INSERT INTO public.user_credits (user_id, credits)
    VALUES (auth.uid(), 0);
    current_credits := 0;
  END IF;

  -- 检查余额是否足够
  IF current_credits < p_credits THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', '灵感值不足',
      'current_credits', current_credits,
      'required_credits', p_credits
    );
  END IF;

  -- 扣除灵感值
  new_credits := current_credits - p_credits;
  UPDATE public.user_credits
  SET credits = new_credits, updated_at = NOW()
  WHERE user_id = auth.uid();

  -- 记录消费
  INSERT INTO public.credit_usage (user_id, credits, usage_type, description)
  VALUES (auth.uid(), p_credits, p_usage_type, p_description);

  RETURN jsonb_build_object(
    'success', true,
    'current_credits', new_credits,
    'consumed_credits', p_credits
  );
END;
$$;

-- 创建RPC函数：记录图片工厂使用次数
CREATE OR REPLACE FUNCTION public.record_image_factory_usage()
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
  FROM public.image_factory_usage
  WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE
  FOR UPDATE; -- 行锁，防止并发问题

  -- 如果今天还没有使用记录，创建一个
  IF current_usage_count IS NULL THEN
    INSERT INTO public.image_factory_usage (user_id, usage_date, usage_count)
    VALUES (auth.uid(), CURRENT_DATE, 1);
    new_usage_count := 1;
  ELSE
    -- 增加使用次数
    new_usage_count := current_usage_count + 1;
    UPDATE public.image_factory_usage
    SET usage_count = new_usage_count
    WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'usage_count', new_usage_count
  );
END;
$$;

-- 创建RPC函数：检查并消费图片工厂灵感值（如果超过2次）
CREATE OR REPLACE FUNCTION public.check_and_consume_image_factory_credits()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage_count INTEGER;
  current_credits INTEGER;
  consume_result JSONB;
BEGIN
  -- 获取今日使用次数
  SELECT usage_count INTO current_usage_count
  FROM public.image_factory_usage
  WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE;

  -- 如果今天还没有使用记录，使用次数为0
  IF current_usage_count IS NULL THEN
    current_usage_count := 0;
  END IF;

  -- 如果使用次数小于2，不需要消费灵感值
  IF current_usage_count < 2 THEN
    RETURN jsonb_build_object(
      'success', true,
      'need_consume', false,
      'usage_count', current_usage_count,
      'message', '今日免费次数未用完'
    );
  END IF;

  -- 如果使用次数>=2，需要消费5灵感值
  -- 先检查余额
  SELECT credits INTO current_credits
  FROM public.user_credits
  WHERE user_id = auth.uid();

  IF current_credits IS NULL THEN
    current_credits := 0;
  END IF;

  IF current_credits < 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'need_consume', true,
      'error', '灵感值不足',
      'current_credits', current_credits,
      'required_credits', 5,
      'usage_count', current_usage_count
    );
  END IF;

  -- 消费5灵感值
  consume_result := public.consume_user_credits(5, 'image_factory'::usage_type, '图片工厂超出免费次数');

  IF (consume_result->>'success')::boolean = false THEN
    RETURN consume_result;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'need_consume', true,
    'consumed_credits', 5,
    'current_credits', (consume_result->>'current_credits')::integer,
    'usage_count', current_usage_count
  );
END;
$$;

COMMENT ON FUNCTION public.update_user_credits_after_payment IS '支付成功后增加用户灵感值';
COMMENT ON FUNCTION public.consume_user_credits IS '消费灵感值（电商视频、图片工厂）';
COMMENT ON FUNCTION public.record_image_factory_usage IS '记录图片工厂使用次数';
COMMENT ON FUNCTION public.check_and_consume_image_factory_credits IS '检查并消费图片工厂灵感值（如果超过2次）';