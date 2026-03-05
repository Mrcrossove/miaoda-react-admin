# 小红书自动发布功能 - Android无障碍服务配置

## ⚠️ 重要说明

此功能使用Android无障碍服务（Accessibility Service）实现自动化操作，可以模拟用户在小红书APP中的操作，实现真正的"一键发布"。

### 功能特性
- ✅ 自动打开小红书APP
- ✅ 自动点击"+"发布按钮
- ✅ 自动选择图片
- ✅ 自动填写文案
- ✅ 用户只需最后点击"发布"按钮

### 风险提示
⚠️ **使用前请务必阅读**：
1. 此功能可能违反小红书服务条款
2. 小红书可能会检测并封禁使用自动化工具的账号
3. 需要用户手动授予无障碍权限
4. 需要持续维护以适配小红书APP更新
5. 不同设备和系统版本可能存在兼容性问题

## 📋 AndroidManifest.xml 配置

需要在 AndroidManifest.xml 中添加以下配置：

### 1. 添加无障碍服务声明

在 `<application>` 标签内添加：

```xml
<application>
    <!-- 其他配置... -->
    
    <!-- 小红书自动发布无障碍服务 -->
    <service
        android:name="com.app8sm6r7tdrncx.services.XhsAutoPublishService"
        android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
        android:exported="true">
        <intent-filter>
            <action android:name="android.accessibilityservice.AccessibilityService" />
        </intent-filter>
        <meta-data
            android:name="android.accessibilityservice"
            android:resource="@xml/xhs_auto_publish_service_config" />
    </service>
    
</application>
```

### 2. 完整的 AndroidManifest.xml 示例

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.app8sm6r7tdrncx">

    <!-- 网络权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- 读写存储权限（用于保存图片） -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <!-- 查询已安装应用的权限（Android 11+） -->
    <queries>
        <package android:name="com.xingin.xhs" />
    </queries>

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <!-- 主Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

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

        <!-- 小红书自动发布无障碍服务 -->
        <service
            android:name="com.app8sm6r7tdrncx.services.XhsAutoPublishService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/xhs_auto_publish_service_config" />
        </service>

    </application>

</manifest>
```

## 📁 文件结构

确保以下文件已创建：

```
android/app/src/main/
├── java/com/app8sm6r7tdrncx/
│   └── services/
│       └── XhsAutoPublishService.java          # 无障碍服务实现
├── res/
│   ├── values/
│   │   └── strings.xml                         # 字符串资源
│   └── xml/
│       ├── file_paths.xml                      # FileProvider配置
│       └── xhs_auto_publish_service_config.xml # 无障碍服务配置
```

## 🔧 使用方法

### 1. 用户首次使用需要授权

用户需要在系统设置中授予无障碍权限：

1. 打开手机「设置」
2. 进入「无障碍」或「辅助功能」
3. 找到「自媒体创作 - 小红书自动发布服务」
4. 开启服务

### 2. 前端调用方式

修改 XhsSharePlugin.java，添加启动无障碍服务的方法：

```java
@PluginMethod
public void shareWithAutoPublish(PluginCall call) {
    String text = call.getString("text", "");
    JSArray imagesArray = call.getArray("images");
    
    // 检查无障碍服务是否已启用
    if (!isAccessibilityServiceEnabled()) {
        // 引导用户开启无障碍服务
        openAccessibilitySettings();
        call.reject("请先开启无障碍服务");
        return;
    }
    
    // 保存图片到相册
    List<String> imagePaths = saveImagesToAlbum(imagesArray);
    
    // 启动自动发布任务
    XhsAutoPublishService.startAutoPublish(imagePaths, text);
    
    // 打开小红书APP
    Intent intent = getContext().getPackageManager()
        .getLaunchIntentForPackage("com.xingin.xhs");
    if (intent != null) {
        getContext().startActivity(intent);
        call.resolve();
    } else {
        call.reject("未安装小红书APP");
    }
}

// 检查无障碍服务是否已启用
private boolean isAccessibilityServiceEnabled() {
    String service = getContext().getPackageName() + 
        "/.services.XhsAutoPublishService";
    
    try {
        int enabled = Settings.Secure.getInt(
            getContext().getContentResolver(),
            Settings.Secure.ACCESSIBILITY_ENABLED
        );
        
        if (enabled == 1) {
            String services = Settings.Secure.getString(
                getContext().getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );
            return services != null && services.contains(service);
        }
    } catch (Settings.SettingNotFoundException e) {
        e.printStackTrace();
    }
    
    return false;
}

// 打开无障碍设置页面
private void openAccessibilitySettings() {
    Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    getContext().startActivity(intent);
}
```

### 3. 前端TypeScript调用

```typescript
// 在 XhsSharePlugin.ts 中添加接口
export interface XhsSharePlugin {
  shareWithAutoPublish(options: {
    text: string;
    images: Array<{ base64: string; filename: string }>;
  }): Promise<{ success: boolean; message: string }>;
}

// 在 useXhsShare Hook 中调用
const result = await XhsShare.shareWithAutoPublish({
  text: caption,
  images: base64Images,
});
```

## 🎯 工作流程

1. **用户点击"发布到小红书"按钮**
2. **检查无障碍服务是否已启用**
   - 如果未启用，引导用户开启
3. **保存图片到相册**
4. **启动自动发布任务**
5. **打开小红书APP**
6. **无障碍服务自动执行以下操作**：
   - 检测到小红书打开
   - 自动点击"+"发布按钮
   - 自动点击"相册"或"图片"
   - 自动选择刚才保存的图片
   - 自动点击"下一步"
   - 自动在文案输入框填写文案
7. **用户点击"发布"按钮完成发布**

## ⚙️ 适配说明

### 小红书APP版本适配

不同版本的小红书APP，UI布局可能不同，需要根据实际情况调整：

1. **发布按钮**：可能是"+"、"发布"、底部中间按钮等
2. **相册入口**：可能是"相册"、"图片"、"从相册选择"等
3. **图片选择**：可能是网格布局、列表布局等
4. **下一步按钮**：可能是"下一步"、"完成"、"Next"等
5. **文案输入框**：可能是单行、多行EditText

### 调试方法

1. 在 XhsAutoPublishService.java 中添加详细日志
2. 使用 `adb logcat` 查看日志输出
3. 使用 Android Studio 的 Layout Inspector 查看小红书UI结构
4. 根据实际UI调整节点查找逻辑

## ⚠️ 法律和道德考虑

### 使用此功能前请考虑：

1. **服务条款**：可能违反小红书的服务条款
2. **账号安全**：可能导致账号被封禁
3. **用户体验**：自动化操作可能影响其他用户体验
4. **隐私保护**：无障碍服务可以访问屏幕上的所有内容
5. **法律风险**：某些地区可能有相关法律限制

### 建议：

- 仅供学习和研究使用
- 不要用于商业目的
- 不要批量自动发布
- 尊重平台规则
- 保护用户隐私

## 📞 技术支持

如有问题，请提供：
- Android版本
- 小红书APP版本
- 设备型号
- 日志输出（adb logcat）
- 具体现象描述

---

**版本**：v3.0.0  
**更新日期**：2026-01-08  
**适用平台**：Android  
**小红书版本**：需要根据实际版本适配  
**风险等级**：⚠️ 高风险（可能导致账号封禁）
