# Edge Function错误处理修复

## 问题描述

在调用Edge Function时，如果发生错误，代码会尝试调用`error.context.text()`来获取错误信息，但这会导致以下错误：

```
TypeError: error?.context?.text is not a function
```

## 问题原因

Supabase Functions返回的错误对象中，`error.context`的类型不确定：
- 有时是一个Response对象，包含`text()`方法
- 有时是一个字符串
- 有时是其他类型的对象

直接调用`await error?.context?.text()`会在`text`不是函数时抛出TypeError。

## 解决方案

添加类型检查，安全地处理不同类型的`error.context`：

```typescript
if (error) {
  let errorMsg = error?.message || '默认错误信息';
  
  // 尝试从context中获取错误信息
  if (error?.context) {
    if (typeof error.context.text === 'function') {
      try {
        errorMsg = await error.context.text();
      } catch (e) {
        console.error('解析错误信息失败:', e);
      }
    } else if (typeof error.context === 'string') {
      errorMsg = error.context;
    }
  }
  
  console.error('操作失败:', errorMsg);
  throw new Error(errorMsg);
}
```

## 修改的文件

### src/db/api.ts

修复了3个Edge Function调用的错误处理：

1. **getTrendingLists** (第47-65行)
   - 调用trending-lists Edge Function
   - 获取热榜数据

2. **getVerticalTrending** (第83-101行)
   - 调用vertical-trending Edge Function
   - 获取垂类热榜数据

3. **searchXiaohongshuNotes** (第182-200行)
   - 调用search-xiaohongshu-notes Edge Function
   - 搜索小红书笔记

## 错误处理逻辑

### 1. 优先级顺序

```
1. error.context.text() (如果是函数)
2. error.context (如果是字符串)
3. error.message
4. 默认错误信息
```

### 2. 类型检查

```typescript
// 检查text是否是函数
if (typeof error.context.text === 'function')

// 检查context是否是字符串
if (typeof error.context === 'string')
```

### 3. 异常捕获

即使`text()`是函数，调用时也可能失败，所以用try-catch包裹：

```typescript
try {
  errorMsg = await error.context.text();
} catch (e) {
  console.error('解析错误信息失败:', e);
}
```

## 验证方法

1. 打开应用的"帮我选品"页面
2. 输入关键词进行搜索
3. 检查是否能正常搜索或显示友好的错误信息
4. 打开浏览器控制台，确认没有TypeError错误

## 可能的错误场景

### 1. Cookie过期

```
错误信息：未配置小红书Cookie或API Key
解决方案：更新Supabase Secrets中的Cookie
```

### 2. API Key无效

```
错误信息：API Key无效或余额不足
解决方案：检查API Key是否正确，充值点数
```

### 3. 网络错误

```
错误信息：网络请求失败
解决方案：检查网络连接，重试
```

### 4. Edge Function错误

```
错误信息：具体的错误信息（从error.context获取）
解决方案：根据具体错误信息排查
```

## 最佳实践

### 1. 统一错误处理

所有Edge Function调用都应该使用相同的错误处理模式：

```typescript
if (error) {
  let errorMsg = error?.message || '默认错误信息';
  
  if (error?.context) {
    if (typeof error.context.text === 'function') {
      try {
        errorMsg = await error.context.text();
      } catch (e) {
        console.error('解析错误信息失败:', e);
      }
    } else if (typeof error.context === 'string') {
      errorMsg = error.context;
    }
  }
  
  console.error('操作失败:', errorMsg);
  throw new Error(errorMsg);
}
```

### 2. 日志记录

- 使用`console.error`记录详细错误信息
- 包含操作名称和错误内容
- 便于调试和问题排查

### 3. 用户友好的错误信息

- 提供默认错误信息
- 避免暴露技术细节
- 给出可能的解决方案

## 技术细节

### Supabase Functions错误对象结构

```typescript
interface FunctionsError {
  message: string;
  context?: Response | string | object;
}
```

### Response对象的text()方法

```typescript
interface Response {
  text(): Promise<string>;
  json(): Promise<any>;
  // ... 其他方法
}
```

### 为什么需要await

`text()`方法返回Promise，需要使用await等待结果：

```typescript
const errorMsg = await error.context.text();
```

## 相关资源

- [Supabase Edge Functions文档](https://supabase.com/docs/guides/functions)
- [JavaScript typeof操作符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/typeof)
- [Response.text()方法](https://developer.mozilla.org/zh-CN/docs/Web/API/Response/text)

---

**修复完成时间**：2026-01-14
**修复状态**：✅ 已验证通过
**影响范围**：所有Edge Function调用
