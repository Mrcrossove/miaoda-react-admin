# 秒哒平台 - 小红书一键发布完整方案

## 📋 方案概述

为基于秒哒开发、XBuilder云打包的「媒创精灵」App实现一键发布到小红书功能，支持多图（最多9张）+文案自动填充，适配安卓端。

### 已完成的前置条件 ✅
- ✅ XBuilder的manifest.json已配置小红书Scheme白名单（xhsdiscover）
- ✅ 已实现多图保存至系统相册
- ✅ 已收集相册路径为数组变量
- ✅ 已保存文案为字符串变量
- ✅ App已获取Gallery相册权限
- ✅ 支持最多9张图发布

## 🎯 核心实现代码

### 1. 完整的JS代码（秒哒兼容版）

```javascript
/**
 * 秒哒平台 - 小红书一键发布核心代码
 * 适配XBuilder云打包，支持多图+文案自动填充
 * 
 * 占位符说明：
 * {{IMAGE_PATHS_ARRAY}} - 替换为实际的多图路径数组变量，例如：$page.dataset.imagePaths
 * {{CAPTION_TEXT}} - 替换为实际的文案变量，例如：$page.dataset.caption
 */

function publishToXiaohongshu() {
  try {
    // ========== 第1步：读取变量（替换占位符） ==========
    // 占位符1：多图路径数组
    // 秒哒中替换为：$page.dataset.imagePaths 或其他实际变量名
    const imagePaths = {{IMAGE_PATHS_ARRAY}};
    
    // 占位符2：文案内容
    // 秒哒中替换为：$page.dataset.caption 或其他实际变量名
    const caption = {{CAPTION_TEXT}};
    
    console.log('📸 读取到的图片路径数组:', imagePaths);
    console.log('📝 读取到的文案内容:', caption);
    
    // ========== 第2步：前置校验 ==========
    // 校验1：图片数量不超过9张
    if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 9) {
      alert('小红书单条笔记最多支持9张图片，请删减后重试');
      return; // 终止后续操作
    }
    
    // 校验2：至少有文案或图片
    if ((!imagePaths || imagePaths.length === 0) && (!caption || caption.trim() === '')) {
      alert('请至少添加图片或文案');
      return;
    }
    
    // ========== 第3步：构造Scheme链接 ==========
    let schemeUrl = 'xhsdiscover://creator?';
    
    // 处理图片路径（如果有）
    if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 0) {
      // 过滤空值
      const validPaths = imagePaths.filter(path => path && path.trim() !== '');
      
      if (validPaths.length > 0) {
        // 用英文逗号拼接
        const pathsString = validPaths.join(',');
        console.log('🔗 拼接后的路径字符串:', pathsString);
        
        // encodeURIComponent编码
        const encodedPaths = encodeURIComponent(pathsString);
        console.log('🔐 编码后的路径:', encodedPaths);
        
        // 添加到Scheme
        schemeUrl += 'imagePaths=' + encodedPaths;
      }
    }
    
    // 处理文案（如果有）
    if (caption && caption.trim() !== '') {
      // 如果已经有imagePaths参数，添加&连接符
      if (schemeUrl.indexOf('imagePaths=') !== -1) {
        schemeUrl += '&';
      }
      
      // encodeURIComponent编码
      const encodedCaption = encodeURIComponent(caption.trim());
      console.log('🔐 编码后的文案:', encodedCaption);
      
      // 添加到Scheme
      schemeUrl += 'content=' + encodedCaption;
    }
    
    console.log('🚀 最终Scheme链接:', schemeUrl);
    
    // ========== 第4步：唤起小红书（适配云打包） ==========
    // 创建隐藏的a标签
    const link = document.createElement('a');
    link.href = schemeUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // 设置超时降级标志
    let hasOpened = false;
    
    // 点击a标签唤起小红书
    link.click();
    hasOpened = true;
    
    console.log('✅ 已触发小红书唤起');
    
    // 1200ms后检查是否成功唤起
    setTimeout(function() {
      // 移除a标签
      if (link && link.parentNode) {
        document.body.removeChild(link);
      }
      
      // 如果页面仍然可见，说明唤起可能失败
      if (!document.hidden && hasOpened) {
        console.warn('⚠️ 小红书唤起可能失败');
        alert('唤起失败，请手动打开小红书，在发布页选择相册中的图片');
      }
    }, 1200);
    
  } catch (error) {
    console.error('❌ 发布到小红书失败:', error);
    alert('发布失败：' + error.message);
  }
}

// ========== 绑定到按钮点击事件 ==========
// 在秒哒中，将此函数绑定到"发布到小红薯"按钮的onClick事件
// 方式：在按钮的事件配置中，选择"自定义JS"，调用 publishToXiaohongshu()
```

### 2. 简化版代码（去除注释，适合直接复制）

```javascript
function publishToXiaohongshu() {
  try {
    const imagePaths = {{IMAGE_PATHS_ARRAY}};
    const caption = {{CAPTION_TEXT}};
    
    if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 9) {
      alert('小红书单条笔记最多支持9张图片，请删减后重试');
      return;
    }
    
    if ((!imagePaths || imagePaths.length === 0) && (!caption || caption.trim() === '')) {
      alert('请至少添加图片或文案');
      return;
    }
    
    let schemeUrl = 'xhsdiscover://creator?';
    
    if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 0) {
      const validPaths = imagePaths.filter(path => path && path.trim() !== '');
      if (validPaths.length > 0) {
        const pathsString = validPaths.join(',');
        const encodedPaths = encodeURIComponent(pathsString);
        schemeUrl += 'imagePaths=' + encodedPaths;
      }
    }
    
    if (caption && caption.trim() !== '') {
      if (schemeUrl.indexOf('imagePaths=') !== -1) {
        schemeUrl += '&';
      }
      const encodedCaption = encodeURIComponent(caption.trim());
      schemeUrl += 'content=' + encodedCaption;
    }
    
    const link = document.createElement('a');
    link.href = schemeUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    let hasOpened = false;
    link.click();
    hasOpened = true;
    
    setTimeout(function() {
      if (link && link.parentNode) {
        document.body.removeChild(link);
      }
      if (!document.hidden && hasOpened) {
        alert('唤起失败，请手动打开小红书，在发布页选择相册中的图片');
      }
    }, 1200);
    
  } catch (error) {
    console.error('发布到小红书失败:', error);
    alert('发布失败：' + error.message);
  }
}
```

## 📝 占位符说明和替换方式

### 占位符1：{{IMAGE_PATHS_ARRAY}}

**含义**：多图相册路径数组变量

**秒哒中的替换方式**：
```javascript
// 示例1：如果图片路径数组存储在页面数据的imagePaths字段
{{IMAGE_PATHS_ARRAY}} → $page.dataset.imagePaths

// 示例2：如果存储在其他字段
{{IMAGE_PATHS_ARRAY}} → $page.dataset.productImages

// 示例3：如果是全局变量
{{IMAGE_PATHS_ARRAY}} → window.globalImagePaths
```

**数据格式要求**：
```javascript
// 正确格式：字符串数组
[
  "/storage/emulated/0/DCIM/Camera/IMG_001.jpg",
  "/storage/emulated/0/DCIM/Camera/IMG_002.jpg",
  "/storage/emulated/0/DCIM/Camera/IMG_003.jpg"
]

// 错误格式：
// ❌ 字符串："path1,path2,path3"
// ❌ 对象数组：[{path: "xxx"}, {path: "yyy"}]
```

### 占位符2：{{CAPTION_TEXT}}

**含义**：文案内容字符串变量

**秒哒中的替换方式**：
```javascript
// 示例1：如果文案存储在页面数据的caption字段
{{CAPTION_TEXT}} → $page.dataset.caption

// 示例2：如果存储在其他字段
{{CAPTION_TEXT}} → $page.dataset.productDescription

// 示例3：如果是全局变量
{{CAPTION_TEXT}} → window.globalCaption
```

**数据格式要求**：
```javascript
// 正确格式：字符串
"✨ 今天分享超实用的技巧！#生活小妙招 #干货分享"

// 支持emoji和话题标签
// 最大长度：建议不超过1000字
```

## 🔧 秒哒平台变量关联步骤

### 步骤1：确认变量名称

在秒哒平台中，找到存储图片路径数组和文案的变量名称。

**查看方式**：
1. 打开秒哒编辑器
2. 选择"我有产品"页面
3. 查看页面数据（Page Data）
4. 找到图片路径数组和文案字段的名称

**常见变量名**：
- 图片路径：`imagePaths`、`productImages`、`imageList`
- 文案内容：`caption`、`description`、`content`

### 步骤2：替换代码中的占位符

将上面的完整JS代码复制到文本编辑器，进行以下替换：

```javascript
// 替换前
const imagePaths = {{IMAGE_PATHS_ARRAY}};
const caption = {{CAPTION_TEXT}};

// 替换后（假设变量名为imagePaths和caption）
const imagePaths = $page.dataset.imagePaths;
const caption = $page.dataset.caption;
```

### 步骤3：在秒哒中添加自定义JS

1. 在秒哒编辑器中，选择"发布到小红薯"按钮
2. 打开按钮的事件配置面板
3. 选择"点击事件"（onClick）
4. 选择"自定义JS"
5. 将替换后的完整代码粘贴进去
6. 保存

### 步骤4：测试变量绑定

在秒哒预览模式中，打开浏览器控制台（F12），点击"发布到小红薯"按钮，查看console.log输出：

```javascript
📸 读取到的图片路径数组: ["/storage/...", "/storage/..."]
📝 读取到的文案内容: "✨ 今天分享..."
🔗 拼接后的路径字符串: "/storage/...jpg,/storage/...jpg"
🔐 编码后的路径: "%2Fstorage%2F..."
🔐 编码后的文案: "%E2%9C%A8%20..."
🚀 最终Scheme链接: xhsdiscover://creator?imagePaths=...&content=...
✅ 已触发小红书唤起
```

如果看到以上输出，说明变量绑定成功。

## 🧪 测试要点和验证步骤

### 秒哒端测试要点

#### 测试1：变量读取测试
```javascript
// 在按钮点击事件中添加测试代码
console.log('图片路径数组:', $page.dataset.imagePaths);
console.log('文案内容:', $page.dataset.caption);

// 预期输出：
// 图片路径数组: ["/storage/...", ...]
// 文案内容: "✨ 今天分享..."
```

#### 测试2：前置校验测试
```javascript
// 测试场景1：图片超过9张
// 预期：弹出提示"小红书单条笔记最多支持9张图片，请删减后重试"

// 测试场景2：无图片无文案
// 预期：弹出提示"请至少添加图片或文案"

// 测试场景3：正常情况（3张图+文案）
// 预期：正常唤起小红书
```

#### 测试3：Scheme链接构造测试
```javascript
// 在代码中添加console.log输出最终Scheme链接
console.log('最终Scheme链接:', schemeUrl);

// 预期格式：
// xhsdiscover://creator?imagePaths=%2Fstorage%2F...&content=%E2%9C%A8%20...

// 检查要点：
// 1. 路径用逗号拼接
// 2. 路径和文案都经过encodeURIComponent编码
// 3. 参数用&连接
```

### 云打包后验证步骤

#### 步骤1：打包APK
1. 在XBuilder中选择"云打包"
2. 选择Android平台
3. 确认manifest.json中已配置小红书Scheme白名单
4. 开始打包
5. 下载APK文件

#### 步骤2：安装测试
1. 将APK安装到Android测试设备
2. 确保设备已安装小红书APP
3. 打开「媒创精灵」App
4. 进入"我有产品"页面
5. 生成图片和文案

#### 步骤3：功能测试
```
测试场景1：正常发布（3张图+文案）
操作：点击"发布到小红薯"按钮
预期：
  1. 小红书APP自动打开
  2. 进入发布页面
  3. 图片和文案自动填充（如果小红书支持）
  4. 用户点击"发布"完成

测试场景2：仅文案发布
操作：删除所有图片，只保留文案，点击按钮
预期：
  1. 小红书APP自动打开
  2. 进入发布页面
  3. 文案自动填充
  4. 用户手动添加图片或直接发布

测试场景3：图片超限
操作：添加10张图片，点击按钮
预期：
  1. 弹出提示"小红书单条笔记最多支持9张图片，请删减后重试"
  2. 不唤起小红书

测试场景4：唤起失败
操作：在未安装小红书的设备上点击按钮
预期：
  1. 1200ms后弹出提示"唤起失败，请手动打开小红书..."
```

#### 步骤4：兼容性测试
```
测试设备：
- 华为（EMUI/HarmonyOS）
- 小米（MIUI）
- OPPO（ColorOS）
- vivo（OriginOS）
- 三星（OneUI）

测试系统版本：
- Android 9.0
- Android 10.0
- Android 11.0
- Android 12.0+

测试小红书版本：
- 最新版本
- 较旧版本（如果用户未更新）
```

## ⚠️ 三个核心避坑点

### 避坑点1：编码规则

**问题**：路径或文案包含特殊字符（如中文、空格、符号）时，未编码会导致Scheme解析失败。

**正确做法**：
```javascript
// ✅ 正确：使用encodeURIComponent编码
const encodedPaths = encodeURIComponent(pathsString);
const encodedCaption = encodeURIComponent(caption);

// ❌ 错误：不编码
schemeUrl += 'imagePaths=' + pathsString; // 可能包含特殊字符
```

**示例**：
```javascript
// 原始文案
const caption = "✨ 今天分享超实用的技巧！#生活小妙招";

// 编码后
const encoded = encodeURIComponent(caption);
// 结果："%E2%9C%A8%20%E4%BB%8A%E5%A4%A9%E5%88%86%E4%BA%AB..."

// 如果不编码，Scheme会解析失败
```

**检查方法**：
```javascript
// 在console中检查编码结果
console.log('编码前:', caption);
console.log('编码后:', encodeURIComponent(caption));
console.log('解码验证:', decodeURIComponent(encodeURIComponent(caption)));
```

### 避坑点2：路径格式

**问题**：Android相册路径格式不统一，可能导致小红书无法识别。

**常见路径格式**：
```javascript
// 格式1：绝对路径（推荐）
"/storage/emulated/0/DCIM/Camera/IMG_20260108_123456.jpg"

// 格式2：content URI（部分设备）
"content://media/external/images/media/12345"

// 格式3：file URI
"file:///storage/emulated/0/DCIM/Camera/IMG_20260108_123456.jpg"
```

**正确做法**：
```javascript
// 统一处理路径格式
function normalizePath(path) {
  if (!path) return '';
  
  // 移除file://前缀
  if (path.startsWith('file://')) {
    path = path.substring(7);
  }
  
  // content URI保持不变（小红书可能支持）
  if (path.startsWith('content://')) {
    return path;
  }
  
  // 确保是绝对路径
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  return path;
}

// 在代码中使用
const validPaths = imagePaths
  .filter(path => path && path.trim() !== '')
  .map(path => normalizePath(path));
```

**检查方法**：
```javascript
// 在console中检查路径格式
console.log('原始路径:', imagePaths);
console.log('处理后路径:', validPaths);

// 确保路径格式正确
validPaths.forEach((path, index) => {
  console.log(`路径${index + 1}:`, path);
  console.log('  - 是否绝对路径:', path.startsWith('/'));
  console.log('  - 是否content URI:', path.startsWith('content://'));
});
```

### 避坑点3：唤起方式

**问题**：在XBuilder云打包后，`window.location.href`可能无法正常唤起小红书。

**错误做法**：
```javascript
// ❌ 错误：直接使用window.location.href
window.location.href = schemeUrl; // 云打包后可能失效
```

**正确做法**：
```javascript
// ✅ 正确：创建a标签点击
const link = document.createElement('a');
link.href = schemeUrl;
link.style.display = 'none';
document.body.appendChild(link);
link.click();

// 清理
setTimeout(function() {
  if (link && link.parentNode) {
    document.body.removeChild(link);
  }
}, 1200);
```

**为什么要用a标签**：
1. XBuilder云打包后，`window.location.href`可能被限制
2. a标签的点击事件更可靠，兼容性更好
3. 可以设置`target="_blank"`（如果需要）
4. 更符合用户主动触发的语义

**超时降级处理**：
```javascript
// 设置1200ms超时
setTimeout(function() {
  // 检查页面是否仍然可见
  if (!document.hidden) {
    // 说明小红书可能未成功唤起
    alert('唤起失败，请手动打开小红书，在发布页选择相册中的图片');
  }
}, 1200);
```

**检查方法**：
```javascript
// 在云打包后的APK中测试
// 1. 打开Chrome远程调试（chrome://inspect）
// 2. 连接设备
// 3. 查看console输出
// 4. 观察是否成功唤起小红书
```

## 📊 完整的实现流程图

```
用户点击"发布到小红薯"按钮
    ↓
读取变量（图片路径数组、文案）
    ↓
前置校验
    ├─ 图片数量 > 9？ → 是 → 弹出提示，终止
    ├─ 无图片且无文案？ → 是 → 弹出提示，终止
    └─ 否 → 继续
    ↓
构造Scheme链接
    ├─ 有图片？
    │   ├─ 是 → 过滤空值 → 逗号拼接 → encodeURIComponent编码
    │   └─ 否 → 跳过imagePaths参数
    ├─ 有文案？
    │   ├─ 是 → encodeURIComponent编码
    │   └─ 否 → 跳过content参数
    └─ 拼接完整Scheme：xhsdiscover://creator?imagePaths=...&content=...
    ↓
创建a标签
    ├─ 设置href为Scheme链接
    ├─ 设置display: none
    └─ 添加到DOM
    ↓
点击a标签（触发唤起）
    ↓
设置1200ms超时检查
    ├─ 小红书成功唤起 → 页面进入后台 → 成功 ✅
    └─ 小红书未唤起 → 页面仍可见 → 弹出降级提示
    ↓
清理a标签（从DOM移除）
```

## 🔍 调试技巧

### 技巧1：使用console.log追踪

在代码的关键位置添加console.log：

```javascript
console.log('📸 读取到的图片路径数组:', imagePaths);
console.log('📝 读取到的文案内容:', caption);
console.log('🔗 拼接后的路径字符串:', pathsString);
console.log('🔐 编码后的路径:', encodedPaths);
console.log('🔐 编码后的文案:', encodedCaption);
console.log('🚀 最终Scheme链接:', schemeUrl);
console.log('✅ 已触发小红书唤起');
```

### 技巧2：Chrome远程调试

1. 在电脑上打开Chrome浏览器
2. 访问`chrome://inspect`
3. 用USB连接Android设备
4. 在设备上打开「媒创精灵」App
5. 在Chrome中选择对应的WebView
6. 查看console输出和网络请求

### 技巧3：分步测试

```javascript
// 步骤1：测试变量读取
function testStep1() {
  const imagePaths = $page.dataset.imagePaths;
  const caption = $page.dataset.caption;
  console.log('变量读取测试:', { imagePaths, caption });
  alert('变量读取成功，请查看console');
}

// 步骤2：测试Scheme构造
function testStep2() {
  const schemeUrl = 'xhsdiscover://creator?imagePaths=test&content=test';
  console.log('Scheme链接:', schemeUrl);
  alert('Scheme构造成功：' + schemeUrl);
}

// 步骤3：测试a标签唤起
function testStep3() {
  const link = document.createElement('a');
  link.href = 'xhsdiscover://creator?content=test';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  alert('已触发唤起，请查看是否打开小红书');
}
```

## 📞 常见问题解答

### Q1: 为什么要用encodeURIComponent编码？

**A**: 因为路径和文案可能包含特殊字符（中文、空格、符号等），不编码会导致Scheme解析失败。

示例：
```javascript
// 不编码
"xhsdiscover://creator?content=✨ 今天分享" // ❌ 解析失败

// 编码后
"xhsdiscover://creator?content=%E2%9C%A8%20%E4%BB%8A%E5%A4%A9" // ✅ 正确
```

### Q2: 为什么要用逗号拼接路径？

**A**: 小红书Scheme的imagePaths参数要求用逗号分隔多个路径。

示例：
```javascript
// 正确格式
"imagePaths=/path1.jpg,/path2.jpg,/path3.jpg"

// 错误格式
"imagePaths=/path1.jpg&imagePaths=/path2.jpg" // ❌
```

### Q3: 为什么要设置1200ms超时？

**A**: 给小红书APP足够的启动时间。如果1200ms后页面仍可见，说明唤起可能失败。

### Q4: 如果小红书没有自动填充图片和文案怎么办？

**A**: 这取决于小红书APP的实现。如果不支持自动填充，用户需要手动操作：
1. 图片已保存到相册
2. 在小红书发布页手动选择图片
3. 手动输入或粘贴文案

### Q5: 支持iOS吗？

**A**: 当前方案仅适配Android。iOS需要额外配置Universal Links，且小红书的iOS Scheme可能不同。

## 📝 完整示例代码（可直接使用）

```javascript
/**
 * 秒哒平台 - 小红书一键发布
 * 使用前请替换占位符：
 * - {{IMAGE_PATHS_ARRAY}} → $page.dataset.imagePaths
 * - {{CAPTION_TEXT}} → $page.dataset.caption
 */
function publishToXiaohongshu() {
  try {
    // 读取变量（替换占位符）
    const imagePaths = {{IMAGE_PATHS_ARRAY}};
    const caption = {{CAPTION_TEXT}};
    
    console.log('📸 图片路径:', imagePaths);
    console.log('📝 文案内容:', caption);
    
    // 前置校验
    if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 9) {
      alert('小红书单条笔记最多支持9张图片，请删减后重试');
      return;
    }
    
    if ((!imagePaths || imagePaths.length === 0) && (!caption || caption.trim() === '')) {
      alert('请至少添加图片或文案');
      return;
    }
    
    // 构造Scheme链接
    let schemeUrl = 'xhsdiscover://creator?';
    
    // 处理图片
    if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 0) {
      const validPaths = imagePaths.filter(path => path && path.trim() !== '');
      if (validPaths.length > 0) {
        const pathsString = validPaths.join(',');
        const encodedPaths = encodeURIComponent(pathsString);
        schemeUrl += 'imagePaths=' + encodedPaths;
      }
    }
    
    // 处理文案
    if (caption && caption.trim() !== '') {
      if (schemeUrl.indexOf('imagePaths=') !== -1) {
        schemeUrl += '&';
      }
      const encodedCaption = encodeURIComponent(caption.trim());
      schemeUrl += 'content=' + encodedCaption;
    }
    
    console.log('🚀 Scheme链接:', schemeUrl);
    
    // 唤起小红书（适配云打包）
    const link = document.createElement('a');
    link.href = schemeUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // 超时降级
    setTimeout(function() {
      if (link && link.parentNode) {
        document.body.removeChild(link);
      }
      if (!document.hidden) {
        alert('唤起失败，请手动打开小红书，在发布页选择相册中的图片');
      }
    }, 1200);
    
  } catch (error) {
    console.error('❌ 发布失败:', error);
    alert('发布失败：' + error.message);
  }
}
```

## ✅ 实施检查清单

在部署前，请确认以下事项：

- [ ] 已在XBuilder的manifest.json中配置小红书Scheme白名单（xhsdiscover）
- [ ] 已实现多图保存到相册功能
- [ ] 已收集相册路径为数组变量
- [ ] 已保存文案为字符串变量
- [ ] 已获取Gallery相册权限
- [ ] 已替换代码中的占位符（{{IMAGE_PATHS_ARRAY}}和{{CAPTION_TEXT}}）
- [ ] 已在秒哒中绑定按钮点击事件
- [ ] 已在秒哒预览模式中测试变量读取
- [ ] 已在秒哒预览模式中测试前置校验
- [ ] 已在秒哒预览模式中测试Scheme构造
- [ ] 已云打包APK并安装到测试设备
- [ ] 已在真机上测试唤起小红书功能
- [ ] 已测试多种场景（正常、超限、无图、无文案）
- [ ] 已在多个设备和系统版本上测试兼容性

---

**版本**：v1.0.0  
**更新日期**：2026-01-08  
**适用平台**：秒哒 + XBuilder云打包 + Android  
**小红书Scheme**：xhsdiscover://creator
