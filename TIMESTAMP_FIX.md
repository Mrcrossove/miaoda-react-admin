# 签名参数名修复说明

## 🔧 修复内容

### 问题描述

之前的代码中存在参数命名不一致的问题：
- **签名生成**：使用驼峰命名 `timeStamp`（大写S）
- **API请求**：使用小写 `timestamp`
- **可能导致**：签名校验失败，因为签名字符串和实际请求参数不匹配

### 修复方案

统一所有地方使用小写 `timestamp`，确保签名生成和API请求完全一致。

---

## 📝 详细修改

### 1. generateSignature 函数

**修改前**：
```typescript
async function generateSignature(
  appKey: string,
  nonce: string,
  timeStamp: string,  // ❌ 驼峰命名
  secret: string
): Promise<string> {
  const params = `appKey=${appKey}&nonce=${nonce}&timeStamp=${timeStamp}`;  // ❌
  // ...
}
```

**修改后**：
```typescript
async function generateSignature(
  appKey: string,
  nonce: string,
  timestamp: string,  // ✅ 小写
  secret: string
): Promise<string> {
  const params = `appKey=${appKey}&nonce=${nonce}&timestamp=${timestamp}`;  // ✅
  // ...
}
```

**影响**：
- 签名字符串从 `appKey=xxx&nonce=xxx&timeStamp=xxx` 
- 改为 `appKey=xxx&nonce=xxx&timestamp=xxx`
- 与API请求参数名完全一致

---

### 2. getAccessToken 函数

**修改前**：
```typescript
async function getAccessToken(): Promise<{ token: string; expiresAt: number }> {
  const nonce = generateNonce();
  const timeStamp = Date.now().toString();  // ❌ 驼峰命名
  
  const signature = await generateSignature(
    XHS_APP_KEY,
    nonce,
    timeStamp,  // ❌
    XHS_APP_SECRET
  );
  
  // API请求
  body: JSON.stringify({
    app_key: XHS_APP_KEY,
    nonce,
    timestamp: parseInt(timeStamp),  // ✅ API使用小写
    signature,
    expires_in: expiresIn,
  })
}
```

**修改后**：
```typescript
async function getAccessToken(): Promise<{ token: string; expiresAt: number }> {
  const nonce = generateNonce();
  const timestamp = Date.now().toString();  // ✅ 小写
  
  const signature = await generateSignature(
    XHS_APP_KEY,
    nonce,
    timestamp,  // ✅
    XHS_APP_SECRET
  );
  
  // API请求
  body: JSON.stringify({
    app_key: XHS_APP_KEY,
    nonce,
    timestamp: parseInt(timestamp),  // ✅ 完全一致
    signature,
    expires_in: expiresIn,
  })
}
```

**影响**：
- 签名生成和API请求使用相同的变量名
- 避免混淆和错误

---

### 3. generateJSSignature 函数

**修改前**：
```typescript
async function generateJSSignature(): Promise<{
  appKey: string;
  nonce: string;
  timestamp: string;  // ✅ 返回值已经是小写
  signature: string;
}> {
  const nonce = generateNonce();
  const timeStamp = Date.now().toString();  // ❌ 变量名驼峰
  
  const signature = await generateSignature(
    XHS_APP_KEY,
    nonce,
    timeStamp,  // ❌
    accessToken
  );
  
  return {
    appKey: XHS_APP_KEY,
    nonce,
    timestamp: timeStamp,  // ❌ 赋值时转换
    signature,
  };
}
```

**修改后**：
```typescript
async function generateJSSignature(): Promise<{
  appKey: string;
  nonce: string;
  timestamp: string;  // ✅ 返回值小写
  signature: string;
}> {
  const nonce = generateNonce();
  const timestamp = Date.now().toString();  // ✅ 变量名小写
  
  const signature = await generateSignature(
    XHS_APP_KEY,
    nonce,
    timestamp,  // ✅
    accessToken
  );
  
  return {
    appKey: XHS_APP_KEY,
    nonce,
    timestamp,  // ✅ 直接使用
    signature,
  };
}
```

**影响**：
- 变量名和返回值字段名完全一致
- 代码更清晰，避免不必要的转换

---

## 🎯 修复效果

### 签名生成流程（修复后）

1. **第一次加签（获取access_token）**
   ```
   参数：appKey, nonce, timestamp
   签名字符串：appKey=red.YUpzUmGVT5EPQGrN&nonce=abc123&timestamp=1706702400000
   追加密钥：...timestamp=1706702400000a2fe1f2e0a05aaf6016f8073d8cd7989
   SHA-256：生成signature
   
   API请求：
   {
     "app_key": "red.YUpzUmGVT5EPQGrN",
     "nonce": "abc123",
     "timestamp": 1706702400000,  // ✅ 与签名字符串一致
     "signature": "...",
     "expires_in": ...
   }
   ```

2. **第二次加签（生成JS SDK签名）**
   ```
   参数：appKey, nonce, timestamp
   签名字符串：appKey=red.YUpzUmGVT5EPQGrN&nonce=xyz789&timestamp=1706702401000
   追加密钥：...timestamp=1706702401000<access_token>
   SHA-256：生成signature
   
   返回前端：
   {
     "appKey": "red.YUpzUmGVT5EPQGrN",
     "nonce": "xyz789",
     "timestamp": "1706702401000",  // ✅ 与签名字符串一致
     "signature": "..."
   }
   ```

---

## ✅ 验证要点

### 日志输出

修复后，日志应该显示：

```
签名生成参数: { appKey: "red.YUpz...", nonce: "...", timestamp: "17067024..." }
签名字符串（不含密钥）: appKey=red.YUpzUmGVT5EPQGrN&nonce=...&timestamp=...
完整签名字符串: appKey=red.YUpzUmGVT5EPQGrN&nonce=...&timestamp=...a2fe1f2e...
生成的签名: abcdef1234567890abcd...

请求参数: { app_key: "red.YUpzUmGVT5EPQGrN", nonce: "...", timestamp: 1706702400000, expires_in: ... }
```

**关键点**：
- ✅ 签名字符串中是 `timestamp=...`（小写）
- ✅ 请求参数中是 `timestamp: ...`（小写）
- ✅ 两者完全一致

---

## 🔍 为什么这很重要？

### 小红书API签名校验流程

1. **服务端接收请求**
   - 获取请求参数：`app_key`, `nonce`, `timestamp`, `signature`, `expires_in`

2. **服务端重新计算签名**
   - 使用相同的算法：`appKey=xxx&nonce=xxx&timestamp=xxx` + `appSecret`
   - 生成签名：`SHA-256(...)`

3. **对比签名**
   - 如果客户端发送的签名与服务端计算的签名一致 → ✅ 通过
   - 如果不一致 → ❌ 返回"签名校验失败"

### 之前的问题

如果我们的签名字符串是：
```
appKey=xxx&nonce=xxx&timeStamp=xxx  // ❌ 大写S
```

但API请求参数是：
```
{
  "timestamp": xxx  // ✅ 小写
}
```

那么服务端重新计算签名时会使用：
```
appKey=xxx&nonce=xxx&timestamp=xxx  // ✅ 小写（从请求参数中获取）
```

**结果**：客户端签名 ≠ 服务端签名 → 签名校验失败！

---

## 📚 参考

### 小红书官方文档

签名生成规则：
> 参与签名的字段包括 nonce（随机字符串）， **timestamp**（时间戳）， appKey (应用标识)，appSecret（应用秘钥）

注意：官方文档明确使用小写 `timestamp`。

---

## 🎉 总结

这次修复确保了：
1. ✅ 签名生成使用小写 `timestamp`
2. ✅ API请求使用小写 `timestamp`
3. ✅ 两者完全一致，避免签名校验失败
4. ✅ 代码更清晰，变量命名统一

**下一步**：
- 清除浏览器缓存
- 重新测试发布功能
- 查看Edge Function日志
- 验证签名是否正确
