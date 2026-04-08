# 前后端接口对接检查报告

## 概述

本文档分析了前端 `src/db/api.ts` 与后端 Supabase Edge Functions 的对接情况，找出未对接或存在问题的接口。

---

## 1. 后端 Edge Functions 对接状态

| Edge Function | 前端是否有调用 | 状态 | 说明 |
|--------------|---------------|------|------|
| `agent-chat` | ✅ 是 | 正常 | AgentChatPage.tsx 直接调用 |
| `ai-recreate-content` | ❌ 否 | **未使用** | api.ts 中无定义 |
| `cleanup-expired-products` | ❌ 否 | 正常 | 定时任务，无需前端调用 |
| `coze-workflow` | ❌ 否 | **未使用** | api.ts 中无定义 |
| `create_credit_order` | ✅ 是 | 正常 | - |
| `generate-image-dashscope` | ✅ 是 | 正常 | - |
| `generate-image-factory-caption` | ✅ 是 | 正常 | - |
| `generate-image-factory-content` | ✅ 是 | 正常 | - |
| `generate-image-prompt` | ✅ 是 | 正常 | - |
| `generate-sora-video` | ✅ 是 | 正常 | - |
| `generate-xiaohongshu-content` | ✅ 是 | 正常 | - |
| `generate-xiaohongshu-content-dashscope` | ❌ 否 | **未使用** | api.ts 中无定义 |
| `generate-xiaohongshu-copy` | ✅ 是 | 正常 | MyProductPage.tsx 调用 |
| `optimize-xiaohongshu-copy` | ✅ 是 | 正常 | ContentCreationPage.tsx 调用 |
| `parse-xiaohongshu-note` | ✅ 是 | 正常 | - |
| `query-sora-video` | ✅ 是 | 正常 | - |
| `search-xiaohongshu-notes` | ✅ 是 | 正常 | - |
| `trending-lists` | ✅ 是 | 正常 | - |
| `vertical-trending` | ✅ 是 | 正常 | - |
| `wechat_payment_webhook` | ❌ 否 | 正常 | Webhook，由微信服务器回调 |
| `xhs-auth` | ❌ 否 | **未使用** | api.ts 中无定义 |

---

## 2. 存在问题的接口

### 2.1 后端存在但前端未使用的 Edge Functions

#### `ai-recreate-content`
- **文件位置**: `supabase/functions/ai-recreate-content/index.ts`
- **功能**: AI 二创内容生成
- **问题**: 前端 `api.ts` 中无此函数定义
- **建议**: 
  - 如果功能需要，在 `api.ts` 中添加调用函数
  - 如果功能废弃，删除后端 Edge Function

#### `coze-workflow`
- **文件位置**: `supabase/functions/coze-workflow/index.ts`
- **功能**: Coze AI 工作流调用
- **问题**: 前端未调用
- **环境变量**: 需要 `COZE_API_TOKEN`
- **建议**: 如果功能需要，在前端添加调用；否则删除后端函数

#### `generate-xiaohongshu-content-dashscope`
- **文件位置**: `supabase/functions/generate-xiaohongshu-content-dashscope/index.ts`
- **功能**: 使用通义千问生成小红书内容
- **问题**: 前端未调用
- **环境变量**: 需要 `DASHSCOPE_API_KEY`
- **建议**: 与 `generate-xiaohongshu-content` 功能重复，建议保留其中一个

#### `xhs-auth`
- **文件位置**: `supabase/functions/xhs-auth/index.ts`
- **功能**: 小红书认证
- **问题**: 前端未调用
- **建议**: 确认是否需要此功能，如需要则在前端添加调用

---

### 2.2 前端调用方式问题

#### `agent-chat` 调用方式
**问题**: AgentChatPage.tsx 直接调用 Edge Function，未通过 `api.ts` 统一管理

```typescript
// 当前代码位置: src/pages/AgentChatPage.tsx:119
functionUrl: `${supabaseUrl}/functions/v1/agent-chat`,
```

**建议**: 将此调用移至 `api.ts` 中统一管理

#### `generate-xiaohongshu-copy` 调用方式
**问题**: MyProductPage.tsx 直接调用，未通过 `api.ts`

```typescript
// 当前代码位置: src/pages/MyProductPage.tsx:236
functionUrl: `${supabaseUrl}/functions/v1/generate-xiaohongshu-copy`,
```

**建议**: 将此调用移至 `api.ts` 中统一管理

#### `optimize-xiaohongshu-copy` 调用方式
**问题**: ContentCreationPage.tsx 直接调用，未通过 `api.ts`

```typescript
// 当前代码位置: src/pages/ContentCreationPage.tsx:90
functionUrl: `${supabaseURL}/functions/v1/optimize-xiaohongshu-copy`,
```

**建议**: 将此调用移至 `api.ts` 中统一管理

---

## 3. 数据库 RPC 函数对接状态

| RPC 函数 | 前端调用 | 状态 |
|----------|---------|------|
| `verify_user_login` | ✅ loginWithAccount | 正常 |
| `create_user_account` | ✅ registerWithAccount | 正常 |
| `get_user_credits` | ✅ getUserCredits | 正常 |
| `consume_user_credits` | ✅ consumeCredits | 正常 |
| `check_and_consume_usage` | ✅ checkAndConsumeUsage | 正常 |
| `get_user_usage` | ✅ getUserUsage | 正常 |
| `get_user_statistics` | ✅ getUserStatistics | 正常 |
| `recharge_credits` | ✅ rechargeCredits | 正常 |
| `get_credit_transactions` | ✅ getCreditTransactions | 正常 |
| `get_image_factory_usage_today` | ✅ getImageFactoryUsageToday | 正常 |
| `record_image_factory_usage` | ✅ recordImageFactoryUsage | 正常 |
| `check_and_consume_image_factory_credits` | ✅ checkAndConsumeImageFactoryCredits | 正常 |
| `get_video_generation_usage_today` | ✅ getVideoGenerationUsageToday | 正常 |
| `record_video_generation_usage` | ✅ recordVideoGenerationUsage | 正常 |
| `check_video_generation_usage` | ✅ checkVideoGenerationUsage | 正常 |

**RPC 函数对接正常，无明显问题。**

---

## 4. 问题汇总与建议

### 高优先级

| 问题 | 建议操作 |
|------|---------|
| `ai-recreate-content` 未使用 | 确认是否需要，如废弃则删除后端函数 |
| `coze-workflow` 未使用 | 确认是否需要，如废弃则删除后端函数 |
| `xhs-auth` 未使用 | 确认是否需要，如废弃则删除后端函数 |
| 部分接口直接在页面调用 | 统一迁移到 `api.ts` 管理 |

### 中优先级

| 问题 | 建议操作 |
|------|---------|
| `generate-xiaohongshu-content-dashscope` 与 `generate-xiaohongshu-content` 功能重复 | 保留一个，删除另一个 |
| `agent-chat` 未在 api.ts 中定义 | 添加统一调用函数 |

### 建议删除的文件

如果确认功能废弃，可删除以下后端 Edge Function：
- `supabase/functions/ai-recreate-content/` 
- `supabase/functions/coze-workflow/`
- `supabase/functions/xhs-auth/`
- `supabase/functions/generate-xiaohongshu-content-dashscope/`

---

## 5. 待统一管理的接口

建议将以下直接在页面中调用的接口迁移到 `api.ts`：

```typescript
// 需要添加到 api.ts 的函数

// 1. AI 智能体对话
export async function agentChat(message: string, agentId: string, history: Message[]) { ... }

// 2. 生成小红书文案
export async function generateXiaohongshuCopy(productData: ProductData) { ... }

// 3. 优化小红书文案
export async function optimizeXiaohongshuCopy(originalContent: string) { ... }
```

---

*检查日期: 2026-03-20*