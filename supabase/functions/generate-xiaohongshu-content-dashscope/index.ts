// 图片工厂 - 生成小红书文案（使用阿里云百炼API）
// 备选方案：使用阿里云百炼的通义千问模型

const DASHSCOPE_API_KEY = 'sk-63b565c16da348d9983c7c5cbb1b4438';
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

interface GenerateContentRequest {
  mainTitle: string;
  imageCount: number;
}

interface ContentItem {
  sub_title: string;
  content: string;
}

Deno.serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 解析请求参数
    const { mainTitle, imageCount }: GenerateContentRequest = await req.json();

    // 验证参数
    if (!mainTitle || !mainTitle.trim()) {
      return new Response(
        JSON.stringify({ error: '主标题不能为空' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (imageCount < 3 || imageCount > 5) {
      return new Response(
        JSON.stringify({ error: '生成数量必须在3-5之间' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('生成小红书文案:', { mainTitle, imageCount });

    // 构造提示词
    const systemPrompt = `你是一位专业的全行业小红书内容创作者，能够适配不同行业风格（养生偏实用、美妆偏活泼、职场偏专业等）。

你的任务是根据用户提供的主标题，生成${imageCount}个分标题和对应的小红书风格文案。

要求：
1. 分标题：1-4字，简洁明了，与主标题强相关，覆盖主标题核心场景
2. 文案：50-100字，带1-2个行业相关Emoji，开头/结尾符合小红书调性（开头：宝子们/打工人/姐妹们；结尾：快去试试/收藏备用/点赞关注）
3. 输出格式：JSON数组，字段为sub_title（分标题）、content（文案）

示例输出格式：
[
  {
    "sub_title": "底妆",
    "content": "宝子们！底妆是妆容的基础💄 选择适合自己肤质的粉底液，轻薄服帖不卡粉。记得要用美妆蛋轻拍上妆，这样妆感更自然哦✨ 快去试试吧！"
  }
]`;

    const userPrompt = `主标题：${mainTitle}\n\n请生成${imageCount}个分标题和对应的小红书文案。直接返回JSON数组，不要有其他文字。`;

    // 调用阿里云百炼API
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        },
        parameters: {
          result_format: 'message',
        },
      }),
    });

    const responseText = await response.text();
    console.log('阿里云百炼API响应状态:', response.status);
    console.log('阿里云百炼API响应内容:', responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: '阿里云百炼API调用失败',
          status: response.status,
          message: responseText,
        }),
        { 
          status: response.status,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 解析响应
    const result = JSON.parse(responseText);
    const generatedContent = result.output?.choices?.[0]?.message?.content || '';

    console.log('生成的内容:', generatedContent);

    // 提取JSON数组
    let contentList: ContentItem[] = [];
    try {
      // 尝试直接解析
      contentList = JSON.parse(generatedContent);
    } catch (e) {
      // 如果失败，尝试提取JSON部分
      const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        contentList = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析生成的内容');
      }
    }

    // 验证数据完整性
    if (!Array.isArray(contentList) || contentList.length === 0) {
      throw new Error('生成的内容格式不正确');
    }

    // 补充缺失字段
    contentList = contentList.map((item, index) => ({
      sub_title: item.sub_title || `分标题${index + 1}`,
      content: item.content || '精彩内容，敬请期待！✨',
    }));

    // 确保数量正确
    if (contentList.length < imageCount) {
      // 补充默认内容
      for (let i = contentList.length; i < imageCount; i++) {
        contentList.push({
          sub_title: `分标题${i + 1}`,
          content: '精彩内容，敬请期待！✨',
        });
      }
    } else if (contentList.length > imageCount) {
      // 截取前N个
      contentList = contentList.slice(0, imageCount);
    }

    console.log('最终内容列表:', contentList);

    return new Response(
      JSON.stringify({
        success: true,
        content_list: contentList,
        message: '文案生成成功',
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('文案生成失败:', error);
    return new Response(
      JSON.stringify({ 
        error: '文案生成失败',
        message: error instanceof Error ? error.message : '未知错误',
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
