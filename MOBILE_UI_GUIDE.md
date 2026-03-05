# 移动端UI适配说明文档

## 📱 项目概述

**项目名称**：自媒体创作+电商工具APP  
**设计目标**：专业信任感 + 创作活力 + 移动端易用性  
**目标用户**：电商新手（对工具易用性要求高，需降低认知成本）  
**适配屏幕**：375px / 390px / 414px / 430px（主流移动端屏幕宽度）  
**技术栈**：React + TypeScript + Tailwind CSS + shadcn/ui + Capacitor

---

## 🎨 色彩系统规范

### 1. 核心色彩（严格遵循，不可修改）

#### 主色调：科技蓝 #1E88E5
- **用途**：传递信任+专业感
- **应用场景**：
  - 产品管理/展示：模块标题、顶部导航、功能入口图标
  - 智能选品/竞品分析：功能按钮（"开始分析""加入选品库"）、筛选栏
  - 首页/功能导航：顶部导航栏、功能图标（未选中态）、模块标题
  - 通用组件：弹窗标题、表单确认按钮
- **CSS变量**：
  ```css
  --primary: 207 82% 51%;           /* #1E88E5 常态 */
  --primary-hover: 207 82% 46%;     /* #1976D2 hover态 */
  --primary-active: 207 82% 41%;    /* #1565C0 active态 */
  --primary-disabled: 207 82% 71%;  /* #90CAF9 禁用态 */
  --primary-foreground: 0 0% 100%;  /* #FFFFFF 文字色 */
  ```
- **Tailwind类名**：
  ```html
  <!-- 常态 -->
  <button class="bg-primary text-primary-foreground">按钮</button>
  
  <!-- hover态（需要手动添加hover:前缀）-->
  <button class="bg-primary hover:bg-primary-hover text-primary-foreground">按钮</button>
  
  <!-- active态（需要手动添加active:前缀）-->
  <button class="bg-primary active:bg-primary-active text-primary-foreground btn-press-effect">按钮</button>
  
  <!-- 禁用态 -->
  <button class="bg-primary-disabled text-primary-foreground" disabled>按钮</button>
  ```

#### 辅助色1：活力橙 #FF9800
- **用途**：传递行动+创作欲
- **应用场景**：
  - 智能选品/竞品分析：优质选品标签、热门推荐标识
  - 图文创作/电商视频：生成图片、导出视频、发布按钮
  - 首页/功能导航："开始创作"突出按钮、新功能标识
- **CSS变量**：
  ```css
  --orange: 36 100% 50%;           /* #FF9800 常态 */
  --orange-hover: 32 100% 48%;     /* #F57C00 hover态 */
  --orange-active: 28 77% 52%;     /* #E67E22 active态 */
  --orange-disabled: 36 100% 75%;  /* #FFCC80 禁用态 */
  --orange-foreground: 0 0% 100%;  /* #FFFFFF 文字色 */
  ```
- **Tailwind类名**：
  ```html
  <!-- 常态 -->
  <button class="bg-orange text-orange-foreground">创作按钮</button>
  
  <!-- hover态 -->
  <button class="bg-orange hover:bg-orange-hover text-orange-foreground">创作按钮</button>
  
  <!-- active态 -->
  <button class="bg-orange active:bg-orange-active text-orange-foreground btn-press-effect">创作按钮</button>
  
  <!-- 禁用态 -->
  <button class="bg-orange-disabled text-orange-foreground" disabled>创作按钮</button>
  ```

#### 辅助色2：清新绿 #4CAF50
- **用途**：传递成功+正向反馈
- **应用场景**：
  - 产品管理/展示：上架成功标识、库存充足标签
  - 通用组件：成功提示图标
- **CSS变量**：
  ```css
  --success: 122 39% 49%;          /* #4CAF50 */
  --success-foreground: 0 0% 100%; /* #FFFFFF 文字色 */
  ```
- **Tailwind类名**：
  ```html
  <div class="bg-success text-success-foreground">成功提示</div>
  ```

#### 警告/错误色：#EF4444
- **用途**：仅用于报错提示、删除操作
- **CSS变量**：
  ```css
  --destructive: 0 84% 60%;        /* #EF4444 */
  --destructive-foreground: 0 0% 100%; /* #FFFFFF 文字色 */
  ```
- **Tailwind类名**：
  ```html
  <button class="bg-destructive text-destructive-foreground">删除</button>
  ```

### 2. 中性色体系（保障可读性与舒适度）

#### 背景色
- **全局背景**：`#F9FAFB`（避免纯白刺眼）
  ```css
  --background: 210 20% 98%;
  ```
  ```html
  <div class="bg-background">全局背景</div>
  ```

- **卡片/模块背景**：`#FFFFFF`（显干净）
  ```css
  --card: 0 0% 100%;
  ```
  ```html
  <div class="bg-card">卡片背景</div>
  ```

#### 边框色
- **组件分隔、卡片边框**：`#E5E7EB`（不突兀）
  ```css
  --border: 214 15% 91%;
  --input: 214 15% 91%;
  ```
  ```html
  <div class="border border-border">带边框的元素</div>
  <input class="border border-input" />
  ```

#### 文字色（对比度≥4.5:1，符合WCAG AA标准）
- **主文字**：`#111827`（标题、核心信息）
  ```css
  --foreground: 222 47% 11%;
  ```
  ```html
  <h1 class="text-foreground">主标题</h1>
  ```

- **次文字**：`#6B7280`（正文、辅助说明）
  ```css
  --text-secondary: 215 14% 43%;
  ```
  ```html
  <p class="text-text-secondary">辅助说明文字</p>
  ```

- **弱文字**：`#9CA3AF`（提示语、禁用状态、占位文本）
  ```css
  --text-weak: 220 9% 62%;
  ```
  ```html
  <span class="text-text-weak">提示文字</span>
  ```

- **禁用文字**：`#D1D5DB`（按钮禁用、功能不可用状态）
  ```css
  --text-disabled: 218 11% 81%;
  ```
  ```html
  <span class="text-text-disabled">禁用文字</span>
  ```

### 3. 色彩应用规则（按模块精准分配）

| 应用模块          | 主色调应用场景                | 辅助色应用场景                | 中性色搭配要求                  |
|-------------------|-----------------------------|-----------------------------|-------------------------------|
| 产品管理/展示     | 模块标题、顶部导航、功能入口图标 | 绿 #4CAF50（上架成功标识、库存充足标签） | 卡片背景#FFFFFF，边框#E5E7EB，产品名称用主文字色 |
| 智能选品/竞品分析 | 功能按钮（如"开始分析""加入选品库"）、筛选栏 | 橙 #FF9800（优质选品标签、热门推荐标识） | 列表项背景#FFFFFF，hover态#F9FAFB，数据文字用主文字色 |
| 图文创作/电商视频 | 橙 #FF9800（生成图片、导出视频、发布按钮） | 主色 #1E88E5（保存、撤销、模板切换按钮） | 编辑区背景#FFFFFF，工具栏背景#F9FAFB，字体选择区无边框 |
| 首页/功能导航     | 顶部导航栏、功能图标（未选中态）、模块标题 | 橙 #FF9800（"开始创作"突出按钮、新功能标识） | 底部Tab栏背景#FFFFFF，选中图标用主色，未选中用次文字色 |
| 通用组件（弹窗/表单） | 弹窗标题、表单确认按钮 | 绿 #4CAF50（成功提示图标）、#EF4444（错误提示图标） | 弹窗背景#FFFFFF，遮罩层rgba(0,0,0,0.25)，表单标签用次文字色 |

---

## 📐 移动端适配核心要求

### 1. 屏幕适配

#### 适配方案
- **基础单位**：使用Tailwind CSS的响应式类名（基于rem）
- **断点设置**：
  ```javascript
  // tailwind.config.js 默认断点
  screens: {
    'sm': '640px',   // 小屏手机
    'md': '768px',   // 大屏手机/小平板
    'lg': '1024px',  // 平板
    'xl': '1280px',  // 桌面
    '2xl': '1400px'  // 大屏桌面
  }
  ```

#### 布局原则
- **禁止固定px宽度**：使用`w-full`、`w-screen`、`max-w-*`等响应式类名
- **使用flex布局**：`flex`、`flex-col`、`flex-row`、`justify-*`、`items-*`
- **间距使用rem**：`p-4`（1rem = 16px）、`m-2`（0.5rem = 8px）

#### 示例代码
```html
<!-- ❌ 错误：固定宽度 -->
<div style="width: 375px;">内容</div>

<!-- ✅ 正确：响应式宽度 -->
<div class="w-full max-w-md mx-auto">内容</div>

<!-- ✅ 正确：flex布局 -->
<div class="flex flex-col gap-4 p-4">
  <div class="flex-1">内容1</div>
  <div class="flex-1">内容2</div>
</div>
```

### 2. 触摸交互

#### 最小触摸区域：48px × 48px
- **CSS变量**：`--min-touch-target: 48px`
- **Tailwind工具类**：`.min-touch-target`
- **应用场景**：所有可点击元素（按钮、卡片、图标）

#### 间距要求：≥8px
- **Tailwind类名**：`gap-2`（0.5rem = 8px）

#### 示例代码
```html
<!-- 按钮最小触摸区域 -->
<button class="min-touch-target px-4 py-2 bg-primary text-primary-foreground rounded-lg">
  按钮文字
</button>

<!-- 图标按钮最小触摸区域 -->
<button class="min-touch-target flex items-center justify-center bg-primary text-primary-foreground rounded-lg">
  <Icon className="w-6 h-6" />
</button>

<!-- 卡片间距 -->
<div class="grid grid-cols-2 gap-2">
  <div class="bg-card p-4">卡片1</div>
  <div class="bg-card p-4">卡片2</div>
</div>
```

### 3. 导航设计

#### 顶部导航栏
- **iOS默认高度**：44px
- **Android默认高度**：48px
- **统一高度**：48px（`h-12`）
- **安全区域适配**：`.safe-area-top`（iOS刘海屏）

#### 底部Tab栏
- **固定高度**：56px（`h-14`）
- **图标尺寸**：24px（`w-6 h-6`）
- **文字字号**：12px（`text-xs`）
- **安全区域适配**：`.safe-area-bottom`（iOS底部横条）

#### 示例代码
```html
<!-- 顶部导航栏 -->
<header class="h-12 safe-area-top bg-card border-b border-border flex items-center justify-between px-4">
  <button class="min-touch-target">
    <Icon className="w-6 h-6" />
  </button>
  <h1 class="text-lg font-semibold text-foreground">页面标题</h1>
  <button class="min-touch-target">
    <Icon className="w-6 h-6" />
  </button>
</header>

<!-- 底部Tab栏 -->
<nav class="h-14 safe-area-bottom bg-card border-t border-border flex items-center justify-around">
  <button class="min-touch-target flex flex-col items-center justify-center gap-1">
    <Icon className="w-6 h-6 text-primary" />
    <span class="text-xs text-primary">首页</span>
  </button>
  <button class="min-touch-target flex flex-col items-center justify-center gap-1">
    <Icon className="w-6 h-6 text-text-secondary" />
    <span class="text-xs text-text-secondary">创作</span>
  </button>
  <button class="min-touch-target flex flex-col items-center justify-center gap-1">
    <Icon className="w-6 h-6 text-text-secondary" />
    <span class="text-xs text-text-secondary">我的</span>
  </button>
</nav>
```

### 4. 表单适配

#### 输入框高度：≥52px
- **Tailwind类名**：`h-13`（52px）或`py-3`（padding上下各12px）
- **标签文字字号**：14px（`text-sm`）

#### 输入法弹出适配
- **自动上推页面**：浏览器默认行为，无需额外处理
- **避免输入框被遮挡**：确保输入框在可视区域内

#### 示例代码
```html
<!-- 表单输入框 -->
<div class="space-y-2">
  <label class="text-sm font-medium text-foreground">产品名称</label>
  <input 
    type="text" 
    class="w-full h-13 px-4 bg-card border border-input rounded-lg text-foreground placeholder:text-text-weak focus:outline-none focus:ring-2 focus:ring-primary"
    placeholder="请输入产品名称"
  />
</div>

<!-- 文本域 -->
<div class="space-y-2">
  <label class="text-sm font-medium text-foreground">产品描述</label>
  <textarea 
    class="w-full min-h-[120px] px-4 py-3 bg-card border border-input rounded-lg text-foreground placeholder:text-text-weak focus:outline-none focus:ring-2 focus:ring-primary resize-none"
    placeholder="请输入产品描述"
  ></textarea>
</div>
```

### 5. 组件适配

#### 弹窗（Dialog/Modal）
- **位置**：居中展示
- **宽度**：适配屏幕（`max-w-md`，最大448px）
- **关闭按钮**：右上角，易操作（单手可及）
- **遮罩层**：`rgba(0, 0, 0, 0.25)`

#### 底部Sheet
- **位置**：底部展示
- **宽度**：全屏（`w-full`）
- **圆角**：顶部圆角（`rounded-t-2xl`）
- **关闭方式**：下拉关闭或点击关闭按钮

#### 下拉框（Select/Dropdown）
- **位置**：自动适配（上方或下方）
- **宽度**：与触发元素同宽或适配屏幕
- **最大高度**：`max-h-60`（240px），超出滚动

#### 示例代码
```html
<!-- 弹窗 -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25">
  <div class="w-full max-w-md bg-card rounded-2xl shadow-modal p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-foreground">弹窗标题</h2>
      <button class="min-touch-target">
        <Icon className="w-6 h-6 text-text-secondary" />
      </button>
    </div>
    <p class="text-sm text-text-secondary">弹窗内容</p>
    <div class="flex gap-2">
      <button class="flex-1 h-12 bg-secondary text-secondary-foreground rounded-lg">取消</button>
      <button class="flex-1 h-12 bg-primary text-primary-foreground rounded-lg">确认</button>
    </div>
  </div>
</div>

<!-- 底部Sheet -->
<div class="fixed inset-0 z-50 flex items-end bg-black/25">
  <div class="w-full bg-card rounded-t-2xl shadow-modal p-6 space-y-4 safe-area-bottom">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-foreground">底部Sheet标题</h2>
      <button class="min-touch-target">
        <Icon className="w-6 h-6 text-text-secondary" />
      </button>
    </div>
    <p class="text-sm text-text-secondary">底部Sheet内容</p>
  </div>
</div>
```

### 6. 性能要求

#### CSS优化
- **减少重绘重排**：使用`transform`和`opacity`实现动画
- **避免复杂选择器**：使用Tailwind工具类，避免深层嵌套

#### 图片优化
- **格式**：WebP（压缩体积，浏览器兼容性好）
- **懒加载**：`loading="lazy"`
- **响应式图片**：`srcset`和`sizes`

#### 图标优化
- **优先使用SVG**：适配不同分辨率，体积小
- **图标库**：lucide-react（已集成）

#### 示例代码
```html
<!-- 图片懒加载 -->
<img 
  src="product.webp" 
  alt="产品图片" 
  loading="lazy"
  class="w-full h-auto object-cover rounded-lg"
/>

<!-- 响应式图片 -->
<img 
  srcset="product-small.webp 375w, product-medium.webp 768w, product-large.webp 1024w"
  sizes="(max-width: 768px) 100vw, 50vw"
  src="product-medium.webp"
  alt="产品图片"
  loading="lazy"
  class="w-full h-auto object-cover rounded-lg"
/>

<!-- SVG图标 -->
<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
</svg>
```

---

## 🎯 移动端交互体验优化

### 1. 按钮交互

#### 常态
- **主色按钮**：`bg-primary text-primary-foreground rounded-lg`
- **橙色按钮**：`bg-orange text-orange-foreground rounded-lg`
- **圆角**：8px（`rounded-lg`）

#### hover态（仅平板端生效）
- **主色按钮**：`hover:bg-primary-hover`
- **橙色按钮**：`hover:bg-orange-hover`
- **亮度降低**：10%

#### active态（移动端触摸反馈）
- **主色按钮**：`active:bg-primary-active`
- **橙色按钮**：`active:bg-orange-active`
- **亮度降低**：15%
- **按压效果**：`btn-press-effect`（transform: scale(0.98)）

#### 禁用态
- **主色按钮**：`bg-primary-disabled text-primary-foreground opacity-50`
- **橙色按钮**：`bg-orange-disabled text-orange-foreground opacity-50`
- **不可点击**：`disabled`属性

#### 示例代码
```html
<!-- 主色按钮 -->
<button class="min-touch-target px-6 py-3 bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground rounded-lg btn-press-effect">
  确认
</button>

<!-- 橙色按钮 -->
<button class="min-touch-target px-6 py-3 bg-orange hover:bg-orange-hover active:bg-orange-active text-orange-foreground rounded-lg btn-press-effect">
  开始创作
</button>

<!-- 禁用按钮 -->
<button class="min-touch-target px-6 py-3 bg-primary-disabled text-primary-foreground rounded-lg opacity-50" disabled>
  禁用状态
</button>
```

### 2. 页面过渡

#### 过渡动画：0.3s
- **Tailwind工具类**：`.page-transition`
- **CSS**：`transition: all 0.3s ease`

#### 示例代码
```html
<!-- 页面切换 -->
<div class="page-transition opacity-0 translate-y-4" data-show="true">
  页面内容
</div>

<script>
  // JavaScript控制显示
  const element = document.querySelector('[data-show]');
  setTimeout(() => {
    element.classList.remove('opacity-0', 'translate-y-4');
  }, 100);
</script>
```

### 3. 加载反馈

#### 骨架屏
- **Tailwind工具类**：`.skeleton-loading`
- **颜色**：灰色渐变（`#F3F4F6` → `#E5E7EB`）
- **动画**：1.5s波浪动画

#### 圆形加载动画
- **颜色**：主色（`#1E88E5`）
- **尺寸**：24px（`w-6 h-6`）

#### 示例代码
```html
<!-- 骨架屏 -->
<div class="space-y-4">
  <div class="h-4 bg-muted rounded skeleton-loading"></div>
  <div class="h-4 bg-muted rounded skeleton-loading w-3/4"></div>
  <div class="h-4 bg-muted rounded skeleton-loading w-1/2"></div>
</div>

<!-- 圆形加载动画 -->
<div class="flex items-center justify-center p-8">
  <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
</div>
```

### 4. 提示反馈

#### 成功提示
- **颜色**：绿色（`#4CAF50`）
- **图标**：✓
- **停留时间**：2s自动消失

#### 错误提示
- **颜色**：红色（`#EF4444`）
- **图标**：✕
- **关闭方式**：需用户点击关闭

#### 操作反馈
- **按钮点击**：轻微按压效果（`btn-press-effect`）
- **卡片选中**：轻微缩放效果（`card-press-effect`）
- **震动反馈**：仅Android端，振动强度≤100ms（需Capacitor Haptics插件）

#### 示例代码
```html
<!-- 成功提示（使用sonner toast）-->
<script>
  import { toast } from 'sonner';
  
  toast.success('操作成功', {
    description: '产品已成功创建',
    duration: 2000,
  });
</script>

<!-- 错误提示 -->
<script>
  toast.error('操作失败', {
    description: '请检查网络连接后重试',
    duration: Infinity, // 需用户手动关闭
  });
</script>

<!-- 震动反馈（Capacitor）-->
<script>
  import { Haptics, ImpactStyle } from '@capacitor/haptics';
  
  const handleClick = async () => {
    // 轻微震动反馈
    await Haptics.impact({ style: ImpactStyle.Light });
  };
</script>
```

### 5. 滚动优化

#### 下拉刷新
- **进度条颜色**：主色（`#1E88E5`）
- **触发距离**：60px

#### 上拉加载更多
- **提示文字**：弱文字色（`#9CA3AF`）
- **加载中**："加载中..."
- **没有更多**："没有更多了"

#### 滚动流畅性
- **CSS**：`-webkit-overflow-scrolling: touch`（已在index.css中全局设置）

#### 示例代码
```html
<!-- 长列表 -->
<div class="h-screen overflow-y-auto">
  <!-- 下拉刷新区域 -->
  <div class="flex items-center justify-center py-4">
    <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
  
  <!-- 列表内容 -->
  <div class="space-y-2 p-4">
    {items.map(item => (
      <div key={item.id} class="bg-card p-4 rounded-lg border border-border">
        {item.content}
      </div>
    ))}
  </div>
  
  <!-- 上拉加载更多 -->
  <div class="flex items-center justify-center py-4">
    <span class="text-sm text-text-weak">加载中...</span>
  </div>
</div>
```

---

## 📱 iOS/Android差异适配

### 1. 导航栏高度
- **iOS**：44px（默认）
- **Android**：48px（默认）
- **统一方案**：使用48px（`h-12`），兼容两端

### 2. 安全区域
- **iOS**：刘海屏、底部横条
- **Android**：部分机型有刘海屏
- **适配方案**：使用`.safe-area-top`、`.safe-area-bottom`工具类

### 3. 弹窗样式
- **iOS**：圆角较大（16px）
- **Android**：圆角较小（8px）
- **统一方案**：使用12px圆角（`rounded-xl`），兼容两端

### 4. 触摸反馈
- **iOS**：无系统级震动反馈
- **Android**：支持震动反馈
- **适配方案**：使用Capacitor Haptics插件，iOS端自动降级为无震动

### 5. 字体渲染
- **iOS**：San Francisco字体，渲染清晰
- **Android**：Roboto字体，渲染略粗
- **适配方案**：使用系统默认字体，无需额外处理

---

## 🛠️ 开发工具和资源

### 1. Tailwind CSS工具类速查

#### 间距
- `p-4`：padding: 1rem（16px）
- `m-2`：margin: 0.5rem（8px）
- `gap-2`：gap: 0.5rem（8px）

#### 尺寸
- `w-full`：width: 100%
- `h-12`：height: 3rem（48px）
- `min-h-screen`：min-height: 100vh

#### 布局
- `flex`：display: flex
- `flex-col`：flex-direction: column
- `items-center`：align-items: center
- `justify-between`：justify-content: space-between

#### 文字
- `text-sm`：font-size: 0.875rem（14px）
- `text-base`：font-size: 1rem（16px）
- `text-lg`：font-size: 1.125rem（18px）
- `font-medium`：font-weight: 500
- `font-semibold`：font-weight: 600

#### 圆角
- `rounded`：border-radius: 0.25rem（4px）
- `rounded-lg`：border-radius: 0.5rem（8px）
- `rounded-xl`：border-radius: 0.75rem（12px）
- `rounded-2xl`：border-radius: 1rem（16px）

#### 阴影
- `shadow-card`：var(--shadow-card)
- `shadow-hover`：var(--shadow-hover)
- `shadow-modal`：var(--shadow-modal)

### 2. 自定义工具类

#### 按钮按压效果
```css
.btn-press-effect {
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.btn-press-effect:active {
  transform: scale(0.98);
}
```

#### 卡片点击效果
```css
.card-press-effect {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-press-effect:active {
  transform: scale(0.99);
}
```

#### 页面过渡动画
```css
.page-transition {
  transition: all 0.3s ease;
}
```

#### 骨架屏加载动画
```css
.skeleton-loading {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--accent)) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-wave 1.5s ease-in-out infinite;
}

@keyframes skeleton-wave {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

#### 最小触摸区域
```css
.min-touch-target {
  min-width: var(--min-touch-target);
  min-height: var(--min-touch-target);
}
```

#### 安全区域适配
```css
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-left {
  padding-left: env(safe-area-inset-left);
}

.safe-area-right {
  padding-right: env(safe-area-inset-right);
}
```

### 3. 常用组件示例

#### 主色按钮
```tsx
<Button className="min-touch-target bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-foreground btn-press-effect">
  确认
</Button>
```

#### 橙色按钮
```tsx
<Button className="min-touch-target bg-orange hover:bg-orange-hover active:bg-orange-active text-orange-foreground btn-press-effect">
  开始创作
</Button>
```

#### 成功按钮
```tsx
<Button className="min-touch-target bg-success hover:bg-success/90 active:bg-success/80 text-success-foreground btn-press-effect">
  保存
</Button>
```

#### 卡片
```tsx
<Card className="bg-card border-border shadow-card hover:shadow-hover card-press-effect">
  <CardHeader>
    <CardTitle className="text-foreground">卡片标题</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-text-secondary">卡片内容</p>
  </CardContent>
</Card>
```

#### 输入框
```tsx
<Input 
  className="h-13 bg-card border-input text-foreground placeholder:text-text-weak focus:ring-primary"
  placeholder="请输入内容"
/>
```

#### 标签
```tsx
<Badge className="bg-success text-success-foreground">
  成功
</Badge>

<Badge className="bg-orange text-orange-foreground">
  热门
</Badge>
```

---

## 📋 检查清单

### 色彩系统
- [ ] 主色调（#1E88E5）应用正确
- [ ] 辅助色1（#FF9800）应用正确
- [ ] 辅助色2（#4CAF50）应用正确
- [ ] 警告色（#EF4444）仅用于报错和删除
- [ ] 文字对比度≥4.5:1

### 移动端适配
- [ ] 屏幕宽度适配（375px/390px/414px/430px）
- [ ] 最小触摸区域≥48px×48px
- [ ] 元素间距≥8px
- [ ] 导航栏高度48px
- [ ] 底部Tab栏高度56px
- [ ] 输入框高度≥52px
- [ ] 安全区域适配（iOS刘海屏）

### 交互反馈
- [ ] 按钮hover态（仅平板端）
- [ ] 按钮active态（移动端）
- [ ] 按钮按压效果（transform: scale(0.98)）
- [ ] 卡片点击效果（transform: scale(0.99)）
- [ ] 页面过渡动画（0.3s）
- [ ] 加载反馈（骨架屏/圆形加载）
- [ ] 成功提示（绿色，2s自动消失）
- [ ] 错误提示（红色，需用户关闭）

### 性能优化
- [ ] CSS层级优化
- [ ] 图片WebP格式
- [ ] 图片懒加载
- [ ] 图标SVG格式
- [ ] 滚动流畅性

---

## 📞 技术支持

如有任何问题或建议，请联系开发团队。

**文档版本**：v1.0  
**最后更新**：2026-01-08  
**维护者**：秒哒(Miaoda) AI助手
