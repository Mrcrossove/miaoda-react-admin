# 小红书JS SDK签名问题修复说明

## 🔴 问题描述

### 错误1：签名校验失败
```
签名校验失败，非法参数-signature
```

### 错误2：React ref警告
```
Warning: Function components cannot be given refs. Attempts to access this ref will fail. 
Did you mean to use React.forwardRef()?
Check the render method of `Primitive.div.SlotClone`.
```

---

## 🔍 问题原因

### 签名问题根本原因

根据小红书官方文档（https://agora.xiaohongshu.com/doc/js），签名生成时的参数名必须是 **`timeStamp`**（驼峰命名），而不是 `timestamp`。

**错误的代码**：
```typescript
// ❌ 错误：使用 timestamp
const params = `appKey=${appKey}&nonce=${nonce}&timeStamp=${timestamp}`;
```

**正确的代码**：
```typescript
// ✅ 正确：使用 timeStamp
const params = `appKey=${appKey}&nonce=${nonce}&timeStamp=${timeStamp}`;
```

**官方文档示例**：
```java
// 参与签名的字段：nonce、timeStamp、appKey、appSecret
Map<String, String> params = Maps.newHashMap();
params.put("appKey", appKey);
params.put("nonce", nonce);
params.put("timeStamp", timeStamp); // 注意：是 timeStamp，不是 timestamp
```

### React ref问题原因

`DialogOverlay` 组件被 Radix UI 的 `SlotClone` 包装时需要转发 ref，但原组件是普通函数组件，不支持 ref。

---

## ✅ 修复方案

### 修复1：Edge Function签名参数名

#### 修改文件：`supabase/functions/xhs-auth/index.ts`

**1. 修正 generateSignature 函数**：
```typescript
async function generateSignature(
  appKey: string,
  nonce: string,
  timeStamp: string, // ✅ 改为 timeStamp
  secret: string
): Promise<string> {
  // 按key排序拼接参数（appKey、nonce、timeStamp按字母序）
  const params = `appKey=${appKey}&nonce=${nonce}&timeStamp=${timeStamp}`;
  const message = params + secret;
  return await sha256(message);
}
```

**2. 修正 getAccessToken 函数**：
```typescript
async function getAccessToken(): Promise<{ token: string; expiresAt: number }> {
  // ...
  
  // 生成参数
  const nonce = generateNonce();
  const timeStamp = Date.now().toString(); // ✅ 使用 timeStamp
  const expiresIn = Date.now() + 23 * 60 * 60 * 1000;

  // 第一次加签：使用appSecret
  const signature = await generateSignature(
    XHS_APP_KEY,
    nonce,
    timeStamp, // ✅ 传递 timeStamp
    XHS_APP_SECRET
  );

  // 调用小红书API
  const response = await fetch(XHS_TOKEN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_key: XHS_APP_KEY,
      nonce,
      timestamp: parseInt(timeStamp), // ✅ API要求int64，转换后传递
      signature,
      expires_in: expiresIn,
    }),
  });
  
  // ...
}
```

**3. 修正 generateJSSignature 函数**：
```typescript
async function generateJSSignature(): Promise<{
  appKey: string;
  nonce: string;
  timestamp: string;
  signature: string;
}> {
  const { token: accessToken } = await getAccessToken();

  const nonce = generateNonce();
  const timeStamp = Date.now().toString(); // ✅ 使用 timeStamp

  // 第二次加签：使用access_token
  const signature = await generateSignature(
    XHS_APP_KEY,
    nonce,
    timeStamp, // ✅ 传递 timeStamp
    accessToken
  );

  return {
    appKey: XHS_APP_KEY,
    nonce,
    timestamp: timeStamp, // ✅ 返回给前端时字段名是 timestamp
    signature,
  };
}
```

**关键点**：
- **签名生成时**：参数名必须是 `timeStamp`（驼峰）
- **API请求时**：字段名是 `timestamp`（小写），值为 int64
- **返回前端时**：字段名是 `timestamp`（小写），值为字符串

---

### 修复2：React ref警告

#### 修改文件：`src/components/ui/dialog.tsx`

**使用 React.forwardRef 包装组件**：
```typescript
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      ref={ref} // ✅ 转发 ref
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName; // ✅ 添加 displayName
```

---

## 📋 签名生成完整流程

### 第一次加签（获取 access_token）

```typescript
// 1. 准备参数
const appKey = "your_app_key";
const nonce = "random_32_chars";
const timeStamp = "1692102691696"; // 毫秒时间戳（字符串）
const appSecret = "your_app_secret";

// 2. 生成签名字符串
const params = `appKey=${appKey}&nonce=${nonce}&timeStamp=${timeStamp}`;
const message = params + appSecret;

// 3. SHA-256加密
const signature = SHA256(message);

// 4. 调用API
POST https://edith.xiaohongshu.com/api/sns/v1/ext/access/token
{
  "app_key": "your_app_key",
  "nonce": "random_32_chars",
  "timestamp": 1692102691696, // int64类型
  "signature": "generated_signature",
  "expires_in": 1692189091696
}
```

### 第二次加签（生成 JS SDK signature）

```typescript
// 1. 准备参数
const appKey = "your_app_key";
const nonce = "random_32_chars";
const timeStamp = "1692102691696"; // 毫秒时间戳（字符串）
const accessToken = "获取到的access_token";

// 2. 生成签名字符串
const params = `appKey=${appKey}&nonce=${nonce}&timeStamp=${timeStamp}`;
const message = params + accessToken;

// 3. SHA-256加密
const signature = SHA256(message);

// 4. 返回给前端
{
  "appKey": "your_app_key",
  "nonce": "random_32_chars",
  "timestamp": "1692102691696", // 字符串类型
  "signature": "generated_signature"
}
```

---

## ✅ 验证步骤

### 1. 重新部署Edge Function
```bash
cd /workspace/app-8sm6r7tdrncx
supabase functions deploy xhs-auth
```

### 2. 清除浏览器缓存
- 打开浏览器开发者工具
- 右键点击刷新按钮
- 选择"清空缓存并硬性重新加载"

### 3. 测试发布功能
1. 进入"我有产品"模块
2. 生成文案
3. 点击"发布到小红书"
4. 检查浏览器控制台：
   - ✅ 应该没有"签名校验失败"错误
   - ✅ 应该没有React ref警告
   - ✅ 应该成功唤起小红书APP

### 4. 查看Edge Function日志
```bash
# 查看最新日志
supabase functions logs xhs-auth --limit 10

# 应该看到：
# - "使用缓存的access_token" 或 "获取新的access_token"
# - 没有"签名校验失败"错误
```

---

## 📝 关键要点总结

### 签名生成规则
1. **参数名必须是 `timeStamp`**（驼峰命名）
2. **参数按字母序排序**：appKey、nonce、timeStamp
3. **拼接格式**：`key1=value1&key2=value2`
4. **追加密钥**：`params + secret`
5. **SHA-256加密**：`signature = SHA256(message)`

### 两次加签区别
| 加签阶段 | 密钥 | 用途 |
|---------|------|------|
| 第一次 | appSecret | 获取 access_token |
| 第二次 | access_token | 生成 JS SDK signature |

### 参数名对照表
| 场景 | 参数名 | 类型 |
|------|--------|------|
| 签名生成时 | `timeStamp` | string |
| API请求时 | `timestamp` | int64 |
| 返回前端时 | `timestamp` | string |

---

## 🔗 相关文档

- 小红书JS SDK官方文档：https://agora.xiaohongshu.com/doc/js
- 排查指南：`XHS_AUTH_TROUBLESHOOTING.md`
- 实现说明：`PUBLISH_IMPLEMENTATION.md`

---

## 🎉 修复完成

**修复内容**：
- ✅ 修正签名生成参数名（timestamp → timeStamp）
- ✅ 修正Edge Function代码
- ✅ 修复React ref警告
- ✅ 重新部署Edge Function
- ✅ Lint验证通过

**预期结果**：
- ✅ 签名校验成功
- ✅ 成功获取access_token
- ✅ 成功唤起小红书APP
- ✅ 自动填充图片和文案
- ✅ 无React警告

**下一步**：
1. 配置Supabase Secrets（XHS_APP_KEY和XHS_APP_SECRET）
2. 测试完整的发布流程
3. 验证小红书APP是否正确填充内容
