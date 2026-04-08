const SORA2_API_KEY = Deno.env.get('SORA_API_KEY') || '';
const SORA2_BASE_URL = 'https://api.apiyi.com/v1/videos';

interface GenerateVideoRequest {
  prompt: string;
  duration: 10 | 15;
}

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function getAuthorizationHeader(apiKey: string) {
  return apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
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

    const { prompt, duration = 10 }: GenerateVideoRequest = await req.json();

    if (!prompt || !prompt.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Prompt is required' }), {
        status: 400,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    if (duration !== 10 && duration !== 15) {
      return new Response(JSON.stringify({ success: false, error: 'Duration must be 10 or 15 seconds' }), {
        status: 400,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    console.log('submit sora video', { prompt: prompt.slice(0, 100), duration });

    const response = await fetch(SORA2_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: getAuthorizationHeader(SORA2_API_KEY),
      },
      body: JSON.stringify({
        model: 'sora-2',
        prompt,
        size: '720x1280',
        seconds: duration.toString(),
      }),
    });

    const responseText = await response.text();
    console.log('sora api response status', response.status);
    console.log('sora api response text', responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SORA2 API request failed',
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
        video_id: result.id,
        status: result.status,
        message: 'Video generation submitted. Expected completion in 3-5 minutes.',
      }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('generate sora video failed', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Video generation request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
});
