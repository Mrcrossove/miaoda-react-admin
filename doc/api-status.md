# 前后端接口对接状态

## 概述

本文档记录前后端接口对接的最终状态。

---

## 1. Edge Functions 状态（共 19 个）

### ✅ 已对接并使用（17 个）

| Edge Function | 前端调用位置 | 状态 |
|--------------|-------------|------|
| `agent-chat` | AgentChatPage.tsx (通过 api.ts) | ✅ 正常 |
| `create_credit_order` | api.ts | ✅ 正常 |
| `generate-image-dashscope` | api.ts | ✅ 正常 |
| `generate-image-factory-caption` | api.ts | ✅ 正常 |
| `generate-image-factory-content` | api.ts | ✅ 正常 |
| `generate-image-prompt` | api.ts | ✅ 正常 |
| `generate-sora-video` | api.ts | ✅ 正常 |
| `generate-xiaohongshu-content` | api.ts | ✅ 正常 |
| `generate-xiaohongshu-copy` | MyProductPage.tsx (通过 api.ts) | ✅ 正常 |
| `optimize-xiaohongshu-copy` | ContentCreationPage.tsx (通过 api.ts) | ✅ 正常 |
| `parse-xiaohongshu-note` | api.ts | ✅ 正常 |
| `query-sora-video` | api.ts | ✅ 正常 |
| `search-xiaohongshu-notes` | api.ts | ✅ 正常 |
| `trending-lists` | api.ts | ✅ 正常 |
| `vertical-trending` | api.ts | ✅ 正常 |
| `wechat_payment_webhook` | Webhook（微信回调） | ✅ 正常 |
| `ai-recreate-content` | 未使用 | ⚠️ 待删除 |

### ❌ 已删除（2 个）

| Edge Function | 删除原因 | 删除日期 |
|--------------|---------|---------|
| `coze-workflow` | 功能未使用 | 2026-03-20 |
| `generate-xiaohongshu-content-dashscope` | 与 `generate-xiaohongshu-content` 功能重复 | 2026-03-20 |

---

## 2. 数据库 RPC 函数（15 个）

全部正常对接：

- `verify_user_login` - 用户登录
- `create_user_account` - 用户注册
- `get_user_credits` - 获取灵感值
- `consume_user_credits` - 消费灵感值
- `check_and_consume_usage` - 检查并消费使用次数
- `get_user_usage` - 获取使用情况
- `get_user_statistics` - 获取用户统计
- `recharge_credits` - 充值灵感值
- `get_credit_transactions` - 获取交易记录
- `get_image_factory_usage_today` - 获取图片工厂今日使用次数
- `record_image_factory_usage` - 记录图片工厂使用次数
- `check_and_consume_image_factory_credits` - 检查并消费图片工厂灵感值
- `get_video_generation_usage_today` - 获取电商视频今日使用次数
- `record_video_generation_usage` - 记录电商视频使用次数
- `check_video_generation_usage` - 检查电商视频使用次数

---

## 3. 前端 API 统一管理

所有 Edge Function 调用已统一至 `src/db/api.ts`：

### 新增 API 函数

```typescript
// AI 智能体对话
agentChat(message, agentId, history, onData, onComplete, onError, signal)

// 生成小红书文案
generateXiaohongshuCopy(productData)

// 优化小红书文案
optimizeXiaohongshuCopy(originalContent, onData, onComplete, onError, signal)
```

### 调用规范

**之前**（直接在页面中调用）：
```typescript
await sendStreamRequest({
  functionUrl: `${supabaseUrl}/functions/v1/agent-chat`,
  ...
});
```

**现在**（通过 api.ts 统一调用）：
```typescript
await agentChat(message, agentId, history, onData, onComplete, onError, signal);
```

---

## 4. 待处理项目

### 建议删除
- `supabase/functions/ai-recreate-content/` - 功能未使用

---

*最后更新：2026-03-20*