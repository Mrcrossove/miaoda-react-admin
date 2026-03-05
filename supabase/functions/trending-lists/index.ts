// 热榜查询接口
// 支持9个主流平台：微博、头条、知乎、抖音、B站、百度、贴吧、快手、小红书

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
    const { type } = await req.json();

    // 验证type参数
    const validTypes = ['2', '3', '4', '6', '7', '8', '9', '10', '14'];
    if (!type || !validTypes.includes(String(type))) {
      return new Response(
        JSON.stringify({ 
          error: '无效的热榜类型', 
          validTypes: {
            '2': '微博热榜',
            '3': '头条热榜',
            '4': '百度热榜',
            '6': '抖音热榜',
            '7': '知乎热榜',
            '8': 'B站热榜',
            '9': '贴吧热议榜',
            '10': '快手热榜',
            '14': '小红书热榜'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 调用API
    const apiUrl = `https://api-integrations.appmiaoda.com/app-8sm6r7tdrncx/api-l9nZzWk3E1Z9/v2/tools/trending_lists/medium?type=${type}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Appbuilder-Request-Id': crypto.randomUUID(),
      },
    });

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || '获取热榜数据失败' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
