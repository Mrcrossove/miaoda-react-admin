# 图片生成失败问题排查指南

## 问题描述
浏览器控制台显示错误：
```
图片生成失败: {"error":"图片生成失败","message":"未能获取图片URL"}
第1张图片生成失败: Error: {"error":"图片生成失败","message":"未能获取图片URL"}
```

## ✅ 问题已解决（2026-01-18 最终版本）

### 根本原因
用户的阿里云百炼API密钥（sk-63b565c16da348d9983c7c5cbb1b4438）**不支持异步调用模式**。

### 错误信息
```
403 AccessDenied
"current user api does not support asynchronous calls"
```

### 最终解决方案
切换到**同步模式**，移除异步相关的请求头和轮询逻辑：
1. **移除异步请求头**：不添加 `X-DashScope-Async: enable`
2. **使用同步调用**：直接调用API并等待响应
3. **直接提取URL**：从响应的 `result.output.results[0].url` 获取图片URL
4. **简化流程**：提交请求 → 等待响应 → 返回图片URL

### 技术实现
- 移除 `pollTaskStatus()` 异步轮询函数
- 移除 `DASHSCOPE_TASK_URL` 任务查询地址
- 简化主流程：单次API调用即可完成
- 同步模式响应时间：约5-10秒

### 代码变更
文件：`supabase/functions/generate-image-dashscope/index.ts`
- 移除异步模式请求头
- 移除轮询逻辑
- 直接从响应中提取图片URL
- 保留详细的日志输出

---

## 历史排查记录

### 第一次尝试（2026-01-18 早期版本）

#### 根本原因（错误判断）
阿里云百炼的图像生成API使用**异步任务模式**，而不是同步返回图片URL。

#### 解决方案（已废弃）
实现了完整的异步任务处理流程：
1. **提交任务**：调用API并添加 `X-DashScope-Async: enable` 头部
2. **获取task_id**：从响应中提取任务ID
3. **轮询查询**：每2秒查询一次任务状态，最多30次（60秒）
4. **提取结果**：任务完成后获取图片URL

### 技术实现
- 新增 `pollTaskStatus()` 函数处理异步轮询
- 支持任务状态：PENDING（等待中）、RUNNING（执行中）、SUCCEEDED（成功）、FAILED（失败）
- 自动重试机制：任务进行中时每2秒查询一次
- 超时保护：最多轮询30次，避免无限等待

### 代码变更
文件：`supabase/functions/generate-image-dashscope/index.ts`
- 添加 `DASHSCOPE_TASK_URL` 常量
- 实现 `pollTaskStatus()` 异步轮询函数
- 修改主流程：提交任务 → 轮询状态 → 返回结果
- 添加详细的日志输出

---

## 历史排查记录

### 已采取的修复措施（第一版）

### 1. 增强日志输出
- 添加完整的API响应结构日志
- 记录图片URL提取过程
- 输出详细的错误信息

### 2. 优化URL提取逻辑
尝试多种可能的响应格式：
- `result.output.results[0].url` - 标准格式
- `result.output.task_id` - 异步任务格式
- `result.data.url` - 备选格式1
- `result.url` - 备选格式2

### 3. 重新部署Edge Function
已部署更新后的 `generate-image-dashscope` 函数

## 下一步排查步骤

### 步骤1：查看Edge Function日志
1. 打开Supabase Dashboard
2. 进入 Edge Functions → generate-image-dashscope
3. 点击 Logs 标签
4. 查找 "API响应完整结构" 日志
5. 复制完整的响应JSON

### 步骤2：验证API密钥
阿里云百炼API密钥：`sk-63b565c16da348d9983c7c5cbb1b4438`

验证方法：
```bash
curl --location 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-63b565c16da348d9983c7c5cbb1b4438' \
--data '{
    "model": "z-image-turbo",
    "input": {
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "text": "一只可爱的小猫"
                    }
                ]
            }
        ]
    },
    "parameters": {
        "size": "1024*1024"
    }
}'
```

### 步骤3：检查API响应格式
根据阿里云百炼官方文档，响应格式应该是：
```json
{
  "output": {
    "task_id": "xxx",
    "task_status": "SUCCEEDED",
    "results": [
      {
        "url": "https://..."
      }
    ]
  },
  "usage": {
    "image_count": 1
  },
  "request_id": "xxx"
}
```

### 步骤4：可能的问题原因

#### 原因1：API密钥无效或过期
**症状**：返回401或403错误
**解决方案**：
1. 登录阿里云控制台
2. 进入百炼平台
3. 检查API密钥状态
4. 如需要，重新生成密钥并更新代码

#### 原因2：账户余额不足
**症状**：返回402或特定错误码
**解决方案**：
1. 登录阿里云控制台
2. 检查账户余额
3. 充值或开通免费额度

#### 原因3：模型参数错误
**症状**：返回400错误
**可能问题**：
- 模型名称错误（当前使用：z-image-turbo）
- 图片尺寸不支持（当前使用：1024*1024）
- 提示词格式错误

**解决方案**：
检查官方文档，确认支持的参数：
- 模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
- 参数说明：https://help.aliyun.com/zh/model-studio/developer-reference/api-details

#### 原因4：异步任务模式
**症状**：响应中包含 `task_id` 但没有 `url`
**说明**：某些模型使用异步生成模式
**解决方案**：需要实现轮询机制
1. 提交任务获取 `task_id`
2. 定期查询任务状态
3. 任务完成后获取图片URL

#### 原因5：网络或超时问题
**症状**：请求超时或连接失败
**解决方案**：
1. 检查Supabase Edge Function的网络连接
2. 增加请求超时时间
3. 添加重试机制

## 临时解决方案

### 方案1：使用测试图片
在开发阶段，可以使用占位图片：
```typescript
// 临时使用占位图片
const imageUrl = 'https://via.placeholder.com/1024x1024/6366f1/ffffff?text=Test+Image';
```

### 方案2：切换到其他生图API
如果阿里云百炼持续失败，可以考虑：
- Stability AI
- Midjourney API
- DALL-E 3
- 文心一格

## 联系支持

如果以上方案都无法解决，请提供：
1. Supabase Edge Function完整日志
2. API响应的完整JSON
3. 阿里云控制台的错误信息
4. 账户余额和API密钥状态

---

**更新时间**：2026-01-18
**状态**：已部署修复版本，等待测试结果
