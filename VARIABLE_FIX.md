# 变量重复声明错误修复

## 🐛 问题描述

Edge Function部署后返回500错误，原因是`getAccessToken`函数中存在变量重复声明：

```typescript
// 第94行
const expiresIn = Date.now() + 23 * 60 * 60 * 1000; // ✅ 第一次声明

// ... 中间代码 ...

// 第155行
const expiresIn = data.expires_in || data.data?.expires_in || (Date.now() + 23 * 60 * 60 * 1000); // ❌ 重复声明
```

**错误信息**：
```
Identifier 'expiresIn' has already been declared
```

---

## ✅ 修复方案

### 修改前

```typescript
async function getAccessToken(): Promise<{ token: string; expiresAt: number }> {
  // ... 前面的代码 ...
  
  // 第94行：第一次声明
  const expiresIn = Date.now() + 23 * 60 * 60 * 1000;
  
  // ... 中间代码 ...
  
  // 第155行：重复声明 ❌
  const expiresIn = data.expires_in || data.data?.expires_in || (Date.now() + 23 * 60 * 60 * 1000);
  
  // 第158行
  const actualExpiresAt = data.expires_in || expiresIn;
}
```

### 修改后

```typescript
async function getAccessToken(): Promise<{ token: string; expiresAt: number }> {
  // ... 前面的代码 ...
  
  // 第94行：第一次声明（用于API请求参数）
  const expiresIn = Date.now() + 23 * 60 * 60 * 1000;
  
  // ... 中间代码 ...
  
  // 第155行：改名为responseExpiresIn ✅
  const responseExpiresIn = data.expires_in || data.data?.expires_in;
  
  // 第158行：更新计算逻辑
  const actualExpiresAt = responseExpiresIn || expiresIn;
}
```

---

## 📝 详细说明

### 1. expiresIn（第94行）

**用途**：作为API请求参数，告诉小红书服务器我们希望token的过期时间

```typescript
const expiresIn = Date.now() + 23 * 60 * 60 * 1000; // 23小时后过期

// 用于API请求
body: JSON.stringify({
  app_key: XHS_APP_KEY,
  nonce,
  timestamp: parseInt(timestamp),
  signature,
  expires_in: expiresIn, // ✅ 发送给小红书API
})
```

### 2. responseExpiresIn（第155行，原expiresIn）

**用途**：从小红书API响应中获取实际的过期时间

```typescript
// 从API响应中获取expires_in
const responseExpiresIn = data.expires_in || data.data?.expires_in;
```

**可能的响应格式**：
- 格式1：`{ "access_token": "...", "expires_in": 1706702400000 }`
- 格式2：`{ "data": { "access_token": "...", "expires_in": 1706702400000 } }`

### 3. actualExpiresAt（第158行）

**用途**：确定最终使用的过期时间

```typescript
// 优先使用API返回的expires_in，如果没有则使用我们计算的expiresIn
const actualExpiresAt = responseExpiresIn || expiresIn;
```

**逻辑**：
- 如果小红书API返回了`expires_in` → 使用API返回的值
- 如果小红书API没有返回 → 使用我们计算的值（23小时后）

---

## 🎯 修复效果

### 修复前

```
❌ Edge Function部署失败
❌ 返回500 Internal Server Error
❌ 错误信息：Identifier 'expiresIn' has already been declared
```

### 修复后

```
✅ Edge Function成功部署
✅ 变量命名清晰，无冲突
✅ 正确处理access_token的过期时间
✅ 兼容多种API响应格式
```

---

## 🔍 验证方法

### 1. 检查Edge Function日志

测试发布功能后，查看Edge Function日志，应该显示：

```
🔄 获取新的access_token...
请求参数: { app_key: "...", nonce: "...", timestamp: ..., expires_in: 1706702400000 }
小红书API响应状态: 200
小红书API原始响应: {"access_token":"...","expires_in":...}
✅ 成功获取access_token，过期时间: 2026-02-01T...
```

**关键点**：
- ✅ 不再出现变量重复声明错误
- ✅ 成功调用小红书API
- ✅ 正确解析响应数据
- ✅ 正确计算过期时间

### 2. 检查浏览器控制台

点击"发布到小红书"后，浏览器控制台应该显示：

```
小红书JS SDK已加载
```

**不应该出现**：
- ❌ 500 Internal Server Error
- ❌ Edge Function returned a non-2xx status code

---

## 💡 经验教训

### 1. 避免变量重复声明

在同一作用域内，不要使用`const`或`let`重复声明同一个变量名。

**错误示例**：
```typescript
const name = "Alice";
// ... 一些代码 ...
const name = "Bob"; // ❌ 错误：重复声明
```

**正确示例**：
```typescript
const name = "Alice";
// ... 一些代码 ...
const newName = "Bob"; // ✅ 正确：使用不同的变量名
```

### 2. 使用有意义的变量名

当需要存储相似但来源不同的数据时，使用更具描述性的变量名：

- `expiresIn` → 我们计算的过期时间
- `responseExpiresIn` → API返回的过期时间
- `actualExpiresAt` → 最终使用的过期时间

### 3. 添加注释说明

在关键的变量声明处添加注释，说明变量的用途和来源：

```typescript
// 计算23小时后的过期时间（用于API请求参数）
const expiresIn = Date.now() + 23 * 60 * 60 * 1000;

// 从API响应中获取实际的过期时间
const responseExpiresIn = data.expires_in || data.data?.expires_in;

// 优先使用API返回的expires_in，如果没有则使用我们计算的expiresIn
const actualExpiresAt = responseExpiresIn || expiresIn;
```

---

## 🚀 下一步

1. **清除浏览器缓存**
   - 按F12打开开发者工具
   - 右键点击刷新按钮
   - 选择"清空缓存并硬性重新加载"

2. **重新测试发布功能**
   - 进入"我有产品"或"图片工厂"
   - 生成内容
   - 点击"发布到小红书"

3. **观察结果**
   - 浏览器控制台不应该再出现500错误
   - Edge Function日志应该显示成功获取access_token
   - 如果还有其他错误，立即告诉我

---

**修复完成！现在可以重新测试了！** 🎉
