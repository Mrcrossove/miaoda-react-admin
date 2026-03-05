-- 创建用户使用记录表
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month TEXT NOT NULL, -- 格式：YYYY-MM
  image_factory_count INTEGER DEFAULT 0, -- 图片工厂使用次数
  ecommerce_video_count INTEGER DEFAULT 0, -- 电商视频使用次数
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

-- 创建用户算力表
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  credits INTEGER DEFAULT 0, -- 算力余额
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建算力交易记录表
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL, -- 正数为充值，负数为消费
  type TEXT NOT NULL, -- 'recharge' 或 'consume'
  description TEXT, -- 描述
  related_feature TEXT, -- 关联功能：'image_factory' 或 'ecommerce_video'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- 启用RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：允许所有人通过函数操作
CREATE POLICY "允许通过函数操作使用记录" ON user_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允许通过函数操作算力" ON user_credits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "允许通过函数操作交易记录" ON credit_transactions FOR ALL USING (true) WITH CHECK (true);

-- 创建函数：检查并消费使用次数
CREATE OR REPLACE FUNCTION check_and_consume_usage(
  p_user_id UUID,
  p_feature TEXT -- 'image_factory' 或 'ecommerce_video'
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  remaining_free INTEGER, -- 剩余免费次数
  credits_balance INTEGER, -- 算力余额
  consumed_type TEXT -- 'free' 或 'credits'
) AS $$
DECLARE
  v_current_month TEXT;
  v_usage_record user_usage;
  v_credits_record user_credits;
  v_free_limit INTEGER;
  v_credits_cost INTEGER;
  v_current_count INTEGER;
BEGIN
  -- 获取当前月份
  v_current_month := to_char(now(), 'YYYY-MM');
  
  -- 设置免费次数限制和算力消费
  IF p_feature = 'image_factory' THEN
    v_free_limit := 12;
    v_credits_cost := 10;
  ELSIF p_feature = 'ecommerce_video' THEN
    v_free_limit := 7;
    v_credits_cost := 20;
  ELSE
    RETURN QUERY SELECT false, '无效的功能类型'::TEXT, 0, 0, ''::TEXT;
    RETURN;
  END IF;
  
  -- 获取或创建使用记录
  SELECT * INTO v_usage_record
  FROM user_usage
  WHERE user_id = p_user_id AND month = v_current_month;
  
  IF NOT FOUND THEN
    INSERT INTO user_usage (user_id, month, image_factory_count, ecommerce_video_count)
    VALUES (p_user_id, v_current_month, 0, 0)
    RETURNING * INTO v_usage_record;
  END IF;
  
  -- 获取当前功能的使用次数
  IF p_feature = 'image_factory' THEN
    v_current_count := v_usage_record.image_factory_count;
  ELSE
    v_current_count := v_usage_record.ecommerce_video_count;
  END IF;
  
  -- 检查免费次数
  IF v_current_count < v_free_limit THEN
    -- 使用免费次数
    IF p_feature = 'image_factory' THEN
      UPDATE user_usage
      SET image_factory_count = image_factory_count + 1, updated_at = now()
      WHERE user_id = p_user_id AND month = v_current_month;
    ELSE
      UPDATE user_usage
      SET ecommerce_video_count = ecommerce_video_count + 1, updated_at = now()
      WHERE user_id = p_user_id AND month = v_current_month;
    END IF;
    
    -- 获取算力余额
    SELECT credits INTO v_credits_record
    FROM user_credits
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
      v_credits_record.credits := 0;
    END IF;
    
    RETURN QUERY SELECT 
      true, 
      '使用成功（免费次数）'::TEXT, 
      v_free_limit - v_current_count - 1, 
      v_credits_record.credits,
      'free'::TEXT;
    RETURN;
  END IF;
  
  -- 免费次数用完，检查算力
  SELECT * INTO v_credits_record
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits)
    VALUES (p_user_id, 0)
    RETURNING * INTO v_credits_record;
  END IF;
  
  -- 检查算力是否足够
  IF v_credits_record.credits < v_credits_cost THEN
    RETURN QUERY SELECT 
      false, 
      '免费次数已用完，算力不足，请充值'::TEXT, 
      0, 
      v_credits_record.credits,
      ''::TEXT;
    RETURN;
  END IF;
  
  -- 扣除算力
  UPDATE user_credits
  SET credits = credits - v_credits_cost, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- 记录交易
  INSERT INTO credit_transactions (user_id, amount, type, description, related_feature)
  VALUES (
    p_user_id, 
    -v_credits_cost, 
    'consume', 
    CASE 
      WHEN p_feature = 'image_factory' THEN '图片工厂使用'
      ELSE '电商视频使用'
    END,
    p_feature
  );
  
  RETURN QUERY SELECT 
    true, 
    '使用成功（消费算力）'::TEXT, 
    0, 
    v_credits_record.credits - v_credits_cost,
    'credits'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取用户使用情况
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID)
RETURNS TABLE(
  current_month TEXT,
  image_factory_used INTEGER,
  image_factory_limit INTEGER,
  image_factory_remaining INTEGER,
  ecommerce_video_used INTEGER,
  ecommerce_video_limit INTEGER,
  ecommerce_video_remaining INTEGER,
  credits_balance INTEGER
) AS $$
DECLARE
  v_current_month TEXT;
  v_usage_record user_usage;
  v_credits_record user_credits;
BEGIN
  v_current_month := to_char(now(), 'YYYY-MM');
  
  -- 获取使用记录
  SELECT * INTO v_usage_record
  FROM user_usage
  WHERE user_id = p_user_id AND month = v_current_month;
  
  IF NOT FOUND THEN
    v_usage_record.image_factory_count := 0;
    v_usage_record.ecommerce_video_count := 0;
  END IF;
  
  -- 获取算力余额
  SELECT * INTO v_credits_record
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    v_credits_record.credits := 0;
  END IF;
  
  RETURN QUERY SELECT
    v_current_month,
    v_usage_record.image_factory_count,
    12,
    GREATEST(0, 12 - v_usage_record.image_factory_count),
    v_usage_record.ecommerce_video_count,
    7,
    GREATEST(0, 7 - v_usage_record.ecommerce_video_count),
    v_credits_record.credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：充值算力
CREATE OR REPLACE FUNCTION recharge_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT '算力充值'
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  new_balance INTEGER
) AS $$
DECLARE
  v_credits_record user_credits;
BEGIN
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT false, '充值金额必须大于0'::TEXT, 0;
    RETURN;
  END IF;
  
  -- 获取或创建算力记录
  SELECT * INTO v_credits_record
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits)
    VALUES (p_user_id, p_amount)
    RETURNING * INTO v_credits_record;
  ELSE
    UPDATE user_credits
    SET credits = credits + p_amount, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_credits_record;
  END IF;
  
  -- 记录交易
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'recharge', p_description);
  
  RETURN QUERY SELECT true, '充值成功'::TEXT, v_credits_record.credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取交易记录
CREATE OR REPLACE FUNCTION get_credit_transactions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  amount INTEGER,
  type TEXT,
  description TEXT,
  related_feature TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.amount,
    t.type,
    t.description,
    t.related_feature,
    t.created_at
  FROM credit_transactions t
  WHERE t.user_id = p_user_id
  ORDER BY t.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;