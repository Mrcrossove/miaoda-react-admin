# 小红书JS SDK鉴权问题排查指南

## 🔴 当前问题

**错误信息**：
```
POST https://backend.appmiaoda.com/projects/supabase267647421859807232/functions/v1/xhs-auth 500 (Internal Server Error)
获取鉴权配置失败: FunctionsHttpError: Edge Function returned a non-2xx status code
```

**Edge Function日志**：
```
鉴权失败: Error: 响应中没有access_token
    at getAccessToken (file:///var/tmp/sb-compile-edge-runtime/functions/xhs-auth/index.ts:83:11)
```

---

## 🔍 问题原因

Edge Function `xhs-auth` 在调用小红书API获取 `access_token` 时失败，原因可能是：

### 1. 环境变量未配置 ⚠️
**最可能的原因**：Supabase Secrets中的 `XHS_APP_KEY` 或 `XHS_APP_SECRET` 未配置或配置错误。

### 2. 小红书应用未审核通过
如果应用还未通过小红书开放平台的审核，API调用会失败。

### 3. API响应格式变化
小红书API的响应格式可能与文档不一致。

---

## ✅ 解决方案

### 方案1：配置Supabase Secrets（推荐）

#### 步骤1：获取小红书应用凭证

1. 访问小红书开放平台：https://agora.xiaohongshu.com/
2. 登录并进入「应用管理」
3. 如果还没有应用，点击「快速接入」创建应用
4. 等待审核通过（通常需要1-3个工作日）
5. 审核通过后，在应用详情页获取：
   - `appKey`（应用的唯一标识）
   - `appSecret`（应用秘钥）

#### 步骤2：配置Supabase Secrets

1. 打开Supabase Dashboard
2. 进入项目：`supabase267647421859807232`
3. 点击左侧菜单「Edge Functions」
4. 点击「Secrets」标签
5. 添加以下两个密钥：

| 密钥名称 | 值 | 说明 |
|---------|---|------|
| `XHS_APP_KEY` | 你的appKey | 从小红书开放平台获取 |
| `XHS_APP_SECRET` | 你的appSecret | 从小红书开放平台获取 |

6. 点击「Save」保存

#### 步骤3：重新部署Edge Function

配置完Secrets后，需要重新部署Edge Function：

```bash
cd /workspace/app-8sm6r7tdrncx
# 重新部署xhs-auth函数
supabase functions deploy xhs-auth
```

或者在Supabase Dashboard中：
1. 进入「Edge Functions」
2. 找到 `xhs-auth` 函数
3. 点击「Redeploy」

#### 步骤4：测试

1. 刷新应用页面
2. 进入"我有产品"模块
3. 生成文案后点击"发布到小红书"
4. 检查浏览器控制台是否还有错误

---

### 方案2：添加详细日志（调试用）

如果配置了Secrets后仍然失败，可以添加详细日志来排查问题。

修改 `supabase/functions/xhs-auth/index.ts`，在第105-110行添加日志：

```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error('获取access_token失败:', errorText);
  console.error('请求参数:', { app_key: XHS_APP_KEY, nonce, timestamp, signature });
  throw new Error(`获取access_token失败: ${response.status} ${errorText}`);
}

const data = await response.json();
console.log('小红书API响应:', data); // 添加这行日志

if (!data.access_token) {
  console.error('响应中没有access_token:', data);
  throw new Error('响应中没有access_token');
}
```

然后重新部署，再次测试，查看Edge Function日志：

```bash
# 查看日志
supabase functions logs xhs-auth
```

---

### 方案3：使用测试模式（临时方案）

如果小红书应用还未审核通过，可以暂时使用降级方案（复制文案到剪贴板）。

修改 `src/hooks/useXHSShare.ts`，在 `shareToXhs` 函数中添加降级逻辑：

```typescript
const shareToXhs = async (params: XHSShareParams) => {
  try {
    // 尝试获取鉴权配置
    const verifyConfig = await getVerifyConfig();
    
    // 调用JS SDK
    // ...
  } catch (error) {
    console.error('获取鉴权配置失败，使用降级方案:', error);
    
    // 降级方案：复制文案到剪贴板
    const copyText = `${params.title}\n\n${params.content}`;
    await navigator.clipboard.writeText(copyText);
    
    toast.info('小红书SDK暂不可用', {
      description: '文案已复制到剪贴板，请手动打开小红书粘贴',
      duration: 5000,
    });
    
    // 尝试打开小红书APP
    window.location.href = 'xhsdiscover://';
  }
};
```

---

## 📋 检查清单

在配置完成后，请确认以下事项：

- [ ] 已在小红书开放平台注册应用
- [ ] 应用已通过审核（状态为"已上线"）
- [ ] 已获取 `appKey` 和 `appSecret`
- [ ] 已在Supabase Dashboard配置Secrets
- [ ] Secrets名称完全正确（`XHS_APP_KEY` 和 `XHS_APP_SECRET`）
- [ ] 已重新部署Edge Function
- [ ] 已测试发布功能

---

## 🔗 相关文档

- 小红书开放平台：https://agora.xiaohongshu.com/
- JS SDK文档：https://agora.xiaohongshu.com/doc/js
- Supabase Edge Functions文档：https://supabase.com/docs/guides/functions
- 实现说明：`PUBLISH_IMPLEMENTATION.md`

---

## 💡 常见问题

### Q1: 为什么需要配置Secrets？
A: `appSecret` 是敏感信息，不能暴露在前端代码中。必须在服务端（Edge Function）中使用，通过Supabase Secrets安全存储。

### Q2: 如何知道应用是否审核通过？
A: 登录小红书开放平台，进入「应用管理」，查看应用状态。如果显示"已上线"，说明审核通过。

### Q3: 配置Secrets后多久生效？
A: 配置Secrets后需要重新部署Edge Function才能生效。部署后立即生效。

### Q4: 如果没有小红书应用怎么办？
A: 需要先在小红书开放平台注册应用。注册流程：
1. 访问 https://agora.xiaohongshu.com/
2. 点击「快速接入」
3. 填写企业和应用信息
4. 提交审核
5. 等待审核通过（1-3个工作日）

### Q5: 测试环境可以使用吗？
A: 小红书开放平台提供测试环境，但需要单独申请。建议先使用生产环境进行开发测试。

---

## 🎯 下一步

1. **立即行动**：按照「方案1」配置Supabase Secrets
2. **测试验证**：配置完成后测试发布功能
3. **查看日志**：如果仍然失败，查看Edge Function日志排查问题
4. **联系支持**：如果问题持续，可以联系小红书开放平台技术支持

---

**重要提示**：
- 请妥善保管 `appSecret`，不要泄露给他人
- 不要将 `appSecret` 提交到Git仓库
- 定期更换 `appSecret` 以提高安全性
