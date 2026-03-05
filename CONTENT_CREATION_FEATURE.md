# 图文创作功能

## 功能概述

"图文创作"功能允许用户粘贴小红书笔记链接，一键优化文案进行二创，支持上传图片或使用图生图模型二创原图片，最后一键跳转到小红书发布。

## 功能特点

### 1. 小红书链接解析

- 用户粘贴小红书笔记链接
- 自动解析笔记内容（标题、正文、图片）
- 支持手动输入原始内容

### 2. 文案优化二创

- 使用文心大模型进行文案优化
- 流式输出，实时显示优化进度
- 保持原文核心信息和主题
- 优化语言表达，使其更生动有趣
- 添加适当的emoji表情符号
- 保持小红书社区风格
- 字数控制在300-500字之间

### 3. 图片管理

#### 上传图片
- 支持多张图片上传
- 支持JPEG、PNG、GIF、WEBP格式
- 单张图片最大1MB
- 自动压缩超大图片

#### 图生图二创
- 基于原图进行AI二创
- 保持主体内容不变
- 改变风格和色调
- 使图片更吸引人
- 适合小红书平台风格

#### 图片预览
- 网格布局展示所有图片
- 悬停显示操作按钮
- 支持删除单张图片
- 支持批量下载所有图片

### 4. 发布到小红书

- 一键复制优化后的文案
- 自动打开小红书创作者平台
- 用户手动粘贴文案和上传图片

## 使用流程

```
1. 粘贴小红书笔记链接
   ↓
2. 点击"解析"按钮
   ↓
3. 查看解析后的原始内容
   ↓
4. 点击"一键优化"按钮
   ↓
5. 实时查看优化后的文案
   ↓
6. 上传图片或使用图生图二创
   ↓
7. 预览图片和文案
   ↓
8. 点击"发布到小红书"
   ↓
9. 在小红书中粘贴文案和上传图片
```

## 技术实现

### 1. Edge Functions

#### parse-xiaohongshu-note
- 功能：解析小红书笔记链接
- 输入：笔记URL
- 输出：笔记内容（标题、正文、图片）
- API：网页内容总结API

#### optimize-xiaohongshu-copy
- 功能：优化文案进行二创
- 输入：原始内容
- 输出：优化后的文案（流式）
- API：文心大模型API

#### image-to-image-submit
- 功能：提交图生图任务
- 输入：图片Base64、MIME类型、提示词
- 输出：任务ID
- API：图片生成API

#### image-to-image-query
- 功能：查询图生图任务状态
- 输入：任务ID
- 输出：任务状态、图片URL
- API：图片生成查询API

### 2. 前端实现

#### 状态管理
```typescript
const [noteUrl, setNoteUrl] = useState('');
const [originalContent, setOriginalContent] = useState('');
const [optimizedContent, setOptimizedContent] = useState('');
const [isOptimizing, setIsOptimizing] = useState(false);
const [isParsing, setIsParsing] = useState(false);
const [uploadedImages, setUploadedImages] = useState<string[]>([]);
const [isUploading, setIsUploading] = useState(false);
const [imageToImageTasks, setImageToImageTasks] = useState<Map<string, { status: string; imageUrl?: string }>>(new Map());
```

#### 流式请求
使用`sendStreamRequest`函数处理流式响应：
```typescript
await sendStreamRequest({
  functionUrl: `${supabaseUrl}/functions/v1/optimize-xiaohongshu-copy`,
  requestBody: { originalContent },
  supabaseAnonKey,
  onData: (data) => {
    const parsed = JSON.parse(data);
    const chunk = parsed.content || '';
    setOptimizedContent(prev => prev + chunk);
  },
  onComplete: () => {
    setIsOptimizing(false);
    toast.success('文案优化完成');
  },
  onError: (error) => {
    toast.error('优化失败，请稍后重试');
  },
  signal: abortControllerRef.current.signal,
});
```

#### 图片上传
```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  for (const file of Array.from(files)) {
    // 验证文件大小和类型
    // 上传到Supabase Storage
    const imageUrl = await uploadImage(file);
    setUploadedImages(prev => [...prev, imageUrl]);
  }
};
```

#### 图生图轮询
```typescript
const pollImageToImageTask = async (taskId: string) => {
  const maxAttempts = 60; // 最多查询60次（10分钟）
  let attempts = 0;

  const poll = async () => {
    const result = await queryImageToImage(taskId);
    const { status, imageUrl } = result.data;
    
    if (status === 'SUCCESS' && imageUrl) {
      setUploadedImages(prev => [...prev, imageUrl]);
      return;
    } else if (status === 'PENDING' || status === 'PROCESSING') {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 10000); // 每10秒查询一次
      }
    }
  };

  poll();
};
```

### 3. 数据存储

#### Supabase Storage
- Bucket名称：`app-8sm6r7tdrncx_content_images`
- 权限：所有用户可上传、查看、删除
- 文件命名：`{timestamp}_{randomStr}.{ext}`

## 界面设计

### 布局
- 左右两栏布局（桌面端）
- 上下布局（移动端）
- 左侧：输入区域
- 右侧：输出区域

### 左侧输入区域

#### 步骤1：粘贴小红书链接
- 输入框：笔记链接
- 按钮：解析
- 文本框：原始内容（可编辑）

#### 步骤2：优化文案
- 按钮：一键优化 / 停止优化

#### 步骤3：上传或生成图片
- 按钮：上传图片
- 提示：支持格式和大小限制

### 右侧输出区域

#### 优化后的文案
- 标题：优化后的文案
- 按钮：复制
- 内容：流式显示优化后的文案

#### 图片预览
- 标题：图片预览
- 按钮：下载全部
- 网格：2列布局
- 悬停操作：二创、删除

#### 发布按钮
- 按钮：发布到小红书
- 状态：禁用（无文案时）

## 用户体验优化

### 1. 加载状态
- 解析中：显示加载动画
- 优化中：显示流式输出
- 上传中：显示上传进度
- 生成中：显示任务状态

### 2. 错误处理
- 链接格式错误：提示用户
- 解析失败：显示错误信息
- 优化失败：允许重试
- 上传失败：显示失败原因
- 生成失败：显示错误详情

### 3. 成功反馈
- 解析成功：Toast提示
- 优化完成：Toast提示
- 上传成功：Toast提示
- 生成成功：Toast提示 + 添加到图片列表
- 复制成功：Toast提示
- 下载完成：Toast提示

### 4. 交互优化
- 回车键触发解析
- 停止优化按钮
- 图片悬停显示操作
- 批量下载图片
- 一键发布

## 注意事项

### 1. 小红书链接解析
- 需要有效的小红书笔记链接
- 解析依赖网页内容总结API
- 可能受小红书反爬虫机制影响

### 2. 文案优化
- 使用文心大模型
- 生成时间约5-10秒
- 可能需要多次优化才能满意

### 3. 图片上传
- 单张图片最大1MB
- 超大图片会自动压缩
- 文件名只能包含英文字母和数字

### 4. 图生图
- 任务执行时间较长（5-10分钟）
- 每10秒查询一次任务状态
- 最多查询60次（10分钟）
- 可能因超时或其他原因失败

### 5. 发布到小红书
- 小红书没有开放API
- 无法直接从外部应用发布
- 需要用户手动粘贴文案和上传图片

## 未来优化方向

### 1. 批量处理
- 支持批量解析多个链接
- 支持批量优化文案
- 支持批量图生图

### 2. 模板管理
- 保存常用文案模板
- 快速应用模板
- 分享模板给其他用户

### 3. 历史记录
- 保存解析历史
- 保存优化历史
- 快速重新使用

### 4. 智能推荐
- 根据原文推荐优化方向
- 根据图片推荐二创风格
- 根据平台推荐发布时间

### 5. 数据分析
- 统计使用次数
- 分析优化效果
- 推荐热门话题

## 相关文件

- **src/pages/ContentCreationPage.tsx** - 主页面组件
- **supabase/functions/parse-xiaohongshu-note/index.ts** - 解析笔记Edge Function
- **supabase/functions/optimize-xiaohongshu-copy/index.ts** - 优化文案Edge Function
- **supabase/functions/image-to-image-submit/index.ts** - 提交图生图Edge Function
- **supabase/functions/image-to-image-query/index.ts** - 查询图生图Edge Function
- **src/db/api.ts** - API调用函数
- **src/utils/stream.ts** - 流式请求工具

## 测试建议

### 功能测试
1. 测试链接解析功能
2. 测试文案优化功能
3. 测试图片上传功能
4. 测试图生图功能
5. 测试图片管理功能
6. 测试发布功能

### 边界测试
1. 无效链接
2. 空内容
3. 超大图片
4. 多张图片
5. 网络错误
6. API超时

### 性能测试
1. 解析速度
2. 优化速度
3. 上传速度
4. 生成速度
5. 页面响应速度

---

**功能完成时间**：2026-01-14
**功能状态**：✅ 已上线
**支持平台**：小红书
