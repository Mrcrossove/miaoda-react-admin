// 搜索小红书爆款笔记
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 解析点赞数字符串（如"2万"、"1.5万"）为数字
function parseLikedCount(likedCountStr: string): number {
  if (!likedCountStr) return 0;
  
  // 移除所有空格
  const str = likedCountStr.trim();
  
  // 如果包含"万"
  if (str.includes('万')) {
    const num = parseFloat(str.replace('万', ''));
    return Math.floor(num * 10000);
  }
  
  // 如果是纯数字字符串
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.floor(num);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { 
      keyword, 
      number = 30, // 采集数量，默认20，最大100
      sort = 4, // 排序方式：0=综合排序, 1=最新发布, 2=最多点赞, 3=最多评论, 4=最多收藏
      noteType = 2, // 笔记类型：0=全部, 1=视频笔记, 2=图文笔记
      publishTime = 3 // 发布时间：0=不限, 1=一天内, 2=一周内, 3=半年内
    } = requestBody;

    console.log('=== 搜索小红书爆款笔记 - 开始 ===');
    console.log('请求参数:', JSON.stringify({ keyword, number, sort, noteType, publishTime }, null, 2));

    if (!keyword) {
      const error = '缺少必要参数：keyword';
      console.error('参数验证失败:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 从环境变量获取配置
    const cookie = Deno.env.get('XIAOHONGSHU_COOKIE');
    const apiKey = Deno.env.get('XIAOHONGSHU_API_KEY');

    if (!cookie || !apiKey) {
      const error = '未配置小红书Cookie或API Key，请在Supabase后台配置环境变量';
      console.error('配置错误:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 检查是否为占位符
    if (cookie.includes('请在Supabase后台配置') || apiKey.includes('请在Supabase后台配置')) {
      const error = '请先在Supabase后台配置真实的小红书Cookie和API Key';
      console.error('配置错误:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 构建API请求URL
    const apiUrl = new URL('https://cyanlis.cn/api/plugins/xiaohongshu/search');
    apiUrl.searchParams.append('keyword', keyword);
    apiUrl.searchParams.append('cookie', cookie);
    apiUrl.searchParams.append('apiKey', apiKey);
    apiUrl.searchParams.append('sort', String(sort)); // 使用传入的排序方式
    apiUrl.searchParams.append('noteType', String(noteType)); // 使用传入的笔记类型
    apiUrl.searchParams.append('publishTime', String(publishTime)); // 使用传入的发布时间
    apiUrl.searchParams.append('number', String(number)); // 采集数量

    console.log('调用小红书搜索API:', apiUrl.toString().replace(cookie, '***').replace(apiKey, '***'));

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API响应状态:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('API响应原始内容:', responseText.substring(0, 500));

    let apiData;
    try {
      apiData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      throw new Error(`API返回的不是有效的JSON: ${responseText.substring(0, 200)}`);
    }

    console.log('API响应数据:', JSON.stringify(apiData, null, 2).substring(0, 1000));

    if (apiData.code !== 0 || !apiData.success) {
      const errorMsg = apiData.msg || '搜索失败';
      console.error('API返回错误:', errorMsg);
      throw new Error(errorMsg);
    }

    // 转换数据格式（不再进行点赞数筛选，由API参数控制）
    const notes = (apiData.data || [])
      .map((item: any) => {
        const likeCount = parseLikedCount(item.liked_count);
        return {
          note_id: item.note_id,
          title: item.title,
          description: '', // API不返回描述，设为空
          cover_image: item.cover,
          images: [item.cover], // 只有封面图
          like_count: likeCount,
          comment_count: 0, // API不返回评论数
          share_count: 0, // API不返回分享数
          collect_count: 0, // API不返回收藏数
          author_name: item.user?.nickname || '小红书用户',
          author_avatar: item.user?.avatar || '',
          note_url: item.url,
          publish_time: '', // API不返回发布时间
          _original_liked_count: item.liked_count, // 保留原始点赞数显示
        };
      });

    console.log('=== 搜索小红书爆款笔记 - 成功 ===');
    console.log('返回数量:', notes.length);
    console.log('用量信息:', apiData.msg);

    return new Response(
      JSON.stringify({
        status: 0,
        msg: apiData.msg || 'success',
        data: {
          notes,
          total: notes.length,
          is_mock: false, // 标记这是真实数据
          usage: apiData.usage,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('=== 搜索小红书爆款笔记 - 失败 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);

    return new Response(
      JSON.stringify({
        error: error.message || '搜索失败',
        errorType: error.constructor.name,
        errorStack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
