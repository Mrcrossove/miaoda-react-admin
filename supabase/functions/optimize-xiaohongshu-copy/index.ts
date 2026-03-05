// 优化小红书文案（二创）
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
    const { originalContent } = requestBody;

    console.log('=== 优化文案 - 开始 ===');
    console.log('原始内容长度:', originalContent?.length);

    if (!originalContent) {
      const error = '缺少必要参数：originalContent';
      console.error('参数验证失败:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 调用文心大模型API
    const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');
    
    if (!apiKey) {
      const error = '未配置API Key';
      console.error('配置错误:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('调用文心大模型API...');
    
    // 计算原文字数
    const originalWordCount = originalContent.length;
    const targetWordCount = Math.max(300, Math.min(originalWordCount, 800));
    
    const prompt = `# 小红书文案二创指令

## 核心任务
基于提供的原爆款文案，进行差异化二创，保留爆款逻辑（标题吸睛、情绪共鸣、实用价值），避免抄袭，适配小红书平台风格（口语化、分段清晰、emoji点缀、互动引导）。

## 原爆款文案
${originalContent}

## 输出要求

### 标题
- 格式：【情绪词/数字词】核心卖点 + 人群痛点/利益点 + 悬念/号召
- 要求：含1-2个热门emoji，长度控制在20字内，强吸引点击
- 示例：【救命！】这个方法真的太绝了🔥 必须分享给你们

### 正文
- 结构：开头钩子（个人体验/痛点共鸣）→ 核心内容（分点/分段，每段≤3行）→ 互动引导
- 语言：口语化、接地气，可加入1-2个网络热词
- emoji：每段1-2个，不堆砌，贴合内容
- 实用价值：明确给出"怎么做""为什么有用"，避免空泛
- 字数：参考原文字数（约${targetWordCount}字），不要过长或过短

### 话题标签
- 数量：8-12个
- 分类：核心标签（2个）+ 场景标签（3个）+ 热门标签（3-5个）
- 格式：每个标签前加#号，标签之间用空格分隔
- 示例：#生活技巧 #实用分享 #干货推荐 #必看 #种草

## 禁忌
- 不抄袭原文案的句子结构，核心观点用自己的话重述
- 不使用敏感词、夸大宣传
- 不堆砌无关标签，标签与内容强相关
- 不要添加任何说明或解释，直接输出优化后的文案

## 差异化方向
采用"换角度叙述"的方式，从不同视角重新表达核心内容，增加新鲜感。

请直接输出优化后的文案，格式如下：

【标题】
[这里是标题内容]

【正文】
[这里是正文内容，分段清晰，每段不超过3行]

【话题标签】
[这里是话题标签，用空格分隔]`;

    const apiResponse = await fetch(
      'https://app-8sm6r7tdrncx-api-zYkZz8qovQ1L-gateway.appmiaoda.com/v2/chat/completions',
      {
        method: 'POST',
        headers: {
          'X-Gateway-Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是一位专业的小红书内容创作者，擅长创作吸引人的爆款文案。你精通小红书平台的内容风格和用户喜好，能够进行高质量的文案二创。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      }
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API请求失败:', apiResponse.status, errorText);
      throw new Error(`API请求失败: ${apiResponse.status}`);
    }

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const reader = apiResponse.body?.getReader();
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
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
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

    console.log('=== 优化文案 - 开始流式输出 ===');

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('优化失败:', error);
    return new Response(
      JSON.stringify({
        error: error.message || '优化失败',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
