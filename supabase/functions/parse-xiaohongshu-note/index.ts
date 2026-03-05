// 解析小红书笔记链接
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { url } = requestBody;

    console.log('=== 解析小红书笔记 - 开始 ===');
    console.log('笔记链接:', url);

    if (!url) {
      const error = '缺少必要参数：url';
      console.error('参数验证失败:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 使用专门的小红书解析API
    const apiKey = 'cca4a25b-e2bb-4cb7-823a-08af7a6a6ecd';
    
    console.log('调用小红书解析API...');
    const apiUrl = `https://cyanlis.cn/api/plugins/xiaohongshu/detail?url=${encodeURIComponent(url)}&apiKey=${apiKey}`;
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API请求失败:', apiResponse.status, errorText);
      throw new Error(`API请求失败: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    console.log('API响应:', JSON.stringify(apiData, null, 2));

    // 检查响应状态
    if (apiData.code !== 0 || !apiData.success) {
      throw new Error(apiData.msg || '解析失败');
    }

    const noteData = apiData.data;
    
    if (!noteData) {
      throw new Error('未能提取到笔记内容');
    }

    // 格式化内容
    const formattedContent = `标题：${noteData.title || '无'}

正文内容：${noteData.desc || '无'}

作者：${noteData.user?.nickname || '未知'}

互动数据：
- 点赞：${noteData.stats?.liked_count || 0}
- 收藏：${noteData.stats?.collected_count || 0}
- 评论：${noteData.stats?.comment_count || 0}
- 分享：${noteData.stats?.share_count || 0}

笔记类型：${noteData.type === 'video' ? '视频' : '图文'}

图片数量：${noteData.images?.length || 0}`;

    console.log('=== 解析小红书笔记 - 完成 ===');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          content: formattedContent,
          url,
          noteData, // 返回完整的笔记数据
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('解析失败:', error);
    return new Response(
      JSON.stringify({
        error: error.message || '解析失败',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
