const SORA2_API_KEY = Deno.env.get('SORA_API_KEY') || '';
const SORA2_BASE_URL = 'https://api.apiyi.com/v1/videos';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function getAuthorizationHeader(apiKey: string) {
  return apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'submitted':
      return 'Submitted';
    case 'queued':
      return 'Queued';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown status';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders() });
  }

  try {
    if (!SORA2_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'SORA_API_KEY is not configured' }), {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const videoId = url.searchParams.get('video_id');

    if (!videoId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing video_id parameter' }), {
        status: 400,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(`${SORA2_BASE_URL}/${videoId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: getAuthorizationHeader(SORA2_API_KEY),
      },
    });

    const responseText = await response.text();
    console.log('query sora api response', response.status, responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Query failed',
          status: response.status,
          message: responseText,
        }),
        {
          status: response.status,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    const result = JSON.parse(responseText);

    return new Response(
      JSON.stringify({
        success: true,
        video_id: videoId,
        status: result.status,
        progress: result.progress || 0,
        video_url: result.url || result.video_url || null,
        message: getStatusMessage(result.status),
      }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('query sora video failed', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Query failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
});
