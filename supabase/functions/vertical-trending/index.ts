// 垂类热榜查询接口
// 支持美食、美妆、汽车 + 抖音/小红书平台

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, mediaType, timeRange } = await req.json();

    // 验证参数
    const validTypes = ['美食', '美妆', '汽车'];
    const validMediaTypes = ['抖音', '小红书'];
    const validTimeRanges = [1, 3, 7];

    if (!type || !validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: '无效的垂类类型，可选值：美食、美妆、汽车' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!mediaType || !validMediaTypes.includes(mediaType)) {
      return new Response(
        JSON.stringify({ error: '无效的媒体类型，可选值：抖音、小红书' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!timeRange || !validTimeRanges.includes(timeRange)) {
      return new Response(
        JSON.stringify({ error: '无效的时间范围，可选值：1(近一天)、3(近三天)、7(近7天)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 调用API
    const apiUrl = 'https://api-integrations.appmiaoda.com/app-8sm6r7tdrncx/api-79jKPrD7GGKL/v2/tools/trending_lists/vertical';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appbuilder-Request-Id': crypto.randomUUID(),
      },
      body: JSON.stringify({
        type,
        mediaType,
        timeRange,
      }),
    });

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || '获取垂类热榜数据失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
