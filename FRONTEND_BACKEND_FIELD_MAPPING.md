# 前后端字段名映射说明

## 🎯 核心问题

小红书JS SDK鉴权涉及三个环节，每个环节的字段命名格式不同：

1. **Edge Function签名计算**：使用驼峰命名（`appKey`, `timeStamp`）
2. **Edge Function返回前端**：使用下划线命名（`app_key`, `timestamp`）
3. **小红书JS SDK调用**：使用驼峰命名（`appKey`, `timestamp`）

---

## 📝 完整数据流

### 1. Edge Function内部签名计算

```typescript
// 签名参数（驼峰命名）
const signParams = {
  appKey: XHS_APP_KEY,      // ✅ 驼峰
  nonce: nonce,
  timeStamp: timestamp,     // ✅ 驼峰
};

const signature = await generateSignature(secret, signParams);
```

**字段名**：`appKey`, `timeStamp`

---

### 2. Edge Function返回给前端

```typescript
// 返回前端（下划线命名）
return {
  app_key: XHS_APP_KEY,     // ✅ 下划线
  nonce: nonce,
  timestamp: timestamp,     // ✅ 下划线
  signature: signature,
};
```

**字段名**：`app_key`, `timestamp`

---

### 3. 前端接收Edge Function响应

```typescript
// VerifyConfigResponse接口（Edge Function返回格式）
interface VerifyConfigResponse {
  app_key: string;          // ✅ 下划线
  nonce: string;
  timestamp: string;        // ✅ 下划线
  signature: string;
}
```

**字段名**：`app_key`, `timestamp`

---

### 4. 前端调用小红书JS SDK

```typescript
// XHSShareConfig接口（小红书SDK要求格式）
export interface XHSShareConfig {
  shareInfo: { ... },
  verifyConfig: {
    appKey: string;         // ✅ 驼峰
    nonce: string;
    timestamp: string;      // ✅ 驼峰
    signature: string;
  };
  fail?: (error: unknown) => void;
}
```

**字段名**：`appKey`, `timestamp`

---

### 5. 前端字段名转换

```typescript
// 在shareToXhs函数中进行转换
const shareConfig: XHSShareConfig = {
  shareInfo: {
    type: params.type,
    title: params.title,
    content: params.content,
    images: params.images,
    video: params.video,
    cover: params.cover,
  },
  verifyConfig: {
    appKey: verifyConfig.app_key,      // ✅ 转换：app_key → appKey
    nonce: verifyConfig.nonce,
    timestamp: verifyConfig.timestamp,  // ✅ 保持：timestamp
    signature: verifyConfig.signature,
  },
  fail: (error) => { ... },
};

// 调用小红书JS SDK
window.xhs.share(shareConfig);
```

**关键点**：
- ✅ 将 `app_key` 转换为 `appKey`
- ✅ 保持 `timestamp`（已经是驼峰命名）

---

## 🔍 为什么需要字段名转换？

### Edge Function返回下划线命名的原因

1. **RESTful API规范**：HTTP API通常使用下划线命名（snake_case）
2. **JSON序列化标准**：JSON字段名通常使用下划线命名
3. **跨语言兼容性**：下划线命名在不同语言中更通用

### 小红书SDK要求驼峰命名的原因

1. **JavaScript规范**：JavaScript对象属性通常使用驼峰命名（camelCase）
2. **官方API文档**：小红书官方文档明确要求使用 `appKey` 和 `timestamp`
3. **SDK内部实现**：小红书SDK内部按驼峰命名解析参数

---

## 📊 字段名对照表

| 环节 | appKey字段名 | timestamp字段名 | 说明 |
|------|------------|----------------|------|
| Edge Function签名 | `appKey` | `timeStamp` | 驼峰命名，参与签名计算 |
| Edge Function返回 | `app_key` | `timestamp` | 下划线命名，HTTP API规范 |
| 前端接收 | `app_key` | `timestamp` | 下划线命名，与Edge Function一致 |
| 小红书SDK调用 | `appKey` | `timestamp` | 驼峰命名，官方API要求 |

---

## ✅ 正确示例

### 完整的前后端交互流程

```typescript
// ========== Edge Function ==========

// 1. 签名计算（驼峰命名）
const signParams = {
  appKey: XHS_APP_KEY,
  nonce: nonce,
  timeStamp: timestamp,
};
const signature = await generateSignature(secret, signParams);

// 2. 返回前端（下划线命名）
return {
  app_key: XHS_APP_KEY,
  nonce: nonce,
  timestamp: timestamp,
  signature: signature,
};

// ========== 前端 ==========

// 3. 接收Edge Function响应（下划线命名）
const verifyConfig: VerifyConfigResponse = {
  app_key: 'red.YUpz...',
  nonce: 'abc123...',
  timestamp: '1706702400000',
  signature: 'def456...',
};

// 4. 转换为小红书SDK格式（驼峰命名）
const shareConfig: XHSShareConfig = {
  shareInfo: { ... },
  verifyConfig: {
    appKey: verifyConfig.app_key,      // ✅ 转换
    nonce: verifyConfig.nonce,
    timestamp: verifyConfig.timestamp,  // ✅ 保持
    signature: verifyConfig.signature,
  },
  fail: (e) => { ... },
};

// 5. 调用小红书JS SDK
window.xhs.share(shareConfig);
```

---

## ⚠️ 常见错误

### 错误1：前端直接使用Edge Function返回的字段名

```typescript
// ❌ 错误
const shareConfig: XHSShareConfig = {
  shareInfo: { ... },
  verifyConfig: verifyConfig,  // ❌ 直接使用，字段名不匹配
  fail: (e) => { ... },
};
```

**结果**：小红书SDK无法识别 `app_key` 字段，导致鉴权失败

---

### 错误2：Edge Function返回驼峰命名

```typescript
// ❌ 错误
return {
  appKey: XHS_APP_KEY,      // ❌ 应该用 app_key
  nonce: nonce,
  timestamp: timestamp,
  signature: signature,
};
```

**结果**：不符合RESTful API规范，前端需要额外处理

---

### 错误3：前端不进行字段名转换

```typescript
// ❌ 错误
window.xhs.share({
  shareInfo: { ... },
  verifyConfig: {
    app_key: verifyConfig.app_key,  // ❌ 应该转换为 appKey
    nonce: verifyConfig.nonce,
    timestamp: verifyConfig.timestamp,
    signature: verifyConfig.signature,
  },
  fail: (e) => { ... },
});
```

**结果**：小红书SDK无法识别 `app_key` 字段，鉴权失败

---

## 🚀 验证方法

### 1. 检查Edge Function日志

```
🔑 待签名字符串 (Params + Secret): appKey=red.YUpz...&nonce=abc123&timeStamp=1706702400000<secret>
✅ JS SDK签名生成完成
```

**关键点**：
- ✅ 签名时使用 `appKey` 和 `timeStamp`

---

### 2. 检查Edge Function响应

```json
{
  "success": true,
  "data": {
    "app_key": "red.YUpz...",
    "nonce": "abc123...",
    "timestamp": "1706702400000",
    "signature": "def456..."
  }
}
```

**关键点**：
- ✅ 返回时使用 `app_key` 和 `timestamp`

---

### 3. 检查前端调用参数

```javascript
// 浏览器控制台
console.log('调用小红书JS SDK分享:', shareConfig);

// 输出
{
  shareInfo: { ... },
  verifyConfig: {
    appKey: "red.YUpz...",      // ✅ 驼峰命名
    nonce: "abc123...",
    timestamp: "1706702400000",  // ✅ 驼峰命名
    signature: "def456..."
  },
  fail: function() { ... }
}
```

**关键点**：
- ✅ 调用SDK时使用 `appKey` 和 `timestamp`

---

## 📚 总结

### 字段名转换规则

1. **Edge Function签名**：`appKey`, `timeStamp`（驼峰）
2. **Edge Function返回**：`app_key`, `timestamp`（下划线）
3. **前端接收**：`app_key`, `timestamp`（下划线）
4. **前端转换**：`app_key` → `appKey`（驼峰）
5. **小红书SDK调用**：`appKey`, `timestamp`（驼峰）

### 关键代码

```typescript
// 前端字段名转换
verifyConfig: {
  appKey: verifyConfig.app_key,      // ✅ 转换
  nonce: verifyConfig.nonce,
  timestamp: verifyConfig.timestamp,  // ✅ 保持
  signature: verifyConfig.signature,
}
```

---

## 🔗 相关文档

- `APPKEY_TIMESTAMP_NAMING.md` - 签名参数命名规范说明
- `NONCE_TIMESTAMP_FIX.md` - 两次加签使用相同nonce和timestamp修复说明
- `SIGNATURE_ALGORITHM_UPDATE.md` - 签名算法优化说明

---

**前后端字段名映射已完成！** 🎉
