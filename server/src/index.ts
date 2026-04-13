import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { getProfileByUserId, loginAccount, registerAccount } from './auth-store.js';
import {
  checkAndConsumeFeatureUsage,
  createOrder,
  getCreditPackagesList,
  getCreditsBalance,
  getCreditUsageHistory,
  getOrderDetail,
  getUsageSummary,
  getUserStatisticsSummary,
} from './billing-store.js';
import { env, requireEnv } from './env.js';
import {
  createProductRecord,
  deleteProductRecord,
  listProductsByUserId,
  updateProductRecord,
} from './product-store.js';
import { pipeOpenAISSE, passThroughSSE } from './sse.js';
import { readUpload, saveUpload } from './upload-store.js';

const app = new Hono();
const DASHSCOPE_TEXT_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const DASHSCOPE_IMAGE_API_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const SORA_API_BASE_URL = 'https://api.apiyi.com/v1/videos';

function getAuthorizationHeader(apiKey: string) {
  return apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.error || text || `Upstream request failed with ${response.status}`;
    throw new Error(message);
  }

  if (data?.code) {
    throw new Error(`${data.code}: ${data.message || 'Upstream service error'}`);
  }

  return data;
}

async function requestDashscopeText(prompt: string) {
  const response = await fetch(DASHSCOPE_TEXT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireEnv('DASHSCOPE_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      input: {
        messages: [{ role: 'user', content: prompt }],
      },
      parameters: {
        result_format: 'message',
      },
    }),
  });

  const data = await parseJsonResponse(response);
  const content = data?.output?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('DashScope returned empty content.');
  }

  return content;
}

function extractJsonArray(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match =
      text.match(/```json\s*([\s\S]*?)\s*```/i) ||
      text.match(/```\s*([\s\S]*?)\s*```/i) ||
      text.match(/\[[\s\S]*\]/);

    if (!match) {
      throw new Error('Unable to extract JSON array from model output.');
    }

    const jsonText = match[1] || match[0];
    return JSON.parse(jsonText);
  }
}

function getSoraStatusMessage(status: string) {
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

app.get('/uploads/*', async (c) => {
  const relativePath = c.req.path.replace(/^\/uploads\//, '');
  const file = await readUpload(relativePath);

  if (!file) {
    return c.json({ error: 'Upload not found.' }, 404);
  }

  return new Response(file.body, {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

app.post('/api/auth/register', async (c) => {
  const body = await c.req.json();
  const username = typeof body.username === 'string' ? body.username : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const displayName = typeof body.displayName === 'string' ? body.displayName : undefined;

  if (!username || !password) {
    return c.json({ success: false, message: 'Missing username or password.' }, 400);
  }

  const result = await registerAccount(username, password, displayName);
  if (!result.success) {
    return c.json(result, 400);
  }

  return c.json(result);
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json();
  const username = typeof body.username === 'string' ? body.username : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    return c.json({ success: false, message: 'Missing username or password.' }, 400);
  }

  const result = await loginAccount(username, password);
  if (!result.success) {
    return c.json(result, 401);
  }

  return c.json(result);
});

app.get('/api/profiles/:userId', async (c) => {
  const userId = c.req.param('userId');
  const profile = await getProfileByUserId(userId);

  if (!profile) {
    return c.json({ error: 'Profile not found.' }, 404);
  }

  return c.json(profile);
});

app.get('/api/products', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) {
    return c.json({ error: 'Missing userId.' }, 400);
  }

  const products = await listProductsByUserId(userId);
  return c.json(products);
});

app.get('/api/credits/packages', async (c) => {
  const packages = await getCreditPackagesList();
  return c.json(packages);
});

app.get('/api/credits/balance', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) {
    return c.json({ error: 'Missing userId.' }, 400);
  }

  const balance = await getCreditsBalance(userId);
  return c.json({ balance });
});

app.post('/api/credits/orders', async (c) => {
  const body = await c.req.json();
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const packageId = typeof body.packageId === 'string' ? body.packageId : '';

  if (!userId || !packageId) {
    return c.json({ error: 'Missing userId or packageId.' }, 400);
  }

  const result = await createOrder(userId, packageId);
  return c.json(result);
});

app.get('/api/credits/orders/:orderNo', async (c) => {
  const order = await getOrderDetail(c.req.param('orderNo'));
  if (!order) {
    return c.json({ error: 'Order not found.' }, 404);
  }

  return c.json(order);
});

app.get('/api/credits/history', async (c) => {
  const userId = c.req.query('userId');
  const limit = Number.parseInt(c.req.query('limit') || '50', 10);
  if (!userId) {
    return c.json({ error: 'Missing userId.' }, 400);
  }

  const usage = await getCreditUsageHistory(userId, limit);
  return c.json(usage);
});

app.post('/api/usage/check-and-consume', async (c) => {
  const body = await c.req.json();
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const feature = body.feature as 'image_factory' | 'ecommerce_video';

  if (!userId || (feature !== 'image_factory' && feature !== 'ecommerce_video')) {
    return c.json({ error: 'Invalid userId or feature.' }, 400);
  }

  const result = await checkAndConsumeFeatureUsage(userId, feature);
  return c.json(result);
});

app.get('/api/usage/:userId', async (c) => {
  const summary = await getUsageSummary(c.req.param('userId'));
  return c.json(summary);
});

app.get('/api/statistics/:userId', async (c) => {
  const stats = await getUserStatisticsSummary(c.req.param('userId'));
  return c.json(stats);
});

app.post('/api/products', async (c) => {
  const body = await c.req.json();
  const userId = typeof body.user_id === 'string' ? body.user_id : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';

  if (!userId || !name) {
    return c.json({ error: 'Missing user_id or name.' }, 400);
  }

  const product = await createProductRecord({
    user_id: userId,
    name,
    description: typeof body.description === 'string' ? body.description : null,
    selling_points: typeof body.selling_points === 'string' ? body.selling_points : null,
    target_audience: typeof body.target_audience === 'string' ? body.target_audience : null,
    image_urls: Array.isArray(body.image_urls) ? body.image_urls.filter((item: unknown) => typeof item === 'string') : [],
    platform: typeof body.platform === 'string' ? body.platform : '',
  });

  return c.json(product);
});

app.patch('/api/products/:productId', async (c) => {
  const productId = c.req.param('productId');
  const body = await c.req.json();
  const userId = typeof body.user_id === 'string' ? body.user_id : '';

  if (!productId || !userId) {
    return c.json({ error: 'Missing productId or user_id.' }, 400);
  }

  const product = await updateProductRecord(productId, userId, {
    name: typeof body.name === 'string' ? body.name.trim() : undefined,
    description: typeof body.description === 'string' ? body.description : undefined,
    selling_points: typeof body.selling_points === 'string' ? body.selling_points : undefined,
    target_audience: typeof body.target_audience === 'string' ? body.target_audience : undefined,
    image_urls: Array.isArray(body.image_urls) ? body.image_urls.filter((item: unknown) => typeof item === 'string') : undefined,
    platform: typeof body.platform === 'string' ? body.platform : undefined,
  });

  if (!product) {
    return c.json({ error: 'Product not found.' }, 404);
  }

  return c.json(product);
});

app.delete('/api/products/:productId', async (c) => {
  const productId = c.req.param('productId');
  const userId = c.req.query('userId');

  if (!productId || !userId) {
    return c.json({ error: 'Missing productId or userId.' }, 400);
  }

  const deleted = await deleteProductRecord(productId, userId);
  if (!deleted) {
    return c.json({ error: 'Product not found.' }, 404);
  }

  return c.json({ success: true });
});

app.post('/api/uploads/:category', async (c) => {
  const category = c.req.param('category');
  const body = await c.req.parseBody();
  const file = body.file;
  const ownerId = typeof body.ownerId === 'string' ? body.ownerId : undefined;

  if (!(file instanceof File)) {
    return c.json({ error: 'Missing file.' }, 400);
  }

  const upload = await saveUpload(file, category, ownerId);
  const origin = new URL(c.req.url).origin;

  return c.json({
    path: upload.relativePath,
    publicUrl: `${origin}${upload.publicPath}`,
  });
});

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

app.post('/api/generate-image-dashscope', async (c) => {
  const body = await c.req.json();
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const size = typeof body.size === 'string' ? body.size : '1024*1024';

  if (!prompt) {
    return c.json({ success: false, error: 'Prompt is required.' }, 400);
  }

  if (!/^\d+\*\d+$/.test(size)) {
    return c.json({ success: false, error: 'Invalid size format.' }, 400);
  }

  const response = await fetch(DASHSCOPE_IMAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireEnv('DASHSCOPE_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'z-image-turbo',
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: prompt.slice(0, 800) }],
          },
        ],
      },
      parameters: {
        prompt_extend: false,
        size,
      },
    }),
  });

  const data = await parseJsonResponse(response);
  const imageUrl = data?.output?.choices?.[0]?.message?.content?.[0]?.image;

  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('DashScope did not return an image URL.');
  }

  return c.json({
    success: true,
    image_url: imageUrl,
    message: 'Image generated successfully.',
  });
});

app.post('/api/generate-image-factory-content', async (c) => {
  const body = await c.req.json();
  const theme = typeof body.theme === 'string' ? body.theme.trim() : '';
  const itemCount = Number(body.itemCount);
  const contentStyle = typeof body.contentStyle === 'string' ? body.contentStyle : 'science';

  if (!theme) {
    return c.json({ success: false, error: 'Theme is required.' }, 400);
  }

  if (!Number.isInteger(itemCount) || itemCount < 3 || itemCount > 8) {
    return c.json({ success: false, error: 'itemCount must be between 3 and 8.' }, 400);
  }

  const stylePrompts: Record<string, string> = {
    science: 'Professional and educational. Accurate wording, clear explanations, useful takeaways.',
    recommend: 'Recommendation style. Warm, persuasive, lively, easy to read.',
    cute: 'Cute and playful. Friendly tone, light mood, social-post friendly.',
  };

  const prompt = `You are writing Xiaohongshu image-carousel copy.
Generate ${itemCount} items for the topic "${theme}".
Style: ${stylePrompts[contentStyle] || stylePrompts.science}

Rules:
1. Each item must have "subTitle" and "content".
2. subTitle should be concise and punchy, around 5-10 Chinese characters.
3. content should be under 50 Chinese characters.
4. Return JSON only. No markdown fences.

Example:
[
  {"subTitle":"小标题1","content":"对应文案1"},
  {"subTitle":"小标题2","content":"对应文案2"}
]`;

  const text = await requestDashscopeText(prompt);
  const contentList = extractJsonArray(text);

  if (!Array.isArray(contentList)) {
    throw new Error('Invalid content list returned from model.');
  }

  const normalized = contentList.slice(0, itemCount).map((item: any) => ({
    subTitle: String(item?.subTitle || item?.sub_title || '').trim(),
    content: String(item?.content || '').trim().slice(0, 50),
  }));

  if (normalized.some((item) => !item.subTitle || !item.content)) {
    throw new Error('Generated content items are incomplete.');
  }

  return c.json({
    success: true,
    content_list: normalized,
    message: 'Content generated successfully.',
  });
});

app.post('/api/generate-image-prompt', async (c) => {
  const body = await c.req.json();
  const theme = typeof body.theme === 'string' ? body.theme.trim() : '';
  const subTitle = typeof body.subTitle === 'string' ? body.subTitle.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!theme || !subTitle) {
    return c.json({ success: false, error: 'Theme and subTitle are required.' }, 400);
  }

  const prompt = `Write one concise Chinese image prompt for a Xiaohongshu-style cover image.
Topic: ${theme}
Sub-title: ${subTitle}
Caption: ${content}

Requirements:
1. Describe subject, scene, composition, lighting, mood, and color palette.
2. Fit Xiaohongshu aesthetics: clean, textured, attractive, natural.
3. Output plain text only, around 50-150 Chinese characters.`;

  const generatedPrompt = (await requestDashscopeText(prompt)).trim().replace(/^["']|["']$/g, '');

  return c.json({
    success: true,
    prompt: generatedPrompt,
    message: 'Prompt generated successfully.',
  });
});

app.post('/api/generate-image-factory-caption', async (c) => {
  const body = await c.req.json();
  const theme = typeof body.theme === 'string' ? body.theme.trim() : '';

  if (!theme) {
    return c.json({ success: false, error: 'Theme is required.' }, 400);
  }

  const prompt = `You are a Xiaohongshu copywriter.
Create one catchy post title and one short body for the topic "${theme}".

Requirements:
1. Conversational and engaging.
2. Include 2-3 related hashtags at the end.
3. Total length suitable for a short social caption.
4. Output plain text only. Do not use markdown fences.`;

  const caption = (await requestDashscopeText(prompt)).trim();
  return c.json({
    success: true,
    caption,
    message: 'Caption generated successfully.',
  });
});

app.post('/api/generate-sora-video', async (c) => {
  const body = await c.req.json();
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const duration = body.duration === 15 ? 15 : 10;

  if (!prompt) {
    return c.json({ success: false, error: 'Prompt is required.' }, 400);
  }

  const response = await fetch(SORA_API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: getAuthorizationHeader(requireEnv('SORA_API_KEY')),
    },
    body: JSON.stringify({
      model: 'sora-2',
      prompt,
      size: '720x1280',
      seconds: duration.toString(),
    }),
  });

  const data = await parseJsonResponse(response);
  return c.json({
    success: true,
    video_id: data?.id,
    status: data?.status || 'submitted',
    message: 'Video generation submitted. Expected completion in 3-5 minutes.',
  });
});

app.get('/api/query-sora-video', async (c) => {
  const videoId = c.req.query('video_id');
  if (!videoId) {
    return c.json({ success: false, error: 'Missing video_id parameter.' }, 400);
  }

  const response = await fetch(`${SORA_API_BASE_URL}/${videoId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: getAuthorizationHeader(requireEnv('SORA_API_KEY')),
    },
  });

  const data = await parseJsonResponse(response);
  return c.json({
    success: true,
    video_id: videoId,
    status: data?.status || 'submitted',
    progress: Number(data?.progress || 0),
    video_url: data?.url || data?.video_url || null,
    message: getSoraStatusMessage(data?.status || 'submitted'),
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
