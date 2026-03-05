# 帮我选品页面功能说明

## 功能概述

帮我选品页面已完全重构，实现了全新的交互体验。用户可以搜索小红书爆款笔记，查看产品灵感，点击图片放大预览，二创文案标题并一键发布到小红书，同时保留以图搜图功能方便查找货源。

## 核心功能

### 1. 笔记搜索与展示

- **搜索功能**：输入关键词搜索小红书图文笔记
- **卡片展示**：
  - 封面图（4:3比例）
  - 标题（粗体，最多2行）
  - 文案描述（最多3行）
  - 作者信息（头像 + 昵称）
- **移除互动数据**：不再显示点赞、评论、收藏等数据

### 2. 图片预览功能 ✨

**触发方式**：点击笔记封面图

**功能特点**：
- 大图展示笔记封面
- 显示完整标题和作者信息
- 显示完整文案内容
- 提供快捷操作按钮：
  - 一键发布到小红书
  - 以图搜图

**交互体验**：
- 图片悬浮时显示放大图标提示
- 使用模态框展示，支持关闭
- 不跳转到小红书平台，留在应用内

### 3. 一键发布到小红书 🚀

**触发方式**：
- 点击卡片上的"一键发布"按钮
- 或在图片预览模态框中点击"一键发布"

**功能特点**：
- 显示原图预览（最大高度240px）
- 可编辑标题（最多20字，实时字数统计）
- 可编辑文案（最多1000字，实时字数统计）
- 提供两个操作按钮：
  - **复制文案**：将标题和文案复制到剪贴板
  - **一键发布**：自动复制文案 + 打开小红书创作平台

**发布流程**：
1. 点击"一键发布"按钮
2. 文案自动复制到剪贴板
3. 系统打开小红书创作平台（https://creator.xiaohongshu.com/publish/publish）
4. 在小红书创作页面粘贴文案，上传图片即可发布

**使用场景**：
- 二创爆款笔记文案
- 快速发布到小红书
- 提升创作效率

### 4. 以图搜图功能 🔍

**触发方式**：
- 点击卡片上的"以图搜图"按钮选择笔记
- 然后点击悬浮的电商平台按钮

**支持平台**：
- 1688（批发拿货）
- 淘宝（零售选品）
- 拼多多（低价货源）
- 京东（品质保障）

**功能特点**：
- 选中笔记后显示金色渐变标记
- 悬浮平台按钮显示在右下角
- 支持1688和淘宝的以图搜图功能
- 跳转到电商平台查找同款货源

## 视觉设计

### 卡片样式

- **默认状态**：透明边框，白色背景
- **悬浮状态**：主色边框，阴影加重
- **选中状态**：金色边框，金色阴影

### 按钮样式

- **一键发布按钮**：
  - 蓝紫渐变背景
  - 彩色阴影效果
  - 悬浮缩放动画
  - 粗体字体

- **以图搜图按钮**：
  - 未选中：outline样式，2px边框
  - 选中：金色渐变背景，金色阴影
  - 悬浮缩放动画
  - 粗体字体

### 模态框样式

- **图片预览模态框**：
  - 最大宽度：4xl（896px）
  - 最大高度：90vh
  - 支持滚动
  - 圆角阴影

- **发布模态框**：
  - 最大宽度：2xl（672px）
  - 最大高度：90vh
  - 支持滚动
  - 紫蓝渐变提示卡片

## 操作流程

### 完整选品流程

1. **搜索笔记**
   - 输入关键词（如"护肤品"、"家居好物"）
   - 点击搜索或按Enter键
   - 查看搜索结果

2. **查看详情**
   - 点击笔记封面图
   - 查看大图和完整文案
   - 决定是否二创发布

3. **二创发布**
   - 点击"一键发布"按钮
   - 编辑标题和文案
   - 点击"一键发布"
   - 在小红书创作平台粘贴文案并上传图片

4. **查找货源**
   - 点击"以图搜图"按钮选择笔记
   - 点击悬浮的电商平台按钮
   - 在电商平台查找同款商品
   - 保存商品图片到相册

5. **继续创作**
   - 返回应用继续选品
   - 或去"我有产品"上传商品图片生成笔记

## 技术实现

### 状态管理

```typescript
// 图片预览
const [previewNote, setPreviewNote] = useState<XiaohongshuNote | null>(null);
const [isPreviewOpen, setIsPreviewOpen] = useState(false);

// 发布到小红书
const [publishNote, setPublishNote] = useState<XiaohongshuNote | null>(null);
const [isPublishOpen, setIsPublishOpen] = useState(false);
const [editedTitle, setEditedTitle] = useState('');
const [editedContent, setEditedContent] = useState('');
```

### 核心函数

```typescript
// 打开图片预览
const handleImageClick = (note: XiaohongshuNote) => {
  setPreviewNote(note);
  setIsPreviewOpen(true);
};

// 打开发布对话框
const handlePublishClick = (note: XiaohongshuNote) => {
  setPublishNote(note);
  setEditedTitle(note.title);
  setEditedContent(note.description || '');
  setIsPublishOpen(true);
};

// 复制文案
const handleCopyContent = () => {
  const content = `${editedTitle}\n\n${editedContent}`;
  navigator.clipboard.writeText(content);
  toast.success('文案已复制到剪贴板');
};

// 一键发布到小红书
const handlePublishToXiaohongshu = () => {
  const content = `${editedTitle}\n\n${editedContent}`;
  navigator.clipboard.writeText(content);
  window.open('https://creator.xiaohongshu.com/publish/publish', '_blank');
  toast.success('文案已复制，正在打开小红书创作页面...');
  setIsPublishOpen(false);
};
```

### 使用的组件

- `Dialog`：模态框容器
- `DialogContent`：模态框内容
- `DialogHeader`：模态框头部
- `DialogTitle`：模态框标题
- `DialogDescription`：模态框描述
- `Input`：标题输入框
- `Textarea`：文案输入框
- `Button`：操作按钮
- `Card`：卡片容器

## 用户体验优化

### 交互优化

1. **图片悬浮效果**：
   - 图片缩放110%
   - 显示放大图标
   - 黑色半透明遮罩

2. **按钮反馈**：
   - 悬浮缩放105%
   - 渐变背景动画
   - 彩色阴影效果

3. **模态框动画**：
   - 淡入淡出效果
   - 背景模糊效果
   - 支持ESC键关闭

### 视觉优化

1. **统一花哨风格**：
   - 渐变背景
   - 彩色阴影
   - 粗体字体
   - 大圆角

2. **色彩系统**：
   - 蓝紫渐变（一键发布）
   - 金色渐变（已选择）
   - 紫蓝渐变（提示卡片）

3. **动画效果**：
   - 脉冲缩放
   - 悬浮缩放
   - 弹跳动画

## 注意事项

### 功能限制

1. **小红书创作平台**：
   - 需要用户已登录小红书账号
   - 需要手动上传图片
   - 文案需要手动粘贴

2. **以图搜图**：
   - 仅1688和淘宝支持
   - 拼多多和京东暂不支持

3. **文案编辑**：
   - 标题最多20字
   - 文案最多1000字
   - 超出部分自动截断

### 最佳实践

1. **选品流程**：
   - 先搜索多个关键词
   - 浏览多个笔记
   - 选择爆款内容二创

2. **文案二创**：
   - 保留原文核心卖点
   - 添加个人风格
   - 优化标题吸引力

3. **货源查找**：
   - 优先使用1688批发
   - 对比多个平台价格
   - 保存商品图片到相册

## 更新日志

### v1.0.0 (2026-01-08)

- ✅ 移除点赞数显示
- ✅ 实现图片点击预览
- ✅ 实现一键发布到小红书
- ✅ 保留以图搜图功能
- ✅ 优化卡片视觉设计
- ✅ 统一花哨风格
- ✅ 添加操作流程提示

## 相关文件

- `src/pages/ProductSelectionPage.tsx` - 主页面组件
- `src/components/product-selection/FloatingPlatformButton.tsx` - 悬浮平台按钮
- `src/db/api.ts` - API接口（searchXiaohongshuNotes）
- `src/types/types.ts` - 类型定义（XiaohongshuNote）

## 反馈与建议

如有任何问题或建议，请联系开发团队。
