# AI二创功能调试指南

## 问题描述

AI二创功能调用失败，返回400 Bad Request错误。

## 已实施的修复

### 1. Edge Function优化

**文件**：`supabase/functions/ai-recreate-content/index.ts`

**修复内容**：
- ✅ 添加详细的请求体解析错误处理
- ✅ 添加参数验证日志
- ✅ 添加API调用日志
- ✅ 改进错误信息，返回详细错误详情
- ✅ 添加try-catch包裹请求体解析

**日志输出**：
```
收到请求体: {"originalTitle":"...","originalContent":"..."}
参数验证通过: {"titleLength":10,"contentLength":100}
API密钥已配置
准备调用API: https://...
API响应状态: 200
API调用成功，开始流式响应
```

### 2. 前端优化

**文件**：`src/pages/ProductSelectionPage.tsx`

**修复内容**：
- ✅ 添加原内容完整性检查
- ✅ 移除空字符串默认值
- ✅ 添加详细的console.log日志
- ✅ 改进错误提示

**日志输出**：
```
开始AI二创: {title: "...", contentLength: 100}
收到数据: {"choices":[{"delta":{"content":"..."}}]}
AI二创完成
```

## 测试步骤

### 1. 打开浏览器开发者工具

按F12或右键 → 检查，打开开发者工具。

### 2. 切换到Console标签

查看控制台日志输出。

### 3. 执行AI二创

1. 在"帮我选品"页面搜索笔记
2. 点击笔记卡片的"一键发布"按钮
3. 在发布模态框中点击"AI智能二创"按钮

### 4. 观察日志输出

**前端日志**（浏览器Console）：
```
开始AI二创: {title: "原标题", contentLength: 50}
收到数据: data: {"id":"...","choices":[...]}
收到数据: data: {"id":"...","choices":[...]}
...
AI二创完成
```

**Edge Function日志**（Supabase Dashboard）：
1. 访问 Supabase Dashboard
2. 进入 Edge Functions
3. 选择 ai-recreate-content
4. 查看 Logs 标签

预期日志：
```
收到请求体: {"originalTitle":"...","originalContent":"..."}
参数验证通过: {"titleLength":10,"contentLength":50}
API密钥已配置
准备调用API: https://app-8sm6r7tdrncx-api-zYkZz8qovQ1L-gateway.appmiaoda.com/v2/chat/completions
API响应状态: 200
API调用成功，开始流式响应
```

## 可能的错误及解决方案

### 错误1：原笔记内容不完整

**错误信息**：
```
原笔记内容不完整，无法进行AI二创
```

**原因**：
- 笔记没有标题
- 笔记没有文案描述

**解决方案**：
- 选择有完整标题和文案的笔记
- 确保笔记的description字段不为空

### 错误2：请求体解析失败

**错误信息**：
```
请求体解析失败，请确保发送有效的JSON
```

**原因**：
- 请求体不是有效的JSON格式
- 网络传输过程中数据损坏

**解决方案**：
- 检查网络连接
- 重试操作
- 查看浏览器Console日志

### 错误3：参数验证失败

**错误信息**：
```
缺少必要参数：originalTitle 和 originalContent
```

**原因**：
- originalTitle为空
- originalContent为空

**解决方案**：
- 确保笔记有标题和文案
- 检查前端传递的参数

### 错误4：API密钥未配置

**错误信息**：
```
API密钥未配置
```

**原因**：
- INTEGRATIONS_API_KEY环境变量未设置
- Edge Function部署时未注入API密钥

**解决方案**：
- 联系管理员配置API密钥
- 重新部署Edge Function

### 错误5：API调用失败

**错误信息**：
```
API调用失败: 400
```

**原因**：
- 文心大模型API返回400错误
- 请求参数不符合API要求
- API限流

**解决方案**：
- 查看Edge Function日志中的详细错误信息
- 检查API调用参数
- 等待一段时间后重试（如果是限流）

## 调试技巧

### 1. 查看完整的错误信息

在浏览器Console中，展开错误对象查看详细信息：
```javascript
console.error('AI二创失败:', error);
// 展开error对象，查看message、stack等属性
```

### 2. 查看网络请求

在浏览器开发者工具的Network标签中：
1. 筛选XHR/Fetch请求
2. 找到ai-recreate-content请求
3. 查看Request Headers、Request Payload
4. 查看Response Headers、Response Body

### 3. 查看Edge Function日志

在Supabase Dashboard中：
1. 进入Edge Functions
2. 选择ai-recreate-content
3. 查看Logs标签
4. 筛选错误日志（红色）

### 4. 测试API直接调用

使用curl测试Edge Function：
```bash
curl -X POST https://backend.appmiaoda.com/projects/supabase267647421859807232/functions/v1/ai-recreate-content \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "originalTitle": "测试标题",
    "originalContent": "测试文案内容"
  }'
```

## 预期行为

### 成功场景

1. 用户点击"AI智能二创"按钮
2. 按钮显示"AI创作中..."和旋转图标
3. 标题输入框逐字显示生成的标题
4. 文案输入框逐字显示生成的文案
5. 生成完成后显示"AI二创完成！"提示
6. 按钮恢复为"AI智能二创"

### 失败场景

1. 用户点击"AI智能二创"按钮
2. 如果原内容不完整，立即显示错误提示
3. 如果API调用失败，显示"AI二创失败，请重试"
4. 按钮恢复为"AI智能二创"
5. 编辑框保持原内容或清空

## 性能监控

### 响应时间

- 首字响应：< 2秒
- 完整生成：< 10秒
- 超时时间：30秒

### 日志记录

- 每次调用记录开始时间
- 每次调用记录完成时间
- 计算总耗时

```javascript
const startTime = Date.now();
// ... AI二创逻辑
const endTime = Date.now();
console.log('AI二创耗时:', endTime - startTime, 'ms');
```

## 常见问题

### Q1: 为什么有些笔记无法AI二创？

A: 因为有些笔记没有文案描述（description字段为空），系统会提前检查并提示"原笔记内容不完整"。

### Q2: AI生成的内容为什么不完整？

A: 可能原因：
- 网络中断导致流式响应中断
- API返回的内容被截断
- 正则匹配失败

解决方案：
- 重试操作
- 检查网络连接
- 查看Console日志中的原始数据

### Q3: 为什么生成速度很慢？

A: 可能原因：
- 网络延迟
- API服务器负载高
- 生成内容较长

解决方案：
- 等待完成
- 如果超过30秒，刷新页面重试

### Q4: 如何中断正在进行的AI二创？

A: 
- 关闭发布模态框
- 再次点击"AI智能二创"按钮
- 刷新页面

系统会自动中断之前的请求。

## 联系支持

如果问题仍未解决，请提供以下信息：

1. 浏览器Console日志截图
2. Network标签中的请求详情
3. Edge Function日志截图
4. 操作步骤描述
5. 笔记标题和文案内容

## 更新日志

### 2026-02-01

- ✅ 添加详细的日志输出
- ✅ 添加原内容完整性检查
- ✅ 改进错误处理和提示
- ✅ 重新部署Edge Function
