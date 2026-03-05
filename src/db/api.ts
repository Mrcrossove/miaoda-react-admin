import { supabase } from './supabase';
import type { Profile, TrendingType, VerticalType, MediaType, TimeRange, Product } from '@/types';

// 获取用户资料
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('获取用户资料失败:', error);
    return null;
  }

  return data;
}

// 更新用户资料
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'phone' | 'email'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('更新用户资料失败:', error);
    return false;
  }

  return true;
}

// 调用热榜查询Edge Function
export async function getTrendingLists(type: TrendingType) {
  const { data, error } = await supabase.functions.invoke('trending-lists', {
    body: JSON.stringify({ type }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error) {
    let errorMsg = error?.message || '获取热榜数据失败';
    
    // 尝试从context中获取错误信息
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('获取热榜数据失败:', errorMsg);
    throw new Error(errorMsg);
  }

  return data;
}

// 调用垂类热榜查询Edge Function
export async function getVerticalTrending(
  type: VerticalType,
  mediaType: MediaType,
  timeRange: TimeRange
) {
  const { data, error } = await supabase.functions.invoke('vertical-trending', {
    body: JSON.stringify({ type, mediaType, timeRange }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error) {
    let errorMsg = error?.message || '获取垂类热榜数据失败';
    
    // 尝试从context中获取错误信息
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('获取垂类热榜数据失败:', errorMsg);
    throw new Error(errorMsg);
  }

  return data;
}

// ========== 产品相关API ==========

// 获取用户的所有产品
export async function getUserProducts(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取产品列表失败:', error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

// 创建产品
export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .maybeSingle();

  if (error) {
    console.error('创建产品失败:', error);
    return null;
  }

  return data;
}

// 更新产品
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) {
    console.error('更新产品失败:', error);
    return false;
  }

  return true;
}

// 删除产品
export async function deleteProduct(productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('删除产品失败:', error);
    return false;
  }

  return true;
}

// 搜索小红书爆款笔记
export async function searchXiaohongshuNotes(
  keyword: string, 
  number: number = 30, // 采集数量，默认20，最大100
  sort: number = 4, // 排序方式：0=综合排序, 1=最新发布, 2=最多点赞, 3=最多评论, 4=最多收藏
  noteType: number = 2, // 笔记类型：0=全部, 1=视频笔记, 2=图文笔记
  publishTime: number = 3 // 发布时间：0=不限, 1=一天内, 2=一周内, 3=半年内
) {
  const { data, error } = await supabase.functions.invoke('search-xiaohongshu-notes', {
    body: JSON.stringify({ keyword, number, sort, noteType, publishTime }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error) {
    let errorMsg = error?.message || '搜索失败';
    
    // 尝试从context中获取错误信息
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('搜索小红书笔记失败:', errorMsg);
    throw new Error(errorMsg);
  }

  return data;
}


// 解析小红书笔记链接
export async function parseXiaohongshuNote(url: string) {
  const { data, error } = await supabase.functions.invoke('parse-xiaohongshu-note', {
    body: JSON.stringify({ url }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error) {
    let errorMsg = error?.message || '解析失败';
    
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('解析小红书笔记失败:', errorMsg);
    throw new Error(errorMsg);
  }

  return data;
}

// 提交图生图任务
export async function submitImageToImage(imageBase64: string, mimeType: string, prompt: string) {
  const { data, error } = await supabase.functions.invoke('image-to-image-submit', {
    body: JSON.stringify({ imageBase64, mimeType, prompt }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error) {
    let errorMsg = error?.message || '提交任务失败';
    
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('提交图生图任务失败:', errorMsg);
    throw new Error(errorMsg);
  }

  return data;
}

// 查询图生图任务状态
export async function queryImageToImage(taskId: string) {
  const { data, error } = await supabase.functions.invoke('image-to-image-query', {
    body: JSON.stringify({ taskId }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error) {
    let errorMsg = error?.message || '查询任务失败';
    
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('查询图生图任务失败:', errorMsg);
    throw new Error(errorMsg);
  }

  return data;
}


// 上传图片到Supabase Storage
export async function uploadImage(file: File): Promise<string> {
  // 生成唯一文件名
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const ext = file.name.split('.').pop();
  const fileName = `${timestamp}_${randomStr}.${ext}`;

  // 上传到Supabase Storage
  const { error } = await supabase.storage
    .from('app-8sm6r7tdrncx_content_images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('上传图片失败:', error);
    throw new Error(error.message || '上传图片失败');
  }

  // 获取公开URL
  const { data: { publicUrl } } = supabase.storage
    .from('app-8sm6r7tdrncx_content_images')
    .getPublicUrl(fileName);

  return publicUrl;
}

// ==================== SORA2视频生成API ====================

/**
 * 提交SORA2视频生成请求
 * @param prompt - 视频提示词
 * @param duration - 视频时长（10或15秒）
 * @returns 视频ID和状态
 */
export async function generateSoraVideo(prompt: string, duration: 10 | 15): Promise<{
  video_id: string;
  status: string;
  message: string;
}> {
  const { data, error } = await supabase.functions.invoke('generate-sora-video', {
    body: { prompt, duration },
  });

  if (error) {
    let errorMsg = '提交视频生成请求失败';
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('提交视频生成请求失败:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!data.success) {
    throw new Error(data.error || '提交视频生成请求失败');
  }

  return {
    video_id: data.video_id,
    status: data.status,
    message: data.message,
  };
}

/**
 * 查询SORA2视频生成状态
 * @param videoId - 视频ID
 * @returns 视频状态、进度和URL
 */
export async function querySoraVideo(videoId: string): Promise<{
  video_id: string;
  status: string;
  progress: number;
  video_url: string | null;
  message: string;
}> {
  const { data, error } = await supabase.functions.invoke(`query-sora-video?video_id=${videoId}`, {
    method: 'GET',
  });

  if (error) {
    let errorMsg = '查询视频状态失败';
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('查询视频状态失败:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!data.success) {
    throw new Error(data.error || '查询视频状态失败');
  }

  return {
    video_id: data.video_id,
    status: data.status,
    progress: data.progress,
    video_url: data.video_url,
    message: data.message,
  };
}

// ==================== 图片工厂API ====================

/**
 * 生成小红书文案
 * @param mainTitle - 主标题
 * @param imageCount - 生成数量（3-5）
 * @returns 分标题和文案列表
 */
export async function generateXiaohongshuContent(mainTitle: string, imageCount: number): Promise<{
  sub_title: string;
  content: string;
}[]> {
  const { data, error } = await supabase.functions.invoke('generate-xiaohongshu-content', {
    body: { mainTitle, imageCount },
  });

  if (error) {
    let errorMsg = '文案生成失败';
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('文案生成失败:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!data.success) {
    throw new Error(data.error || '文案生成失败');
  }

  return data.content_list;
}

/**
 * 生成图片（阿里云DashScope - 同步模式）
 * @param prompt - 提示词
 * @param size - 图片尺寸（默认1024*1024，格式：宽*高）
 * @returns 图片URL
 */
export async function generateImageWithDashscope(prompt: string, size: string = '1024*1024'): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-image-dashscope', {
    body: { prompt, size },
  });

  if (error) {
    let errorMsg = '图片生成失败';
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('图片生成失败:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!data.success) {
    throw new Error(data.error || '图片生成失败');
  }

  return data.image_url;
}

/**
 * 生成小标题和文案（图片工厂 - 通义千问）
 * @param theme - 核心主题
 * @param itemCount - 小标题数量
 * @param contentStyle - 文案风格
 * @returns 小标题和文案列表
 */
export async function generateImageFactoryContent(
  theme: string,
  itemCount: number,
  contentStyle: 'science' | 'recommend' | 'cute'
): Promise<{ subTitle: string; content: string }[]> {
  const { data, error } = await supabase.functions.invoke('generate-image-factory-content', {
    body: { theme, itemCount, contentStyle },
  });

  if (error) {
    let errorMsg = '内容生成失败';
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('内容生成失败:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!data.success) {
    throw new Error(data.error || '内容生成失败');
  }

  return data.content_list;
}

// 生成图片提示词（基于主题、小标题、文案）
export async function generateImagePrompt(
  theme: string,
  subTitle: string,
  content: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-image-prompt', {
    body: { theme, subTitle, content },
  });

  if (error) {
    let errorMsg = '提示词生成失败';
    if (error?.context) {
      if (typeof error.context.text === 'function') {
        try {
          errorMsg = await error.context.text();
        } catch (e) {
          console.error('解析错误信息失败:', e);
        }
      } else if (typeof error.context === 'string') {
        errorMsg = error.context;
      }
    }
    
    console.error('提示词生成失败:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!data.success) {
    throw new Error(data.error || '提示词生成失败');
  }

  return data.prompt;
}

// ==================== 灵感值系统 API ====================

// 获取用户灵感值余额
export async function getUserCredits(userId?: string): Promise<number> {
  // 如果没有传入userId，尝试从localStorage获取
  let uid = userId;
  if (!uid) {
    try {
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        uid = JSON.parse(userInfo).userId;
      }
    } catch (e) {
      console.error('获取用户信息失败:', e);
    }
  }

  const { data, error } = await supabase.rpc('get_user_credits', {
    p_user_id: uid || null
  });

  if (error) {
    console.error('获取灵感值失败:', error);
    return 0;
  }

  return data || 0;
}

// 获取充值套餐列表
export async function getCreditPackages() {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('获取充值套餐失败:', error);
    throw new Error('获取充值套餐失败');
  }

  return Array.isArray(data) ? data : [];
}

// 创建充值订单
export async function createCreditOrder(packageId: string): Promise<{ orderNo: string; payUrl: string }> {
  const { data, error } = await supabase.functions.invoke('create_credit_order', {
    body: JSON.stringify({ packageId }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error) {
    let errorMsg = error?.message || '创建订单失败';
    
    // 尝试从context中获取错误信息
    if (error?.context) {
      try {
        const text = await error.context.text();
        const json = JSON.parse(text);
        errorMsg = json.error || errorMsg;
      } catch (e) {
        // 忽略解析错误
      }
    }
    
    console.error('创建订单失败:', errorMsg);
    throw new Error(errorMsg);
  }

  if (!data.success) {
    throw new Error(data.error || '创建订单失败');
  }

  return {
    orderNo: data.orderNo,
    payUrl: data.payUrl
  };
}

// 查询订单详情
export async function getCreditOrder(orderNo: string) {
  const { data, error } = await supabase
    .from('credit_orders')
    .select(`
      *,
      credit_packages (
        name,
        credits,
        price
      )
    `)
    .eq('order_no', orderNo)
    .maybeSingle();

  if (error) {
    console.error('查询订单失败:', error);
    throw new Error('查询订单失败');
  }

  return data;
}

// 获取用户充值订单列表
export async function getUserCreditOrders(limit: number = 20) {
  const { data, error } = await supabase
    .from('credit_orders')
    .select(`
      *,
      credit_packages (
        name,
        credits,
        price
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('获取订单列表失败:', error);
    throw new Error('获取订单列表失败');
  }

  return Array.isArray(data) ? data : [];
}

// 获取用户消费记录
export async function getUserCreditUsage(limit: number = 50) {
  const { data, error } = await supabase
    .from('credit_usage')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('获取消费记录失败:', error);
    throw new Error('获取消费记录失败');
  }

  return Array.isArray(data) ? data : [];
}

// 消费灵感值
export async function consumeCredits(
  credits: number,
  usageType: 'video_generation' | 'image_factory',
  description?: string
): Promise<{ success: boolean; currentCredits?: number; error?: string }> {
  const { data, error } = await supabase.rpc('consume_user_credits', {
    p_credits: credits,
    p_usage_type: usageType,
    p_description: description
  });

  if (error) {
    console.error('消费灵感值失败:', error);
    return { success: false, error: '消费灵感值失败' };
  }

  return data;
}

// 获取图片工厂今日使用次数
export async function getImageFactoryUsageToday(): Promise<number> {
  const { data, error } = await supabase.rpc('get_image_factory_usage_today');

  if (error) {
    console.error('获取图片工厂使用次数失败:', error);
    return 0;
  }

  return data || 0;
}

// 记录图片工厂使用次数
export async function recordImageFactoryUsage(): Promise<{ success: boolean; usageCount?: number }> {
  const { data, error } = await supabase.rpc('record_image_factory_usage');

  if (error) {
    console.error('记录图片工厂使用次数失败:', error);
    return { success: false };
  }

  return data;
}

// 检查并消费图片工厂灵感值（如果超过2次）
export async function checkAndConsumeImageFactoryCredits(): Promise<{
  success: boolean;
  needConsume: boolean;
  usageCount?: number;
  currentCredits?: number;
  error?: string;
}> {
  const { data, error } = await supabase.rpc('check_and_consume_image_factory_credits');

  if (error) {
    console.error('检查并消费图片工厂灵感值失败:', error);
    return { success: false, needConsume: false, error: '检查失败' };
  }

  return data;
}

// 获取电商视频今日使用次数
export async function getVideoGenerationUsageToday(): Promise<number> {
  const { data, error } = await supabase.rpc('get_video_generation_usage_today');

  if (error) {
    console.error('获取电商视频使用次数失败:', error);
    return 0;
  }

  return data || 0;
}

// 记录电商视频使用次数
export async function recordVideoGenerationUsage(): Promise<{ success: boolean; usageCount?: number }> {
  const { data, error } = await supabase.rpc('record_video_generation_usage');

  if (error) {
    console.error('记录电商视频使用次数失败:', error);
    return { success: false };
  }

  return data;
}

// 检查电商视频使用次数（每天1次免费）
export async function checkVideoGenerationUsage(): Promise<{
  success: boolean;
  canUse: boolean;
  usageCount?: number;
  dailyLimit?: number;
  error?: string;
}> {
  const { data, error } = await supabase.rpc('check_video_generation_usage');

  if (error) {
    console.error('检查电商视频使用次数失败:', error);
    return { success: false, canUse: false, error: '检查失败' };
  }

  return data;
}

// 获取用户统计数据
export async function getUserStatistics(userId?: string): Promise<{
  productCount: number;
  creationCount: number;
  analysisCount: number;
  imageFactoryCount: number;
  videoGenerationCount: number;
}> {
  // 如果没有传入userId，尝试从localStorage获取
  let uid = userId;
  if (!uid) {
    try {
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        uid = JSON.parse(userInfo).userId;
      }
    } catch (e) {
      console.error('获取用户信息失败:', e);
    }
  }

  const { data, error } = await supabase.rpc('get_user_statistics', {
    p_user_id: uid || null
  });

  if (error) {
    console.error('获取用户统计数据失败:', error);
    return {
      productCount: 0,
      creationCount: 0,
      analysisCount: 0,
      imageFactoryCount: 0,
      videoGenerationCount: 0,
    };
  }

  // 转换字段名从snake_case到camelCase
  return {
    productCount: data.product_count || 0,
    creationCount: data.creation_count || 0,
    analysisCount: data.analysis_count || 0,
    imageFactoryCount: data.image_factory_count || 0,
    videoGenerationCount: data.video_generation_count || 0,
  };
}

// 生成图片工厂小红书简短文案
export async function generateImageFactoryCaption(theme: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-image-factory-caption', {
    body: JSON.stringify({ theme }),
  });

  if (error) {
    const errorMsg = await error?.context?.text();
    console.error('生成文案失败:', errorMsg || error?.message);
    throw new Error(errorMsg || error?.message || '生成文案失败');
  }

  return data.content || '';
}

// ==================== 账号管理相关 ====================

/**
 * 用户账号登录
 */
export async function loginWithAccount(username: string, password: string) {
  const { data, error } = await supabase.rpc('verify_user_login', {
    p_username: username,
    p_password: password
  });

  if (error) {
    console.error('登录失败:', error);
    return { success: false, message: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, message: '登录失败' };
  }

  const result = data[0];
  return {
    success: result.success,
    userId: result.user_id,
    username: result.username,
    displayName: result.display_name,
    message: result.message
  };
}

/**
 * 管理员登录
 */
export async function loginAdmin(username: string, password: string) {
  const { data, error } = await supabase.rpc('verify_admin_login', {
    p_username: username,
    p_password: password
  });

  if (error) {
    console.error('管理员登录失败:', error);
    return { success: false, message: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, message: '登录失败' };
  }

  const result = data[0];
  return {
    success: result.success,
    adminId: result.admin_id,
    username: result.username,
    displayName: result.display_name,
    isSuperAdmin: result.is_super_admin,
    message: result.message
  };
}

/**
 * 生成用户账号
 */
export async function generateAccount(
  username: string,
  password: string,
  displayName?: string,
  notes?: string
) {
  const { data, error } = await supabase.rpc('generate_user_account', {
    p_username: username,
    p_password: password,
    p_display_name: displayName,
    p_notes: notes
  });

  if (error) {
    console.error('生成账号失败:', error);
    return { success: false, message: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, message: '生成账号失败' };
  }

  const result = data[0];
  return {
    success: result.success,
    accountId: result.account_id,
    username: result.username,
    message: result.message
  };
}

/**
 * 获取所有用户账号列表
 */
export async function getAllAccounts() {
  const { data, error } = await supabase
    .from('user_accounts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取账号列表失败:', error);
    return [];
  }

  return data || [];
}

/**
 * 更新账号状态
 */
export async function updateAccountStatus(accountId: string, isActive: boolean) {
  const { error } = await supabase
    .from('user_accounts')
    .update({ is_active: isActive })
    .eq('id', accountId);

  if (error) {
    console.error('更新账号状态失败:', error);
    return false;
  }

  return true;
}

/**
 * 删除账号
 */
export async function deleteAccount(accountId: string) {
  const { error } = await supabase
    .from('user_accounts')
    .delete()
    .eq('id', accountId);

  if (error) {
    console.error('删除账号失败:', error);
    return false;
  }

  return true;
}

/**
 * 延长账号有效期
 */
export async function extendAccountExpiry(userId: string, days: number = 30) {
  const { data, error } = await supabase.rpc('extend_account_expiry', {
    p_user_id: userId,
    p_days: days
  });

  if (error) {
    console.error('延长账号有效期失败:', error);
    return { success: false, message: error.message };
  }

  return data || { success: false, message: '延长有效期失败' };
}

/**
 * 重置账号密码
 */
export async function resetAccountPassword(accountId: string, newPassword: string) {
  // 需要通过RPC调用来加密密码
  const { data, error } = await supabase.rpc('reset_user_password', {
    p_account_id: accountId,
    p_new_password: newPassword
  });

  if (error) {
    console.error('重置密码失败:', error);
    return { success: false, message: error.message };
  }

  return { success: true, message: '密码重置成功' };
}

// ==================== 使用次数和算力管理 ====================

/**
 * 检查并消费使用次数
 * @param userId 用户ID
 * @param feature 功能类型：'image_factory' 或 'ecommerce_video'
 */
export async function checkAndConsumeUsage(userId: string, feature: 'image_factory' | 'ecommerce_video') {
  const { data, error } = await supabase.rpc('check_and_consume_usage', {
    p_user_id: userId,
    p_feature: feature
  });

  if (error) {
    console.error('检查使用次数失败:', error);
    return {
      success: false,
      message: error.message,
      remaining_free: 0,
      credits_balance: 0,
      consumed_type: ''
    };
  }

  return data?.[0] || {
    success: false,
    message: '未知错误',
    remaining_free: 0,
    credits_balance: 0,
    consumed_type: ''
  };
}

/**
 * 获取用户使用情况
 * @param userId 用户ID
 */
export async function getUserUsage(userId: string) {
  const { data, error } = await supabase.rpc('get_user_usage', {
    p_user_id: userId
  });

  if (error) {
    console.error('获取使用情况失败:', error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * 充值算力
 * @param userId 用户ID
 * @param amount 充值金额
 * @param description 描述
 */
export async function rechargeCredits(userId: string, amount: number, description?: string) {
  const { data, error } = await supabase.rpc('recharge_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_description: description || '算力充值'
  });

  if (error) {
    console.error('充值算力失败:', error);
    return {
      success: false,
      message: error.message,
      new_balance: 0
    };
  }

  return data?.[0] || {
    success: false,
    message: '未知错误',
    new_balance: 0
  };
}

/**
 * 获取算力交易记录
 * @param userId 用户ID
 * @param limit 限制数量
 */
export async function getCreditTransactions(userId: string, limit: number = 50) {
  const { data, error } = await supabase.rpc('get_credit_transactions', {
    p_user_id: userId,
    p_limit: limit
  });

  if (error) {
    console.error('获取交易记录失败:', error);
    return [];
  }

  return data || [];
}


