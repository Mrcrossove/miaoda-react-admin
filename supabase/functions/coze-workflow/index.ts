// Coze工作流调用 Edge Function
import { SignJWT, importPKCS8 } from 'https://deno.land/x/jose@v5.2.0/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Coze API配置
const COZE_API_BASE = 'https://api.coze.cn';
const COZE_TOKEN_URL = `${COZE_API_BASE}/api/permission/oauth2/token`;
const COZE_WORKFLOW_URL = `${COZE_API_BASE}/v1/workflow/stream_run`;

// 内存缓存Access Token
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { workflowId, parameters, userId } = requestBody;

    console.log('=== Coze工作流调用 - 开始 ===');
    console.log('工作流ID:', workflowId);
    console.log('参数:', parameters);
    console.log('用户ID:', userId);

    if (!workflowId || !parameters) {
      const error = '缺少必要参数：workflowId 或 parameters';
      console.error('参数验证失败:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取配置
    const clientId = Deno.env.get('COZE_CLIENT_ID');
    const privateKey = Deno.env.get('COZE_PRIVATE_KEY');
    const kid = Deno.env.get('COZE_KID');

    if (!clientId || !privateKey || !kid) {
      const error = '未配置Coze应用凭证（需要CLIENT_ID、PRIVATE_KEY、KID）';
      console.error('配置错误:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取Access Token（使用缓存）
    let accessToken = cachedAccessToken;
    const now = Math.floor(Date.now() / 1000);

    if (!accessToken || now >= tokenExpiresAt) {
      console.log('=== 步骤1: 生成JWT Token ===');
      
      // 生成JWT（按照Python示例的方式）
      const iat = now;
      const exp = iat + 600; // 10分钟后过期（与Python示例一致）
      const jti = crypto.randomUUID();

      console.log('JWT Payload:', { iat, exp, jti, aud: 'api.coze.cn', iss: clientId });

      // 导入私钥
      const privateKeyPem = privateKey.replace(/\\n/g, '\n');
      const cryptoKey = await importPKCS8(privateKeyPem, 'RS256');

      // 创建JWT（与Python示例保持一致）
      const jwt = await new SignJWT({})
        .setProtectedHeader({ 
          alg: 'RS256', 
          typ: 'JWT',
          kid: kid, // 公钥指纹
        })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .setJti(jti)
        .setAudience('api.coze.cn')
        .setIssuer(clientId)
        .sign(cryptoKey);

      console.log('JWT生成成功');
      console.log('JWT Token:', jwt.substring(0, 50) + '...');

      // 步骤2: 获取Access Token
      console.log('=== 步骤2: 获取Access Token ===');
      console.log('Token URL:', COZE_TOKEN_URL);
      
      const tokenRequestBody = {
        duration_seconds: 86400, // 24小时
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      };
      
      console.log('Token请求Body:', JSON.stringify(tokenRequestBody, null, 2));
      console.log('JWT Token (前50字符):', jwt.substring(0, 50));
      
      // 根据Python示例，JWT放在Authorization Header中
      const tokenResponse = await fetch(COZE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`, // JWT放在Header中
        },
        body: JSON.stringify(tokenRequestBody),
      });

      console.log('Token响应状态:', tokenResponse.status);
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('获取Access Token失败:', tokenResponse.status, errorText);
        throw new Error(`获取Access Token失败: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Token响应数据:', JSON.stringify(tokenData, null, 2));
      
      accessToken = tokenData.access_token;
      
      if (!accessToken) {
        throw new Error('Token响应中没有access_token字段');
      }
      
      // 缓存Token（提前5分钟过期）
      cachedAccessToken = accessToken;
      tokenExpiresAt = now + 86400 - 300;
      
      console.log('Access Token获取成功，已缓存');
    } else {
      console.log('使用缓存的Access Token');
    }

    // 步骤3: 调用工作流API
    console.log('=== 步骤3: 调用工作流API ===');
    console.log('Workflow URL:', COZE_WORKFLOW_URL);
    
    const workflowRequestBody = {
      workflow_id: workflowId,
      parameters,
      // 使用用户ID实现会话隔离
      ...(userId && { ext: { user_id: userId } }),
    };
    
    console.log('Workflow请求Body:', JSON.stringify(workflowRequestBody, null, 2));
    
    const workflowResponse = await fetch(COZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(workflowRequestBody),
    });

    console.log('Workflow响应状态:', workflowResponse.status);

    if (!workflowResponse.ok) {
      const errorText = await workflowResponse.text();
      console.error('工作流API调用失败:', workflowResponse.status, errorText);
      throw new Error(`工作流API调用失败: ${workflowResponse.status} - ${errorText}`);
    }

    // 步骤4: 流式返回结果
    console.log('=== 步骤4: 流式返回结果 ===');
    const stream = new ReadableStream({
      async start(controller) {
        const reader = workflowResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('=== 工作流执行完成 ===');
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            // 直接转发SSE数据
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (error) {
          console.error('流式处理错误:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Coze工作流调用失败:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Coze工作流调用失败',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
