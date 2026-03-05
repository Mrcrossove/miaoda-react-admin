import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  originalTitle: string;
  originalContent?: string; // 改为可选参数
}

Deno.serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 解析请求体
    let body;
    try {
      body = await req.json();
      console.log('收到请求体:', JSON.stringify(body));
    } catch (parseError) {
      console.error('请求体解析失败:', parseError);
      return new Response(
        JSON.stringify({ error: '请求体解析失败，请确保发送有效的JSON' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { originalTitle, originalContent } = body as RequestBody;

    if (!originalTitle) {
      console.error('参数验证失败: 缺少标题', { originalTitle });
      return new Response(
        JSON.stringify({ 
          error: '缺少必要参数：originalTitle（笔记标题）',
          received: { originalTitle }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('参数验证通过:', { 
      titleLength: originalTitle.length, 
      hasContent: !!originalContent,
      contentLength: originalContent?.length || 0
    });

    // 获取API密钥
    const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');
    if (!apiKey) {
      console.error('API密钥未配置');
      return new Response(
        JSON.stringify({ error: 'API密钥未配置' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('API密钥已配置');

    // 构建提示词
    const systemPrompt = `你是一位专业的小红书内容创作专家，擅长创作爆款笔记。你的任务是：
1. 根据原笔记标题，创作一个全新的、更吸引人的小红书爆款标题和文案
2. 标题要求：
   - 最多20字
   - 使用emoji、感叹词、悬念、数字、热点话题等元素
   - 抓人眼球，引发点击欲望
   - 符合小红书爆款标题特征
3. 文案要求：
   - 最多200字
   - 口语化、亲切、有感染力
   - 符合小红书社区调性
   - 结构清晰：开场引入 → 核心卖点 → 使用体验/推荐理由
   - 适当使用emoji增加趣味性
4. 输出格式：
   标题：[新标题]
   
   文案：
   [新文案内容]`;

    const userPrompt = originalContent 
      ? `请为以下小红书笔记进行二创：

原标题：${originalTitle}

原文案：
${originalContent}

请生成一个全新的、更吸引人的标题和200字以内的文案。`
      : `请根据以下小红书笔记标题，创作一个爆款标题和200字以内的吸引人的文案：

笔记标题：${originalTitle}

请充分发挥创意，生成吸引人的标题和文案。`;

    // 调用文心大模型API
    const apiUrl = 'https://app-8sm6r7tdrncx-api-zYkZz8qovQ1L-gateway.appmiaoda.com/v2/chat/completions';
    
    console.log('准备调用API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        enable_thinking: false
      }),
    });

    console.log('API响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API调用失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return new Response(
        JSON.stringify({ 
          error: `API调用失败: ${response.status}`,
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('API调用成功，开始流式响应');

    // 直接返回API的流式响应，不做二次包装
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Edge Function错误:', error);
    return new Response(
      JSON.stringify({ error: error.message || '服务器内部错误' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
