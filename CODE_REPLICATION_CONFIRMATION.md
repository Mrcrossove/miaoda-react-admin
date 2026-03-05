# 代码复刻确认文档

## ✅ 百分百复刻完成

已完全按照用户提供的代码进行替换，确保逻辑完全一致。

---

## 🔑 关键变更对比

### 变更1：密钥配置方式

**原代码（使用环境变量）**：
```typescript
const XHS_APP_KEY = Deno.env.get('XHS_APP_KEY') || '';
const XHS_APP_SECRET = Deno.env.get('XHS_APP_SECRET') || '';
```

**新代码（硬编码）**：
```typescript
const XHS_APP_KEY = 'red.YUpzUmGVT5EPQGrN';
const XHS_APP_SECRET = 'a2fe1f2e0a05aaf6016f8073d8cd7989';
```

**说明**：
- ✅ 已替换为用户提供的硬编码密钥
- ✅ 不再依赖环境变量
- ✅ 密钥值完全一致

---

## 📝 代码逻辑确认

### 1. 生成nonce和timestamp

```typescript
// 1. 生成唯一的 nonce 和 timestamp
const nonce = generateNonce();
const timestamp = Date.now().toString(); // 毫秒级时间戳字符串

console.log('本次请求使用的 Nonce/Time:', { nonce, timestamp });
```

**确认**：
- ✅ 只生成一次
- ✅ 两次加签共用
- ✅ 使用毫秒级时间戳字符串

---

### 2. 第一次加签（获取access_token）

```typescript
// 第一次加签：使用 appKey, nonce, timeStamp + appSecret
// 注意：这里使用 appKey (驼峰)，不是 app_key
const signParams = {
  appKey: XHS_APP_KEY,
  nonce: nonce,
  timeStamp: timestamp, // 字符串形式的时间戳
};

const signature = await generateSignature(XHS_APP_SECRET, signParams);

// 发送 HTTP POST 请求
// 注意：Body 字段名使用 app_key, nonce, timestamp (下划线)
const response = await fetch(XHS_TOKEN_API, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    app_key: XHS_APP_KEY,
    nonce: nonce,
    timestamp: parseInt(timestamp, 10), // API文档要求 int64，这里传数字
    signature: signature,
  }),
});
```

**确认**：
- ✅ 签名参数使用驼峰命名（appKey, timeStamp）
- ✅ API请求使用下划线命名（app_key, timestamp）
- ✅ timestamp转换为数字
- ✅ 使用appSecret作为密钥

---

### 3. 第二次加签（生成JS SDK签名）

```typescript
// 3. 第二次加签：使用 access_token 生成前端需要的 signature
// 参与签名的字段依然是：appKey, nonce, timeStamp
const signParams = {
  appKey: XHS_APP_KEY,
  nonce: nonce,
  timeStamp: timestamp,
};

// 密钥使用 access_token
const signature = await generateSignature(accessToken, signParams);

console.log('✅ JS SDK签名生成完成');

// 4. 返回给前端
return {
  app_key: XHS_APP_KEY,
  nonce: nonce,
  timestamp: timestamp,
  signature: signature,
};
```

**确认**：
- ✅ 签名参数使用驼峰命名（appKey, timeStamp）
- ✅ 使用相同的nonce和timestamp
- ✅ 使用access_token作为密钥
- ✅ 返回前端使用下划线命名（app_key, timestamp）

---

## 🔍 签名算法确认

```typescript
async function generateSignature(secretKey: string, params: Record<string, string>): Promise<string> {
  // 1. 按key的字典序排序
  const sortedKeys = Object.keys(params).sort();
  
  // 2. 拼接成 key=value&key=value 格式 (原始值，不URL转义)
  const paramString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 3. 末尾追加密钥 (string1 + secret)
  const stringToSign = paramString + secretKey;
  
  // 调试日志
  console.log('🔑 待签名字符串 (Params + Secret):', stringToSign);

  // 4. SHA-256加密
  const signature = await sha256(stringToSign);
  return signature;
}
```

**确认**：
- ✅ 按字典序排序
- ✅ 拼接key=value&key=value格式
- ✅ 末尾追加密钥（无分隔符）
- ✅ SHA-256加密
- ✅ 包含调试日志

---

## 📊 完整数据流

```
1. generateJSSignature() 开始
   ↓
2. 生成 nonce 和 timestamp（只生成一次）
   ↓
3. 调用 getAccessToken(nonce, timestamp)
   ├─ 签名参数：{ appKey, nonce, timeStamp }
   ├─ 密钥：appSecret
   ├─ API请求：{ app_key, nonce, timestamp, signature }
   └─ 返回：access_token
   ↓
4. 第二次加签
   ├─ 签名参数：{ appKey, nonce, timeStamp }（相同的nonce和timestamp）
   ├─ 密钥：access_token
   └─ 生成：signature
   ↓
5. 返回前端
   └─ { app_key, nonce, timestamp, signature }
```

---

## ✅ 验证清单

- [x] 密钥配置：使用硬编码方式
- [x] 密钥值：完全一致
- [x] nonce生成：只生成一次
- [x] timestamp生成：只生成一次
- [x] 第一次加签：使用appSecret
- [x] 第二次加签：使用access_token
- [x] 两次加签：使用相同的nonce和timestamp
- [x] 签名参数：使用驼峰命名（appKey, timeStamp）
- [x] API请求：使用下划线命名（app_key, timestamp）
- [x] 返回前端：使用下划线命名（app_key, timestamp）
- [x] 签名算法：按字典序排序 + 拼接 + 追加密钥 + SHA-256
- [x] 调试日志：完整保留
- [x] 错误处理：完整保留
- [x] CORS配置：完整保留
- [x] 缓存机制：完整保留

---

## 🚀 部署状态

- ✅ Edge Function已重新部署
- ✅ Lint验证通过（108个文件）
- ✅ Git提交完成（总提交数：187）

---

## 📚 测试步骤

1. **清除浏览器缓存**
   - 按F12打开开发者工具
   - 右键点击刷新按钮
   - 选择"清空缓存并硬性重新加载"

2. **等待部署生效**
   - 等待30秒-1分钟
   - 确保Edge Function部署完成

3. **测试发布功能**
   - 进入"我有产品"或"图片工厂"
   - 生成内容
   - 点击"发布到小红书"按钮

4. **查看Edge Function日志**
   - 在Supabase控制台查看日志
   - 验证nonce和timestamp相同
   - 验证两次签名使用相同参数

---

## 🎯 预期日志输出

```
📥 收到鉴权请求
🔐 开始生成JS SDK签名（一次调用，两次加签）...
本次请求使用的 Nonce/Time: { nonce: "abc123...", timestamp: "1706702400000" }
🔄 获取新的access_token...
🔑 待签名字符串 (Params + Secret): appKey=red.YUpzUmGVT5EPQGrN&nonce=abc123...&timeStamp=1706702400000a2fe1f2e0a05aaf6016f8073d8cd7989
📥 Token API 原始响应: {"success":true,"data":{"access_token":"...","expires_in":7200}}
✅ 成功获取access_token
🔑 待签名字符串 (Params + Secret): appKey=red.YUpzUmGVT5EPQGrN&nonce=abc123...&timeStamp=1706702400000<access_token>
✅ JS SDK签名生成完成
```

**关键验证点**：
- ✅ 两次签名使用相同的nonce（`abc123...`）
- ✅ 两次签名使用相同的timestamp（`1706702400000`）
- ✅ 第一次签名末尾是appSecret
- ✅ 第二次签名末尾是access_token

---

## ✨ 总结

**代码已百分百复刻用户提供的版本！**

所有逻辑、命名、格式、注释都与用户提供的代码完全一致。

---

**文档创建时间**：2026-01-08  
**总提交数**：187  
**最新提交**：ab24112 (fix: 百分百复刻用户提供的小红书JS SDK鉴权代码)
