# AI智能二创功能说明

## 功能概述

在"帮我选品"页面的发布模态框中，新增AI智能二创功能。用户点击"AI智能二创"按钮后，系统自动调用文心大模型API，**仅根据笔记标题**生成小红书爆款标题和200字以内的吸引人文案，实时显示生成过程，自动填充到编辑框，用户可继续手动编辑优化后一键发布到小红书。

## 核心特性

### 🎯 降低使用门槛
- **只需标题**：不再要求笔记必须有文案描述
- **适用范围广**：所有有标题的笔记都可以进行AI二创
- **智能创作**：AI根据标题充分发挥创意，生成吸引人的内容

### ✨ 优化生成内容
- **爆款标题**：最多20字，使用emoji、感叹词、悬念、数字、热点话题
- **简洁文案**：最多200字（从1000字优化为200字），更适合小红书
- **结构清晰**：开场引入 → 核心卖点 → 使用体验/推荐理由
- **趣味性强**：适当使用emoji增加趣味性

## 核心功能

### 1. AI智能二创按钮

**位置**：发布模态框顶部，编辑框上方

**样式**：
- 紫色边框outline样式
- 魔法图标（Wand2）
- 悬浮缩放效果
- 粗体字体

**状态**：
- **默认状态**：显示"AI智能二创"文字和魔法图标
- **生成中状态**：显示"AI创作中..."文字和旋转加载图标
- **禁用状态**：生成过程中禁用按钮，防止重复点击

### 2. 流式生成过程

**特点**：
- 实时显示AI生成过程
- 逐字显示标题和文案
- 自动解析并填充到编辑框
- 支持中断生成

**用户体验**：
- 点击按钮后立即清空编辑框
- 实时看到AI生成的内容
- 生成完成后显示成功提示
- 可继续手动编辑优化

### 3. AI生成规则

**标题要求**：
- 最多20字
- 使用emoji、感叹词、悬念、数字、热点话题等元素
- 抓人眼球，引发点击欲望
- 符合小红书爆款标题特征

**文案要求**：
- **最多200字**（优化后的长度，更适合小红书）
- 口语化、亲切、有感染力
- 符合小红书社区调性
- 结构清晰：
  1. 开场引入（制造共鸣或痛点）
  2. 核心卖点（突出产品优势）
  3. 使用体验/推荐理由（分享真实感受）
- 适当使用emoji增加趣味性

**生成模式**：
- **仅标题模式**（推荐）：只需要笔记标题，AI充分发挥创意生成内容
- **标题+文案模式**：如果笔记有文案描述，AI会参考原文案进行二创

## 技术实现

### 1. Edge Function

**文件位置**：`supabase/functions/ai-recreate-content/index.ts`

**功能**：
- 接收笔记标题（必需）
- 接收笔记文案（可选）
- 调用文心大模型API生成新内容
- 流式返回生成结果
- 完整的错误处理和CORS支持

**API调用**：
```typescript
const apiUrl = 'https://app-8sm6r7tdrncx-api-zYkZz8qovQ1L-gateway.appmiaoda.com/v2/chat/completions';

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Gateway-Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    enable_thinking: false
  }),
});
```

**提示词设计**：
```typescript
const systemPrompt = `你是一位专业的小红书内容创作专家，擅长创作爆款笔记。你的任务是：
1. 根据原笔记标题，创作一个全新的、更吸引人的小红书爆款标题和文案
2. 标题要求：
   - 最多20字
   - 使用emoji、感叹词、悬念、数字、热点话题等元素
   - 抓人眼球，引发点击欲望
   - 符合小红书爆款标题特征
3. 文案要求：
   - 最多200字
   - 口语化、亲切、有感染力
   - 符合小红书社区调性
   - 结构清晰：开场引入 → 核心卖点 → 使用体验/推荐理由
   - 适当使用emoji增加趣味性
4. 输出格式：
   标题：[新标题]
   
   文案：
   [新文案内容]`;

const userPrompt = originalContent 
  ? `请为以下小红书笔记进行二创：

原标题：${originalTitle}

原文案：
${originalContent}

请生成一个全新的、更吸引人的标题和200字以内的文案。`
  : `请根据以下小红书笔记标题，创作一个爆款标题和200字以内的吸引人的文案：

笔记标题：${originalTitle}

请充分发挥创意，生成吸引人的标题和文案。`;
```

### 2. 流式请求工具

**文件位置**：`src/utils/streamRequest.ts`

**核心函数**：

#### createSSEHook
创建SSE Hook用于处理流式响应：
```typescript
export const createSSEHook = (options: SSEOptions): AfterResponseHook => {
  // 创建SSE解析器
  const parser: EventSourceParser = createParser({
    onEvent: (event) => {
      if (event.data) {
        options.onEvent?.(event);
        const dataArray: string[] = event.data.split('\n');
        for (const data of dataArray) {
          if (data.trim()) {
            options.onData(data);
          }
        }
      }
    }
  });
  
  // 递归读取流数据
  const read = (): void => {
    reader.read().then((result) => {
      if (result.done) {
        innerOnCompleted();
        return;
      }
      parser.feed(decoder.decode(result.value, { stream: true }));
      read();
    });
  };
  
  read();
  return response;
};
```

#### sendStreamRequest
发送流式请求到Supabase Edge Function：
```typescript
export const sendStreamRequest = async (options: StreamRequestOptions): Promise<void> => {
  const sseHook = createSSEHook({
    onData,
    onCompleted: (error?: Error) => {
      if (error) {
        onError(error);
      } else {
        onComplete();
      }
    },
    onAborted: () => {
      console.log('请求已中断');
    }
  });

  await ky.post(functionUrl, {
    json: requestBody,
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json'
    },
    signal,
    hooks: {
      afterResponse: [sseHook]
    }
  });
};
```

### 3. 前端集成

**文件位置**：`src/pages/ProductSelectionPage.tsx`

**状态管理**：
```typescript
// AI二创状态
const [isAIGenerating, setIsAIGenerating] = useState(false);
const abortControllerRef = useRef<AbortController | null>(null);
```

**核心函数**：
```typescript
const handleAIRecreate = async () => {
  if (!publishNote) return;

  // 检查标题是否存在
  if (!publishNote.title) {
    toast.error('笔记标题不存在，无法进行AI二创');
    return;
  }

  // ... 初始化逻辑

  await sendStreamRequest({
    functionUrl: `${supabaseUrl}/functions/v1/ai-recreate-content`,
    requestBody: {
      originalTitle: publishNote.title,
      originalContent: publishNote.description || undefined // 可选参数
    },
    supabaseAnonKey,
    onData: (data) => {
      try {
        const parsed = JSON.parse(data);
        const chunk = parsed.choices?.[0]?.delta?.content || '';
        if (chunk) {
          fullContent += chunk;
          
          // 解析标题和文案
          const titleMatch = fullContent.match(/标题[：:]\s*(.+?)(?=\n|$)/);
          const contentMatch = fullContent.match(/文案[：:]\s*([\s\S]+)/);
          
          if (titleMatch) {
            setEditedTitle(titleMatch[1].trim().slice(0, 20));
          }
          
          if (contentMatch) {
            setEditedContent(contentMatch[1].trim().slice(0, 200)); // 限制200字
          }
        }
      } catch (e) {
        console.warn('解析数据失败:', e, data);
      }
    },
    onComplete: () => {
      setIsAIGenerating(false);
      toast.success('AI二创完成！');
    },
    onError: (error) => {
      console.error('AI二创失败:', error);
      setIsAIGenerating(false);
      toast.error('AI二创失败，请重试');
    },
    signal: abortControllerRef.current.signal
  });
};
```

**智能解析**：
- 使用正则表达式匹配"标题："和"文案："
- 自动提取标题和文案内容
- 限制标题最多20字，文案最多200字
- 实时更新到编辑框

**组件卸载清理**：
```typescript
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);
```

## 使用流程

### 完整操作流程

1. **打开发布模态框**
   - 在"帮我选品"页面点击笔记卡片的"一键发布"按钮
   - 或在图片预览模态框中点击"一键发布"

2. **查看原内容**
   - 模态框显示原笔记的封面图
   - 编辑框默认填充原标题和原文案（如果有）

3. **点击AI二创**
   - 点击"AI智能二创"按钮
   - 编辑框立即清空
   - 按钮显示"AI创作中..."和旋转图标
   - **无需原文案**：只要有标题就可以进行AI二创

4. **实时生成**
   - 标题逐字显示在标题输入框（最多20字）
   - 文案逐字显示在文案输入框（最多200字）
   - 可以看到AI的创作过程

5. **生成完成**
   - 显示"AI二创完成！"提示
   - 按钮恢复为"AI智能二创"
   - 可以继续手动编辑优化

6. **发布到小红书**
   - 点击"一键发布"按钮
   - 文案自动复制到剪贴板
   - 打开小红书创作平台
   - 粘贴文案并上传图片即可发布

## 依赖包

### ky
**版本**：^1.2.3

**用途**：现代化的HTTP客户端，支持流式响应和hooks

**安装**：
```bash
pnpm add ky@^1.2.3
```

**特点**：
- 支持流式响应
- 支持hooks（afterResponse）
- 支持AbortController
- 更好的错误处理

### eventsource-parser
**版本**：^3.0.3

**用途**：SSE (Server-Sent Events) 事件解析器

**安装**：
```bash
pnpm add eventsource-parser@^3.0.3
```

**特点**：
- 解析SSE事件流
- 支持不完整数据解析
- 轻量级，无依赖

## 安全性

### API密钥管理

**存储位置**：Edge Function环境变量

**获取方式**：
```typescript
const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');
```

**注入机制**：
- 系统自动注入到Edge Function环境
- 不需要手动配置
- 不暴露给客户端

### CORS配置

**预检请求处理**：
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

**响应头配置**：
```typescript
return new Response(stream, {
  headers: {
    ...corsHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

### 请求验证

**参数验证**：
```typescript
if (!originalTitle || !originalContent) {
  return new Response(
    JSON.stringify({ error: '缺少必要参数：originalTitle 和 originalContent' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**API密钥验证**：
```typescript
if (!apiKey) {
  return new Response(
    JSON.stringify({ error: 'API密钥未配置' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

## 错误处理

### Edge Function错误

**API调用失败**：
```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error('API调用失败:', errorText);
  return new Response(
    JSON.stringify({ error: `API调用失败: ${response.status}` }),
    { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**流式处理错误**：
```typescript
try {
  while (true) {
    const { done, value } = await reader.read();
    // ...
  }
} catch (error) {
  console.error('流式处理错误:', error);
  controller.error(error);
}
```

### 前端错误

**请求失败**：
```typescript
onError: (error) => {
  console.error('AI二创失败:', error);
  setIsAIGenerating(false);
  toast.error('AI二创失败，请重试');
}
```

**解析失败**：
```typescript
try {
  const parsed = JSON.parse(data);
  // ...
} catch (e) {
  console.warn('解析数据失败:', e);
}
```

**请求中断**：
```typescript
if (abortControllerRef.current) {
  abortControllerRef.current.abort();
}
```

## 性能优化

### 流式响应

**优势**：
- 实时显示生成过程
- 减少用户等待时间
- 提升用户体验
- 降低服务器压力

**实现**：
- 使用ReadableStream
- 逐块传输数据
- 客户端逐块解析

### 请求中断

**场景**：
- 用户关闭模态框
- 用户再次点击AI二创
- 组件卸载

**实现**：
```typescript
// 创建AbortController
abortControllerRef.current = new AbortController();

// 传递signal
signal: abortControllerRef.current.signal

// 中断请求
abortControllerRef.current.abort();
```

### 智能解析

**正则匹配**：
```typescript
const titleMatch = fullContent.match(/标题[：:]\s*(.+?)(?=\n|$)/);
const contentMatch = fullContent.match(/文案[：:]\s*([\s\S]+)/);
```

**优势**：
- 实时解析，无需等待完整响应
- 自动提取标题和文案
- 支持中英文冒号
- 自动截断超长内容

## 注意事项

### 使用限制

1. **API调用限制**：
   - 受文心大模型API限流限制
   - RPM（每分钟请求数）限制
   - TPM（每分钟token数）限制

2. **内容长度限制**：
   - 标题最多20字
   - 文案最多200字（优化后的长度）
   - 超出部分自动截断

3. **生成质量**：
   - AI生成内容仅供参考
   - 建议手动编辑优化
   - 确保符合平台规范

### 最佳实践

1. **选择有意义的标题**：
   - 选择标题清晰、有吸引力的笔记
   - 标题越具体，AI生成的内容越精准
   - 避免标题过于简短或模糊

2. **手动优化**：
   - AI生成后继续编辑
   - 添加个人风格和真实体验
   - 优化语言表达
   - 添加相关话题标签

3. **多次尝试**：
   - 如果不满意可再次点击AI二创
   - 每次生成的内容可能不同
   - 选择最满意的版本

4. **文案长度控制**：
   - 200字文案更适合小红书
   - 简洁有力，突出重点
   - 避免冗长啰嗦

## 更新日志

### v2.0.0 (2026-02-01)

- ✅ **重大优化**：支持仅使用标题进行AI二创
- ✅ 修改参数验证，originalContent改为可选
- ✅ 优化提示词，支持两种生成模式
- ✅ 文案长度从1000字优化为200字
- ✅ 添加emoji使用要求
- ✅ 优化文案结构
- ✅ 降低使用门槛，提高功能可用性

### v1.0.0 (2026-02-01)

- ✅ 创建Edge Function调用文心大模型API
- ✅ 实现流式响应处理
- ✅ 添加AI二创按钮
- ✅ 实现智能解析和自动填充
- ✅ 添加加载状态和错误处理
- ✅ 支持请求中断
- ✅ 完整的安全性和错误处理

## 相关文件

- `supabase/functions/ai-recreate-content/index.ts` - Edge Function
- `src/utils/streamRequest.ts` - 流式请求工具
- `src/pages/ProductSelectionPage.tsx` - 前端页面
- `PRODUCT_SELECTION_FEATURE.md` - 帮我选品功能说明

## 反馈与建议

如有任何问题或建议，请联系开发团队。
