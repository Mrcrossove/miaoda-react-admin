# "小红书" → "小红薯" 品牌升级说明

## 修改概述
将应用中所有用户可见的"小红书"文本改为"小红薯"，使品牌名称更加亲切、符合小红书社区文化。

## 修改原则

### ✅ 需要修改的内容
- **用户界面文本**：所有用户可见的显示文本
- **提示信息**：Toast、错误提示、成功提示
- **页面标题和描述**：页面头部、卡片描述
- **按钮文本**：操作按钮的显示文字
- **注释**：代码注释中的说明文字

### ❌ 保持不变的内容
- **API路径**：Edge Function名称（如 generate-xiaohongshu-copy）
- **函数名**：数据库API函数名（如 search-xiaohongshu-notes）
- **URL地址**：官方域名（xiaohongshu.com）
- **变量名**：代码中的变量名（如 xiaohongshuScheme）
- **类型定义**：TypeScript类型（如 PlatformType = 'xiaohongshu'）

## 修改详情

### 1. HomePage.tsx（首页）
**修改内容**：
- 添加平台类型转换函数 `getPlatformDisplayName()`
- 将 'xiaohongshu' 映射为 '小红薯'
- 修改导航传递参数：传递显示文本而非类型值

**代码变更**：
```typescript
// 新增函数
const getPlatformDisplayName = (platformType: PlatformType): string => {
  return platformType === 'xiaohongshu' ? '小红薯' : '抖音';
};

// 修改导航
onClick={() => navigate(feature.path, { state: { platform: getPlatformDisplayName(platform) } })}
```

### 2. MyProductPage.tsx（我有产品）
**修改内容**（7处）：
1. platform默认值：'小红书' → '小红薯'
2. 注释：打开小红书APP → 打开小红薯APP
3. 注释：小红书的URL Scheme → 小红薯的URL Scheme
4. 注释：打开小红书创作中心 → 打开小红薯创作中心
5. 注释：发布到小红书 → 发布到小红薯
6. Toast提示：即将打开小红书 → 即将打开小红薯
7. Toast提示：请在小红书中粘贴 → 请在小红薯中粘贴

**影响功能**：
- 页面标题显示："上传产品图片，生成小红薯爆款文案"
- 按钮文本："生成小红薯文案"、"发布到小红薯"
- 提示信息：所有相关提示都显示"小红薯"

### 3. ProductSelectionPage.tsx（帮我选品）
**修改内容**（1处）：
1. platform默认值：'小红书' → '小红薯'

**影响功能**：
- 页面标题显示："帮我选品 - 小红薯"

### 4. ContentCreationPage.tsx（图文创作）
**修改内容**（10处）：
1. platform默认值：'小红书' → '小红薯'
2. 注释：解析小红书链接 → 解析小红薯链接
3. 错误提示：请输入小红书笔记链接 → 请输入小红薯笔记链接
4. 错误提示：请先解析小红书链接 → 请先解析小红薯链接
5. 图生图提示词：适合小红书平台 → 适合小红薯平台
6. 注释：发布到小红书 → 发布到小红薯
7. 注释：打开小红书 → 打开小红薯
8. Toast提示：请在小红书中粘贴 → 请在小红薯中粘贴
9. 步骤标题：粘贴小红书链接 → 粘贴小红薯链接
10. 按钮文本：发布到小红书 → 发布到小红薯

**影响功能**：
- 步骤1标题："粘贴小红薯链接"
- 按钮文本："发布到小红薯"
- 所有提示信息都显示"小红薯"

### 5. CompetitorAnalysisPage.tsx（分析同行）
**修改内容**（4处）：
1. PLATFORM_MAP键名：'小红书' → '小红薯'
2. 平台配置名称：小红书热榜 → 小红薯热榜
3. platform默认值：'小红书' → '小红薯'
4. 默认平台配置：PLATFORM_MAP['小红书'] → PLATFORM_MAP['小红薯']（2处）

**影响功能**：
- 平台选择器显示："小红薯热榜"
- 页面标题显示："分析同行 - 小红薯"

### 6. ImageFactoryPage.tsx（图片工厂）
**修改内容**（1处）：
- 页面描述：智能生成小红书风格配图 → 智能生成小红薯风格配图

**影响功能**：
- 页面副标题显示："智能生成小红薯风格配图，适配全行业"

## 技术实现

### 平台类型映射
```typescript
// 类型定义（保持不变）
export type PlatformType = 'xiaohongshu' | 'douyin';

// 显示文本映射（新增）
const getPlatformDisplayName = (platformType: PlatformType): string => {
  return platformType === 'xiaohongshu' ? '小红薯' : '抖音';
};
```

### 数据流转
1. **HomePage**：用户选择平台 → 'xiaohongshu'（类型值）
2. **导航传递**：转换为显示文本 → '小红薯'
3. **子页面接收**：直接使用显示文本 → '小红薯'
4. **界面显示**：所有地方显示 → '小红薯'

## 用户体验改进

### 品牌亲和力
- "小红薯"是小红书社区的昵称，更加亲切
- 符合小红书用户的语言习惯
- 增强品牌认同感

### 一致性
- 所有用户可见文本统一使用"小红薯"
- 技术命名保持标准化（xiaohongshu）
- 避免混淆，提升专业性

## 测试验证

### 测试点
1. ✅ 首页平台选择：显示"📕 小红薯冲冲冲"
2. ✅ 我有产品页面：标题显示"生成小红薯爆款文案"
3. ✅ 图文创作页面：步骤1显示"粘贴小红薯链接"
4. ✅ 分析同行页面：平台选择显示"小红薯热榜"
5. ✅ 图片工厂页面：描述显示"智能生成小红薯风格配图"
6. ✅ 所有Toast提示：显示"小红薯"
7. ✅ 所有按钮文本：显示"小红薯"

### 功能验证
- ✅ API调用正常（使用xiaohongshu路径）
- ✅ 数据库查询正常（使用xiaohongshu函数名）
- ✅ 外部链接正常（使用xiaohongshu.com域名）
- ✅ 页面导航正常（平台参数正确传递）

## 影响范围

### 前端文件（6个）
1. src/pages/HomePage.tsx
2. src/pages/MyProductPage.tsx
3. src/pages/ProductSelectionPage.tsx
4. src/pages/ContentCreationPage.tsx
5. src/pages/CompetitorAnalysisPage.tsx
6. src/pages/ImageFactoryPage.tsx

### 后端文件（0个）
- 无需修改Edge Functions
- 无需修改数据库API
- 无需修改类型定义

### 总修改量
- 修改文件：6个
- 修改行数：约30处
- 新增函数：1个（getPlatformDisplayName）

## 兼容性

### 向后兼容
- ✅ 现有API完全兼容
- ✅ 数据库查询完全兼容
- ✅ 外部服务完全兼容
- ✅ 类型定义完全兼容

### 数据迁移
- ❌ 无需数据迁移
- ❌ 无需配置更新
- ❌ 无需API密钥更新

## 总结

### 修改目的
提升品牌亲和力，使用更符合小红书社区文化的昵称"小红薯"。

### 修改原则
只修改用户可见文本，保持技术命名不变，确保系统稳定性。

### 修改结果
- ✅ 所有用户界面文本已更新为"小红薯"
- ✅ 所有技术命名保持不变
- ✅ 功能完全正常
- ✅ 通过Lint验证（99个文件）

---

**更新时间**：2026-01-18
**版本**：v1.0
**状态**：已完成 ✅
