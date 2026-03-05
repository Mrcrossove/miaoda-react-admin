# 小红书笔记解析API接入文档

## API概述

使用第三方专业API（cyanlis.cn）解析小红书笔记链接，获取笔记详细信息。

## API信息

- **API地址**: `https://cyanlis.cn/api/plugins/xiaohongshu/detail`
- **请求方式**: GET
- **API Key**: `cca4a25b-e2bb-4cb7-823a-08af7a6a6ecd`

## 请求参数

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| url | string | 是 | 小红书笔记链接（支持短链和长链） |
| apiKey | string | 是 | API密钥 |
| cookie | string | 否 | 小红书Cookie（可选，提供可获取更多数据） |

## 响应数据结构

```json
{
  "code": 0,
  "success": true,
  "msg": "返回成功 [本次消耗:1 剩余:722 今日:2 累计:50875]",
  "data": {
    "note_id": "笔记ID",
    "title": "笔记标题",
    "desc": "笔记描述/文案",
    "type": "笔记类型（video/normal）",
    "time": 1706847252000,
    "last_update_time": 1706847253000,
    "user": {
      "user_id": "作者ID",
      "nickname": "作者昵称",
      "avatar": "作者头像链接"
    },
    "stats": {
      "liked_count": 193000,
      "collected_count": 36000,
      "comment_count": 1849,
      "share_count": 2602
    },
    "images": [
      {
        "url": "无水印图片链接",
        "width": 1440,
        "height": 1080
      }
    ],
    "video": {
      "url": "无水印视频链接",
      "cover": "视频封面图链接"
    },
    "original_url": "原始笔记链接"
  }
}
```

## Edge Function实现

### 文件位置
`supabase/functions/parse-xiaohongshu-note/index.ts`

### 核心逻辑

```typescript
// 1. 构建API请求URL
const apiKey = 'cca4a25b-e2bb-4cb7-823a-08af7a6a6ecd';
const apiUrl = `https://cyanlis.cn/api/plugins/xiaohongshu/detail?url=${encodeURIComponent(url)}&apiKey=${apiKey}`;

// 2. 发送GET请求
const apiResponse = await fetch(apiUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. 解析响应
const apiData = await apiResponse.json();

// 4. 检查响应状态
if (apiData.code !== 0 || !apiData.success) {
  throw new Error(apiData.msg || '解析失败');
}

// 5. 格式化内容
const noteData = apiData.data;
const formattedContent = `标题：${noteData.title || '无'}

正文内容：${noteData.desc || '无'}

作者：${noteData.user?.nickname || '未知'}

互动数据：
- 点赞：${noteData.stats?.liked_count || 0}
- 收藏：${noteData.stats?.collected_count || 0}
- 评论：${noteData.stats?.comment_count || 0}
- 分享：${noteData.stats?.share_count || 0}

笔记类型：${noteData.type === 'video' ? '视频' : '图文'}

图片数量：${noteData.images?.length || 0}`;

// 6. 返回结果
return {
  success: true,
  data: {
    content: formattedContent,
    url,
    noteData, // 完整的笔记数据
  },
};
```

## 数据处理

### 1. 标题和描述
- **title**: 笔记标题
- **desc**: 笔记正文内容

### 2. 作者信息
- **user.nickname**: 作者昵称
- **user.avatar**: 作者头像
- **user.user_id**: 作者ID

### 3. 互动数据
- **stats.liked_count**: 点赞数（数字类型）
- **stats.collected_count**: 收藏数（数字类型）
- **stats.comment_count**: 评论数（数字类型）
- **stats.share_count**: 分享数（数字类型）

### 4. 媒体资源
- **images**: 图片列表（无水印）
  - url: 图片链接
  - width: 图片宽度
  - height: 图片高度
- **video**: 视频信息（仅视频笔记）
  - url: 视频链接（无水印）
  - cover: 视频封面

### 5. 笔记类型
- **video**: 视频笔记
- **normal**: 图文笔记

## 错误处理

### API错误码

| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| 401 | Unauthorized | API Key无效或过期 |
| 400 | Bad Request | 请求参数错误（URL为空） |
| 403 | Forbidden | 余额不足或权限受限 |
| 500 | Internal Server Error | 服务器内部错误或解析失败 |

### Edge Function错误处理

```typescript
try {
  // API调用逻辑
} catch (error: any) {
  console.error('解析失败:', error);
  return new Response(
    JSON.stringify({
      error: error.message || '解析失败',
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
```

## 前端调用

### API函数
```typescript
// src/db/api.ts
export async function parseXiaohongshuNote(url: string) {
  const { data, error } = await supabase.functions.invoke('parse-xiaohongshu-note', {
    body: JSON.stringify({ url }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (error) {
    // 错误处理
    throw new Error(errorMsg);
  }

  return data;
}
```

### 页面使用
```typescript
// src/pages/ContentCreationPage.tsx
const handleParse = async () => {
  try {
    const result = await parseXiaohongshuNote(noteUrl.trim());
    
    if (result?.success && result?.data?.content) {
      setOriginalContent(result.data.content);
      toast.success('解析成功');
    }
  } catch (error: any) {
    toast.error(error?.message || '解析失败');
  }
};
```

## 使用示例

### 支持的链接格式

1. **标准链接**
```
https://www.xiaohongshu.com/explore/65bc6c1400000000080219ef
```

2. **短链接**
```
https://xhslink.com/xxxxx
```

3. **分享链接**
```
https://www.xiaohongshu.com/discovery/item/65bc6c1400000000080219ef?source=webshare
```

### 解析结果示例

```
标题：林丹擦地板竟然遭到裁判嫌弃，无奈只能找

正文内容：对手出气#羽毛球[话题]# #羽毛球单打[话题]# #林丹[话题]#

作者：姚安

互动数据：
- 点赞：193000
- 收藏：36000
- 评论：1849
- 分享：2602

笔记类型：视频

图片数量：1
```

## API用量管理

### 用量信息
API响应中的`msg`字段包含用量信息：
```
"返回成功 [本次消耗:1 剩余:722 今日:2 累计:50875]"
```

- **本次消耗**: 本次请求消耗的额度
- **剩余**: 剩余可用额度
- **今日**: 今日已使用额度
- **累计**: 累计使用额度

### 用量优化建议

1. **缓存机制**
   - 对已解析的链接进行缓存
   - 避免重复解析同一链接

2. **用户提示**
   - 在用户输入时验证链接格式
   - 避免无效请求消耗额度

3. **错误重试**
   - 网络错误时允许重试
   - API错误时不重试（避免浪费额度）

## 优势对比

### 之前的方案（网页内容总结API）
- ❌ 解析不稳定
- ❌ 数据不完整
- ❌ 格式不统一
- ❌ 依赖AI理解

### 现在的方案（专业解析API）
- ✅ 解析稳定可靠
- ✅ 数据完整准确
- ✅ 格式统一规范
- ✅ 直接返回结构化数据
- ✅ 支持无水印图片和视频
- ✅ 包含详细的互动数据

## 注意事项

1. **API Key安全**
   - API Key已硬编码在Edge Function中
   - Edge Function运行在服务端，不会暴露给客户端
   - 如需更换Key，需重新部署Edge Function

2. **链接格式**
   - 支持小红书的各种链接格式
   - 自动处理URL编码

3. **数据时效性**
   - 互动数据（点赞、收藏等）为解析时的实时数据
   - 不会自动更新

4. **图片和视频**
   - 返回的是无水印资源链接
   - 图片和视频链接可能有时效性
   - 建议及时下载或使用

5. **错误处理**
   - 网络错误：提示用户重试
   - API错误：显示具体错误信息
   - 链接无效：提示用户检查链接

## 测试建议

### 测试用例

1. **正常图文笔记**
   - 测试标准链接解析
   - 验证标题、描述、图片

2. **视频笔记**
   - 测试视频链接解析
   - 验证视频URL和封面

3. **短链接**
   - 测试短链接跳转
   - 验证解析结果

4. **异常情况**
   - 无效链接
   - 已删除的笔记
   - 私密笔记

## 相关文件

- **supabase/functions/parse-xiaohongshu-note/index.ts** - Edge Function实现
- **src/db/api.ts** - API调用函数
- **src/pages/ContentCreationPage.tsx** - 前端页面

---

**更新时间**: 2026-01-14
**API状态**: ✅ 已接入
**API提供商**: cyanlis.cn
