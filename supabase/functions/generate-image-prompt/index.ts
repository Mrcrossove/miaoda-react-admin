// 图片工厂 - 生成图片提示词
// 使用通义千问大模型根据主题、小标题、文案生成适合小红书的图片提示词

const DASHSCOPE_API_KEY = 'sk-63b565c16da348d9983c7c5cbb1b4438';
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

interface GeneratePromptRequest {
  theme: string;
  subTitle: string;
  content: string;
}

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
    const { theme, subTitle, content } = await req.json() as GeneratePromptRequest;

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

    if (!subTitle || !subTitle.trim()) {
      return new Response(
        JSON.stringify({ error: '小标题不能为空' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('生成图片提示词:', { theme, subTitle, content });

    // 构建提示词
    const prompt = `你是一个专业的小红书图片创作助手，擅长根据内容生成精准的图片提示词。

任务：根据以下信息，生成一个适合小红书爆款图文的图片提示词。

信息：
- 主题：${theme}
- 小标题：${subTitle}
- 文案：${content}

要求：
1. 分析主题、小标题和文案，推理出最适合的图片类型（实物图、场景图、插画、图表、对比图等）
2. 生成详细的视觉描述，包括：
   - 主体物品或场景
   - 颜色风格（清新、温暖、简约等）
   - 构图方式（居中、俯拍、特写等）
   - 背景环境
   - 光线氛围
3. 符合小红书风格：简约、清新、有质感、吸引眼球
4. 提示词长度：50-150字
5. 直接输出提示词文本，不要有任何其他说明或格式

示例：
输入：主题"湿气越吃越少"，小标题"红豆薏米粥"，文案"祛湿养颜，每天一碗身体轻盈"
输出：一碗热气腾腾的红豆薏米粥，白色陶瓷碗，粥面点缀红豆和薏米，俯拍视角，木质餐桌背景，温暖柔和的自然光，简约清新风格，适合小红书美食配图

现在请生成提示词：`;

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

    // 提取生成的提示词
    const generatedPrompt = result.output?.choices?.[0]?.message?.content;
    if (!generatedPrompt) {
      throw new Error(`未能获取生成的提示词，响应结构：${JSON.stringify(result)}`);
    }

    console.log('提示词生成成功:', generatedPrompt);

    // 清理提示词（去除可能的引号、换行等）
    const cleanedPrompt = generatedPrompt.trim().replace(/^["']|["']$/g, '');

    return new Response(
      JSON.stringify({
        success: true,
        prompt: cleanedPrompt,
        message: '提示词生成成功',
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('提示词生成失败:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '提示词生成失败',
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
