# appKey改为app_key修复说明

## 🔧 修改内容

根据小红书官方API标准，将所有`appKey`（驼峰命名）改为`app_key`（下划线命名）。

---

## 📝 修改详情

### 1. Edge Function修改

**文件**：`supabase/functions/xhs-auth/index.ts`

#### 修改1：generateSignature函数参数

**修改前**：
```typescript
async function generateSignature(
  appKey: string,  // ❌ 驼峰命名
  nonce: string,
  timestamp: string,
  secret: string
): Promise<string> {
  const params: Record<string, string> = { appKey, nonce, timestamp };
  // ...
}
```

**修改后**：
```typescript
async function generateSignature(
  app_key: string,  // ✅ 下划线命名
  nonce: string,
  timestamp: string,
  secret: string
): Promise<string> {
  const params: Record<string, string> = { app_key, nonce, timestamp };
  // ...
}
```

#### 修改2：generateJSSignature返回值类型

**修改前**：
```typescript
async function generateJSSignature(): Promise<{
  appKey: string;  // ❌ 驼峰命名
  nonce: string;
  timestamp: string;
  signature: string;
}> {
  // ...
  return {
    appKey: XHS_APP_KEY,  // ❌ 驼峰命名
    nonce,
    timestamp,
    signature,
  };
}
```

**修改后**：
```typescript
async function generateJSSignature(): Promise<{
  app_key: string;  // ✅ 下划线命名
  nonce: string;
  timestamp: string;
  signature: string;
}> {
  // ...
  return {
    app_key: XHS_APP_KEY,  // ✅ 下划线命名
    nonce,
    timestamp,
    signature,
  };
}
```

#### 修改3：注释说明

**修改前**：
```typescript
/**
 * 生成签名
 * 签名算法：SHA-256("appKey=value&nonce=value&timestamp=value" + secret)
 */
```

**修改后**：
```typescript
/**
 * 生成签名
 * 签名算法：SHA-256("app_key=value&nonce=value&timestamp=value" + secret)
 */
```

---

### 2. 前端Hook修改

**文件**：`src/hooks/useXHSShare.ts`

#### 修改1：XHSShareConfig接口

**修改前**：
```typescript
export interface XHSShareConfig {
  shareInfo: { /* ... */ };
  verifyConfig: {
    appKey: string;  // ❌ 驼峰命名
    nonce: string;
    timestamp: string;
    signature: string;
  };
  fail?: (error: unknown) => void;
}
```

**修改后**：
```typescript
export interface XHSShareConfig {
  shareInfo: { /* ... */ };
  verifyConfig: {
    app_key: string;  // ✅ 下划线命名
    nonce: string;
    timestamp: string;
    signature: string;
  };
  fail?: (error: unknown) => void;
}
```

#### 修改2：VerifyConfigResponse接口

**修改前**：
```typescript
interface VerifyConfigResponse {
  appKey: string;  // ❌ 驼峰命名
  nonce: string;
  timestamp: string;
  signature: string;
}
```

**修改后**：
```typescript
interface VerifyConfigResponse {
  app_key: string;  // ✅ 下划线命名
  nonce: string;
  timestamp: string;
  signature: string;
}
```

---

## 🎯 修改原因

### 1. 符合小红书官方API标准

小红书官方API文档中，所有参数都使用下划线命名：
- `app_key`（应用标识）
- `app_secret`（应用密钥）
- `access_token`（访问令牌）
- `expires_in`（过期时间）

### 2. 统一命名规范

**之前的问题**：
- Edge Function内部使用`appKey`（驼峰）
- API请求参数使用`app_key`（下划线）
- 存在命名不一致的情况

**现在的改进**：
- 所有地方统一使用`app_key`（下划线）
- 前后端参数名称完全一致
- 避免混淆和错误

### 3. 确保签名正确

签名字符串的格式会影响签名结果：

**修改前**：
```
appKey=red.YUpzUmGVT5EPQGrN&nonce=abc123&timestamp=1706702400000
```

**修改后**：
```
app_key=red.YUpzUmGVT5EPQGrN&nonce=abc123&timestamp=1706702400000
```

虽然参数会自动排序，但使用官方标准的参数名更规范。

---

## 📊 影响范围

### 1. Edge Function

- ✅ `generateSignature`函数：参数名和内部变量
- ✅ `generateJSSignature`函数：返回值类型和对象
- ✅ 日志输出：显示`app_key`而不是`appKey`
- ✅ 注释说明：更新为`app_key`

### 2. 前端Hook

- ✅ `XHSShareConfig`接口：`verifyConfig.app_key`
- ✅ `VerifyConfigResponse`接口：`app_key`
- ✅ 类型检查：确保前后端类型一致

### 3. 小红书JS SDK调用

- ✅ 传递给小红书SDK的参数名为`app_key`
- ✅ 符合小红书官方SDK的参数要求

---

## 🔍 验证方法

### 1. 检查Edge Function日志

测试发布功能后，查看Edge Function日志：

```
签名生成参数: { app_key: "red.YUpz...", nonce: "...", timestamp: "..." }
排序后的key顺序: [ 'app_key', 'nonce', 'timestamp' ]
签名字符串（不含密钥）: app_key=red.YUpzUmGVT5EPQGrN&nonce=...&timestamp=...
```

**关键点**：
- ✅ 日志中显示`app_key`而不是`appKey`
- ✅ 排序后的key顺序包含`app_key`
- ✅ 签名字符串格式为`app_key=xxx&nonce=xxx&timestamp=xxx`

### 2. 检查前端调用

在浏览器控制台查看调用小红书SDK的参数：

```javascript
{
  shareInfo: { /* ... */ },
  verifyConfig: {
    app_key: "red.YUpzUmGVT5EPQGrN",  // ✅ 使用app_key
    nonce: "...",
    timestamp: "...",
    signature: "..."
  }
}
```

**关键点**：
- ✅ `verifyConfig`中使用`app_key`
- ✅ 参数名与小红书官方SDK要求一致

---

## ✅ 修改效果

### 修改前

```typescript
// Edge Function
const params = { appKey, nonce, timestamp };  // ❌ 驼峰命名

// 前端
interface VerifyConfigResponse {
  appKey: string;  // ❌ 驼峰命名
}
```

**问题**：
- 命名不符合小红书官方标准
- 与API请求参数不一致
- 可能导致混淆

### 修改后

```typescript
// Edge Function
const params = { app_key, nonce, timestamp };  // ✅ 下划线命名

// 前端
interface VerifyConfigResponse {
  app_key: string;  // ✅ 下划线命名
}
```

**优势**：
- ✅ 完全符合小红书官方API标准
- ✅ 前后端参数名称统一
- ✅ 避免命名混淆
- ✅ 更规范、更易维护

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

3. **查看Edge Function日志**
   - 确认日志中显示`app_key`
   - 确认签名字符串格式正确
   - 确认小红书API响应正常

4. **观察结果**
   - 如果成功：恭喜！🎉
   - 如果失败：告诉我完整的日志，我会进一步分析

---

## 📚 相关文档

- `SIGNATURE_ALGORITHM_UPDATE.md` - 签名算法优化说明
- `VARIABLE_FIX.md` - 变量重复声明错误修复说明
- `TIMESTAMP_FIX.md` - 签名参数名修复详细说明
- `FINAL_TEST_GUIDE.md` - 最终测试指南

---

**修改完成！现在所有参数名都符合小红书官方API标准！** 🚀
