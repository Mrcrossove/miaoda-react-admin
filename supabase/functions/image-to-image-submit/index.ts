// 图生图 - 提交任务
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
    const { imageBase64, mimeType, prompt } = requestBody;

    console.log('=== 图生图 - 提交任务 ===');
    console.log('图片类型:', mimeType);
    console.log('提示词:', prompt);

    if (!imageBase64 || !mimeType || !prompt) {
      const error = '缺少必要参数：imageBase64, mimeType, prompt';
      console.error('参数验证失败:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 调用图片生成API
    const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');
    
    if (!apiKey) {
      const error = '未配置API Key';
      console.error('配置错误:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('调用图片生成API...');
    const apiResponse = await fetch(
      'https://app-8sm6r7tdrncx-api-ra5EZDjVKkXa-gateway.appmiaoda.com/image-generation/submit',
      {
        method: 'POST',
        headers: {
          'X-Gateway-Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          }],
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
      throw new Error(apiData.message || '提交任务失败');
    }

    const taskId = apiData.data?.taskId;
    
    if (!taskId) {
      throw new Error('未获取到任务ID');
    }

    console.log('任务ID:', taskId);
    console.log('=== 图生图 - 任务提交成功 ===');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          taskId,
          status: apiData.data?.status || 'PENDING',
          estimatedTime: apiData.data?.estimatedTime || 600,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('提交任务失败:', error);
    return new Response(
      JSON.stringify({
        error: error.message || '提交任务失败',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
