import { buildApiUrl, getJson } from '@/lib/apiBase';
import type { Product } from '@/types';

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

export interface AuthResult {
  success: boolean;
  userId?: string;
  username?: string;
  displayName?: string;
  message?: string;
}

export interface UserProfile {
  id: string;
  phone: string | null;
  email: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  sort_order: number;
}

export interface CreditOrderDetail {
  id: string;
  order_no: string;
  user_id: string;
  package_id: string;
  credits: number;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  wechat_pay_url: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
  credit_packages: {
    name: string;
    credits: number;
    price: number;
  };
}

export interface CreditUsageRecord {
  id: string;
  user_id: string;
  credits: number;
  usage_type: 'video_generation' | 'image_factory';
  description: string | null;
  created_at: string;
}

export interface UsageSummary {
  image_factory_remaining: number;
  image_factory_limit: number;
  ecommerce_video_remaining: number;
  ecommerce_video_limit: number;
  credits_balance: number;
}

export interface UserStatisticsSummary {
  productCount: number;
  creationCount: number;
  analysisCount: number;
  imageFactoryCount: number;
  videoGenerationCount: number;
}

function getStoredUserId() {
  try {
    const raw = localStorage.getItem('user_info');
    return raw ? (JSON.parse(raw).userId as string | undefined) : undefined;
  } catch {
    return undefined;
  }
}

async function uploadFile(path: string, file: File, ownerId?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  if (ownerId) {
    formData.append('ownerId', ownerId);
  }

  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as { error?: string; publicUrl?: string };
  if (!response.ok || !data.publicUrl) {
    throw new Error(data.error || 'Upload failed');
  }

  return data.publicUrl;
}

export async function registerWithAccount(
  username: string,
  password: string,
  displayName?: string,
): Promise<AuthResult> {
  return postJson('/auth/register', {
    username,
    password,
    displayName,
  });
}

export async function loginWithAccount(username: string, password: string): Promise<AuthResult> {
  return postJson('/auth/login', {
    username,
    password,
  });
}

export async function getProfileByUserId(userId: string): Promise<UserProfile> {
  return getJson(`/profiles/${userId}`);
}

export async function getUserCredits(userId?: string): Promise<number> {
  const resolvedUserId = userId || getStoredUserId();
  if (!resolvedUserId) {
    return 0;
  }

  const data = await getJson<{ balance: number }>(`/credits/balance?userId=${encodeURIComponent(resolvedUserId)}`);
  return data.balance || 0;
}

export async function getCreditPackages(): Promise<CreditPackage[]> {
  return getJson('/credits/packages');
}

export async function createCreditOrder(packageId: string): Promise<{ orderNo: string; payUrl: string }> {
  const userId = getStoredUserId();
  if (!userId) {
    throw new Error('Missing user id.');
  }

  return postJson('/credits/orders', {
    userId,
    packageId,
  });
}

export async function getCreditOrder(orderNo: string): Promise<CreditOrderDetail | null> {
  try {
    return await getJson(`/credits/orders/${orderNo}`);
  } catch {
    return null;
  }
}

export async function getUserCreditUsage(limit = 50): Promise<CreditUsageRecord[]> {
  const userId = getStoredUserId();
  if (!userId) {
    return [];
  }

  return getJson(`/credits/history?userId=${encodeURIComponent(userId)}&limit=${limit}`);
}

export async function getUserStatistics(userId?: string): Promise<UserStatisticsSummary> {
  const resolvedUserId = userId || getStoredUserId();
  if (!resolvedUserId) {
    return {
      productCount: 0,
      creationCount: 0,
      analysisCount: 0,
      imageFactoryCount: 0,
      videoGenerationCount: 0,
    };
  }

  return getJson(`/statistics/${resolvedUserId}`);
}

export async function checkAndConsumeUsage(userId: string, feature: 'image_factory' | 'ecommerce_video') {
  return postJson<{
    success: boolean;
    message: string;
    remaining_free: number;
    credits_balance: number;
    consumed_type: string;
  }>('/usage/check-and-consume', {
    userId,
    feature,
  });
}

export async function getUserUsage(userId: string): Promise<UsageSummary | null> {
  try {
    return await getJson(`/usage/${userId}`);
  } catch {
    return null;
  }
}

export async function getUserProducts(userId: string): Promise<Product[]> {
  return getJson(`/products?userId=${encodeURIComponent(userId)}`);
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  return postJson('/products', product);
}

export async function updateProduct(
  productId: string,
  userId: string,
  updates: Partial<Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<Product> {
  const response = await fetch(buildApiUrl(`/products/${productId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      ...updates,
    }),
  });

  const data = (await response.json()) as Product & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export async function deleteProduct(productId: string, userId: string): Promise<boolean> {
  const response = await fetch(buildApiUrl(`/products/${productId}?userId=${encodeURIComponent(userId)}`), {
    method: 'DELETE',
  });

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || 'Delete failed');
  }

  return true;
}

export async function uploadProductImage(file: File, ownerId?: string) {
  return uploadFile('/uploads/product-image', file, ownerId);
}

export async function uploadContentImage(file: File, ownerId?: string) {
  return uploadFile('/uploads/content-image', file, ownerId);
}

export async function uploadSharedImage(file: File, ownerId?: string) {
  return uploadFile('/uploads/shared-image', file, ownerId);
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

export async function generateImageWithDashscope(prompt: string, size: string = '1024*1024'): Promise<string> {
  const data = await postJson<{ success: boolean; image_url?: string; error?: string }>('/generate-image-dashscope', {
    prompt,
    size,
  });

  if (!data.success || !data.image_url) {
    throw new Error(data.error || 'Image generation failed');
  }

  return data.image_url;
}

export async function generateImageFactoryContent(
  theme: string,
  itemCount: number,
  contentStyle: 'science' | 'recommend' | 'cute'
): Promise<{ subTitle: string; content: string }[]> {
  const data = await postJson<{
    success: boolean;
    content_list?: { subTitle: string; content: string }[];
    error?: string;
  }>('/generate-image-factory-content', {
    theme,
    itemCount,
    contentStyle,
  });

  if (!data.success || !data.content_list) {
    throw new Error(data.error || 'Content generation failed');
  }

  return data.content_list;
}

export async function generateImagePrompt(theme: string, subTitle: string, content: string): Promise<string> {
  const data = await postJson<{ success: boolean; prompt?: string; error?: string }>('/generate-image-prompt', {
    theme,
    subTitle,
    content,
  });

  if (!data.success || !data.prompt) {
    throw new Error(data.error || 'Prompt generation failed');
  }

  return data.prompt;
}

export async function generateImageFactoryCaption(theme: string): Promise<string> {
  const data = await postJson<{ success: boolean; caption?: string; error?: string }>('/generate-image-factory-caption', {
    theme,
  });

  if (!data.success || !data.caption) {
    throw new Error(data.error || 'Caption generation failed');
  }

  return data.caption;
}

export async function generateSoraVideo(prompt: string, duration: 10 | 15): Promise<{
  video_id: string;
  status: string;
  message: string;
}> {
  const data = await postJson<{
    success: boolean;
    video_id?: string;
    status?: string;
    message?: string;
    error?: string;
  }>('/generate-sora-video', {
    prompt,
    duration,
  });

  if (!data.success || !data.video_id) {
    throw new Error(data.error || 'Video generation request failed');
  }

  return {
    video_id: data.video_id,
    status: data.status || 'submitted',
    message: data.message || '',
  };
}

export async function querySoraVideo(videoId: string): Promise<{
  video_id: string;
  status: string;
  progress: number;
  video_url: string | null;
  message: string;
}> {
  const data = await getJson<{
    success: boolean;
    video_id?: string;
    status?: string;
    progress?: number;
    video_url?: string | null;
    message?: string;
  }>(`/query-sora-video?video_id=${encodeURIComponent(videoId)}`);

  if (!data.success || !data.video_id) {
    throw new Error('Video status query failed');
  }

  return {
    video_id: data.video_id,
    status: data.status || 'submitted',
    progress: data.progress || 0,
    video_url: data.video_url || null,
    message: data.message || '',
  };
}
