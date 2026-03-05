# 小红书JS SDK集成配置文档

## 📋 概述

本应用已集成小红书官方JS SDK，支持一键发布图文到小红书。基于小红书开放平台官方文档（https://agora.xiaohongshu.com/doc/js）实现，包含完整的鉴权流程（两次加签）。

## 🔑 必需配置参数

### 1. 小红书开放平台配置

需要从[小红书开放平台](https://agora.xiaohongshu.com/)获取以下参数：

| 参数名 | 说明 | 获取方式 |
|--------|------|----------|
| `XHS_APP_KEY` | 应用的唯一标识 | 小红书开放平台 → 首页「快速接入」→ 登记企业和应用信息 → 审核通过后获得 |
| `XHS_APP_SECRET` | 应用秘钥，用于生成签名 | 小红书开放平台 → 应用管理 → 应用详情 |

**配置方法**：

在Supabase Dashboard中配置密钥：

1. 登录Supabase Dashboard
2. 进入项目设置 → Edge Functions → Secrets
3. 添加以下密钥：
   - `XHS_APP_KEY`: 你的小红书AppKey
   - `XHS_APP_SECRET`: 你的小红书AppSecret

**⚠️ 安全提示**：
- appSecret必须保存在服务端，不要暴露给前端
- 不要将密钥提交到Git仓库
- 定期更换密钥以提高安全性

### 2. Supabase Edge Function

已部署Edge Function `xhs-auth`，用于实现小红书鉴权流程（两次加签）：

**鉴权流程**：
1. **第一次加签**：使用appSecret获取access_token
   - 参数：appKey、nonce、timestamp
   - 签名算法：SHA-256("appKey=value&nonce=value&timeStamp=value" + appSecret)
   - 调用小红书API：`POST https://edith.xiaohongshu.com/api/sns/v1/ext/access/token`
   - 获取access_token（有效期最长24小时）

2. **第二次加签**：使用access_token生成JS SDK签名
   - 参数：appKey、nonce、timestamp
   - 签名算法：SHA-256("appKey=value&nonce=value&timeStamp=value" + access_token)
   - 返回verifyConfig给前端

**Edge Function功能**：
- 自动获取和缓存access_token
- 生成随机nonce和timestamp
- 实现SHA-256签名算法
- 返回完整的verifyConfig配置

### 3. Supabase Storage配置

图片需要上传到Supabase Storage获取公网HTTPS URL（小红书要求）。

**前置条件**：
- Supabase项目已创建
- Storage bucket `images` 已创建
- Bucket权限设置为公开读取

**验证方法**：

1. 登录Supabase Dashboard
2. 进入 Storage → images bucket
3. 确认 Policies 中有 `Public access` 策略

### 4. 小红书JS SDK引入

已在 `index.html` 中引入官方JS SDK：

```html
<script src="https://fe-static.xhscdn.com/biz-static/goten/xhs-1.0.1.js"></script>
```

SDK会在页面加载时自动加载，提供全局对象 `window.xhs`。

#### 3.1 manifest.json配置

在HBuilderX项目的 `manifest.json` 中添加以下配置：

```json
{
  "id": "your-app-id",
  "name": "自媒体创作",
  "version": {
    "name": "1.0.0",
    "code": 100
  },
  "plus": {
    "distribute": {
      "android": {
        "schemes": ["yourapp"],
        "permissions": [
          "<uses-permission android:name=\"android.permission.INTERNET\"/>",
          "<uses-permission android:name=\"android.permission.WRITE_EXTERNAL_STORAGE\"/>",
          "<uses-permission android:name=\"android.permission.READ_EXTERNAL_STORAGE\"/>"
        ]
      },
      "ios": {
        "urltypes": [
          {
            "urlidentifier": "com.yourcompany.yourapp",
            "urlschemes": ["yourapp"]
          }
        ],
        "universalLinks": [
          "https://your-domain.com/apple-app-site-association"
        ]
      }
    }
  }
}
```

**需要修改的地方**：
- `id`: 应用唯一标识
- `schemes`: 你的App Scheme（用于从小红书返回）
- `urlidentifier`: iOS URL Identifier
- `urlschemes`: iOS URL Schemes
- `universalLinks`: iOS Universal Links（可选）

#### 3.2 Android配置

在 `AndroidManifest.xml` 中添加小红书包名查询权限：

```xml
<manifest>
    <!-- 允许查询小红书是否安装 -->
    <queries>
        <package android:name="com.xingin.xhs" />
    </queries>
</manifest>
```

#### 3.3 iOS配置

在 `Info.plist` 中添加小红书Scheme白名单：

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>xhsdiscover</string>
</array>
```

## 📦 SDK引入方式

### 方式一：NPM安装（推荐）

```bash
npm install @xhs/xhs-share-sdk
```

或

```bash
pnpm add @xhs/xhs-share-sdk
```

### 方式二：CDN引入

在 `index.html` 中添加：

```html
<script src="https://cdn.jsdelivr.net/npm/@xhs/xhs-share-sdk@latest/dist/xhs-sdk.min.js"></script>
```

**注意**：如果使用CDN方式，需要确保SDK在React应用加载前完成加载。

## 🔧 使用方法

### 1. 基本使用

```typescript
import { useXHSShare } from '@/hooks/useXHSShare';
import { uploadImagesToSupabase } from '@/services/imageUploadService';

function MyComponent() {
  const { shareToXhs, isReady } = useXHSShare();

  const handleShare = async () => {
    // 1. 上传图片到Supabase获取公网URL
    const localImages = [
      { url: 'blob:http://...', filename: 'image1.png' },
      { url: 'blob:http://...', filename: 'image2.png' },
    ];
    
    const publicUrls = await uploadImagesToSupabase(localImages, (current, total) => {
      console.log(`上传进度: ${current}/${total}`);
    });

    // 2. 调用分享
    await shareToXhs({
      type: 'normal', // 图文类型
      title: '我的笔记标题',
      content: '这是笔记正文内容...',
      images: publicUrls,
      fail: (err) => {
        console.error('分享失败', err);
      },
    });
  };

  return (
    <button onClick={handleShare} disabled={!isReady}>
      发布到小红书
    </button>
  );
}
```

### 2. 参数说明

**shareToXhs 参数**（符合官方API规范）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `'normal' \| 'video'` | 是 | 笔记类型：'normal'（图文）或 'video'（视频） |
| `title` | `string` | 否 | 笔记标题 |
| `content` | `string` | 否 | 笔记正文 |
| `images` | `string[]` | 图文必填 | 图片URL数组（必须是公网HTTPS URL） |
| `video` | `string` | 视频必填 | 视频URL（必须是公网HTTPS URL） |
| `cover` | `string` | 否 | 视频封面图（必须是公网HTTPS URL） |
| `fail` | `Function` | 否 | 失败回调函数 |

**⚠️ 重要提示**：
- 所有资源（图片、视频、封面）必须是服务器地址（公网HTTPS URL）
- 不支持本地文件路径（file://）或blob URL
- 图文类型必须提供images数组
- 视频类型必须提供video URL

### 3. 图片要求

小红书对图片的要求：

- **URL格式**：必须是公网HTTPS地址
- **建议尺寸**：宽度 ≥ 720px
- **建议比例**：3:4（竖图）、1:1（方图）或 4:3（横图）
- **格式**：JPG、PNG
- **来源**：必须是服务器地址，不支持本地文件

**检查图片尺寸**：

```typescript
import { checkImagesSize } from '@/services/imageUploadService';

const results = await checkImagesSize(imageUrls);
results.forEach(result => {
  if (!result.valid) {
    console.warn(`图片不符合要求: ${result.message}`);
  }
});
```

### 4. 完整流程

```
用户点击发布按钮
    ↓
上传图片到Supabase Storage
    ↓
获取公网HTTPS URL
    ↓
调用useXHSShare.shareToXhs()
    ↓
Hook调用Edge Function获取鉴权配置
    ↓
Edge Function执行两次加签
    ↓
返回verifyConfig（appKey、nonce、timestamp、signature）
    ↓
Hook调用window.xhs.share()
    ↓
小红书JS SDK唤起小红书APP
    ↓
自动填充标题、正文、图片
    ↓
用户在小红书中点击「发布」
```

## 🧪 测试步骤

### 1. 本地测试（网页端）

```bash
npm run dev
```

访问 `http://localhost:5173`，测试以下功能：

- [ ] SDK是否正确初始化（查看控制台日志）
- [ ] 图片是否能上传到Supabase
- [ ] 是否能获取公网HTTPS URL
- [ ] 点击分享按钮是否有响应

**注意**：网页端无法真正唤起小红书App，会使用降级方案（复制文案）。

### 2. HBuilderX真机调试

1. 在HBuilderX中打开项目
2. 连接Android/iOS真机
3. 运行 → 运行到手机或模拟器
4. 测试以下功能：

- [ ] 检测小红书是否安装
- [ ] 唤起小红书App
- [ ] 小红书是否自动填充内容
- [ ] 发布后是否能返回App

### 3. 云打包测试

1. HBuilderX → 发行 → 原生App-云打包
2. 下载安装包
3. 安装到真机
4. 完整测试发布流程

## 🐛 常见问题

### 1. SDK初始化失败

**现象**：控制台显示"小红书SDK未加载"

**解决方法**：
- 检查是否正确引入SDK（NPM或CDN）
- 检查appKey是否正确配置
- 查看网络请求是否被拦截

### 2. 图片上传失败

**现象**：上传图片时报错

**解决方法**：
- 检查Supabase Storage bucket是否创建
- 检查bucket权限是否设置为公开
- 检查图片大小是否超过限制（建议<5MB）

### 3. 无法唤起小红书

**现象**：点击分享按钮无响应

**解决方法**：
- 检查小红书是否已安装
- 检查HBuilderX的Scheme配置
- 检查Android的queries权限
- 检查iOS的LSApplicationQueriesSchemes

### 4. 图片URL不是HTTPS

**现象**：分享时提示"图片URL必须是公网HTTPS地址"

**解决方法**：
- 确保图片已上传到Supabase
- 确保使用的是Supabase返回的publicUrl
- 不要使用本地文件路径或blob URL

### 5. 从小红书返回后无响应

**现象**：在小红书发布后返回App，但没有任何提示

**解决方法**：
- 检查App.tsx中的Scheme回调处理
- 检查manifest.json中的schemes配置
- 在回调中添加日志查看是否触发

## 📊 完整数据流

```
用户编辑图文
    ↓
上传图片到Supabase Storage
    ↓
获取公网HTTPS URL
    ↓
调用useXHSShare.shareImageText()
    ↓
检测小红书是否安装（HBuilderX 5+ API）
    ↓
调用小红书JS SDK
    ↓
唤起小红书App（xhsdiscover://）
    ↓
小红书编辑页（自动填充标题/正文/图片）
    ↓
用户点击"发布"
    ↓
返回你的App（通过Scheme回调）
    ↓
显示发布成功提示
```

## 🔐 安全注意事项

### 1. appKey保护

- ❌ 不要将appKey提交到公开的Git仓库
- ✅ 使用环境变量存储敏感信息
- ✅ 在生产环境使用服务端签名

### 2. 图片URL安全

- ✅ 确保Supabase Storage的RLS策略正确配置
- ✅ 定期清理过期的临时图片
- ✅ 限制上传图片的大小和格式

### 3. 用户隐私

- ✅ 在分享前明确告知用户将要分享的内容
- ✅ 不要在用户不知情的情况下上传图片
- ✅ 遵守小红书的用户协议和隐私政策

## 📝 相关文档

- [小红书开放平台](https://open.xiaohongshu.com/)
- [小红书JS SDK文档](https://open.xiaohongshu.com/docs/js-sdk)
- [HBuilderX官方文档](https://www.dcloud.io/hbuilderx.html)
- [Supabase Storage文档](https://supabase.com/docs/guides/storage)

---

**版本**：v1.0.0  
**更新日期**：2026-01-08  
**适用平台**：Android、iOS  
**封装工具**：HBuilderX  
**SDK版本**：@xhs/xhs-share-sdk@latest
