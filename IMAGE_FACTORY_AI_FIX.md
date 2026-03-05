# 图片工厂AI文案生成修复说明

## 🎯 问题描述

图片工厂的最后一步"排版导出"中，AI文案生成功能失败，无法根据用户输入的主题生成符合小红书爆款逻辑的文案和标题。

---

## ✅ 解决方案

### 1. 更新Edge Function

**文件**: `supabase/functions/generate-image-factory-caption/index.ts`

**主要修改**:

#### 修改1：API更新

**旧代码**:
```typescript
const apiUrl = 'https://api-integrations.appmiaoda.com/app-8sm6r7tdrncx/api-Xa6JZMByJlDa/v2/chat/completions';

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [...]
  }),
});
```

**新代码**:
```typescript
const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');
const apiUrl = 'https://app-8sm6r7tdrncx-api-zYkZz8qovQ1L-gateway.appmiaoda.com/v2/chat/completions';

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'X-Gateway-Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [...]
  }),
});
```

**说明**:
- ✅ 使用正确的文心大模型API网关地址
- ✅ 添加认证头 `X-Gateway-Authorization`
- ✅ 使用环境变量 `INTEGRATIONS_API_KEY`

---

#### 修改2：提示词优化（与"我有产品"逻辑一致）

**旧提示词**:
```typescript
const systemPrompt = `你是一位专业的小红书内容创作专家，擅长撰写简短有力、吸引眼球的文案。`;

const userPrompt = `请为主题"${theme}"生成一条小红书简短文案。

要求：
1. 文案不超过50字
2. 风格活泼、有感染力
3. 适当使用emoji增强表现力
4. 可以包含1-2个相关话题标签
5. 直接输出文案内容，不要其他说明`;
```

**新提示词**:
```typescript
const systemPrompt = `你是一位专业的小红书内容创作专家，擅长撰写爆款标题和吸引人的正文。你的文案风格口语化、亲切、有感染力，善于使用感叹词、数字、悬念等技巧吸引读者。`;

const userPrompt = `请为主题"${theme}"生成小红书爆款文案：

请按以下格式输出：

【标题】
（生成1个抓人眼球的小红书爆款标题，使用感叹词、数字、emoji等元素，控制在20字以内）

【正文】
（生成完整的小红书正文，包含：
1. 开场引入，制造共鸣或痛点
2. 突出主题核心内容和解决的实际问题
3. 分享真实的体验或感受
4. 结尾添加2-3个相关话题标签
正文控制在200-300字，使用emoji增强表现力）`;
```

**说明**:
- ✅ 与"我有产品"功能使用相同的提示词逻辑
- ✅ 生成完整的标题和正文（不再限制50字）
- ✅ 明确输出格式：【标题】+【正文】
- ✅ 标题要求：20字以内，使用emoji和感叹词
- ✅ 正文要求：200-300字，包含开场、核心内容、体验、话题标签

---

#### 修改3：响应方式改进

**旧代码（非流式）**:
```typescript
const data = await response.json();
const content = data.choices?.[0]?.message?.content || '';

return new Response(
  JSON.stringify({ content: finalContent }),
  { 
    status: 200, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  }
);
```

**新代码（流式）**:
```typescript
// 创建流式响应
const stream = new ReadableStream({
  async start(controller) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      controller.close();
      return;
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
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
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              if (content) {
                // 发送SSE格式的数据
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
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

return new Response(stream, {
  headers: {
    ...corsHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

**说明**:
- ✅ 改为流式响应（SSE格式）
- ✅ 支持实时显示生成内容
- ✅ 更好的用户体验
- ✅ 与"我有产品"功能保持一致

---

## 📊 功能对比

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| API地址 | 旧的集成API | 新的文心大模型网关API |
| 认证方式 | 无认证头 | X-Gateway-Authorization |
| 提示词 | 简短文案（50字） | 爆款标题+完整正文（200-300字） |
| 输出格式 | 单一文案 | 【标题】+【正文】 |
| 响应方式 | 非流式 | 流式（SSE） |
| 用户体验 | 等待完整响应 | 实时显示生成内容 |

---

## 🚀 使用方式

### 前端调用示例

```typescript
import { sendStreamRequest } from '@/utils/stream';

// 调用图片工厂文案生成
await sendStreamRequest({
  functionUrl: `${supabaseUrl}/functions/v1/generate-image-factory-caption`,
  requestBody: {
    theme: '用户输入的主题'  // 例如：'职场高效复盘'
  },
  supabaseAnonKey,
  onData: (data) => {
    try {
      const parsed = JSON.parse(data);
      const chunk = parsed.content || '';
      // 累积显示内容
      setContent(prev => prev + chunk);
    } catch (e) {
      console.warn('解析失败:', e);
    }
  },
  onComplete: () => {
    console.log('文案生成完成');
  },
  onError: (error) => {
    console.error('生成失败:', error);
    toast.error('文案生成失败，请重试');
  }
});
```

---

## 🎯 生成示例

### 输入
```
主题：职场高效复盘
```

### 输出

**【标题】**
```
✨ 职场人必看！3个高效复盘技巧，让你快速成长💪
```

**【正文】**
```
姐妹们！今天分享我用了3年的职场复盘方法🔥

还记得刚入职时，每天忙得团团转，却总感觉没什么进步😭 后来学会了这套复盘法，工作效率直接翻倍！

核心就3步：
1️⃣ 每天花10分钟记录今日亮点和不足
2️⃣ 每周总结一次，找出可优化的地方
3️⃣ 每月复盘，调整下月目标

坚持下来真的会发现自己在不断进步！现在我已经从小白成长为团队骨干啦💪

强烈推荐给所有想要快速成长的职场人！

#职场复盘 #高效工作 #职场成长
```

---

## ✅ 验证清单

- [x] API地址更新为正确的文心大模型网关
- [x] 添加认证头 X-Gateway-Authorization
- [x] 提示词与"我有产品"逻辑一致
- [x] 生成完整的标题和正文
- [x] 改为流式响应（SSE格式）
- [x] 错误处理完善
- [x] Edge Function重新部署
- [x] Lint验证通过

---

## 📚 相关文档

- 文心大模型API文档：见API说明
- 流式请求使用指南：见前端工具函数
- "我有产品"文案生成：`generate-xiaohongshu-copy`

---

## 🔧 故障排查

### 问题1：API请求失败

**症状**：返回401或403错误

**解决方案**：
1. 检查环境变量 `INTEGRATIONS_API_KEY` 是否正确设置
2. 确认API地址是否正确
3. 检查认证头格式：`Bearer ${apiKey}`

---

### 问题2：生成内容为空

**症状**：流式响应正常，但没有内容输出

**解决方案**：
1. 检查提示词是否正确
2. 查看Edge Function日志
3. 确认API返回格式是否符合预期

---

### 问题3：前端无法接收流式数据

**症状**：onData回调不触发

**解决方案**：
1. 确认使用了正确的流式请求工具函数
2. 检查SSE解析器是否正确配置
3. 查看浏览器Network面板，确认响应类型为 `text/event-stream`

---

## ✨ 总结

**修复完成！** 图片工厂AI文案生成功能已恢复正常，现在可以：

- ✅ 根据用户输入的主题生成小红书爆款文案
- ✅ 生成吸睛的标题和完整的正文
- ✅ 符合小红书社区调性
- ✅ 使用流式响应，实时显示生成内容
- ✅ 与"我有产品"功能保持一致的提示词逻辑

---

**文档创建时间**：2026-01-08  
**总提交数**：189  
**最新提交**：042349e (fix: 修复图片工厂AI文案生成功能)
