# 智能体示例问题功能

## 功能概述

为每个智能体配置了3个精心设计的示例问题，并实现了动态打字效果展示，帮助用户快速了解智能体的能力和使用场景，降低使用门槛。

## 功能特点

### 1. 示例问题配置

每个智能体配置3个代表性问题，覆盖其核心能力：

#### 人设IP文案精灵 ✨
1. 我是一名健身教练，想打造专业型人设，帮我生成5个"教知识"方向的选题
2. 我想做美食博主，人设是闺蜜型，给我一个"晒过程"的爆款文案
3. 帮我检测这个选题：30天减肥10斤的秘诀

#### 品牌故事 📖
1. 我的咖啡品牌主打手工烘焙，帮我写一个温暖的品牌故事
2. 如何讲述一个科技公司从车库创业到上市的品牌故事？
3. 我想为环保品牌写一个有社会责任感的品牌故事

#### 马云梦想引擎 🚀
1. 我想创业但不知道做什么，如何找到适合自己的方向？
2. 创业初期最重要的是什么？如何度过艰难时期？
3. 如何在竞争激烈的市场中找到突破口？

#### 巴菲特价值引擎 💎
1. 如何判断一家公司是否具有长期投资价值？
2. 在市场波动时，应该如何保持理性决策？
3. 什么是护城河？如何识别企业的竞争优势？

#### 丁宁产品顾问 🎯
1. 如何做好用户需求分析？有哪些实用的方法？
2. 产品功能越多越好吗？如何平衡功能和体验？
3. 如何提升产品的用户留存率？

#### 参哥智策 🧠
1. 如何设计一个可持续的商业模式？
2. 面对强大的竞争对手，中小企业应该采取什么策略？
3. 如何做好企业的战略规划？有哪些关键步骤？

#### 金枪大叔文案顾问 ✍️
1. 如何写出让人忍不住点击的广告标题？
2. 我的产品是智能手表，帮我写一段促销文案
3. 什么样的文案更容易引发用户的情感共鸣？

#### 马斯克战略顾问 ⚡
1. 什么是第一性原理？如何用它来解决问题？
2. 如何在传统行业中找到颠覆性创新的机会？
3. 面对不可能的目标，应该如何制定实现路径？

### 2. 动态打字效果

- **循环展示**：自动循环展示3个示例问题
- **打字动画**：每个字符逐个显示，模拟真实打字效果
- **光标闪烁**：打字光标动画，增强真实感
- **自动切换**：打字完成后等待2秒，自动切换到下一个示例
- **停止条件**：用户开始对话后，停止动态展示

### 3. 快速输入功能

- **点击填充**：点击示例问题卡片，自动填充到输入框
- **即时发送**：填充后可直接发送，无需手动输入
- **降低门槛**：帮助新用户快速上手，了解智能体能力

## 技术实现

### 1. 配置结构

```typescript
export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  enableWebSearch: boolean;
  exampleQuestions: string[]; // 新增：示例问题数组
}
```

### 2. 动态打字实现

```typescript
// 状态管理
const [typingText, setTypingText] = useState('');
const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

// 打字效果
useEffect(() => {
  if (!agent || messages.length > 0) return;

  const examples = agent.exampleQuestions || [];
  if (examples.length === 0) return;

  let charIndex = 0;
  const currentExample = examples[currentExampleIndex];

  // 清除之前的定时器
  if (typingIntervalRef.current) {
    clearInterval(typingIntervalRef.current);
  }

  // 重置打字文本
  setTypingText('');

  // 开始打字动画（每50ms显示一个字符）
  typingIntervalRef.current = setInterval(() => {
    if (charIndex < currentExample.length) {
      setTypingText(currentExample.slice(0, charIndex + 1));
      charIndex++;
    } else {
      // 打字完成，等待2秒后切换到下一个示例
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      setTimeout(() => {
        setCurrentExampleIndex((prev) => (prev + 1) % examples.length);
      }, 2000);
    }
  }, 50);

  // 清理函数
  return () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
  };
}, [agent, currentExampleIndex, messages.length]);
```

### 3. UI展示

```tsx
{/* 示例问题卡片 */}
<div className="space-y-3">
  {agent.exampleQuestions.map((question, index) => (
    <Card
      key={index}
      className="p-4 cursor-pointer hover:shadow-md hover:border-purple-400 transition-all text-left"
      onClick={() => setInput(question)}
    >
      <p className="text-sm">{question}</p>
    </Card>
  ))}
</div>

{/* 动态打字效果 */}
<div className="mt-6 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
  <p className="text-xs text-muted-foreground mb-2">正在输入...</p>
  <p className="text-sm min-h-[24px]">
    {typingText}
    <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse"></span>
  </p>
</div>
```

## 用户体验优化

### 1. 视觉设计
- **卡片布局**：清晰的卡片设计，易于点击
- **悬停效果**：鼠标悬停时显示阴影和边框高亮
- **打字区域**：虚线边框区域，明确标识动态内容
- **光标动画**：脉冲动画光标，增强真实感

### 2. 交互优化
- **即时反馈**：点击卡片立即填充到输入框
- **自动停止**：开始对话后停止动态展示
- **循环播放**：自动循环展示所有示例
- **平滑过渡**：打字速度适中，阅读体验好

### 3. 性能优化
- **定时器清理**：组件卸载时清理定时器
- **条件渲染**：仅在无消息时显示示例
- **内存管理**：及时清除不需要的定时器

## 示例问题设计原则

### 1. 代表性
- 覆盖智能体的核心能力
- 展示不同的使用场景
- 体现智能体的专业性

### 2. 实用性
- 贴近用户真实需求
- 问题具体明确
- 易于理解和使用

### 3. 多样性
- 不同类型的问题
- 不同难度的问题
- 不同角度的问题

### 4. 启发性
- 激发用户思考
- 引导用户探索
- 展示更多可能性

## 未来优化方向

### 1. 个性化推荐
- 根据用户历史对话推荐问题
- 根据用户行业推荐问题
- 根据热门话题推荐问题

### 2. 动态更新
- 定期更新示例问题
- 根据用户反馈优化问题
- 添加季节性/热点问题

### 3. 交互增强
- 支持问题分类筛选
- 支持问题搜索
- 支持问题收藏

### 4. 数据分析
- 统计问题点击率
- 分析用户偏好
- 优化问题排序

## 相关文件

- **src/config/agents.ts** - 智能体配置（包含示例问题）
- **src/pages/AgentChatPage.tsx** - 对话页面（实现动态打字效果）

## 测试建议

### 功能测试
1. 测试示例问题展示
2. 测试动态打字效果
3. 测试点击填充功能
4. 测试循环切换功能
5. 测试停止条件

### 边界测试
1. 无示例问题的情况
2. 示例问题为空字符串
3. 快速点击多个示例
4. 打字过程中切换页面

### 性能测试
1. 定时器清理是否正常
2. 内存占用是否合理
3. 动画是否流畅

---

**功能完成时间**：2026-01-14
**功能状态**：✅ 已上线
**示例问题数量**：每个智能体3个，共24个
**打字速度**：50ms/字符
**切换间隔**：2秒
