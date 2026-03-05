// SORA2视频生成 - 查询状态
// API文档：https://docs.apiyi.com/api-capabilities/sora-2-video-async

const SORA2_API_KEY = 'sk-sO7D8MoXDNAhWHejAcAcEeB4BfD1436bA78aDb864cB8C11e';
const SORA2_BASE_URL = 'https://api.apiyi.com/v1/videos';

Deno.serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // 从URL参数获取video_id
    const url = new URL(req.url);
    const videoId = url.searchParams.get('video_id');

    // 验证参数
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: '缺少video_id参数' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('查询SORA2视频状态:', videoId);

    // 调用SORA2 API查询状态
    const response = await fetch(`${SORA2_BASE_URL}/${videoId}`, {
      method: 'GET',
      headers: {
        'Authorization': SORA2_API_KEY,
      },
    });

    const responseText = await response.text();
    console.log('SORA2 API响应状态:', response.status);
    console.log('SORA2 API响应内容:', responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'SORA2 API查询失败',
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
    const status = result.status; // submitted, in_progress, completed, failed
    const progress = result.progress || 0;
    const videoUrl = result.url || null;

    console.log('视频状态查询结果:', { videoId, status, progress, videoUrl });

    return new Response(
      JSON.stringify({
        success: true,
        video_id: videoId,
        status: status,
        progress: progress,
        video_url: videoUrl,
        message: getStatusMessage(status),
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('视频状态查询失败:', error);
    return new Response(
      JSON.stringify({ 
        error: '视频状态查询失败',
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

// 获取状态对应的中文提示
function getStatusMessage(status: string): string {
  switch (status) {
    case 'submitted':
      return '任务已提交，等待处理';
    case 'in_progress':
      return '视频生成中，请耐心等待';
    case 'completed':
      return '视频生成完成';
    case 'failed':
      return '视频生成失败';
    default:
      return '未知状态';
  }
}
