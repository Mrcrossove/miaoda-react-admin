# 豆包API配置指南

## 问题描述
图片工厂生成文案时出现错误：
```
文案生成失败: Error: {"error":"豆包API调用失败","status":401,"message":"AuthenticationError"}
```

## 原因分析
豆包API密钥未配置或配置错误，导致认证失败（401 Unauthorized）。

## 解决方案

### 方案1：获取豆包API密钥（推荐）

1. **访问火山引擎控制台**
   - 登录：https://console.volcengine.com/
   - 进入"机器学习平台PAI" → "模型推理"

2. **创建API密钥**
   - 点击"API密钥管理"
   - 创建新的API密钥
   - 复制生成的API Key（格式类似：`sk-xxxxxxxxxxxxxxxx`）

3. **配置到Supabase**
   - 方式A：通过Supabase Dashboard
     1. 登录 https://supabase.com/dashboard
     2. 选择项目：app-8sm6r7tdrncx
     3. 进入 Settings → Edge Functions → Secrets
     4. 添加新密钥：
        - Name: `DOUBAO_API_KEY`
        - Value: `您的豆包API密钥`
     5. 点击 Save

   - 方式B：通过命令行（如果有Supabase CLI）
     ```bash
     supabase secrets set DOUBAO_API_KEY=您的豆包API密钥
     ```

4. **重新部署Edge Function**
   ```bash
   # 在项目根目录执行
   supabase functions deploy generate-xiaohongshu-content
   ```

### 方案2：使用其他大模型（备选）

如果无法获取豆包API密钥，可以替换为其他大模型：

#### 选项A：使用通义千问（阿里云）
- API地址：https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
- 模型：qwen-turbo
- 需要阿里云API Key

#### 选项B：使用文心一言（百度）
- API地址：https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions
- 模型：ernie-bot-turbo
- 需要百度API Key

## 验证配置

配置完成后，测试步骤：
1. 打开图片工厂页面
2. 选择背景图
3. 输入主标题（如：新手化妆教程）
4. 选择生成数量（3/4/5张）
5. 点击"下一步：生成文案"
6. 如果配置正确，应该能看到生成的文案

## 常见问题

### Q1: 如何获取豆包API密钥？
A: 访问火山引擎控制台 → 机器学习平台PAI → 模型推理 → API密钥管理

### Q2: 配置后仍然报错？
A: 
1. 检查API密钥是否正确复制（无多余空格）
2. 确认密钥是否已激活
3. 检查账户余额是否充足
4. 重新部署Edge Function

### Q3: 可以使用免费的API吗？
A: 豆包API通常需要付费，但新用户可能有免费额度。建议查看火山引擎官网的定价说明。

### Q4: 如何查看API调用日志？
A: 
1. Supabase Dashboard → Edge Functions → generate-xiaohongshu-content
2. 点击 Logs 查看详细日志
3. 查找错误信息和API响应

## 技术细节

### Edge Function配置
文件位置：`supabase/functions/generate-xiaohongshu-content/index.ts`

```typescript
const DOUBAO_API_KEY = Deno.env.get('DOUBAO_API_KEY') || '';
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const DOUBAO_MODEL = 'ep-20241226185149-qxqkl';
```

### 环境变量
- 名称：`DOUBAO_API_KEY`
- 类型：Secret（加密存储）
- 作用域：Edge Function

## 联系支持

如果以上方案都无法解决问题，请提供：
1. 完整的错误信息
2. API密钥的前4位和后4位（不要提供完整密钥）
3. 是否能访问火山引擎控制台
4. 账户是否有余额

---

**重要提示**：
- 请勿在代码中硬编码API密钥
- 请勿将API密钥提交到Git仓库
- 定期更换API密钥以确保安全
