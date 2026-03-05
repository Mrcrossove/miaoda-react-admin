// 图生图 - 查询任务状态
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
    const { taskId } = requestBody;

    console.log('=== 图生图 - 查询任务状态 ===');
    console.log('任务ID:', taskId);

    if (!taskId) {
      const error = '缺少必要参数：taskId';
      console.error('参数验证失败:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 调用图片生成查询API
    const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');
    
    if (!apiKey) {
      const error = '未配置API Key';
      console.error('配置错误:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('调用图片生成查询API...');
    const apiResponse = await fetch(
      'https://app-8sm6r7tdrncx-api-VaOwP2jDmAga-gateway.appmiaoda.com/image-generation/task',
      {
        method: 'POST',
        headers: {
          'X-Gateway-Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
        }),
      }
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API请求失败:', apiResponse.status, errorText);
      throw new Error(`API请求失败: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    console.log('API响应:', JSON.stringify(apiData, null, 2));

    if (apiData.status !== 0) {
      throw new Error(apiData.message || '查询任务失败');
    }

    const taskStatus = apiData.data?.status;
    const imageUrl = apiData.data?.result?.imageUrl;
    const error = apiData.data?.error;

    console.log('任务状态:', taskStatus);
    if (imageUrl) {
      console.log('图片URL:', imageUrl);
    }
    if (error) {
      console.log('错误信息:', error);
    }

    console.log('=== 图生图 - 查询完成 ===');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          taskId,
          status: taskStatus,
          imageUrl,
          error,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('查询任务失败:', error);
    return new Response(
      JSON.stringify({
        error: error.message || '查询任务失败',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
