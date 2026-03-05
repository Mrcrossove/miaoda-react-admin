/**
 * 小红书JS SDK鉴权Edge Function
 * 严格逻辑：
 * 1. 一次请求内，生成一组 nonce 和 timestamp。
 * 2. 第一次加签：使用 appKey, nonce, timeStamp + appSecret 计算 signature。
 *    发送请求：app_key, nonce, timestamp, signature。
 * 3. 第二次加签：使用 appKey, nonce, timeStamp + access_token 计算 signature。
 *    返回前端：app_key, nonce, timestamp, signature。
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 小红书开放平台配置
const XHS_APP_KEY = 'red.YUpzUmGVT5EPQGrN';
const XHS_APP_SECRET = 'a2fe1f2e0a05aaf6016f8073d8cd7989';
const XHS_TOKEN_API = 'https://edith.xiaohongshu.com/api/sns/v1/ext/access/token';

// 缓存access_token
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * 生成随机字符串（nonce）
 */
function generateNonce(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * SHA-256加密
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 核心签名生成逻辑
 * @param secretKey 密钥
 * @param params 参与签名的参数对象（Key 必须严格对应文档要求：appKey, nonce, timeStamp）
 */
async function generateSignature(secretKey: string, params: Record<string, string>): Promise<string> {
  // 1. 按key的字典序排序
  const sortedKeys = Object.keys(params).sort();
  
  // 2. 拼接成 key=value&key=value 格式 (原始值，不URL转义)
  const paramString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 3. 末尾追加密钥 (string1 + secret)
  const stringToSign = paramString + secretKey;
  
  // 调试日志
  console.log('🔑 待签名字符串 (Params + Secret):', stringToSign);

  // 4. SHA-256加密
  const signature = await sha256(stringToSign);
  return signature;
}

/**
 * 获取 access_token（第一次加签）
 */
async function getAccessToken(nonce: string, timestamp: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    console.log('✅ 使用缓存的access_token');
    return cachedToken.token;
  }

  console.log('🔄 获取新的access_token...');

  // 第一次加签：使用 appKey, nonce, timeStamp + appSecret
  // 注意：这里使用 appKey (驼峰)，不是 app_key
  const signParams = {
    appKey: XHS_APP_KEY,
    nonce: nonce,
    timeStamp: timestamp, // 字符串形式的时间戳
  };

  const signature = await generateSignature(XHS_APP_SECRET, signParams);

  // 发送 HTTP POST 请求
  // 注意：Body 字段名使用 app_key, nonce, timestamp (下划线)
  const response = await fetch(XHS_TOKEN_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_key: XHS_APP_KEY,
      nonce: nonce,
      timestamp: parseInt(timestamp, 10), // API文档要求 int64，这里传数字
      signature: signature,
    }),
  });

  const responseText = await response.text();
  console.log('📥 Token API 原始响应:', responseText);

  if (!response.ok) {
    throw new Error(`获取access_token失败: ${response.status} ${responseText}`);
  }

  const data = JSON.parse(responseText);
  
  // 检查业务成功状态
  if (!data.success) {
     throw new Error(`API返回错误: ${data.msg} (code: ${data.code})`);
  }

  const accessToken = data.data?.access_token;
  const expiresInSec = data.data?.expires_in || 7200;

  if (!accessToken) {
    throw new Error(`响应中没有access_token`);
  }

  const expiresAt = Date.now() + expiresInSec * 1000;
  cachedToken = { token: accessToken, expiresAt };

  console.log('✅ 成功获取access_token');
  return accessToken;
}

/**
 * 生成JS SDK签名（第二次加签）
 * 一次调用，两次加签，共用 nonce 和 timestamp
 */
async function generateJSSignature(): Promise<{
  app_key: string;
  nonce: string;
  timestamp: string;
  signature: string;
}> {
  console.log('🔐 开始生成JS SDK签名（一次调用，两次加签）...');

  // 1. 生成唯一的 nonce 和 timestamp
  const nonce = generateNonce();
  const timestamp = Date.now().toString(); // 毫秒级时间戳字符串

  console.log('本次请求使用的 Nonce/Time:', { nonce, timestamp });

  // 2. 第一次加签：获取 access_token
  const accessToken = await getAccessToken(nonce, timestamp);

  // 3. 第二次加签：使用 access_token 生成前端需要的 signature
  // 参与签名的字段依然是：appKey, nonce, timeStamp
  const signParams = {
    appKey: XHS_APP_KEY,
    nonce: nonce,
    timeStamp: timestamp,
  };

  // 密钥使用 access_token
  const signature = await generateSignature(accessToken, signParams);

  console.log('✅ JS SDK签名生成完成');

  // 4. 返回给前端
  return {
    app_key: XHS_APP_KEY,
    nonce: nonce,
    timestamp: timestamp,
    signature: signature,
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 收到鉴权请求');
    const verifyConfig = await generateJSSignature();
    
    return new Response(JSON.stringify({
      success: true,
      data: verifyConfig,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ 鉴权失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
