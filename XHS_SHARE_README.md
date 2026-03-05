# 小红书分享功能完整实现文档

## 📋 功能概述

实现前端触发 Android 原生唤起小红书，将 Supabase 中的文案+多张产品图片自动填充到小红书草稿箱的完整功能。

### 核心特性

- ✅ 支持单图和多图分享（最多9张）
- ✅ 从 Supabase 数据库获取文案和图片
- ✅ 批量下载图片并显示进度
- ✅ 图片数量超限自动截断
- ✅ 部分图片失败时仅传递成功的图片
- ✅ 完整的错误处理和用户提示
- ✅ TypeScript 类型安全
- ✅ React Hook 封装，易于复用

## 🏗️ 技术栈

- **前端**: React 18+ + TypeScript + Vite
- **移动端**: Capacitor (Android)
- **数据库**: Supabase (PostgreSQL + Storage)
- **UI**: shadcn/ui + Tailwind CSS

## 📁 项目结构

```
src/
├── types/
│   └── xhs.ts                    # 小红书分享类型定义
├── services/
│   └── xhsService.ts             # Supabase服务层
├── lib/
│   └── xhsUtils.ts               # 工具函数
├── plugins/
│   ├── XhsSharePlugin.ts         # Capacitor插件定义
│   └── web.ts                    # Web端实现（调试用）
├── hooks/
│   └── useXhsShare.ts            # React Hook
├── components/
│   └── xhs/
│       └── XhsPublishButton.tsx  # 发布按钮组件
└── examples/
    └── XhsShareExample.tsx       # 使用示例

android/
├── app/src/main/java/com/app8sm6r7tdrncx/plugins/
│   └── XhsSharePlugin.java       # Android原生插件
├── app/src/main/res/xml/
│   └── file_paths.xml            # FileProvider配置
└── ANDROID_MANIFEST_CONFIG.md    # AndroidManifest配置说明
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install @capacitor/core @capacitor/android
```

### 2. 配置 AndroidManifest.xml

在 `android/app/src/main/AndroidManifest.xml` 中添加：

```xml
<manifest>
    <!-- 查询小红书应用 -->
    <queries>
        <package android:name="com.xingin.xhs" />
    </queries>

    <application>
        <!-- FileProvider配置 -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
```

详细配置请参考：`android/ANDROID_MANIFEST_CONFIG.md`

### 3. 注册 Capacitor 插件

在 `android/app/src/main/java/.../MainActivity.java` 中注册插件：

```java
import com.app8sm6r7tdrncx.plugins.XhsSharePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 注册小红书分享插件
        registerPlugin(XhsSharePlugin.class);
    }
}
```

### 4. 使用组件

```tsx
import XhsPublishButton from '@/components/xhs/XhsPublishButton';
import type { XhsShareParams } from '@/types/xhs';

// 多图分享示例
function MyComponent() {
  const params: XhsShareParams = {
    text: '这是一款超棒的产品！',
    imageType: 'multi',
    images: [
      { url: 'https://...', filename: 'product_1.jpg' },
      { url: 'https://...', filename: 'product_2.jpg' },
      { url: 'https://...', filename: 'product_3.jpg' },
    ],
  };

  return (
    <XhsPublishButton
      params={params}
      text="发布到小红书"
      onSuccess={() => console.log('分享成功')}
      onError={(error) => console.error('分享失败', error)}
    />
  );
}
```

## 📖 API 文档

### 类型定义

#### XhsShareParams

```typescript
interface XhsShareParams {
  text: string;                    // 文案内容
  imageType: 'single' | 'multi';   // 图片类型
  imageUrl?: string;               // 单图URL
  images?: XhsImageItem[];         // 多图列表
  productId?: string;              // 产品ID（自动获取）
}
```

#### XhsImageItem

```typescript
interface XhsImageItem {
  url: string;        // 图片URL
  filename: string;   // 文件名
  size?: number;      // 文件大小
  width?: number;     // 宽度
  height?: number;    // 高度
}
```

#### XhsShareResult

```typescript
interface XhsShareResult {
  success: boolean;           // 是否成功
  message: string;            // 结果消息
  successCount?: number;      // 成功数量
  failedCount?: number;       // 失败数量
  failedImages?: string[];    // 失败的图片
}
```

### Hook: useXhsShare

```typescript
const { shareToXhs, loading, progress } = useXhsShare();

// 调用分享
const result = await shareToXhs(params);
```

**返回值：**
- `shareToXhs`: 分享函数
- `loading`: 是否正在处理
- `progress`: 下载进度信息

### 组件: XhsPublishButton

```typescript
<XhsPublishButton
  params={params}              // 分享参数
  text="发布到小红书"          // 按钮文本
  variant="default"            // 按钮样式
  size="default"               // 按钮大小
  onBeforeShare={() => true}   // 分享前回调
  onSuccess={() => {}}         // 成功回调
  onError={(error) => {}}      // 失败回调
/>
```

### 服务函数

#### getProductForXhs

从数据库获取产品信息：

```typescript
const data = await getProductForXhs(productId);
// 返回: { text: string, images: XhsImageItem[] }
```

#### downloadMultiImages

批量下载图片：

```typescript
const result = await downloadMultiImages(
  images,
  (current, total, filename) => {
    console.log(`下载进度: ${current}/${total}`);
  }
);
```

### 工具函数

#### validateImageCount

校验图片数量：

```typescript
const result = validateImageCount(images);
// 返回: { valid: boolean, message: string, truncatedImages?: XhsImageItem[] }
```

#### filterInvalidImages

过滤无效图片：

```typescript
const { validImages, invalidImages } = filterInvalidImages(images);
```

## 🔧 Android 原生插件

### 方法列表

#### isXhsInstalled

检查小红书是否已安装：

```java
@PluginMethod
public void isXhsInstalled(PluginCall call)
```

#### shareToXhs

分享单图：

```java
@PluginMethod
public void shareToXhs(PluginCall call)
```

**参数：**
- `text`: 文案内容
- `imageBase64`: 图片Base64数据

#### shareMultiImagesToXhs

分享多图（多图适配）：

```java
@PluginMethod
public void shareMultiImagesToXhs(PluginCall call)
```

**参数：**
- `text`: 文案内容
- `images`: 图片数组 `[{ base64, filename }]`

**返回：**
- `success`: 是否成功
- `message`: 结果消息
- `successCount`: 成功数量
- `failedCount`: 失败数量
- `failedImages`: 失败的图片列表

### 多图适配关键点

1. **Intent类型**: 使用 `ACTION_SEND_MULTIPLE` 而不是 `ACTION_SEND`
2. **图片传递**: 使用 `putParcelableArrayListExtra(EXTRA_STREAM, imageUris)`
3. **FileProvider**: 每张图片都需要通过 `FileProvider.getUriForFile()` 获取Uri
4. **权限**: 所有Uri都需要添加 `FLAG_GRANT_READ_URI_PERMISSION`
5. **异常处理**: 部分图片失败时，仅传递成功的图片

## 📝 使用示例

### 示例1：单图分享

```tsx
const params: XhsShareParams = {
  text: '这是一款超棒的产品！',
  imageType: 'single',
  imageUrl: 'https://example.com/product.jpg',
};

<XhsPublishButton params={params} />
```

### 示例2：多图分享

```tsx
const params: XhsShareParams = {
  text: '产品多图展示',
  imageType: 'multi',
  images: [
    { url: 'https://...', filename: 'img1.jpg' },
    { url: 'https://...', filename: 'img2.jpg' },
    { url: 'https://...', filename: 'img3.jpg' },
  ],
};

<XhsPublishButton params={params} />
```

### 示例3：从数据库获取

```tsx
const params: XhsShareParams = {
  text: '', // 将从数据库获取
  imageType: 'multi',
  productId: 'product-uuid-123',
};

<XhsPublishButton params={params} />
```

### 示例4：自定义Hook使用

```tsx
function MyComponent() {
  const { shareToXhs, loading, progress } = useXhsShare();

  const handleShare = async () => {
    const result = await shareToXhs({
      text: '自定义分享',
      imageType: 'multi',
      images: [...],
    });

    if (result.success) {
      console.log('分享成功');
    }
  };

  return (
    <div>
      <button onClick={handleShare} disabled={loading}>
        {loading ? '处理中...' : '分享'}
      </button>
      {progress && (
        <div>下载进度: {progress.percentage}%</div>
      )}
    </div>
  );
}
```

## 🎯 体验优化

### 1. 下载进度显示

```tsx
{progress && (
  <div>
    正在下载: {progress.current}/{progress.total}
    <br />
    当前文件: {progress.filename}
    <br />
    进度: {progress.percentage}%
  </div>
)}
```

### 2. 图片数量限制

- 小红书最多支持9张图片
- 超过限制时自动截断并提示用户
- 代码会自动处理，无需手动判断

### 3. 错误处理

- 图片下载失败：跳过失败的图片，仅传递成功的
- 图片解码失败：记录失败的图片并提示用户
- 小红书未安装：提示用户安装小红书应用
- 网络错误：显示友好的错误提示

### 4. 用户提示

- 开始下载：显示"正在下载图片..."
- 下载进度：显示"正在下载 3/5 (60%)"
- 部分失败：显示"2张图片下载失败，已跳过"
- 打开小红书：显示"已打开小红书草稿箱"

## 🐛 常见问题

### 1. 小红书未打开

**原因**: 小红书应用未安装或包名不正确

**解决**: 
- 确保设备已安装小红书
- 检查包名是否为 `com.xingin.xhs`
- 检查 AndroidManifest.xml 中的 `<queries>` 配置

### 2. 图片无法传递

**原因**: FileProvider 配置不正确

**解决**:
- 检查 AndroidManifest.xml 中的 FileProvider 配置
- 确保 `file_paths.xml` 文件存在
- 确保 authority 为 `${applicationId}.fileprovider`

### 3. 部分图片失败

**原因**: 图片URL无效或网络问题

**解决**:
- 检查图片URL是否可访问
- 检查网络连接
- 查看控制台日志了解具体失败原因

### 4. Web端无法测试

**原因**: 小红书分享功能仅支持Android原生

**解决**:
- 使用Android设备或模拟器测试
- Web端会显示"Web端不支持此功能"的提示

## 📦 构建和部署

### 1. 构建前端

```bash
npm run build
```

### 2. 同步到Android

```bash
npx cap sync android
```

### 3. 打开Android Studio

```bash
npx cap open android
```

### 4. 构建APK

在 Android Studio 中：
- Build > Build Bundle(s) / APK(s) > Build APK(s)

## 🔐 安全注意事项

1. **图片权限**: 使用 FileProvider 安全地共享文件
2. **临时文件**: 图片保存在缓存目录，应用卸载时自动清理
3. **权限控制**: FileProvider 仅授予读取权限
4. **数据验证**: 所有输入数据都经过验证和过滤

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题，请通过以下方式联系：
- GitHub Issues
- Email: support@example.com

---

**注意**: 此功能需要在 Android 设备上测试，Web 端仅用于开发调试。
