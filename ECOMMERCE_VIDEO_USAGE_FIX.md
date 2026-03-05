# 电商视频次数扣除Bug修复说明

## 🐛 问题描述

用户反馈电商视频次数存在bug：
1. **只用了一次就不能再用了**：用户只成功生成了1个视频，但之后就提示"今日免费次数已用完"
2. **每天需要刷新一次**：每天的免费次数限制为1次

---

## 🔍 问题分析

### 原始逻辑流程

```
1. 用户进入"生成视频"步骤
   ↓
2. checkUsageAndStart() - 检查今日使用次数
   ↓
3. 如果可以使用，调用 startGeneration()
   ↓
4. startGeneration() - 提交SORA2视频生成请求
   ↓
5. pollTaskStatus() - 轮询查询视频生成状态
   ↓
6. handleVideoCompleted() - 视频生成完成
   ↓
7. recordVideoGenerationUsage() - 记录使用次数 ❌ 问题在这里！
```

### Bug场景

**场景1：用户中途离开**
```
1. 用户提交生成请求 → SORA2 API被调用
2. 用户刷新页面或关闭浏览器
3. 使用次数没有被记录（因为视频还没生成完成）
4. 用户再次进入页面 → 检查显示可以使用
5. 用户再次提交请求 → SORA2 API再次被调用
6. 第二次视频生成完成 → 使用次数被记录为1
7. 用户第三次进入页面 → 检查显示已用完 ❌
```

**结果**：
- 用户只成功生成了1个视频
- 但实际消耗了2次SORA2 API调用
- 用户无法再使用（显示已用完）

**场景2：视频生成失败**
```
1. 用户提交生成请求 → SORA2 API被调用
2. 视频生成失败（网络问题、API错误等）
3. 使用次数没有被记录（因为没有到达handleVideoCompleted）
4. 用户再次提交请求 → SORA2 API再次被调用
5. 第二次视频生成完成 → 使用次数被记录为1
6. 用户第三次进入页面 → 检查显示已用完 ❌
```

### 根本原因

**使用次数的记录时机不对**：
- ❌ 原逻辑：在视频生成**完成后**才记录使用次数
- ✅ 正确逻辑：在提交SORA2请求**之前**就记录使用次数

---

## ✅ 修复方案

### 1. 调整记录时机

**修改前**：
```typescript
// startGeneration() - 提交生成请求
const startGeneration = async () => {
  // 调用SORA2 API提交生成请求
  const result = await generateSoraVideo(prompt, duration);
  // ...
};

// handleVideoCompleted() - 视频生成完成
const handleVideoCompleted = async (url: string) => {
  // 记录使用次数 ❌ 太晚了！
  const result = await recordVideoGenerationUsage();
  // ...
};
```

**修改后**：
```typescript
// startGeneration() - 提交生成请求
const startGeneration = async () => {
  // 先记录使用次数（在提交请求之前）✅
  if (!usageRecorded) {
    const usageResult = await recordVideoGenerationUsage();
    setUsageRecorded(true);
  }
  
  // 调用SORA2 API提交生成请求
  const result = await generateSoraVideo(prompt, duration);
  // ...
};

// handleVideoCompleted() - 视频生成完成
const handleVideoCompleted = async (url: string) => {
  // 只更新状态，不再记录使用次数
  setStatus('completed');
  setVideoUrl(url);
};
```

### 2. 添加重复扣除保护

**问题**：如果用户点击"重新生成"，会再次调用`startGeneration()`，导致重复扣除次数

**解决方案**：添加`usageRecorded`标志

```typescript
const [usageRecorded, setUsageRecorded] = useState(false);

const startGeneration = async () => {
  // 只在第一次生成时记录使用次数
  if (!usageRecorded) {
    const usageResult = await recordVideoGenerationUsage();
    setUsageRecorded(true); // 标记已记录
  }
  
  // 后续的重新生成不会再次扣除次数
  // ...
};
```

---

## 📊 修复前后对比

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| 记录时机 | 视频生成完成后 | 提交请求之前 |
| 中途离开 | 次数丢失，可重复提交 | 次数已记录，避免重复 |
| 生成失败 | 次数丢失，可重复提交 | 次数已记录，避免重复 |
| 重新生成 | 可能重复扣除 | 不会重复扣除 |
| API资源 | 可能被浪费 | 得到保护 |

---

## 🎯 新的流程

```
1. 用户进入"生成视频"步骤
   ↓
2. checkUsageAndStart() - 检查今日使用次数
   ↓
3. 如果可以使用，调用 startGeneration()
   ↓
4. recordVideoGenerationUsage() - 立即记录使用次数 ✅
   ↓
5. generateSoraVideo() - 提交SORA2视频生成请求
   ↓
6. pollTaskStatus() - 轮询查询视频生成状态
   ↓
7. handleVideoCompleted() - 视频生成完成，更新状态
```

**关键改进**：
- ✅ 在提交SORA2请求之前就记录使用次数
- ✅ 即使用户中途离开或视频生成失败，次数也已被记录
- ✅ 避免用户多次提交请求导致API资源浪费
- ✅ 重新生成不会重复扣除次数

---

## 🧪 测试场景

### 场景1：正常生成
```
1. 用户进入页面 → 显示"剩余0次，可用"
2. 提交生成请求 → 立即记录使用次数（1次）
3. 视频生成中...
4. 视频生成完成 → 显示视频
5. 用户再次进入页面 → 显示"今日已用完"
```
**预期结果**：✅ 正常

### 场景2：中途刷新页面
```
1. 用户进入页面 → 显示"剩余0次，可用"
2. 提交生成请求 → 立即记录使用次数（1次）
3. 视频生成中...
4. 用户刷新页面 ❌
5. 用户再次进入页面 → 显示"今日已用完"
```
**预期结果**：✅ 正确阻止重复提交

### 场景3：视频生成失败
```
1. 用户进入页面 → 显示"剩余0次，可用"
2. 提交生成请求 → 立即记录使用次数（1次）
3. 视频生成失败 ❌
4. 用户点击"重新生成" → 不再扣除次数
5. 视频生成成功 → 显示视频
6. 用户再次进入页面 → 显示"今日已用完"
```
**预期结果**：✅ 重新生成不重复扣除

### 场景4：第二天使用
```
1. 第一天用完1次 → 显示"今日已用完"
2. 第二天进入页面 → 显示"剩余0次，可用"
3. 提交生成请求 → 立即记录使用次数（1次）
4. 视频生成完成 → 显示视频
```
**预期结果**：✅ 每天重置次数

---

## 📝 代码变更

### 文件：`src/components/ecommerce-video/VideoGenerationStep.tsx`

**变更1：添加usageRecorded状态**
```typescript
const [usageRecorded, setUsageRecorded] = useState(false);
```

**变更2：修改startGeneration函数**
```typescript
const startGeneration = async () => {
  setStatus('submitting');
  setProgress(0);
  setErrorMessage('');

  try {
    // 只在第一次生成时记录使用次数（避免重新生成时重复扣除）
    if (!usageRecorded) {
      const usageResult = await recordVideoGenerationUsage();
      
      if (!usageResult.success) {
        throw new Error('记录使用次数失败');
      }
      
      setUsageCount(usageResult.usageCount || 0);
      setUsageRecorded(true); // 标记已记录
    }
    
    // 调用SORA2 API提交生成请求
    const result = await generateSoraVideo(prompt, duration);
    // ...
  } catch (error) {
    // ...
  }
};
```

**变更3：简化handleVideoCompleted函数**
```typescript
const handleVideoCompleted = async (url: string) => {
  // 使用次数已在startGeneration中记录，这里只需要更新状态
  setStatus('completed');
  setProgress(100);
  setVideoUrl(url);
};
```

---

## ✅ 验证清单

- [x] 记录时机调整为提交请求之前
- [x] 添加usageRecorded标志防止重复扣除
- [x] 移除handleVideoCompleted中的重复记录逻辑
- [x] 测试正常生成流程
- [x] 测试中途刷新页面场景
- [x] 测试视频生成失败场景
- [x] 测试重新生成不重复扣除
- [x] Lint验证通过

---

## 🚀 部署状态

- ✅ 代码修改完成
- ✅ Lint验证通过（108个文件）
- ✅ Git提交完成（总提交数：192）

---

## 📚 相关文件

- 数据库表：`supabase/migrations/00007_create_video_generation_usage_table.sql`
- RPC函数：
  - `check_video_generation_usage()` - 检查使用次数
  - `record_video_generation_usage()` - 记录使用次数
  - `get_video_generation_usage_today()` - 获取今日使用次数
- 前端组件：`src/components/ecommerce-video/VideoGenerationStep.tsx`
- API封装：`src/db/api.ts`

---

## ✨ 总结

**Bug已修复！** 电商视频使用次数的扣除逻辑已优化：

- ✅ 在提交SORA2请求之前就记录使用次数
- ✅ 避免用户中途离开导致次数丢失
- ✅ 避免视频生成失败导致次数丢失
- ✅ 避免重新生成时重复扣除次数
- ✅ 保护API资源不被浪费

现在用户每天可以稳定使用1次免费电商视频生成功能！

---

**文档创建时间**：2026-01-08  
**总提交数**：192  
**最新提交**：50e2c66 (fix: 修复电商视频次数扣除bug)
