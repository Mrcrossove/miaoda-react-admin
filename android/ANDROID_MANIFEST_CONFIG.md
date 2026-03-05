# AndroidManifest.xml 配置说明

## 小红书分享功能需要在 AndroidManifest.xml 中添加以下配置：

### 1. 在 <application> 标签内添加 FileProvider 配置

```xml
<application>
    <!-- 其他配置... -->
    
    <!-- FileProvider配置：用于多图分享 -->
    <!-- 多图适配关键点：配置FileProvider以共享多个图片文件 -->
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
```

### 2. 添加查询小红书应用的权限（Android 11+）

```xml
<manifest>
    <!-- 其他配置... -->
    
    <!-- 查询小红书应用是否已安装 -->
    <queries>
        <package android:name="com.xingin.xhs" />
    </queries>
    
</manifest>
```

### 3. 完整示例

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.app8sm6r7tdrncx">

    <!-- 网络权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    
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

    </application>

</manifest>
```

## 注意事项

1. **FileProvider Authority**：使用 `${applicationId}.fileprovider` 可以自动匹配应用包名
2. **grantUriPermissions**：必须设置为 `true`，允许其他应用访问共享的文件
3. **exported**：必须设置为 `false`，FileProvider不应该被外部直接访问
4. **queries**：Android 11+ 需要声明要查询的应用包名
5. **file_paths.xml**：必须在 `res/xml/` 目录下创建此文件

## 多图适配要点

- FileProvider 支持共享多个文件
- 使用 `Intent.ACTION_SEND_MULTIPLE` 传递多张图片
- 每个图片Uri都需要通过 `FileProvider.getUriForFile()` 获取
- 所有Uri都需要添加 `FLAG_GRANT_READ_URI_PERMISSION` 权限
