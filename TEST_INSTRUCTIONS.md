# 测试说明

## ✅ 配置已完成

小红书应用凭证已成功配置到Supabase Secrets：

- **XHS_APP_KEY**: `red.YUpzUmGVT5EPQGrN`
- **XHS_APP_SECRET**: `a2fe1f2e0a05aaf6016f8073d8cd7989`

Edge Function `xhs-auth` 已重新部署，配置应该在1分钟内生效。

---

## 📋 测试步骤

### 步骤1：清除浏览器缓存

1. 打开浏览器开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

### 步骤2：测试发布功能

#### 方法A：测试"我有产品"模块

1. 进入应用
2. 点击底部导航栏的"创作"
3. 选择"我有产品"
4. 上传产品图片
5. 填写产品信息
6. 点击"生成文案"
7. 等待文案生成完成
8. 点击"发布到小红书"按钮
9. 观察：
   - 浏览器控制台是否有错误
   - 是否成功唤起小红书APP
   - 小红书APP是否自动填充图片和文案

#### 方法B：测试"图片工厂"模块

1. 进入应用
2. 点击底部导航栏的"创作"
3. 选择"图片工厂"
4. 选择背景图或上传自定义背景
5. 输入主标题
6. 点击"生成文案"
7. 编辑文案（可选）
8. 点击"确认生成图片"
9. 等待图片生成完成
10. 点击"发布到小红书"按钮
11. 观察同上

### 步骤3：查看Edge Function日志

在测试后立即查看日志，确认配置是否生效：

```bash
# 使用CLI查看最新日志
supabase functions logs xhs-auth --limit 10
```

或在Supabase Dashboard查看：
1. 访问：https://supabase.com/dashboard/project/supabase267647421859807232
2. 左侧菜单 → Edge Functions
3. 点击 `xhs-auth`
4. 点击 Logs 标签
5. 查看最新日志

---

## 🎯 预期结果

### Edge Function日志应该显示：

```
=== 小红书SDK配置检查 ===
XHS_APP_KEY: red.YUpz...
XHS_APP_SECRET: 已配置

📥 收到鉴权请求
🔐 开始生成JS SDK签名...
🔄 获取新的access_token...
请求参数: { app_key: "red.YUpzUmGVT5EPQGrN", nonce: "...", timestamp: ..., expires_in: ... }
签名生成参数: { appKey: "red.YUpzUmGVT5EPQGrN", nonce: "...", timeStamp: "..." }
签名字符串（不含密钥）: appKey=red.YUpzUmGVT5EPQGrN&nonce=...&timeStamp=...
生成的签名: ...
小红书API响应状态: 200
小红书API响应数据: { access_token: "...", expires_in: ... }
✅ 成功获取access_token
获取到access_token: ...
生成nonce和timeStamp: { nonce: "...", timeStamp: "..." }
签名生成参数: { appKey: "red.YUpzUmGVT5EPQGrN", nonce: "...", timeStamp: "..." }
签名字符串（不含密钥）: appKey=red.YUpzUmGVT5EPQGrN&nonce=...&timeStamp=...
生成的签名: ...
✅ JS SDK签名生成完成
✅ 鉴权成功，返回配置
```

### 浏览器控制台应该显示：

```
小红书JS SDK已加载
```

### 点击"发布到小红书"后：

1. ✅ 自动唤起小红书APP（或显示小红书网页版）
2. ✅ 自动填充图片
3. ✅ 自动填充文案
4. ✅ 用户点击"发布"即可完成

---

## ⚠️ 可能的问题

### 问题1：仍然显示500错误

**可能原因**：
1. Edge Function还未重启（需要等待约1分钟）
2. 浏览器缓存未清除
3. 小红书应用未审核通过

**解决方案**：
1. 等待1-2分钟后重试
2. 清除浏览器缓存
3. 查看Edge Function日志确认配置是否生效
4. 检查小红书开放平台的应用状态

### 问题2：日志显示"签名校验失败"

**可能原因**：
1. appKey或appSecret配置错误
2. 小红书应用未审核通过
3. 签名算法有问题

**解决方案**：
1. 确认appKey和appSecret是否正确
2. 登录小红书开放平台查看应用状态
3. 查看日志中的"签名字符串"是否正确

### 问题3：日志显示"应用未审核通过"

**解决方案**：
1. 登录小红书开放平台：https://agora.xiaohongshu.com/
2. 进入「应用管理」
3. 查看应用状态
4. 如果是"待审核"，需要等待审核通过（1-3个工作日）
5. 如果审核被拒，根据拒绝原因修改后重新提交

---

## 📊 日志分析

### 成功的标志：

- ✅ 显示 `XHS_APP_KEY: red.YUpz...`
- ✅ 显示 `XHS_APP_SECRET: 已配置`
- ✅ 显示 `小红书API响应状态: 200`
- ✅ 显示 `✅ 成功获取access_token`
- ✅ 显示 `✅ JS SDK签名生成完成`
- ✅ 显示 `✅ 鉴权成功，返回配置`

### 失败的标志：

- ❌ 显示 `XHS_APP_KEY: 未配置`
- ❌ 显示 `小红书API响应状态: 400` 或 `401`
- ❌ 显示 `❌ 获取access_token失败`
- ❌ 显示 `❌ 签名校验失败`
- ❌ 显示 `❌ 应用未审核通过`

---

## 🔍 调试技巧

### 1. 实时查看日志

在测试时，可以在另一个终端窗口实时查看日志：

```bash
# 持续监控日志（每2秒刷新一次）
watch -n 2 'supabase functions logs xhs-auth --limit 5'
```

### 2. 查看详细的API响应

日志中会显示小红书API的完整响应，包括：
- 响应状态码
- 响应数据
- 错误信息（如果有）

### 3. 验证签名生成

日志中会显示签名生成的详细过程：
- 签名参数（appKey、nonce、timeStamp）
- 签名字符串（不含密钥）
- 生成的签名（前20位）

可以手动验证签名是否正确。

---

## 📚 相关文档

- `CURRENT_STATUS.md` - 当前状态和下一步操作
- `XHS_DEBUG_GUIDE.md` - 详细调试指南
- `XHS_AUTH_TROUBLESHOOTING.md` - 鉴权问题排查指南
- `XHS_SIGNATURE_FIX.md` - 签名问题修复说明
- `PUBLISH_IMPLEMENTATION.md` - 发布功能实现说明

---

## 💡 重要提示

1. **等待Edge Function重启**
   - 配置Secrets后，Edge Function需要约1分钟重启
   - 可以通过查看日志确认配置是否生效

2. **清除浏览器缓存**
   - 测试前务必清除浏览器缓存
   - 避免使用旧的JS SDK代码

3. **查看日志是关键**
   - 日志会清楚地显示问题所在
   - 根据日志信息可以快速定位问题

4. **应用审核状态**
   - 确认小红书应用已审核通过
   - 未审核通过的应用无法使用API

---

## 🆘 如果还有问题

1. **复制完整的错误日志**
   - 包括Edge Function日志
   - 包括浏览器控制台错误

2. **检查应用状态**
   - 登录小红书开放平台
   - 查看应用审核状态
   - 确认appKey和appSecret正确

3. **参考调试指南**
   - 打开 `XHS_DEBUG_GUIDE.md`
   - 根据日志特征查找对应的解决方案

4. **联系支持**
   - 如果确认配置正确但仍然失败
   - 可能是小红书API的问题
   - 联系小红书技术支持

---

**配置时间**：2026-01-31
**状态**：等待测试
**预计生效时间**：配置后1-2分钟
