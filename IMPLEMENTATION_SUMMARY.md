# 小红书JS SDK一键发布功能实现总结

## ✅ 已完成的功能

### 1. 完整的发布流程

**用户操作流程**：
1. 用户在"图文创作"模块编辑内容（标题、文案、图片）
2. 点击"生成小红书文案"按钮 → AI生成文案
3. 点击"发布到小红书"按钮
4. 系统自动处理：
   - 上传图片到Supabase Storage获取公网HTTPS URL
   - 调用Edge Function获取鉴权配置（两次加签）
   - 调用小红书JS SDK的`xhs.share()`方法
   - 自动唤起小红书APP
   - 内容自动填充到小红书编辑页（标题、文案、图片）
5. 用户在小红书APP中点击"发布"即可

### 2. 技术实现

#### 2.1 官方JS SDK集成
- ✅ 在`index.html`中引入官方SDK：`https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js`
- ✅ SDK提供全局对象`window.xhs`
- ✅ 调用`xhs.share()`方法实现分享

#### 2.2 鉴权流程（Edge Function）
- ✅ 创建`supabase/functions/xhs-auth/index.ts`
- ✅ 实现两次加签：
  - 第一次：使用`XHS_APP_SECRET`获取`access_token`
  - 第二次：使用`access_token`生成`signature`
- ✅ 自动缓存`access_token`（有效期23小时）
- ✅ 返回完整的`verifyConfig`（appKey、nonce、timestamp、signature）

#### 2.3 图片上传服务
- ✅ 创建`src/services/imageUploadService.ts`
- ✅ 上传图片到Supabase Storage
- ✅ 获取公网HTTPS URL
- ✅ 检查图片尺寸（宽度≥720px）

#### 2.4 分享Hook
- ✅ 创建`src/hooks/useXHSShare.ts`
- ✅ 实现`shareToXhs()`方法
- ✅ 参数验证（图文类型必须有images）
- ✅ 调用Edge Function获取鉴权配置
- ✅ 构造符合官方规范的`shareConfig`
- ✅ 调用`window.xhs.share()`
- ✅ 降级方案（复制到剪贴板）

#### 2.5 UI集成
- ✅ 在`LayoutPreviewStep.tsx`中集成
- ✅ "发布到小红书"按钮
- ✅ 上传进度提示
- ✅ SDK初始化状态提示
- ✅ 错误处理和用户提示

### 3. API结构（符合官方文档）

```javascript
xhs.share({
  shareInfo: {
    type: 'normal',           // 图文类型
    title: '笔记标题',         // 标题
    content: '笔记正文内容',   // 文案
    images: [                 // 图片数组（公网HTTPS URL）
      'https://xxx.supabase.co/storage/v1/object/public/images/xxx.png'
    ]
  },
  verifyConfig: {
    appKey: 'your_app_key',           // 从Edge Function获取
    nonce: 'random_string',           // 从Edge Function获取
    timestamp: '1692102691696',       // 从Edge Function获取
    signature: 'generated_signature'  // 从Edge Function获取
  },
  fail: (error) => {
    console.error('分享失败', error);
  }
});
```

### 4. 配置要求

#### 4.1 Supabase Secrets配置
需要在Supabase Dashboard中配置：
- `XHS_APP_KEY`：小红书应用的唯一标识
- `XHS_APP_SECRET`：小红书应用秘钥

#### 4.2 Supabase Storage配置
- Bucket名称：`images`
- 权限：公开读取（Public access）

### 5. 降级方案

如果JS SDK调用失败，系统会自动：
1. 复制文案到剪贴板
2. 提示用户手动打开小红书粘贴
3. 用户需要手动保存图片并上传

## 📝 使用说明

### 开发环境测试
1. 配置Supabase Secrets（XHS_APP_KEY、XHS_APP_SECRET）
2. 确保Supabase Storage bucket `images` 已创建并设置为公开
3. 运行应用：`npm run dev`
4. 进入"图文创作"模块
5. 编辑内容并点击"发布到小红书"

### 生产环境部署
1. 在小红书开放平台（https://agora.xiaohongshu.com/）注册应用
2. 获取`appKey`和`appSecret`
3. 在Supabase Dashboard配置Secrets
4. 部署Edge Function：`xhs-auth`
5. 构建并部署应用

## 🔍 技术细节

### 鉴权流程（两次加签）

**第一次加签（获取access_token）**：
```
参数：appKey、nonce、timestamp
密钥：appSecret
签名：SHA-256("appKey=value&nonce=value&timeStamp=value" + appSecret)
调用：POST https://edith.xiaohongshu.com/api/sns/v1/ext/access/token
返回：access_token（有效期最长24小时）
```

**第二次加签（生成JS SDK签名）**：
```
参数：appKey、nonce、timestamp
密钥：access_token
签名：SHA-256("appKey=value&nonce=value&timeStamp=value" + access_token)
返回：verifyConfig（用于xhs.share()）
```

### 图片处理流程

```
用户选择图片（本地文件/Canvas生成）
    ↓
转换为Blob对象
    ↓
上传到Supabase Storage
    ↓
获取公网HTTPS URL
    ↓
传递给xhs.share()
```

### 完整发布流程

```
用户点击"发布到小红书"
    ↓
验证参数（标题、文案、图片）
    ↓
上传图片到Supabase Storage
    ↓
获取公网HTTPS URL
    ↓
调用Edge Function获取verifyConfig
    ↓
Edge Function执行两次加签
    ↓
返回verifyConfig
    ↓
调用xhs.share()
    ↓
小红书JS SDK唤起小红书APP
    ↓
内容自动填充到编辑页
    ↓
用户在小红书APP中点击"发布"
```

## ✅ 符合官方文档规范

- ✅ SDK对象名：`window.xhs`
- ✅ API结构：`shareInfo` + `verifyConfig`
- ✅ type值：`'normal'`（图文）或`'video'`（视频）
- ✅ 鉴权流程：两次加签
- ✅ 资源要求：公网HTTPS URL
- ✅ 回调函数：`fail`

## 📚 参考文档

- 小红书开放平台：https://agora.xiaohongshu.com/
- JS SDK文档：https://agora.xiaohongshu.com/doc/js
- 配置文档：`XHS_SDK_CONFIG.md`

## 🎯 总结

当前实现完全基于小红书官方JS SDK，符合官方文档规范，实现了：
- ✅ 一键发布到小红书
- ✅ 内容自动填充（标题、文案、图片）
- ✅ 完整的鉴权流程（服务端签名）
- ✅ 安全的密钥管理（Supabase Secrets）
- ✅ 完善的错误处理和降级方案

用户只需点击"发布到小红书"按钮，系统会自动处理所有技术细节，最终在小红书APP中自动填充内容，用户只需点击"发布"即可完成发布。
