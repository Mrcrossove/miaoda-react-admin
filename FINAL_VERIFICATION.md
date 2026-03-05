# 小红书JS SDK鉴权最终验证

## ✅ 代码逻辑确认

当前Edge Function代码**完全符合**小红书官方API要求：

### 严格逻辑流程

```
1. 一次请求内，生成一组 nonce 和 timestamp
   ↓
2. 第一次加签：使用 appKey, nonce, timeStamp + appSecret 计算 signature
   发送请求：app_key, nonce, timestamp, signature
   ↓
3. 获取 access_token
   ↓
4. 第二次加签：使用 appKey, nonce, timeStamp + access_token 计算 signature
   返回前端：app_key, nonce, timestamp, signature
```

---

## 📝 代码实现验证

### 1. 生成唯一的nonce和timestamp

```typescript
// ✅ 在generateJSSignature函数开始时生成
const nonce = generateNonce();
const timestamp = Date.now().toString(); // 毫秒级时间戳字符串

console.log('本次请求使用的 Nonce/Time:', { nonce, timestamp });
```

**验证点**：
- ✅ 只生成一次
- ✅ 两次加签共用

---

### 2. 第一次加签（获取access_token）

```typescript
// ✅ 签名参数（驼峰命名）
const signParams = {
  appKey: XHS_APP_KEY,      // ✅ 驼峰
  nonce: nonce,             // ✅ 共用的nonce
  timeStamp: timestamp,     // ✅ 驼峰，共用的timestamp
};

const signature = await generateSignature(XHS_APP_SECRET, signParams);

// ✅ API请求（下划线命名）
const response = await fetch(XHS_TOKEN_API, {
  method: 'POST',
  body: JSON.stringify({
    app_key: XHS_APP_KEY,           // ✅ 下划线
    nonce: nonce,                   // ✅ 共用的nonce
    timestamp: parseInt(timestamp, 10),  // ✅ 下划线，共用的timestamp
    signature: signature,
  }),
});
```

**验证点**：
- ✅ 签名时使用驼峰命名（appKey, timeStamp）
- ✅ API请求使用下划线命名（app_key, timestamp）
- ✅ 使用共用的nonce和timestamp
- ✅ 使用appSecret作为密钥

---

### 3. 第二次加签（生成JS SDK签名）

```typescript
// ✅ 签名参数（驼峰命名）
const signParams = {
  appKey: XHS_APP_KEY,      // ✅ 驼峰
  nonce: nonce,             // ✅ 共用的nonce
  timeStamp: timestamp,     // ✅ 驼峰，共用的timestamp
};

// ✅ 使用access_token作为密钥
const signature = await generateSignature(accessToken, signParams);

// ✅ 返回前端（下划线命名）
return {
  app_key: XHS_APP_KEY,     // ✅ 下划线
  nonce: nonce,             // ✅ 共用的nonce
  timestamp: timestamp,     // ✅ 下划线，共用的timestamp
  signature: signature,
};
```

**验证点**：
- ✅ 签名时使用驼峰命名（appKey, timeStamp）
- ✅ 返回前端使用下划线命名（app_key, timestamp）
- ✅ 使用共用的nonce和timestamp
- ✅ 使用access_token作为密钥

---

## 🔍 签名算法验证

### 核心签名函数

```typescript
async function generateSignature(secretKey: string, params: Record<string, string>): Promise<string> {
  // 1. 按key的字典序排序
  const sortedKeys = Object.keys(params).sort();
  
  // 2. 拼接成 key=value&key=value 格式
  const paramString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 3. 末尾追加密钥
  const stringToSign = paramString + secretKey;
  
  // 4. SHA-256加密
  const signature = await sha256(stringToSign);
  return signature;
}
```

**验证点**：
- ✅ 按字典序排序参数
- ✅ 拼接成key=value&key=value格式
- ✅ 末尾追加密钥（无分隔符）
- ✅ SHA-256加密

---

## 📊 字段名对照表

| 环节 | appKey字段名 | timestamp字段名 | nonce | signature |
|------|------------|----------------|-------|-----------|
| 第一次签名参数 | `appKey` | `timeStamp` | ✅ | - |
| 第一次API请求 | `app_key` | `timestamp` | ✅ | ✅ |
| 第二次签名参数 | `appKey` | `timeStamp` | ✅ | - |
| 返回前端 | `app_key` | `timestamp` | ✅ | ✅ |

**关键点**：
- ✅ 两次签名使用相同的nonce和timestamp
- ✅ 签名时使用驼峰命名
- ✅ API请求和返回使用下划线命名

---

## 🚀 测试步骤

### 1. 清除浏览器缓存

```
1. 按F12打开开发者工具
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"
```

### 2. 等待Edge Function部署生效

```
等待30秒-1分钟，确保Edge Function部署完成
```

### 3. 测试发布功能

```
1. 进入"我有产品"或"图片工厂"
2. 生成内容
3. 点击"发布到小红书"按钮
```

### 4. 查看Edge Function日志

在Supabase控制台查看日志，应该看到：

```
📥 收到鉴权请求
🔐 开始生成JS SDK签名（一次调用，两次加签）...
本次请求使用的 Nonce/Time: { nonce: "abc123...", timestamp: "1706702400000" }
🔄 获取新的access_token...
🔑 待签名字符串 (Params + Secret): appKey=red.YUpz...&nonce=abc123...&timeStamp=1706702400000<appSecret>
📥 Token API 原始响应: {"success":true,"data":{"access_token":"...","expires_in":7200}}
✅ 成功获取access_token
🔑 待签名字符串 (Params + Secret): appKey=red.YUpz...&nonce=abc123...&timeStamp=1706702400000<access_token>
✅ JS SDK签名生成完成
```

**关键验证点**：
- ✅ 两次签名使用相同的nonce（`abc123...`）
- ✅ 两次签名使用相同的timestamp（`1706702400000`）
- ✅ 第一次签名使用appSecret
- ✅ 第二次签名使用access_token
- ✅ 签名字符串格式正确（appKey=...&nonce=...&timeStamp=...）

---

## 🎯 预期结果

### 成功场景

```
✅ Edge Function返回：
{
  "success": true,
  "data": {
    "app_key": "red.YUpz...",
    "nonce": "abc123...",
    "timestamp": "1706702400000",
    "signature": "def456..."
  }
}

✅ 前端调用小红书SDK：
window.xhs.share({
  shareInfo: { ... },
  verifyConfig: {
    appKey: "red.YUpz...",      // ✅ 转换为驼峰
    nonce: "abc123...",
    timestamp: "1706702400000",
    signature: "def456..."
  },
  fail: (e) => { ... }
})

✅ 小红书APP打开，显示草稿箱
```

### 失败场景

如果出现错误，请检查：

1. **签名验证失败**
   - 检查nonce和timestamp是否相同
   - 检查签名参数是否使用驼峰命名
   - 检查签名字符串格式是否正确

2. **API请求失败**
   - 检查app_key和timestamp是否使用下划线命名
   - 检查timestamp是否转换为数字
   - 检查网络连接

3. **前端调用失败**
   - 检查verifyConfig是否使用驼峰命名（appKey）
   - 检查小红书SDK是否加载
   - 检查小红书APP是否安装

---

## 📚 相关文档

- `NONCE_TIMESTAMP_FIX.md` - 两次加签使用相同nonce和timestamp修复说明
- `APPKEY_TIMESTAMP_NAMING.md` - 签名参数命名规范说明
- `FRONTEND_BACKEND_FIELD_MAPPING.md` - 前后端字段名映射说明
- `SIGNATURE_ALGORITHM_UPDATE.md` - 签名算法优化说明

---

## ✅ 最终确认

- ✅ 代码逻辑完全符合小红书官方API要求
- ✅ 两次加签使用相同的nonce和timestamp
- ✅ 签名参数使用正确的驼峰命名
- ✅ API请求和返回使用正确的下划线命名
- ✅ 前端正确转换字段名
- ✅ Edge Function已部署
- ✅ Lint验证通过

**准备就绪，可以开始测试！** 🚀
