// 智能体对话 Edge Function - 豆包大模型版本
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 百度搜索API配置
const BAIDU_SEARCH_API_URL = 'https://app-8sm6r7tdrncx-api-DYJwo27V8Qya-gateway.appmiaoda.com/v2/ai_search/search';

// 豆包API配置
const DOUBAO_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_MODEL = 'doubao-seed-1-8-251228';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { agentId, messages, enableWebSearch, outputFormat } = requestBody;

    console.log('=== 智能体对话 - 开始 ===');
    console.log('智能体ID:', agentId);
    console.log('消息数量:', messages?.length);
    console.log('启用联网搜索:', enableWebSearch);
    console.log('输出格式:', outputFormat);

    if (!agentId || !messages || !Array.isArray(messages)) {
      const error = '缺少必要参数：agentId 或 messages';
      console.error('参数验证失败:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取API Keys
    const arkApiKey = Deno.env.get('ARK_API_KEY');
    const integrationsApiKey = Deno.env.get('INTEGRATIONS_API_KEY');
    
    if (!arkApiKey) {
      const error = '未配置豆包API Key (ARK_API_KEY)';
      console.error('配置错误:', error);
      return new Response(
        JSON.stringify({ error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 智能体配置（使用简短版本，实际提示词在前端配置中）
    const agentConfigs: Record<string, { name: string; systemPrompt: string }> = {
      'ip-copywriter': {
        name: '人设ip文案精灵',
        systemPrompt: '你是一位专业的短视频文案创作专家，擅长创作爆款文案。',
      },
      'brand-story': {
        name: '品牌故事',
        systemPrompt: '你是一位品牌故事创作大师，擅长讲述动人的品牌故事。',
      },
      'jack-ma-dream': {
        name: '马云梦想引擎',
        systemPrompt: '你是马云梦想引擎，以梦想驱动、商业洞察和团队哲学为核心的商业导师。',
      },
      'buffett-value': {
        name: '巴菲特价值引擎',
        systemPrompt: '你是巴菲特价值引擎，秉持价值投资理念的智慧导师。',
      },
      'ding-ning-product': {
        name: '丁宁产品顾问',
        systemPrompt: '你是丁宁产品顾问，经验丰富的产品设计与优化专家。',
      },
      'can-ge-strategy': {
        name: '参哥智策',
        systemPrompt: '你是参哥智策，擅长运用犀利语言剖析职场、商业问题的智能体。',
      },
      'jin-qiang-copywriter': {
        name: '金枪大叔文案顾问',
        systemPrompt: '你是金枪大叔，营销界的"毒舌外科医生"，擅长创作犀利的营销文案。',
      },
      'musk-strategy': {
        name: '马斯克战略顾问',
        systemPrompt: '你是马斯克战略顾问，擅长运用第一性原理和颠覆性创新思维。',
      },
    };

    const agentConfig = agentConfigs[agentId];
    if (!agentConfig) {
      const error = `未找到智能体配置: ${agentId}`;
      console.error(error);
      return new Response(
        JSON.stringify({ error }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 根据输出格式添加格式化指令
    let formatInstruction = '';
    if (outputFormat === 'table') {
      formatInstruction = '\n\n请以Markdown表格格式输出结果，使用清晰的表头和行列结构。';
    } else if (outputFormat === 'mindmap') {
      formatInstruction = '\n\n请以Mermaid思维导图格式输出结果，使用mindmap语法，展示清晰的层级结构。示例：\n```mermaid\nmindmap\n  root((主题))\n    分支1\n      子节点1\n      子节点2\n    分支2\n      子节点3\n```';
    }

    // 构建系统提示词
    let systemPrompt = agentConfig.systemPrompt + formatInstruction;

    console.log('调用豆包API...');

    // 获取用户最后一条消息作为查询
    const userQuery = messages[messages.length - 1]?.content || '';
    let searchContext = '';

    // 如果启用联网搜索，先调用百度搜索API
    if (enableWebSearch && integrationsApiKey) {
      console.log('=== 步骤1: 调用百度搜索API ===');
      console.log('搜索查询:', userQuery);
      
      try {
        const searchResponse = await fetch(BAIDU_SEARCH_API_URL, {
          method: 'POST',
          headers: {
            'X-Gateway-Authorization': `Bearer ${integrationsApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userQuery,
            top_k: 5, // 获取前5条搜索结果
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log('=== 步骤2: 百度搜索结果 ===');
          console.log('搜索结果数量:', searchData?.results?.length || 0);

          // 清洗和筛选搜索结果
          if (searchData?.results && Array.isArray(searchData.results)) {
            console.log('=== 步骤3: 清洗/筛选搜索结果 ===');
            const cleanedResults = searchData.results
              .slice(0, 3) // 只取前3条
              .map((result: any, index: number) => {
                return `[${index + 1}] ${result.title || '无标题'}\n${result.snippet || result.content || '无内容'}\n来源: ${result.url || '未知'}`;
              })
              .join('\n\n');

            searchContext = `\n\n【联网搜索结果】\n${cleanedResults}\n\n请基于以上搜索结果回答用户问题。`;
            console.log('搜索上下文已构建，长度:', searchContext.length);
          }
        } else {
          console.warn('百度搜索API调用失败:', searchResponse.status);
        }
      } catch (searchError) {
        console.error('百度搜索失败:', searchError);
        // 搜索失败不影响后续流程，继续使用豆包API
      }
    }

    // 构造增强型Prompt
    console.log('=== 步骤4: 构造增强型Prompt ===');
    const enhancedSystemPrompt = systemPrompt + searchContext;
    console.log('增强Prompt长度:', enhancedSystemPrompt.length);

    // 调用豆包API生成结构化回答
    console.log('=== 步骤5: 调用豆包API生成结构化回答 ===');
    
    const doubaoResponse = await fetch(`${DOUBAO_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${arkApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages: [
          {
            role: 'system',
            content: enhancedSystemPrompt,
          },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!doubaoResponse.ok) {
      const errorText = await doubaoResponse.text();
      console.error('豆包API请求失败:', doubaoResponse.status, errorText);
      throw new Error(`豆包API请求失败: ${doubaoResponse.status}`);
    }

    // 创建流式响应
    console.log('=== 步骤6: 格式化输出（流式） ===');
    const stream = new ReadableStream({
      async start(controller) {
        const reader = doubaoResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('=== 步骤7: 返回给用户 ===');
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  // 发送SSE格式的数据
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(parsed)}\n\n`));
                } catch (e) {
                  console.error('解析JSON失败:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('流式处理错误:', error);
          controller.error(error);
        }
      },
    });

    console.log('=== 智能体对话 - 开始流式输出 ===');

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('智能体对话失败:', error);
    return new Response(
      JSON.stringify({
        error: error.message || '智能体对话失败',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
