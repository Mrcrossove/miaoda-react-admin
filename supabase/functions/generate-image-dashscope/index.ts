// 图片工厂 - 调用阿里云DashScope多模态生成API（同步模式）
// 使用 z-image-turbo 模型生成图片
// 官方文档：https://bailian.console.aliyun.com/cn-beijing/?tab=api#/api/?type=model&url=3002354

const DASHSCOPE_API_KEY = 'sk-63b565c16da348d9983c7c5cbb1b4438';
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

interface GenerateImageRequest {
  prompt: string;
  size?: string;
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
    const { prompt, size = '1024*1024' } = await req.json() as GenerateImageRequest;

    // 校验size格式（格式：宽*高，如 1024*1024）
    const validSizeRegex = /^\d+\*\d+$/;
    if (!validSizeRegex.test(size)) {
      return new Response(
        JSON.stringify({ error: 'size格式错误，需为"宽*高"（如1024*1024、1120*1440）' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (!prompt || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: '提示词不能为空' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 截断提示词（最多800字符）
    const truncatedPrompt = prompt.slice(0, 800);

    console.log('生成图片（同步模式）:', { prompt: truncatedPrompt, size });

    // 调用阿里云DashScope z-image-turbo API（同步模式）
    // 完全按照官方示例代码格式
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        // 注意：不添加 X-DashScope-Async 头部，使用同步模式
      },
      body: JSON.stringify({
        model: 'z-image-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  text: truncatedPrompt, // 注意：只有text字段，没有type字段
                },
              ],
            },
          ],
        },
        parameters: {
          prompt_extend: false,
          size: size, // 格式：宽*高（如 1024*1024）
        },
      }),
    });

    const responseText = await response.text();
    console.log('=== API响应 ===');
    console.log('响应状态码:', response.status);
    console.log('响应内容:', responseText);

    // 先解析响应，检查是否有error
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error(`响应解析失败：${responseText}`);
    }

    // 检查服务端返回的错误（即使status是200）
    if (result.code) {
      throw new Error(`服务端错误：${result.code} - ${result.message}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP错误 ${response.status}：${responseText}`);
    }

    // 【关键修复】正确提取z-image-turbo的图片URL
    // 根据测试文件的成功经验，URL路径是：result.output.choices[0].message.content[0].image
    const imageUrl = result.output?.choices?.[0]?.message?.content?.[0]?.image;
    
    if (!imageUrl) {
      console.error('未能获取图片URL，响应结构:', result);
      console.error('尝试的路径: result.output.choices[0].message.content[0].image');
      throw new Error(`未能获取图片URL，响应结构：${JSON.stringify(result)}`);
    }

    console.log('图片生成成功:', imageUrl);

    return new Response(
      JSON.stringify({
        success: true,
        image_url: imageUrl,
        message: '图片生成成功',
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('图片生成失败:', error);
    return new Response(
      JSON.stringify({ 
        error: '图片生成失败',
        message: error.message,
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
