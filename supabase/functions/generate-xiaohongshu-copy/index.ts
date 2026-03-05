// 生成小红书文案（流式响应）
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, sellingPoints, targetAudience, description } = await req.json();

    if (!productName) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数：productName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 构建提示词
    const systemPrompt = `你是一位专业的小红书内容创作专家，擅长撰写爆款标题和吸引人的正文。你的文案风格口语化、亲切、有感染力，善于使用感叹词、数字、悬念等技巧吸引读者。`;
    
    const userPrompt = `请为以下产品生成小红书爆款文案：

产品名称：${productName}
${sellingPoints ? `核心卖点：${sellingPoints}` : ''}
${targetAudience ? `目标用户：${targetAudience}` : ''}
${description ? `产品描述：${description}` : ''}

请按以下格式输出：

【标题】
（生成1个抓人眼球的小红书爆款标题，使用感叹词、数字、emoji等元素，控制在20字以内）

【正文】
（生成完整的小红书正文，包含：
1. 开场引入，制造共鸣或痛点
2. 突出产品核心卖点和解决的实际问题
3. 分享真实的使用体验或感受
4. 结尾添加2-3个相关话题标签
正文控制在200-300字，使用emoji增强表现力）`;

    // 调用文心大模型API（流式）
    const apiUrl = 'https://api-integrations.appmiaoda.com/app-8sm6r7tdrncx/api-Xa6JZMByJlDa/v2/chat/completions';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  continue;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  
                  if (content) {
                    // 发送SSE格式的数据
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                    );
                  }
                } catch (e) {
                  console.error('解析JSON失败:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('流式处理错误:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || '生成文案失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
