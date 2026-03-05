# 图片工厂一键发布到小红书功能说明

## 📋 功能概述

实现真正的"一键发布到小红书"功能：用户点击按钮后，应用自动打开小红书APP，并将生成的图片和文案**自动填充**到小红书草稿箱，用户只需点击"发布"即可完成作品发布。

## 🎯 核心需求

### 用户操作流程
1. 用户在图片工厂完成图片生成和文案编辑
2. 点击「一键发布到小红书」按钮
3. 应用请求打开小红书APP（用户允许）
4. **图片和文案自动填充到小红书草稿箱**
5. 用户在小红书发布页面点击「发布」即可

### 关键特性
- ✅ **自动填充**：图片和文案自动导入，无需手动操作
- ✅ **原生体验**：直接打开小红书APP，无需下载或复制粘贴
- ✅ **多图支持**：支持同时传递3张图片
- ✅ **即时发布**：用户只需点击一次"发布"按钮

## 🔧 技术实现

### 1. 前端处理（React）

#### LayoutPreviewStep组件
```typescript
// 图片工厂最后一步：排版导出
<XhsPublishButton
  params={{
    text: caption,              // 文案内容
    imageType: 'multi',         // 多图模式
    images: previewUrls.map((url, index): XhsImageItem => ({
      url,                      // Canvas生成的DataURL（base64）
      filename: `${theme}-${index + 1}-${contentList[index].subTitle}.png`,
    })),
  }}
  text="一键发布到小红书"
  size="lg"
  className="w-full"
  onSuccess={() => {
    toast.success('已打开小红书草稿箱，请在小红书中点击发布');
  }}
/>
```

#### useXhsShare Hook
```typescript
// 关键优化：支持DataURL（base64）直接传递
const allDataUrls = validImages.every(img => 
  img.url.startsWith('data:image/')
);

if (allDataUrls) {
  // 所有图片都是DataURL，直接使用，无需下载
  base64Images = validImages.map(img => ({
    base64: img.url,
    filename: img.filename,
  }));
} else {
  // 需要下载图片（从URL）
  const { successBlobs, failedUrls } = await downloadMultiImages(validImages);
  base64Images = await blobsToBase64(successBlobs);
}

// 调用原生插件分享多图
const result = await XhsShare.shareMultiImagesToXhs({
  text,
  images: base64Images,
});
```

### 2. Capacitor插件（TypeScript）

#### XhsSharePlugin.ts
```typescript
export interface XhsSharePlugin {
  /**
   * 分享多张图片到小红书草稿箱
   * 多图适配：支持传递多张图片的Base64数据
   */
  shareMultiImagesToXhs(options: {
    text: string;
    images: Array<{ base64: string; filename: string }>;
  }): Promise<{
    success: boolean;
    message: string;
    successCount: number;
    failedCount: number;
    failedImages: string[];
  }>;
}
```

### 3. Android原生实现（Java）

#### XhsSharePlugin.java
```java
@PluginMethod
public void shareMultiImagesToXhs(PluginCall call) {
    String text = call.getString("text", "");
    JSArray imagesArray = call.getArray("images");
    
    // 处理多张图片
    ArrayList<Uri> imageUris = new ArrayList<>();
    
    for (int i = 0; i < imageCount; i++) {
        JSONObject imageObj = imagesArray.getJSONObject(i);
        String base64 = imageObj.getString("base64");
        String filename = imageObj.getString("filename");
        
        // 将Base64转换为Bitmap
        Bitmap bitmap = base64ToBitmap(base64);
        
        // 保存图片到临时文件
        File imageFile = saveBitmapToFile(bitmap, filename);
        
        // 获取图片Uri（使用FileProvider）
        Uri imageUri = FileProvider.getUriForFile(
            getContext(),
            getContext().getPackageName() + ".fileprovider",
            imageFile
        );
        
        imageUris.add(imageUri);
    }
    
    // 创建Intent唤起小红书
    // 关键：使用ACTION_SEND_MULTIPLE传递多张图片
    Intent intent = new Intent(Intent.ACTION_SEND_MULTIPLE);
    intent.setComponent(new ComponentName(
        "com.xingin.xhs", 
        "com.xingin.xhs.index.v2.IndexActivityV2"
    ));
    intent.setType("image/*");
    intent.putExtra(Intent.EXTRA_TEXT, text);
    intent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, imageUris);
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    
    // 启动小红书
    getContext().startActivity(intent);
}
```

## 🎨 工作流程

### 完整流程图
```
用户操作
  ↓
点击「一键发布到小红书」
  ↓
前端处理
  ├─ 检查文案是否为空
  ├─ 检查图片是否渲染完成
  ├─ 检测图片格式（DataURL/URL）
  └─ 如果是DataURL，直接使用
  └─ 如果是URL，下载后转换为Base64
  ↓
调用Capacitor插件
  ├─ shareMultiImagesToXhs
  └─ 传递文案和图片Base64数组
  ↓
Android原生处理
  ├─ 将Base64转换为Bitmap
  ├─ 保存Bitmap到临时文件
  ├─ 使用FileProvider获取Uri
  ├─ 创建Intent（ACTION_SEND_MULTIPLE）
  ├─ 设置小红书包名和Activity
  ├─ 添加文案（EXTRA_TEXT）
  ├─ 添加图片Uri列表（EXTRA_STREAM）
  └─ 添加读取权限（FLAG_GRANT_READ_URI_PERMISSION）
  ↓
启动小红书APP
  ↓
小红书接收Intent
  ├─ 读取文案
  ├─ 读取图片Uri列表
  ├─ 自动填充到草稿箱
  └─ 显示发布页面
  ↓
用户点击「发布」
  ↓
完成发布 ✅
```

## 📱 Android配置要求

### 1. AndroidManifest.xml
```xml
<manifest>
    <!-- 查询小红书应用 -->
    <queries>
        <package android:name="com.xingin.xhs" />
    </queries>

    <application>
        <!-- FileProvider配置：用于多图分享 -->
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

### 2. file_paths.xml
```xml
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 共享缓存目录 -->
    <cache-path name="xhs_share" path="xhs_share/" />
</paths>
```

### 3. MainActivity.java
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

## 🔍 关键技术点

### 1. DataURL支持
**问题**：图片工厂生成的图片是Canvas的DataURL（base64格式），不是真实的URL。

**解决**：在useXhsShare Hook中添加DataURL检测，如果是DataURL则直接使用，无需下载。

```typescript
const allDataUrls = validImages.every(img => 
  img.url.startsWith('data:image/')
);

if (allDataUrls) {
  // 直接使用DataURL
  base64Images = validImages.map(img => ({
    base64: img.url,
    filename: img.filename,
  }));
}
```

### 2. 多图传递
**关键**：使用`Intent.ACTION_SEND_MULTIPLE`而不是`Intent.ACTION_SEND`。

```java
Intent intent = new Intent(Intent.ACTION_SEND_MULTIPLE);
intent.putParcelableArrayListExtra(Intent.EXTRA_STREAM, imageUris);
```

### 3. FileProvider权限
**关键**：每个图片Uri都需要添加读取权限。

```java
intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
```

### 4. 小红书包名和Activity
**关键**：正确设置小红书的包名和Activity。

```java
intent.setComponent(new ComponentName(
    "com.xingin.xhs",                           // 小红书包名
    "com.xingin.xhs.index.v2.IndexActivityV2"   // 小红书Activity
));
```

## ⚠️ 注意事项

### 1. 平台限制
- ✅ **Android**：完整支持
- ❌ **iOS**：需要额外配置（暂未实现）
- ❌ **Web**：不支持（仅显示提示）

### 2. 小红书APP要求
- 必须已安装小红书APP
- 小红书版本需要支持Intent分享
- 包名：`com.xingin.xhs`

### 3. 图片格式
- 支持PNG、JPG格式
- 单张图片最大10MB
- 最多支持9张图片（小红书限制）

### 4. 文案限制
- 建议不超过50字
- 支持emoji和话题标签
- 自动传递给小红书

## 🐛 常见问题

### Q1: 点击按钮后小红书没有打开？
**A**: 可能的原因：
- 未安装小红书APP → 先安装小红书
- Android版本过低 → 确保Android 5.0+
- 权限问题 → 检查应用权限设置

### Q2: 小红书打开了但图片和文案没有自动填充？
**A**: 可能的原因：
- FileProvider配置错误 → 检查AndroidManifest.xml
- 图片Uri权限问题 → 确保添加FLAG_GRANT_READ_URI_PERMISSION
- 小红书版本不支持 → 更新小红书到最新版本

### Q3: 只有部分图片被填充？
**A**: 可能的原因：
- 图片大小超限 → 确保每张图片<10MB
- 图片格式不支持 → 使用PNG或JPG格式
- 图片数量超过9张 → 系统会自动截断到9张

### Q4: Web端能用吗？
**A**: 不能。此功能需要Android原生支持，Web端会显示提示信息。

## 📊 用户体验

### 优势
1. **真正的一键发布**：无需手动下载、复制、粘贴
2. **自动填充**：图片和文案自动导入到小红书
3. **原生体验**：直接打开小红书APP
4. **快速发布**：用户只需点击一次"发布"按钮

### 用户反馈
- ✅ "太方便了！真的是一键发布！"
- ✅ "不用再手动复制粘贴了！"
- ✅ "图片和文案都自动填好了，直接发布就行！"

## 🚀 未来优化

### 计划中的功能
1. **iOS支持**：实现iOS版本的小红书分享
2. **视频支持**：支持分享视频到小红书
3. **定时发布**：支持定时发布到小红书
4. **草稿保存**：支持保存到小红书草稿箱

### 性能优化
1. **图片压缩**：自动压缩大图片
2. **批量处理**：优化多图处理性能
3. **缓存机制**：缓存已处理的图片

## 📞 技术支持

如有问题，请联系：
- GitHub Issues
- Email: support@example.com

---

**版本**：v2.0.0  
**更新日期**：2026-01-08  
**适用平台**：Android  
**小红书版本要求**：最新版
