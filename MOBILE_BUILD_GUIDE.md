# 自媒体创作应用 - 移动端打包指南

## 📱 应用信息

- **应用名称**：自媒体创作
- **应用ID**：com.miaoda.creator
- **支持平台**：Android (APK) / iOS (IPA)

## 🚀 打包步骤

### 1. 构建Web应用

```bash
npm run build
```

### 2. 初始化Capacitor（首次）

```bash
npx cap init
```

### 3. 添加平台

#### Android平台

```bash
npx cap add android
```

#### iOS平台

```bash
npx cap add ios
```

### 4. 同步代码到原生项目

```bash
npx cap sync
```

### 5. 打开原生IDE进行打包

#### Android (APK)

```bash
npx cap open android
```

在Android Studio中：
1. 等待Gradle构建完成
2. 点击 `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
3. APK文件位置：`android/app/build/outputs/apk/debug/app-debug.apk`

#### iOS (IPA)

```bash
npx cap open ios
```

在Xcode中：
1. 选择真机或模拟器
2. 点击 `Product` > `Archive`
3. 选择 `Distribute App` 进行签名和导出

## ✨ 核心功能

### 原生分享功能

当应用打包成APK/IPA后，"发布到小红书"功能将使用**原生系统分享**：

1. **点击"发布到小红书"按钮**
   - 系统自动准备图片和文案
   - 弹出系统分享菜单

2. **选择"小红书"**
   - 小红书APP自动打开
   - 图片和文案自动填充

3. **点击"发布"**
   - 完成发布

### Web版本降级方案

如果在浏览器中使用，将自动降级为：
- 自动下载图片到设备
- 自动复制文案到剪贴板
- 打开小红书APP或网页版

## 📦 依赖说明

### Capacitor核心依赖

- `@capacitor/core` - Capacitor核心库
- `@capacitor/cli` - Capacitor命令行工具
- `@capacitor/share` - 系统分享功能
- `@capacitor/filesystem` - 文件系统访问

### 配置文件

- `capacitor.config.ts` - Capacitor配置
- `android/` - Android原生项目
- `ios/` - iOS原生项目

## 🔧 开发调试

### 在浏览器中调试

```bash
npm run dev
```

### 在真机上调试

#### Android

```bash
npx cap run android
```

#### iOS

```bash
npx cap run ios
```

## 📝 注意事项

1. **Android权限**：
   - 需要网络权限（已自动配置）
   - 需要存储权限（已自动配置）

2. **iOS权限**：
   - 需要在`Info.plist`中添加相册访问权限
   - 需要在`Info.plist`中添加相机权限（如果需要）

3. **小红书APP**：
   - 用户设备需要安装小红书APP
   - 如果未安装，将降级为Web方案

4. **图片格式**：
   - 支持JPG、PNG格式
   - 自动转换为base64存储到临时目录

## 🎯 发布流程

### Android发布

1. 生成签名密钥
2. 配置`build.gradle`
3. 构建Release版本APK
4. 上传到应用商店或直接分发

### iOS发布

1. 配置Apple Developer账号
2. 创建App ID和证书
3. 配置Provisioning Profile
4. Archive并导出IPA
5. 上传到App Store或TestFlight

## 🆘 常见问题

### Q: 分享功能不工作？
A: 确保已安装Capacitor依赖并执行`npx cap sync`

### Q: Android打包失败？
A: 检查Android Studio和Gradle版本，确保JDK版本正确

### Q: iOS打包失败？
A: 检查Xcode版本，确保Apple Developer账号配置正确

### Q: 小红书不在分享菜单中？
A: 确保用户设备已安装小红书APP

## 📞 技术支持

如有问题，请查看：
- Capacitor官方文档：https://capacitorjs.com/
- Android开发文档：https://developer.android.com/
- iOS开发文档：https://developer.apple.com/
