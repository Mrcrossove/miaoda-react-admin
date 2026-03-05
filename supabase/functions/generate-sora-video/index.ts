// SORA2视频生成 - 提交请求
// API文档：https://docs.apiyi.com/api-capabilities/sora-2-video-async

const SORA2_API_KEY = 'sk-sO7D8MoXDNAhWHejAcAcEeB4BfD1436bA78aDb864cB8C11e';
const SORA2_BASE_URL = 'https://api.apiyi.com/v1/videos';

interface GenerateVideoRequest {
  prompt: string;
  duration: 10 | 15;
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
    const { prompt, duration = 10 }: GenerateVideoRequest = await req.json();

    // 验证参数
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

    if (duration !== 10 && duration !== 15) {
      return new Response(
        JSON.stringify({ error: '视频时长只支持10秒或15秒' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('提交SORA2视频生成请求:', { prompt: prompt.substring(0, 100), duration });

    // 构造multipart/form-data请求
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', 'sora-2');
    formData.append('size', '1280x720'); // 竖屏9:16
    formData.append('seconds', duration.toString());

    // 调用SORA2 API
    const response = await fetch(SORA2_BASE_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': SORA2_API_KEY,
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log('SORA2 API响应状态:', response.status);
    console.log('SORA2 API响应内容:', responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'SORA2 API请求失败',
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
    const videoId = result.id;
    const status = result.status;

    console.log('视频生成任务已提交:', { videoId, status });

    return new Response(
      JSON.stringify({
        success: true,
        video_id: videoId,
        status: status,
        message: '视频生成任务已提交，预计3-5分钟完成',
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('视频生成请求失败:', error);
    return new Response(
      JSON.stringify({ 
        error: '视频生成请求失败',
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
