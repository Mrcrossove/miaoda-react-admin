# 小红书SDK鉴权问题调试指南

## 🔍 当前状态

已添加完整的调试日志到Edge Function `xhs-auth`，现在可以清楚地看到每一步的执行情况。

---

## 📋 调试步骤

### 步骤1：查看Edge Function日志

在浏览器中点击"发布到小红书"后，立即查看Edge Function日志：

```bash
# 查看最新的10条日志
supabase functions logs xhs-auth --limit 10
```

或者在Supabase Dashboard中：
1. 进入项目：`supabase267647421859807232`
2. 点击左侧菜单「Edge Functions」
3. 点击 `xhs-auth` 函数
4. 点击「Logs」标签
5. 查看最新日志

---

### 步骤2：分析日志输出

#### 正常流程的日志应该是：

```
=== 小红书SDK配置检查 ===
XHS_APP_KEY: 12345678...
XHS_APP_SECRET: 已配置

📥 收到鉴权请求
🔐 开始生成JS SDK签名...
🔄 获取新的access_token...
请求参数: { app_key: "...", nonce: "...", timestamp: 1234567890, expires_in: 1234567890 }
签名生成参数: { appKey: "...", nonce: "...", timeStamp: "1234567890..." }
签名字符串（不含密钥）: appKey=...&nonce=...&timeStamp=...
生成的签名: abcdef1234567890abcd...
小红书API响应状态: 200
小红书API响应数据: { access_token: "...", expires_in: 1234567890 }
✅ 成功获取access_token
获取到access_token: abcdef1234...
生成nonce和timeStamp: { nonce: "...", timeStamp: "..." }
签名生成参数: { appKey: "...", nonce: "...", timeStamp: "..." }
签名字符串（不含密钥）: appKey=...&nonce=...&timeStamp=...
生成的签名: xyz123456789...
✅ JS SDK签名生成完成
✅ 鉴权成功，返回配置
```

#### 如果环境变量未配置，日志会显示：

```
=== 小红书SDK配置检查 ===
XHS_APP_KEY: 未配置
XHS_APP_SECRET: 未配置

📥 收到鉴权请求
❌ 缺少小红书配置
❌ 鉴权失败: Error: 缺少小红书配置：XHS_APP_KEY 或 XHS_APP_SECRET 未设置
```

**解决方案**：需要在Supabase Dashboard配置Secrets（参考 `XHS_AUTH_TROUBLESHOOTING.md`）

#### 如果签名错误，日志会显示：

```
=== 小红书SDK配置检查 ===
XHS_APP_KEY: 12345678...
XHS_APP_SECRET: 已配置

📥 收到鉴权请求
🔐 开始生成JS SDK签名...
🔄 获取新的access_token...
请求参数: { app_key: "...", nonce: "...", timestamp: 1234567890, expires_in: 1234567890 }
签名生成参数: { appKey: "...", nonce: "...", timeStamp: "1234567890..." }
签名字符串（不含密钥）: appKey=...&nonce=...&timeStamp=...
生成的签名: abcdef1234567890abcd...
小红书API响应状态: 400
❌ 获取access_token失败: 400 {"error":"签名校验失败，非法参数-signature"}
❌ 鉴权失败: Error: 获取access_token失败: 400 ...
```

**可能原因**：
1. XHS_APP_KEY 或 XHS_APP_SECRET 配置错误
2. 签名算法有问题
3. 参数名大小写错误

#### 如果小红书API返回其他错误：

```
小红书API响应状态: 401
❌ 获取access_token失败: 401 {"error":"应用未审核通过"}
```

**解决方案**：需要在小红书开放平台完成应用审核

---

### 步骤3：根据日志排查问题

#### 问题1：环境变量未配置

**日志特征**：
```
XHS_APP_KEY: 未配置
XHS_APP_SECRET: 未配置
```

**解决方案**：
1. 访问小红书开放平台：https://agora.xiaohongshu.com/
2. 获取 appKey 和 appSecret
3. 在Supabase Dashboard配置Secrets：
   - `XHS_APP_KEY` = 你的appKey
   - `XHS_APP_SECRET` = 你的appSecret
4. 重新部署Edge Function（或等待自动重启）

#### 问题2：签名校验失败

**日志特征**：
```
小红书API响应状态: 400
❌ 获取access_token失败: 400 {"error":"签名校验失败，非法参数-signature"}
```

**可能原因**：
1. **appKey或appSecret错误**
   - 检查Supabase Secrets中的配置是否正确
   - 确认没有多余的空格或换行符

2. **签名算法错误**
   - 检查日志中的"签名字符串"是否正确
   - 应该是：`appKey=xxx&nonce=xxx&timeStamp=xxx`
   - 参数名必须是 `timeStamp`（驼峰）

3. **时间戳问题**
   - 检查服务器时间是否正确
   - 时间戳应该是毫秒级（13位数字）

#### 问题3：应用未审核

**日志特征**：
```
小红书API响应状态: 401
❌ 获取access_token失败: 401 {"error":"应用未审核通过"}
```

**解决方案**：
1. 登录小红书开放平台
2. 进入「应用管理」
3. 查看应用状态
4. 如果是"待审核"，需要等待审核通过（1-3个工作日）
5. 如果审核被拒，根据拒绝原因修改后重新提交

#### 问题4：响应中没有access_token

**日志特征**：
```
小红书API响应状态: 200
小红书API响应数据: { ... }
❌ 响应中没有access_token: { ... }
```

**解决方案**：
1. 查看"小红书API响应数据"的具体内容
2. 如果有错误信息，根据错误信息处理
3. 如果响应格式不对，可能是API版本问题

---

## 🔧 常见问题解决

### Q1: 如何确认环境变量已正确配置？

查看Edge Function日志的第一行：
```
=== 小红书SDK配置检查 ===
XHS_APP_KEY: 12345678...  ← 应该显示前8位
XHS_APP_SECRET: 已配置     ← 应该显示"已配置"
```

如果显示"未配置"，说明Secrets没有设置或名称错误。

### Q2: 如何验证签名算法是否正确？

查看日志中的"签名字符串"：
```
签名字符串（不含密钥）: appKey=xxx&nonce=xxx&timeStamp=xxx
```

确认：
1. 参数按字母序排列：appKey、nonce、timeStamp
2. 参数名是 `timeStamp`（驼峰），不是 `timestamp`
3. 格式是 `key1=value1&key2=value2`

### Q3: 如何测试签名生成？

可以使用在线SHA-256工具验证：
1. 复制日志中的"签名字符串"
2. 手动追加密钥（appSecret或access_token）
3. 使用在线SHA-256工具计算
4. 对比日志中的"生成的签名"

### Q4: 为什么有时候成功有时候失败？

可能原因：
1. **Token缓存问题**：第一次成功后，token被缓存23小时，期间都会成功
2. **Token过期**：23小时后token过期，需要重新获取
3. **网络问题**：偶尔的网络超时或连接失败

查看日志中是否有：
```
✅ 使用缓存的access_token  ← 使用缓存
🔄 获取新的access_token... ← 重新获取
```

---

## 📝 下一步操作

### 如果日志显示环境变量未配置：
1. 按照 `XHS_AUTH_TROUBLESHOOTING.md` 配置Secrets
2. 等待Edge Function自动重启（约1分钟）
3. 重新测试发布功能

### 如果日志显示签名校验失败：
1. 检查Supabase Secrets中的appKey和appSecret是否正确
2. 确认没有多余的空格或特殊字符
3. 如果确认配置正确，可能是小红书API的问题，联系技术支持

### 如果日志显示应用未审核：
1. 登录小红书开放平台查看审核状态
2. 等待审核通过
3. 审核通过后重新测试

### 如果日志显示其他错误：
1. 复制完整的错误日志
2. 查看小红书开放平台的API文档
3. 或联系小红书技术支持

---

## 🎯 成功标志

当一切正常时，日志应该显示：

```
✅ 成功获取access_token
✅ JS SDK签名生成完成
✅ 鉴权成功，返回配置
```

浏览器控制台应该显示：
```
小红书JS SDK已加载
```

点击"发布到小红书"后，应该：
1. 自动唤起小红书APP
2. 自动填充图片和文案
3. 用户点击"发布"即可完成

---

## 📚 相关文档

- 排查指南：`XHS_AUTH_TROUBLESHOOTING.md`
- 签名修复说明：`XHS_SIGNATURE_FIX.md`
- 实现说明：`PUBLISH_IMPLEMENTATION.md`
- 小红书官方文档：https://agora.xiaohongshu.com/doc/js

---

## 💡 提示

- 每次修改Secrets后，Edge Function需要约1分钟重启
- 可以通过查看日志确认新配置是否生效
- 建议先在测试环境验证，确认无误后再部署到生产环境
- 保存好所有日志，方便后续排查问题
