# 签名参数命名规范说明

## 🎯 核心规则

小红书JS SDK鉴权需要区分**签名参数**和**API请求参数**的命名格式：

### 签名时（参与签名计算）
使用**驼峰命名**：
- `appKey`（不是 `app_key`）
- `timeStamp`（不是 `timestamp`）
- `nonce`

### API请求时（HTTP Body）
使用**下划线命名**：
- `app_key`（不是 `appKey`）
- `timestamp`（不是 `timeStamp`）
- `nonce`

### 返回前端时
使用**下划线命名**：
- `app_key`
- `timestamp`
- `nonce`
- `signature`

---

## 📝 完整流程

### 第一次加签（获取access_token）

```typescript
// 1. 签名参数（驼峰命名）
const signParams = {
  appKey: XHS_APP_KEY,      // ✅ 驼峰命名
  nonce: nonce,
  timeStamp: timestamp,     // ✅ 驼峰命名
};

// 2. 生成签名
const signature = await generateSignature(XHS_APP_SECRET, signParams);

// 3. API请求（下划线命名）
const response = await fetch(XHS_TOKEN_API, {
  method: 'POST',
  body: JSON.stringify({
    app_key: XHS_APP_KEY,   // ✅ 下划线命名
    nonce: nonce,
    timestamp: parseInt(timestamp, 10),  // ✅ 下划线命名
    signature: signature,
  }),
});
```

**关键点**：
- ✅ 签名时使用 `appKey` 和 `timeStamp`（驼峰）
- ✅ API请求时使用 `app_key` 和 `timestamp`（下划线）

---

### 第二次加签（生成JS SDK签名）

```typescript
// 1. 签名参数（驼峰命名）
const signParams = {
  appKey: XHS_APP_KEY,      // ✅ 驼峰命名
  nonce: nonce,
  timeStamp: timestamp,     // ✅ 驼峰命名
};

// 2. 生成签名
const signature = await generateSignature(accessToken, signParams);

// 3. 返回前端（下划线命名）
return {
  app_key: XHS_APP_KEY,     // ✅ 下划线命名
  nonce: nonce,
  timestamp: timestamp,     // ✅ 下划线命名
  signature: signature,
};
```

**关键点**：
- ✅ 签名时使用 `appKey` 和 `timeStamp`（驼峰）
- ✅ 返回前端时使用 `app_key` 和 `timestamp`（下划线）

---

## 🔍 为什么要区分命名格式？

### 签名算法要求

小红书的签名算法按照**字典序**排序参数：

```
appKey=red.YUpz...&nonce=abc123&timeStamp=1706702400000
```

**字典序排序结果**：
1. `appKey`（a开头）
2. `nonce`（n开头）
3. `timeStamp`（t开头）

如果使用 `app_key` 和 `timestamp`：
```
app_key=red.YUpz...&nonce=abc123&timestamp=1706702400000
```

**字典序排序结果**：
1. `app_key`（a开头，下划线在字母后面）
2. `nonce`（n开头）
3. `timestamp`（t开头，全小写）

**排序结果不同，导致签名不同！**

---

## ⚠️ 常见错误

### 错误1：签名时使用下划线命名

```typescript
// ❌ 错误
const signParams = {
  app_key: XHS_APP_KEY,     // ❌ 应该用 appKey
  nonce: nonce,
  timestamp: timestamp,     // ❌ 应该用 timeStamp
};
```

**结果**：签名验证失败，API返回"非法参数"错误

---

### 错误2：API请求时使用驼峰命名

```typescript
// ❌ 错误
body: JSON.stringify({
  appKey: XHS_APP_KEY,      // ❌ 应该用 app_key
  nonce: nonce,
  timeStamp: timestamp,     // ❌ 应该用 timestamp
  signature: signature,
})
```

**结果**：API无法识别参数，返回"缺少必需参数"错误

---

### 错误3：返回前端时使用驼峰命名

```typescript
// ❌ 错误
return {
  appKey: XHS_APP_KEY,      // ❌ 应该用 app_key
  nonce: nonce,
  timeStamp: timestamp,     // ❌ 应该用 timestamp
  signature: signature,
};
```

**结果**：前端无法正确使用鉴权配置

---

## ✅ 正确示例

### 完整的两次加签流程

```typescript
async function generateJSSignature() {
  // 1. 生成唯一的 nonce 和 timestamp
  const nonce = generateNonce();
  const timestamp = Date.now().toString();

  // 2. 第一次加签：获取 access_token
  // 签名参数使用驼峰命名
  const signParams1 = {
    appKey: XHS_APP_KEY,    // ✅ 驼峰
    nonce: nonce,
    timeStamp: timestamp,   // ✅ 驼峰
  };
  const signature1 = await generateSignature(XHS_APP_SECRET, signParams1);
  
  // API请求使用下划线命名
  const response = await fetch(XHS_TOKEN_API, {
    method: 'POST',
    body: JSON.stringify({
      app_key: XHS_APP_KEY,       // ✅ 下划线
      nonce: nonce,
      timestamp: parseInt(timestamp, 10),  // ✅ 下划线
      signature: signature1,
    }),
  });
  
  const accessToken = response.data.access_token;

  // 3. 第二次加签：生成 JS SDK 签名
  // 签名参数使用驼峰命名
  const signParams2 = {
    appKey: XHS_APP_KEY,    // ✅ 驼峰
    nonce: nonce,           // ✅ 使用相同的nonce
    timeStamp: timestamp,   // ✅ 驼峰，使用相同的timestamp
  };
  const signature2 = await generateSignature(accessToken, signParams2);

  // 4. 返回前端使用下划线命名
  return {
    app_key: XHS_APP_KEY,   // ✅ 下划线
    nonce: nonce,
    timestamp: timestamp,   // ✅ 下划线
    signature: signature2,
  };
}
```

---

## 🚀 验证方法

### 1. 检查Edge Function日志

测试发布功能后，查看日志中的签名字符串：

```
🔑 待签名字符串 (Params + Secret): appKey=red.YUpz...&nonce=abc123&timeStamp=1706702400000a2fe1f2e0a05aaf6016f8073d8cd7989
```

**关键点**：
- ✅ 参数顺序：`appKey` → `nonce` → `timeStamp`
- ✅ 使用驼峰命名：`appKey`、`timeStamp`
- ✅ 末尾追加密钥

---

### 2. 对比正确和错误的签名字符串

**正确**（驼峰命名）：
```
appKey=red.YUpz...&nonce=abc123&timeStamp=1706702400000<secret>
```

**错误**（下划线命名）：
```
app_key=red.YUpz...&nonce=abc123&timestamp=1706702400000<secret>
```

**结果**：两个字符串不同，生成的签名也不同！

---

## 📚 总结

| 场景 | 参数命名格式 | 示例 |
|------|------------|------|
| 签名计算 | 驼峰命名 | `appKey`, `timeStamp` |
| API请求 | 下划线命名 | `app_key`, `timestamp` |
| 返回前端 | 下划线命名 | `app_key`, `timestamp` |

**记住**：
- 🔐 签名时用驼峰（`appKey`, `timeStamp`）
- 📡 请求时用下划线（`app_key`, `timestamp`）
- 📤 返回时用下划线（`app_key`, `timestamp`）

---

## 🔗 相关文档

- `NONCE_TIMESTAMP_FIX.md` - 两次加签使用相同nonce和timestamp修复说明
- `SIGNATURE_ALGORITHM_UPDATE.md` - 签名算法优化说明
- `SIGNATURE_REFACTOR.md` - 签名生成逻辑重构说明

---

**签名参数命名规范已确认！** 🎉
