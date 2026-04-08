import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { env, requireEnv } from './env.js';
import { pipeOpenAISSE, passThroughSSE } from './sse.js';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: env.corsOrigin === '*' ? '*' : env.corsOrigin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  })
);

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'miaoda-self-hosted-api',
    timestamp: new Date().toISOString(),
  })
);

app.post('/api/trending-lists', async (c) => {
  const { type } = await c.req.json();
  const validTypes = ['2', '3', '4', '6', '7', '8', '9', '10', '14'];

  if (!type || !validTypes.includes(String(type))) {
    return c.json({ error: 'Invalid trending type.' }, 400);
  }

  const response = await fetch(
    `https://api-integrations.appmiaoda.com/app-8sm6r7tdrncx/api-l9nZzWk3E1Z9/v2/tools/trending_lists/medium?type=${type}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Appbuilder-Request-Id': crypto.randomUUID(),
      },
    }
  );

  const data = await response.json();
  return c.json(data);
});

app.post('/api/vertical-trending', async (c) => {
  const { type, mediaType, timeRange } = await c.req.json();
  const response = await fetch(
    'https://api-integrations.appmiaoda.com/app-8sm6r7tdrncx/api-79jKPrD7GGKL/v2/tools/trending_lists/vertical',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appbuilder-Request-Id': crypto.randomUUID(),
      },
      body: JSON.stringify({ type, mediaType, timeRange }),
    }
  );

  const data = await response.json();
  return c.json(data);
});

function parseLikedCount(likedCountStr: string): number {
  if (!likedCountStr) return 0;
  const str = likedCountStr.trim();
  if (str.includes('万')) {
    const num = Number.parseFloat(str.replace('万', ''));
    return Math.floor(num * 10000);
  }
  const num = Number.parseFloat(str);
  return Number.isNaN(num) ? 0 : Math.floor(num);
}

app.post('/api/search-xiaohongshu-notes', async (c) => {
  const {
    keyword,
    number = 30,
    sort = 4,
    noteType = 2,
    publishTime = 3,
  } = await c.req.json();

  if (!keyword) {
    return c.json({ error: 'Missing keyword.' }, 400);
  }

  const cookie = requireEnv('XIAOHONGSHU_COOKIE');
  const apiKey = requireEnv('XIAOHONGSHU_API_KEY');

  const apiUrl = new URL('https://cyanlis.cn/api/plugins/xiaohongshu/search');
  apiUrl.searchParams.set('keyword', keyword);
  apiUrl.searchParams.set('cookie', cookie);
  apiUrl.searchParams.set('apiKey', apiKey);
  apiUrl.searchParams.set('sort', String(sort));
  apiUrl.searchParams.set('noteType', String(noteType));
  apiUrl.searchParams.set('publishTime', String(publishTime));
  apiUrl.searchParams.set('number', String(number));

  const response = await fetch(apiUrl.toString());
  const apiData = await response.json();

  if (apiData.code !== 0 || !apiData.success) {
    return c.json({ error: apiData.msg || 'Search failed.' }, 500);
  }

  const notes = (apiData.data || []).map((item: any) => ({
    note_id: item.note_id,
    title: item.title,
    description: '',
    cover_image: item.cover,
    images: [item.cover],
    like_count: parseLikedCount(item.liked_count),
    comment_count: 0,
    share_count: 0,
    collect_count: 0,
    author_name: item.user?.nickname || '小红书用户',
    author_avatar: item.user?.avatar || '',
    note_url: item.url,
    publish_time: '',
    _original_liked_count: item.liked_count,
  }));

  return c.json({
    status: 0,
    msg: apiData.msg || 'success',
    data: {
      notes,
      total: notes.length,
      is_mock: false,
      usage: apiData.usage,
    },
  });
});

app.post('/api/parse-xiaohongshu-note', async (c) => {
  const { url } = await c.req.json();
  if (!url) {
    return c.json({ error: 'Missing url.' }, 400);
  }

  const apiKey = env.xiaohongshuApiKey || 'cca4a25b-e2bb-4cb7-823a-08af7a6a6ecd';
  const apiUrl = `https://cyanlis.cn/api/plugins/xiaohongshu/detail?url=${encodeURIComponent(url)}&apiKey=${apiKey}`;
  const response = await fetch(apiUrl);
  const apiData = await response.json();

  if (apiData.code !== 0 || !apiData.success) {
    return c.json({ error: apiData.msg || 'Parse failed.' }, 500);
  }

  const noteData = apiData.data;
  const formattedContent = `标题：${noteData.title || '无'}\n\n正文内容：${noteData.desc || '无'}\n\n作者：${noteData.user?.nickname || '未知'}\n\n互动数据：\n- 点赞：${noteData.stats?.liked_count || 0}\n- 收藏：${noteData.stats?.collected_count || 0}\n- 评论：${noteData.stats?.comment_count || 0}\n- 分享：${noteData.stats?.share_count || 0}\n\n笔记类型：${noteData.type === 'video' ? '视频' : '图文'}\n\n图片数量：${noteData.images?.length || 0}`;

  return c.json({
    success: true,
    data: {
      content: formattedContent,
      url,
      noteData,
    },
  });
});

app.get('/api/xhs-auth', async (c) => {
  const appKey = requireEnv('XHS_APP_KEY');
  const appSecret = requireEnv('XHS_APP_SECRET');
  const nonce = crypto.randomUUID().replaceAll('-', '');
  const timestamp = Date.now().toString();

  async function sha256(message: string) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  async function sign(secret: string) {
    const params = { appKey, nonce, timeStamp: timestamp };
    const payload =
      Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key as keyof typeof params]}`)
        .join('&') + secret;
    return sha256(payload);
  }

  const firstSignature = await sign(appSecret);
  const tokenResponse = await fetch('https://edith.xiaohongshu.com/api/sns/v1/ext/access/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_key: appKey,
      nonce,
      timestamp: Number.parseInt(timestamp, 10),
      signature: firstSignature,
    }),
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.success || !tokenData.data?.access_token) {
    return c.json({ success: false, error: tokenData.msg || 'Failed to get XHS access token.' }, 500);
  }

  const finalSignature = await sign(tokenData.data.access_token);
  return c.json({
    success: true,
    data: {
      app_key: appKey,
      nonce,
      timestamp,
      signature: finalSignature,
    },
  });
});

app.post('/api/ai-recreate-content', async (c) => {
  const body = await c.req.json();
  const originalTitle = body.originalTitle as string | undefined;
  const originalContent = body.originalContent as string | undefined;

  if (!originalTitle) {
    return c.json({ error: 'Missing originalTitle.' }, 400);
  }

  const systemPrompt =
    '你是专业的小红书内容创作专家。你的任务是基于原始标题和内容，生成一个更有点击欲望的新标题和一段自然、完整、适合小红书的改写文案。输出格式必须是“标题：xxx\\n\\n文案：xxx”。';

  const userPrompt = originalContent
    ? `请为以下小红书笔记进行二创：\n\n原标题：${originalTitle}\n\n原文案：\n${originalContent}`
    : `请根据以下小红书标题创作一个吸引人的标题和完整文案：\n\n标题：${originalTitle}`;

  const upstream = await fetch(
    'https://api-integrations.appmiaoda.com/app-8sm6r7tdrncx/api-Xa6JZMByJlDa/v2/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        enable_thinking: false,
      }),
    }
  );

  return new Response(await passThroughSSE(upstream), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});

app.post('/api/optimize-xiaohongshu-copy', async (c) => {
  const { originalContent } = await c.req.json();
  if (!originalContent) {
    return c.json({ error: 'Missing originalContent.' }, 400);
  }

  const prompt = `请把下面的小红书文案进行差异化优化，保留核心卖点但换一种表达方式。直接输出：\n【标题】...\n\n【正文】...\n\n【话题标签】...\n\n原文：\n${originalContent}`;
  const upstream = await fetch(
    'https://api-integrations.appmiaoda.com/app-8sm6r7tdrncx/api-Xa6JZMByJlDa/v2/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: '你是专业的小红书内容优化助手，擅长做二创改写和结构化输出。',
          },
          { role: 'user', content: prompt },
        ],
      }),
    }
  );

  const stream = await pipeOpenAISSE(upstream, (parsed) => {
    const content = parsed.choices?.[0]?.delta?.content || '';
    return content ? JSON.stringify({ content }) : null;
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});

app.post('/api/generate-xiaohongshu-copy', async (c) => {
  const { productName, sellingPoints, targetAudience, description } = await c.req.json();
  if (!productName) {
    return c.json({ error: 'Missing productName.' }, 400);
  }

  const userPrompt = `请为以下产品生成一篇小红书文案。\n\n产品名称：${productName}\n${sellingPoints ? `核心卖点：${sellingPoints}` : ''}\n${targetAudience ? `目标用户：${targetAudience}` : ''}\n${description ? `产品描述：${description}` : ''}\n\n输出格式：\n【标题】\n【正文】`;
  const upstream = await fetch(
    'https://api-integrations.appmiaoda.com/app-8sm6r7tdrncx/api-Xa6JZMByJlDa/v2/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: '你是专业的小红书爆款文案专家，擅长写标题和种草正文。',
          },
          { role: 'user', content: userPrompt },
        ],
      }),
    }
  );

  const stream = await pipeOpenAISSE(upstream, (parsed) => {
    const content = parsed.choices?.[0]?.delta?.content || '';
    return content ? JSON.stringify({ content }) : null;
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});

app.post('/api/agent-chat', async (c) => {
  const body = await c.req.json();
  const agentId = body.agentId as string | undefined;
  const message = body.message as string | undefined;
  const history = Array.isArray(body.history) ? body.history : [];
  const enableWebSearch = Boolean(body.enableWebSearch);
  const outputFormat = (body.outputFormat as string | undefined) || 'default';

  if (!agentId || !message) {
    return c.json({ error: 'Missing agentId or message.' }, 400);
  }

  const systemPrompts: Record<string, string> = {
    'ip-copywriter': '你是专业的短视频与社媒文案专家。',
    'brand-story': '你是品牌故事创作顾问。',
    'jack-ma-dream': '你是偏商业梦想与创业思维风格的顾问。',
    'buffett-value': '你是偏价值分析与长期主义风格的顾问。',
    'ding-ning-product': '你是产品策略与迭代顾问。',
    'can-ge-strategy': '你是商业策略与增长顾问。',
    'jin-qiang-copywriter': '你是营销文案顾问。',
    'musk-strategy': '你是第一性原理与创新战略顾问。',
  };

  const baseSystemPrompt = systemPrompts[agentId];
  if (!baseSystemPrompt) {
    return c.json({ error: `Unknown agentId: ${agentId}` }, 404);
  }

  let formatInstruction = '';
  if (outputFormat === 'table') {
    formatInstruction = '\n请以 Markdown 表格输出。';
  } else if (outputFormat === 'mindmap') {
    formatInstruction = '\n请以 Mermaid mindmap 输出。';
  }

  let searchContext = '';
  if (enableWebSearch && env.integrationsApiKey) {
    const searchResponse = await fetch(
      'https://app-8sm6r7tdrncx-api-DYJwo27V8Qya-gateway.appmiaoda.com/v2/ai_search/search',
      {
        method: 'POST',
        headers: {
          'X-Gateway-Authorization': `Bearer ${env.integrationsApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          top_k: 5,
        }),
      }
    );

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const results = Array.isArray(searchData.results) ? searchData.results.slice(0, 3) : [];
      if (results.length > 0) {
        searchContext =
          '\n\n【联网搜索结果】\n' +
          results
            .map(
              (result: any, index: number) =>
                `[${index + 1}] ${result.title || '无标题'}\n${result.snippet || result.content || ''}\n来源: ${result.url || '未知'}`
            )
            .join('\n\n');
      }
    }
  }

  const upstream = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('ARK_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'doubao-seed-1-8-251228',
      messages: [
        {
          role: 'system',
          content: `${baseSystemPrompt}${formatInstruction}${searchContext}`,
        },
        ...history,
        { role: 'user', content: message },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  const stream = await pipeOpenAISSE(upstream, (parsed) => JSON.stringify(parsed));
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: error.message || 'Internal server error' }, 500);
});

export default {
  port: env.port,
  fetch: app.fetch,
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = env.port;
  serve({
    fetch: app.fetch,
    port,
  });
  console.log(`Self-hosted API listening on http://0.0.0.0:${port}`);
}
