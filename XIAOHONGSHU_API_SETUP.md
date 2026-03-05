# 小红书搜索API配置指南

## 概述

"帮我选品"功能使用小红书关键词搜索API来获取真实的爆款笔记数据。要使用此功能，需要配置小红书Cookie和API Key。

## 配置步骤

### 1. 获取小红书Cookie

#### 方法一：通过浏览器开发者工具获取

1. 打开Chrome浏览器，访问 [小红书网页版](https://www.xiaohongshu.com)
2. 登录你的小红书账号
3. 按F12打开开发者工具
4. 切换到"Network"（网络）标签
5. 刷新页面（F5）
6. 在网络请求列表中找到任意一个请求
7. 点击该请求，在右侧找到"Request Headers"（请求头）
8. 找到"Cookie"字段，复制完整的Cookie值

**重要提示**：
- Cookie必须包含`web_session`等关键字段
- Cookie有效期有限，过期后需要重新获取
- 不要泄露你的Cookie给他人

#### 方法二：使用浏览器扩展

1. 安装"EditThisCookie"或"Cookie Editor"等浏览器扩展
2. 访问小红书网页版并登录
3. 点击扩展图标，导出Cookie
4. 将Cookie格式化为字符串（如：`key1=value1; key2=value2`）

### 2. 获取API Key

1. 访问API提供商网站：[https://cyanlis.cn](https://cyanlis.cn)
2. 注册账号并登录
3. 在用户中心找到"API Key"或"密钥管理"
4. 复制你的API Key

**注意事项**：
- API Key是付费服务，需要充值后才能使用
- 每次搜索消耗5个点数
- 请妥善保管API Key，不要泄露

### 3. 在Supabase后台配置环境变量

#### 步骤：

1. 登录Supabase后台
2. 选择你的项目
3. 进入"Settings"（设置）→ "Edge Functions"
4. 找到"Secrets"（密钥）部分
5. 添加以下两个环境变量：

**环境变量1：XIAOHONGSHU_COOKIE**
- Name: `XIAOHONGSHU_COOKIE`
- Value: 粘贴你从浏览器获取的完整Cookie值

**环境变量2：XIAOHONGSHU_API_KEY**
- Name: `XIAOHONGSHU_API_KEY`
- Value: 粘贴你从API提供商获取的API Key

6. 点击"Save"保存配置

#### 配置示例：

```
XIAOHONGSHU_COOKIE=web_session=xxx; xsecappid=xxx; a1=xxx; webId=xxx; ...
XIAOHONGSHU_API_KEY=your_api_key_here
```

### 4. 验证配置

配置完成后：

1. 打开应用的"帮我选品"页面
2. 输入任意关键词（如"口红"）
3. 点击"搜索"按钮
4. 如果配置正确，应该能看到真实的小红书笔记列表
5. 如果配置错误，会显示错误提示信息

## 常见问题

### Q1：提示"未配置小红书Cookie或API Key"

**原因**：Supabase后台未配置环境变量

**解决方案**：
1. 检查Supabase后台是否已添加`XIAOHONGSHU_COOKIE`和`XIAOHONGSHU_API_KEY`
2. 确保变量名称完全一致（区分大小写）
3. 保存配置后，等待几分钟让配置生效

### Q2：提示"请先在Supabase后台配置真实的小红书Cookie和API Key"

**原因**：环境变量的值仍然是占位符

**解决方案**：
1. 更新环境变量的值为真实的Cookie和API Key
2. 不要使用默认的占位符文本

### Q3：搜索失败，提示"搜索失败"或其他错误

**可能原因**：
1. Cookie已过期
2. API Key余额不足
3. API Key无效
4. 网络问题

**解决方案**：
1. 重新获取Cookie并更新配置
2. 检查API Key余额
3. 验证API Key是否有效
4. 检查网络连接

### Q4：搜索结果为空

**可能原因**：
1. 关键词太冷门
2. 筛选条件太严格（点赞5000+）
3. API返回数据为空

**解决方案**：
1. 尝试更热门的关键词
2. 检查API返回的原始数据
3. 联系API提供商确认服务状态

### Q5：Cookie多久需要更新一次？

**答案**：
- Cookie的有效期取决于小红书的设置，通常为几天到几周
- 如果搜索失败，首先尝试更新Cookie
- 建议定期（如每周）更新Cookie以确保服务稳定

## API使用说明

### 接口信息

- **接口地址**：`https://cyanlis.cn/api/plugins/xiaohongshu/search`
- **请求方式**：GET
- **消耗点数**：每次搜索消耗5个点数

### 请求参数

| 参数名 | 类型 | 必选 | 描述 |
| --- | --- | --- | --- |
| keyword | string | 是 | 搜索关键词 |
| cookie | string | 是 | 小红书Cookie |
| apiKey | string | 是 | API Key |
| sort | integer | 否 | 排序方式（0-综合，1-最新，2-最多点赞，3-最多评论，4-最多收藏） |
| noteType | integer | 否 | 笔记类型（0-全部，1-视频，2-图文） |
| publishTime | integer | 否 | 发布时间（0-不限，1-一天内，2-一周内，3-半年内） |
| number | integer | 否 | 采集数量（默认20，最大100） |

### 当前配置

应用当前使用以下配置：
- **排序方式**：按点赞数排序（sort=2）
- **笔记类型**：全部类型（noteType=0）
- **发布时间**：不限时间（publishTime=0）
- **采集数量**：20条（用于筛选后返回10条）
- **筛选条件**：点赞数≥5000

## 成本估算

### 使用成本

- 每次搜索消耗：5个点数
- 假设每天搜索10次：50个点数/天
- 假设每月搜索300次：1500个点数/月

### 优化建议

1. **合理使用搜索**：避免频繁搜索相同关键词
2. **缓存结果**：对于热门关键词，可以缓存搜索结果
3. **批量搜索**：一次搜索获取更多结果，减少搜索次数
4. **定期充值**：根据使用量定期充值，避免余额不足

## 安全建议

1. **保护Cookie**：
   - 不要在公共场合展示Cookie
   - 不要将Cookie提交到代码仓库
   - 定期更换Cookie

2. **保护API Key**：
   - 不要在前端代码中暴露API Key
   - 使用环境变量存储API Key
   - 定期更换API Key

3. **监控使用**：
   - 定期检查API使用量
   - 设置余额预警
   - 监控异常调用

## 技术支持

如果遇到配置问题或使用问题，可以：

1. 查看Edge Function日志（Supabase后台 → Functions → Logs）
2. 查看浏览器控制台错误信息
3. 联系API提供商技术支持
4. 参考API文档：[https://cyanlis.cn/docs](https://cyanlis.cn/docs)

## 更新日志

- **2026-01-12**：初始版本，支持小红书关键词搜索
- 配置了Cookie和API Key环境变量
- 实现了点赞数筛选（≥5000）
- 支持按点赞数排序

---

**重要提示**：请确保遵守小红书的使用条款和API提供商的服务协议。不要滥用API服务，避免对小红书平台造成负担。
