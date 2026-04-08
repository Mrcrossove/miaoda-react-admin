# 鲸小助后端接口文档

## 概述

本文档描述了鲸小助应用的所有后端接口，包括 Supabase Edge Functions 和数据库 RPC 函数。

**基础信息：**
- 基础 URL: `https://qbrxkgqhsfjgfatykyzv.supabase.co`
- 认证方式: Supabase Anon Key (通过 `Authorization: Bearer <token>` 请求头)
- 数据格式: JSON

---

## 目录

1. [用户认证接口](#1-用户认证接口)
2. [产品管理接口](#2-产品管理接口)
3. [小红书相关接口](#3-小红书相关接口)
4. [热榜接口](#4-热榜接口)
5. [图片工厂接口](#5-图片工厂接口)
6. [电商视频接口](#6-电商视频接口)
7. [灵感值系统接口](#7-灵感值系统接口)
8. [AI 智能体接口](#8-ai-智能体接口)
9. [存储接口](#9-存储接口)
10. [用户资料接口](#10-用户资料接口)

---

## 1. 用户认证接口

### 1.1 用户登录

**函数名:** `verify_user_login`

**类型:** RPC 函数

**描述:** 验证用户登录凭据

**请求参数:**
```json
{
  "p_username": "string",  // 用户名（手机号）
  "p_password": "string"   // 密码
}
```

**响应参数:**
```json
[
  {
    "success": true,
    "user_id": "uuid",
    "username": "string",
    "display_name": "string",
    "message": "登录成功"
  }
]
```

**错误情况:**
- 账号不存在或已被禁用
- 密码错误

---

### 1.2 用户注册

**函数名:** `create_user_account`

**类型:** RPC 函数

**描述:** 创建新用户账号

**请求参数:**
```json
{
  "p_username": "string",       // 用户名（手机号）
  "p_password": "string",       // 密码
  "p_display_name": "string",   // 显示名称（可选）
  "p_created_by": "uuid"        // 创建者ID（可选）
}
```

**响应参数:**
```json
{
  "success": true,
  "user_id": "uuid",
  "username": "string",
  "display_name": "string",
  "message": "账号创建成功"
}
```

---

## 2. 产品管理接口

### 2.1 获取用户产品列表

**类型:** 数据库查询

**表名:** `products`

**描述:** 获取指定用户的所有产品

**请求:**
```sql
SELECT * FROM products 
WHERE user_id = :userId 
ORDER BY created_at DESC
```

**前端调用:**
```typescript
getUserProducts(userId: string): Promise<Product[]>
```

---

### 2.2 创建产品

**类型:** 数据库插入

**描述:** 创建新产品

**请求参数:**
```json
{
  "user_id": "uuid",
  "name": "string",
  "description": "string",
  "selling_points": "string",
  "target_audience": "string",
  "image_urls": ["string"],
  "platform": "string"
}
```

**前端调用:**
```typescript
createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null>
```

---

### 2.3 更新产品

**类型:** 数据库更新

**前端调用:**
```typescript
updateProduct(productId: string, updates: Partial<Product>): Promise<boolean>
```

---

### 2.4 删除产品

**类型:** 数据库删除

**前端调用:**
```typescript
deleteProduct(productId: string): Promise<boolean>
```

---

## 3. 小红书相关接口

### 3.1 搜索小红书笔记

**Edge Function:** `search-xiaohongshu-notes`

**方法:** POST

**描述:** 搜索小红书爆款笔记

**请求参数:**
```json
{
  "keyword": "string",     // 搜索关键词
  "number": 30,            // 采集数量（默认30，最大100）
  "sort": 4,               // 排序方式：0=综合, 1=最新, 2=最多点赞, 3=最多评论, 4=最多收藏
  "noteType": 2,           // 笔记类型：0=全部, 1=视频, 2=图文
  "publishTime": 3         // 发布时间：0=不限, 1=一天内, 2=一周内, 3=半年内
}
```

**响应参数:**
```json
{
  "success": true,
  "data": [
    {
      "note_id": "string",
      "title": "string",
      "description": "string",
      "cover_image": "string",
      "images": ["string"],
      "like_count": 0,
      "comment_count": 0,
      "share_count": 0,
      "collect_count": 0,
      "author_name": "string",
      "author_avatar": "string",
      "note_url": "string",
      "publish_time": "string"
    }
  ]
}
```

**前端调用:**
```typescript
searchXiaohongshuNotes(keyword: string, number?: number, sort?: number, noteType?: number, publishTime?: number)
```

---

### 3.2 解析小红书笔记链接

**Edge Function:** `parse-xiaohongshu-note`

**方法:** POST

**描述:** 解析小红书笔记链接，获取笔记内容

**请求参数:**
```json
{
  "url": "string"  // 小红书笔记链接
}
```

**响应参数:**
```json
{
  "success": true,
  "data": {
    "title": "string",
    "content": "string",
    "images": ["string"],
    "author": "string"
  }
}
```

**前端调用:**
```typescript
parseXiaohongshuNote(url: string)
```

---

### 3.3 生成小红书文案

**Edge Function:** `generate-xiaohongshu-content`

**方法:** POST

**描述:** 生成小红书风格文案

**请求参数:**
```json
{
  "mainTitle": "string",   // 主标题
  "imageCount": 3          // 生成数量（3-5）
}
```

**响应参数:**
```json
{
  "success": true,
  "content_list": [
    {
      "sub_title": "string",
      "content": "string"
    }
  ]
}
```

**前端调用:**
```typescript
generateXiaohongshuContent(mainTitle: string, imageCount: number)
```

---

### 3.4 优化小红书文案

**Edge Function:** `optimize-xiaohongshu-copy`

**方法:** POST

**描述:** 优化已有文案，使其更符合小红书风格

**请求参数:**
```json
{
  "originalContent": "string"  // 原始文案内容
}
```

**响应:** 流式响应，逐步返回优化后的文案

---

### 3.5 小红书认证

**Edge Function:** `xhs-auth`

**方法:** POST

**描述:** 小红书平台认证

---

## 4. 热榜接口

### 4.1 获取热榜列表

**Edge Function:** `trending-lists`

**方法:** POST

**描述:** 获取各平台热榜数据

**请求参数:**
```json
{
  "type": "string"  // 热榜类型：2=微博, 3=知乎, 4=抖音, 6=B站, 7=今日头条, 8=百度, 9=知乎日报, 10=36氪, 14=IT之家
}
```

**响应参数:**
```json
{
  "success": true,
  "data": [
    {
      "title": "string",
      "hot": 0,
      "url": "string",
      "date": "string"
    }
  ]
}
```

**前端调用:**
```typescript
getTrendingLists(type: TrendingType)
```

---

### 4.2 获取垂类热榜

**Edge Function:** `vertical-trending`

**方法:** POST

**描述:** 获取垂直领域热榜数据（美食、美妆、汽车）

**请求参数:**
```json
{
  "type": "string",       // 类型：美食, 美妆, 汽车
  "mediaType": "string",  // 平台：抖音, 小红书
  "timeRange": 1          // 时间范围：1=今日, 3=三日, 7=七日
}
```

**响应参数:**
```json
{
  "success": true,
  "data": [
    {
      "title": "string",
      "description": "string",
      "url": "string",
      "hotNum": "string",
      "likeCount": 0,
      "commentsCount": 0,
      "sharedCount": 0,
      "readCount": 0
    }
  ]
}
```

**前端调用:**
```typescript
getVerticalTrending(type: VerticalType, mediaType: MediaType, timeRange: TimeRange)
```

---

## 5. 图片工厂接口

### 5.1 生成图片工厂内容

**Edge Function:** `generate-image-factory-content`

**方法:** POST

**描述:** 根据主题生成小标题和文案

**请求参数:**
```json
{
  "theme": "string",           // 核心主题
  "itemCount": 3,              // 小标题数量（1-5）
  "contentStyle": "string"     // 文案风格：science, recommend, cute
}
```

**响应参数:**
```json
{
  "success": true,
  "content_list": [
    {
      "subTitle": "string",
      "content": "string"
    }
  ]
}
```

**前端调用:**
```typescript
generateImageFactoryContent(theme: string, itemCount: number, contentStyle: 'science' | 'recommend' | 'cute')
```

---

### 5.2 生成图片提示词

**Edge Function:** `generate-image-prompt`

**方法:** POST

**描述:** 基于主题、小标题、文案生成图片提示词

**请求参数:**
```json
{
  "theme": "string",
  "subTitle": "string",
  "content": "string"
}
```

**响应参数:**
```json
{
  "success": true,
  "prompt": "string"
}
```

**前端调用:**
```typescript
generateImagePrompt(theme: string, subTitle: string, content: string): Promise<string>
```

---

### 5.3 生成图片（通义万相）

**Edge Function:** `generate-image-dashscope`

**方法:** POST

**描述:** 使用阿里云 DashScope 生成图片

**请求参数:**
```json
{
  "prompt": "string",       // 图片提示词
  "size": "1024*1024"       // 图片尺寸（默认1024*1024）
}
```

**响应参数:**
```json
{
  "success": true,
  "image_url": "string"
}
```

**前端调用:**
```typescript
generateImageWithDashscope(prompt: string, size?: string): Promise<string>
```

---

### 5.4 生成图片工厂简短文案

**Edge Function:** `generate-image-factory-caption`

**方法:** POST

**描述:** 生成图片工厂小红书简短文案

**请求参数:**
```json
{
  "theme": "string"
}
```

**响应参数:**
```json
{
  "success": true,
  "content": "string"
}
```

**前端调用:**
```typescript
generateImageFactoryCaption(theme: string): Promise<string>
```

---

## 6. 电商视频接口

### 6.1 生成 SORA 视频

**Edge Function:** `generate-sora-video`

**方法:** POST

**描述:** 提交 SORA2 视频生成请求

**请求参数:**
```json
{
  "prompt": "string",    // 视频提示词
  "duration": 10         // 视频时长：10 或 15 秒
}
```

**响应参数:**
```json
{
  "success": true,
  "video_id": "string",
  "status": "string",
  "message": "string"
}
```

**前端调用:**
```typescript
generateSoraVideo(prompt: string, duration: 10 | 15)
```

---

### 6.2 查询 SORA 视频状态

**Edge Function:** `query-sora-video`

**方法:** GET

**描述:** 查询视频生成状态

**请求参数:**
- Query 参数: `video_id` - 视频 ID

**响应参数:**
```json
{
  "success": true,
  "video_id": "string",
  "status": "string",      // pending, processing, completed, failed
  "progress": 0,           // 进度 0-100
  "video_url": "string",   // 视频URL（完成时返回）
  "message": "string"
}
```

**前端调用:**
```typescript
querySoraVideo(videoId: string)
```

---

## 7. 灵感值系统接口

### 7.1 获取用户灵感值

**函数名:** `get_user_credits`

**类型:** RPC 函数

**请求参数:**
```json
{
  "p_user_id": "uuid"
}
```

**响应:** 返回灵感值数量（数字）

**前端调用:**
```typescript
getUserCredits(userId?: string): Promise<number>
```

---

### 7.2 获取充值套餐列表

**类型:** 数据库查询

**表名:** `credit_packages`

**前端调用:**
```typescript
getCreditPackages()
```

**响应:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "credits": 100,
    "price": 9.9,
    "sort_order": 1,
    "is_active": true
  }
]
```

---

### 7.3 创建充值订单

**Edge Function:** `create_credit_order`

**方法:** POST

**请求参数:**
```json
{
  "packageId": "uuid"
}
```

**响应参数:**
```json
{
  "success": true,
  "orderNo": "string",
  "payUrl": "string"
}
```

**前端调用:**
```typescript
createCreditOrder(packageId: string): Promise<{ orderNo: string; payUrl: string }>
```

---

### 7.4 获取订单详情

**类型:** 数据库查询

**表名:** `credit_orders`

**前端调用:**
```typescript
getCreditOrder(orderNo: string)
```

---

### 7.5 获取用户消费记录

**类型:** 数据库查询

**表名:** `credit_usage`

**前端调用:**
```typescript
getUserCreditUsage(limit?: number)
```

---

### 7.6 检查并消费使用次数

**函数名:** `check_and_consume_usage`

**类型:** RPC 函数

**描述:** 检查并消费指定功能的使用次数

**请求参数:**
```json
{
  "p_user_id": "uuid",
  "p_feature": "string"  // image_factory 或 ecommerce_video
}
```

**响应参数:**
```json
{
  "success": true,
  "message": "string",
  "remaining_free": 0,
  "credits_balance": 0,
  "consumed_type": "string"  // free 或 credits
}
```

**前端调用:**
```typescript
checkAndConsumeUsage(userId: string, feature: 'image_factory' | 'ecommerce_video')
```

---

### 7.7 获取用户使用情况

**函数名:** `get_user_usage`

**类型:** RPC 函数

**前端调用:**
```typescript
getUserUsage(userId: string)
```

---

### 7.8 充值灵感值

**函数名:** `recharge_credits`

**类型:** RPC 函数

**前端调用:**
```typescript
rechargeCredits(userId: string, amount: number, description?: string)
```

---

## 8. AI 智能体接口

### 8.1 AI 智能体对话

**Edge Function:** `agent-chat`

**方法:** POST

**描述:** 与 AI 智能体进行对话

**请求参数:**
```json
{
  "message": "string",
  "agentId": "string",
  "history": []
}
```

**响应:** 流式响应

---

### 8.2 AI 二创内容

**Edge Function:** `ai-recreate-content`

**方法:** POST

**描述:** AI 二创内容生成

---

### 8.3 Coze 工作流

**Edge Function:** `coze-workflow`

**方法:** POST

**描述:** 调用 Coze AI 工作流

---

## 9. 存储接口

### 9.1 上传图片

**类型:** Supabase Storage

**Bucket:** `app-8sm6r7tdrncx_content_images`

**前端调用:**
```typescript
uploadImage(file: File): Promise<string>
```

**响应:** 返回图片公开 URL

---

## 10. 用户资料接口

### 10.1 获取用户资料

**类型:** 数据库查询

**表名:** `profiles`

**前端调用:**
```typescript
getProfile(userId: string): Promise<Profile | null>
```

---

### 10.2 更新用户资料

**类型:** 数据库更新

**前端调用:**
```typescript
updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean>
```

---

### 10.3 获取用户统计数据

**函数名:** `get_user_statistics`

**类型:** RPC 函数

**请求参数:**
```json
{
  "p_user_id": "uuid"
}
```

**响应参数:**
```json
{
  "product_count": 0,
  "creation_count": 0,
  "analysis_count": 0,
  "image_factory_count": 0,
  "video_generation_count": 0
}
```

**前端调用:**
```typescript
getUserStatistics(userId?: string)
```

---

## 附录

### A. 错误码说明

| 错误码 | 说明 |
|--------|------|
| 22P02 | UUID 格式错误 |
| 401 | 未授权，请重新登录 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### B. 数据类型定义

```typescript
// 热榜类型
type TrendingType = '2' | '3' | '4' | '6' | '7' | '8' | '9' | '10' | '14';

// 垂类类型
type VerticalType = '美食' | '美妆' | '汽车';

// 媒体类型
type MediaType = '抖音' | '小红书';

// 时间范围
type TimeRange = 1 | 3 | 7;

// 产品
interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  selling_points: string | null;
  target_audience: string | null;
  image_urls: string[];
  platform: string;
  created_at: string;
  updated_at: string;
}

// 用户资料
interface Profile {
  id: string;
  phone: string | null;
  email: string | null;
  role: 'user' | 'admin';
  created_at: string;
}
```

### C. 环境变量配置

在 Supabase Dashboard → Edge Functions → Secrets 中配置：

| 变量名 | 用途 |
|--------|------|
| `XIAOHONGSHU_COOKIE` | 小红书 API 认证 |
| `XIAOHONGSHU_API_KEY` | 小红书 API Key |
| `ARK_API_KEY` | 字节跳动豆包 LLM API |
| `DASHSCOPE_API_KEY` | 阿里云 DashScope |
| `SORA_API_KEY` | SORA 视频生成 |
| `COZE_API_TOKEN` | Coze AI 工作流 |

---

*文档版本: 1.0.0*  
*最后更新: 2026-03-20*