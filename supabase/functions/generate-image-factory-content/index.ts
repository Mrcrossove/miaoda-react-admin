// 图片工厂 - 生成小标题和文案
// 使用通义千问大模型生成内容

const DASHSCOPE_API_KEY = 'sk-63b565c16da348d9983c7c5cbb1b4438';
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

interface GenerateContentRequest {
  theme: string;
  itemCount: number;
  contentStyle: 'science' | 'recommend' | 'cute';
}

// 文案风格提示词
const STYLE_PROMPTS = {
  science: '专业严谨的科普风格，知识性强，用词准确',
  recommend: '热情推荐的种草风格，吸引力强，语气亲切',
  cute: '活泼俏皮的可爱风格，亲和力强，语气轻松',
};

Deno.serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { theme, itemCount, contentStyle } = await req.json() as GenerateContentRequest;

    if (!theme || !theme.trim()) {
      return new Response(
        JSON.stringify({ error: '主题不能为空' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (itemCount < 3 || itemCount > 8) {
      return new Response(
        JSON.stringify({ error: '小标题数量必须在3-8之间' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('生成内容:', { theme, itemCount, contentStyle });

    // 构建提示词
    const stylePrompt = STYLE_PROMPTS[contentStyle] || STYLE_PROMPTS.science;
    const prompt = `你是一个专业的小红书内容创作助手。请根据主题"${theme}"生成${itemCount}个小标题和对应的文案。

要求：
1. 文案风格：${stylePrompt}
2. 每个小标题简洁有力，5-10个字
3. 每个文案不超过50字，突出重点
4. 内容要有吸引力，适合小红书平台
5. 严格按照JSON格式输出，不要有任何其他文字

输出格式（纯JSON，不要markdown代码块）：
[
  {"subTitle": "小标题1", "content": "对应文案1"},
  {"subTitle": "小标题2", "content": "对应文案2"}
]`;

    // 调用通义千问API
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        input: {
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        parameters: {
          result_format: 'message',
        },
      }),
    });

    const responseText = await response.text();
    console.log('=== API响应 ===');
    console.log('响应状态码:', response.status);
    console.log('响应内容:', responseText);

    // 解析响应
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error(`响应解析失败：${responseText}`);
    }

    if (result.code) {
      throw new Error(`API错误：${result.code} - ${result.message}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP错误 ${response.status}：${responseText}`);
    }

    // 提取生成的内容
    const generatedText = result.output?.choices?.[0]?.message?.content;
    if (!generatedText) {
      throw new Error(`未能获取生成内容，响应结构：${JSON.stringify(result)}`);
    }

    console.log('生成的文本:', generatedText);

    // 解析JSON内容（处理可能的markdown代码块）
    let contentList;
    try {
      // 尝试直接解析
      contentList = JSON.parse(generatedText);
    } catch (e) {
      // 如果失败，尝试提取JSON（去除markdown代码块）
      const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       generatedText.match(/```\s*([\s\S]*?)\s*```/) ||
                       generatedText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        contentList = JSON.parse(jsonStr);
      } else {
        throw new Error('无法从响应中提取JSON内容');
      }
    }

    // 验证数据格式
    if (!Array.isArray(contentList)) {
      throw new Error('生成的内容格式不正确');
    }

    // 确保数量正确
    if (contentList.length !== itemCount) {
      console.warn(`生成数量不匹配：期望${itemCount}，实际${contentList.length}`);
      // 截取或补充
      if (contentList.length > itemCount) {
        contentList = contentList.slice(0, itemCount);
      }
    }

    // 验证每个项的格式
    for (const item of contentList) {
      if (!item.subTitle || !item.content) {
        throw new Error('生成的内容缺少必要字段');
      }
      // 截断过长的文案
      if (item.content.length > 50) {
        item.content = item.content.slice(0, 50);
      }
    }

    console.log('内容生成成功，数量:', contentList.length);

    return new Response(
      JSON.stringify({
        success: true,
        content_list: contentList,
        message: '内容生成成功',
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('内容生成失败:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '内容生成失败',
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
