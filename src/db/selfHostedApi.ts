import { buildApiUrl } from '@/lib/apiBase';

async function postJson<T = any>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }
  return data;
}

export async function getTrendingLists(type: string): Promise<any> {
  return postJson('/trending-lists', { type });
}

export async function getVerticalTrending(type: string, mediaType: string, timeRange: number): Promise<any> {
  return postJson('/vertical-trending', { type, mediaType, timeRange });
}

export async function searchXiaohongshuNotes(
  keyword: string,
  number = 30,
  sort = 4,
  noteType = 2,
  publishTime = 3
): Promise<any> {
  return postJson('/search-xiaohongshu-notes', {
    keyword,
    number,
    sort,
    noteType,
    publishTime,
  });
}

export async function parseXiaohongshuNote(url: string): Promise<any> {
  return postJson('/parse-xiaohongshu-note', { url });
}

export async function optimizeXiaohongshuCopy(
  originalContent: string,
  onData?: (data: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void,
  signal?: AbortSignal
) {
  const { sendStreamRequest } = await import('@/utils/stream');
  await sendStreamRequest({
    functionUrl: buildApiUrl('/optimize-xiaohongshu-copy'),
    requestBody: { originalContent },
    onData: onData || (() => {}),
    onComplete: onComplete || (() => {}),
    onError: onError || (() => {}),
    signal,
  });
}

export async function agentChat(
  message: string,
  agentId: string,
  history: Array<{ role: string; content: string }>,
  onData?: (data: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void,
  signal?: AbortSignal
) {
  const { sendStreamRequest } = await import('@/utils/stream');
  await sendStreamRequest({
    functionUrl: buildApiUrl('/agent-chat'),
    requestBody: { message, agentId, history },
    onData: onData || (() => {}),
    onComplete: onComplete || (() => {}),
    onError: onError || (() => {}),
    signal,
  });
}

export async function generateXiaohongshuCopy(productData: {
  productName: string;
  sellingPoints: string[];
  category?: string;
  targetAudience?: string;
  description?: string;
}) {
  const { sendStreamRequest } = await import('@/utils/stream');

  let responseText = '';
  await sendStreamRequest({
    functionUrl: buildApiUrl('/generate-xiaohongshu-copy'),
    requestBody: productData,
    onData: (chunk) => {
      try {
        const parsed = JSON.parse(chunk);
        responseText += parsed.content || '';
      } catch {
        // Ignore malformed chunks.
      }
    },
    onComplete: () => {},
    onError: (error) => {
      throw error;
    },
  });

  return responseText;
}
