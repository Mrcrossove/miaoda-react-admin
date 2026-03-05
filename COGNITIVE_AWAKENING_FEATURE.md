# 认知觉醒智能体功能

## 功能概述

"认知觉醒"是一个智能体问答平台，提供8个专业领域的AI智能体，支持联网搜索、多格式输出和一键复制功能，帮助用户获取专业建议和解决方案。

## 功能特点

### 1. 8个专业智能体

#### 人设ip文案精灵 ✨
- **专业领域**：人设IP文案创作
- **核心能力**：分析目标受众、挖掘个人特质、创作有温度的IP文案
- **适用场景**：个人品牌打造、IP形象塑造、价值主张传达

#### 品牌故事 📖
- **专业领域**：品牌故事讲述
- **核心能力**：挖掘品牌故事、生动叙事、传递品牌价值观
- **适用场景**：品牌建设、情感营销、品牌传播

#### 马云梦想引擎 🚀
- **专业领域**：创业梦想激发
- **核心能力**：战略思维、商业洞察、正能量激励
- **适用场景**：创业指导、商业哲学、人生感悟

#### 巴菲特价值引擎 💎
- **专业领域**：价值投资理念
- **核心能力**：长期主义思维、理性决策、价值分析
- **适用场景**：投资决策、商业洞察、人生智慧

#### 丁宁产品顾问 🎯
- **专业领域**：产品设计与优化
- **核心能力**：用户研究、需求分析、体验设计
- **适用场景**：产品规划、用户体验、产品优化

#### 参哥智策 🧠
- **专业领域**：战略规划与决策
- **核心能力**：商业模式分析、竞争策略、战略规划
- **适用场景**：商业决策、战略制定、模式创新

#### 金枪大叔文案顾问 ✍️
- **专业领域**：营销文案创作
- **核心能力**：广告创意、品牌传播、营销策划
- **适用场景**：营销文案、广告创意、转化优化

#### 马斯克战略顾问 ⚡
- **专业领域**：创新思维与颠覆性战略
- **核心能力**：技术前瞻、商业变革、第一性原理
- **适用场景**：创新突破、颠覆性战略、技术变革

### 2. 联网搜索功能

- **实时信息**：接入百度AI搜索，获取最新网络信息
- **深度搜索**：支持深度搜索模式，获取更全面的信息
- **智能总结**：AI自动总结搜索结果，提供精准答案
- **引用来源**：显示信息来源，确保内容可信度

### 3. 多格式输出

#### 纯文本格式
- 分段清晰，重点标注
- 支持Markdown渲染
- 适合阅读和理解

#### 表格格式
- 结构化展示数据
- 清晰的表头和行列
- 适合对比和分析

#### 思维导图格式
- Mermaid语法渲染
- 层级结构清晰
- 适合梳理思路

### 4. 一键复制功能

- **纯文本**：直接复制文本内容
- **表格**：复制为Excel兼容格式（制表符分隔）
- **思维导图**：复制Mermaid代码，可直接使用

## 使用流程

```
1. 点击底部导航"认知觉醒"
   ↓
2. 选择合适的智能体
   ↓
3. 输入问题或需求
   ↓
4. 选择输出格式（纯文本/表格/思维导图）
   ↓
5. 查看AI生成的回答
   ↓
6. 一键复制内容
   ↓
7. 继续对话或返回列表
```

## 技术实现

### 1. 智能体配置

#### 配置文件
`src/config/agents.ts`

```typescript
export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  enableWebSearch: boolean;
}

export const agents: Agent[] = [
  {
    id: 'ip-copywriter',
    name: '人设ip文案精灵',
    description: '专业的人设IP文案创作专家',
    icon: '✨',
    systemPrompt: '...',
    enableWebSearch: true,
  },
  // ... 其他智能体配置
];
```

#### 配置说明
- **id**: 智能体唯一标识
- **name**: 智能体名称
- **description**: 智能体描述
- **icon**: 智能体图标（emoji）
- **systemPrompt**: 系统提示词（定义智能体角色和能力）
- **enableWebSearch**: 是否启用联网搜索

### 2. Edge Function

#### 文件位置
`supabase/functions/agent-chat/index.ts`

#### 核心功能
```typescript
// 1. 接收请求参数
const { agentId, messages, enableWebSearch, outputFormat } = requestBody;

// 2. 获取智能体配置
const agentConfig = agentConfigs[agentId];

// 3. 根据输出格式添加格式化指令
let formatInstruction = '';
if (outputFormat === 'table') {
  formatInstruction = '请以Markdown表格格式输出...';
} else if (outputFormat === 'mindmap') {
  formatInstruction = '请以Mermaid思维导图格式输出...';
}

// 4. 调用API
if (enableWebSearch) {
  // 使用AI搜索API（联网搜索）
  await fetch('百度AI搜索API', { ... });
} else {
  // 使用文心大模型API（无联网搜索）
  await fetch('文心大模型API', { ... });
}

// 5. 流式返回结果
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    ...
  },
});
```

### 3. 前端实现

#### 认知觉醒列表页
`src/pages/CognitiveAwakeningPage.tsx`

- 展示8个智能体卡片
- 点击跳转到对话页面
- 显示联网搜索标识

#### 智能体对话页
`src/pages/AgentChatPage.tsx`

- 消息列表展示
- 输入框和发送按钮
- 格式切换按钮
- 复制功能按钮
- 流式输出支持

#### 状态管理
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [currentResponse, setCurrentResponse] = useState('');
const [outputFormat, setOutputFormat] = useState<OutputFormat>('text');
```

#### 流式请求
```typescript
await sendStreamRequest({
  functionUrl: `${supabaseUrl}/functions/v1/agent-chat`,
  requestBody: {
    agentId,
    messages,
    enableWebSearch,
    outputFormat,
  },
  supabaseAnonKey,
  onData: (data) => {
    const parsed = JSON.parse(data);
    const chunk = parsed.choices?.[0]?.delta?.content || '';
    setCurrentResponse(prev => prev + chunk);
  },
  onComplete: () => {
    setMessages(prev => [...prev, { role: 'assistant', content: currentResponse }]);
    setIsLoading(false);
  },
  onError: (error) => {
    toast.error('请求失败');
  },
});
```

### 4. 底部导航

#### 更新文件
`src/components/common/BottomNav.tsx`

#### 导航配置
```typescript
const navItems = [
  { path: '/', label: '创作', icon: Home },
  { path: '/cognitive-awakening', label: '认知觉醒', icon: Brain },
  { path: '/profile', label: '我的', icon: User },
];
```

## 界面设计

### 列表页布局
- 顶部：标题和描述
- 主体：2列网格布局（桌面端）/ 1列布局（移动端）
- 卡片：智能体图标、名称、描述、联网搜索标识

### 对话页布局
- 顶部：返回按钮、智能体信息
- 格式栏：纯文本/表格/思维导图切换按钮
- 消息区：用户消息（右侧）、AI回复（左侧）
- 输入区：多行文本框、发送/停止按钮

### 消息样式
- 用户消息：紫粉渐变背景、白色文字、右对齐
- AI回复：白色背景、黑色文字、左对齐
- 复制按钮：每条AI回复右上角
- 格式标识：显示当前输出格式

## 用户体验优化

### 1. 加载状态
- 发送消息时显示加载动画
- 流式输出时实时显示内容
- 停止按钮可中断生成

### 2. 错误处理
- 网络错误：提示用户重试
- API错误：显示错误信息
- 参数错误：友好提示

### 3. 成功反馈
- 发送成功：消息添加到列表
- 复制成功：Toast提示
- 格式切换：Toast提示

### 4. 交互优化
- 回车键发送消息（Shift+Enter换行）
- 自动滚动到最新消息
- 消息区域可滚动查看历史
- 输入框自适应高度

## 注意事项

### 1. 智能体配置
- 系统提示词需精心设计
- 明确智能体的角色和能力边界
- 提供清晰的使用指导

### 2. 联网搜索
- 仅在需要实时信息时启用
- 注意API调用成本
- 处理搜索超时情况

### 3. 格式输出
- 表格格式需要结构化数据
- 思维导图需要层级关系
- 纯文本适合大部分场景

### 4. 复制功能
- 表格复制为制表符分隔
- 思维导图复制为Mermaid代码
- 保留格式和结构

### 5. 性能优化
- 流式输出减少等待时间
- 消息列表虚拟滚动（大量消息时）
- 图片懒加载

## 未来优化方向

### 1. 智能体管理
- 支持自定义智能体
- 智能体市场
- 智能体分享

### 2. 对话管理
- 对话历史保存
- 对话导出
- 对话分享

### 3. 高级功能
- 多轮对话上下文
- 文件上传支持
- 语音输入输出

### 4. 协作功能
- 多人协作对话
- 智能体组合
- 工作流自动化

### 5. 数据分析
- 使用统计
- 热门问题
- 智能推荐

## 相关文件

- **src/config/agents.ts** - 智能体配置
- **src/pages/CognitiveAwakeningPage.tsx** - 列表页
- **src/pages/AgentChatPage.tsx** - 对话页
- **src/components/common/BottomNav.tsx** - 底部导航
- **supabase/functions/agent-chat/index.ts** - Edge Function
- **src/routes.tsx** - 路由配置

## 测试建议

### 功能测试
1. 测试智能体列表展示
2. 测试智能体对话功能
3. 测试联网搜索功能
4. 测试格式切换功能
5. 测试复制功能
6. 测试停止生成功能

### 边界测试
1. 空输入
2. 超长输入
3. 网络错误
4. API超时
5. 格式错误

### 性能测试
1. 流式输出速度
2. 消息列表滚动
3. 格式渲染性能
4. 内存占用

---

**功能完成时间**：2026-01-14
**功能状态**：✅ 已上线
**智能体数量**：8个
**支持格式**：纯文本、表格、思维导图
