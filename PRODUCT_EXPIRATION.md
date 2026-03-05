# 产品自动过期功能说明

## 功能概述

用户在"我有产品"模块上传的产品将在**72小时后自动删除**，确保数据的时效性和存储空间的合理使用。

## 实现机制

### 1. 数据库层面

#### RLS策略（Row Level Security）
- **作用**：用户只能查看自己72小时内创建的产品
- **优势**：立即生效，无需等待清理任务
- **实现**：
  ```sql
  CREATE POLICY "products_select_policy" ON products
    FOR SELECT
    USING (
      auth.uid() = user_id 
      AND created_at > (now() - interval '72 hours')
    );
  ```

#### 清理函数
- **函数名**：`cleanup_expired_products()`
- **作用**：物理删除超过72小时的产品数据
- **优势**：节省数据库存储空间
- **实现**：
  ```sql
  CREATE OR REPLACE FUNCTION cleanup_expired_products()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    DELETE FROM products
    WHERE created_at < (now() - interval '72 hours');
    
    RAISE NOTICE '已清理过期产品';
  END;
  $$;
  ```

### 2. Edge Function

#### 定期清理任务
- **函数名**：`cleanup-expired-products`
- **路径**：`supabase/functions/cleanup-expired-products/index.ts`
- **作用**：定期调用清理函数，删除过期产品
- **调用方式**：
  - 手动调用：通过Supabase Dashboard或API
  - 自动调用：配置Cron Job（需要在Supabase Dashboard中设置）

#### 配置Cron Job（可选）

在Supabase Dashboard中配置定时任务：

1. 进入项目的Database > Cron Jobs
2. 创建新的Cron Job
3. 配置：
   - **名称**：cleanup-expired-products
   - **时间表**：`0 */6 * * *`（每6小时执行一次）
   - **命令**：
     ```sql
     SELECT net.http_post(
       url := 'https://your-project.supabase.co/functions/v1/cleanup-expired-products',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
     );
     ```

### 3. 前端显示

#### 剩余时间显示
- **位置**：产品卡片上
- **格式**：
  - 超过24小时：`剩余 X天X小时`
  - 1-24小时：`剩余 X小时X分钟`
  - 少于1小时：`剩余 X分钟`
  - 已过期：`已过期`

#### 过期提示
- **位置**：上传产品对话框顶部
- **内容**：⏰ 重要提示：产品信息将在上传后72小时自动删除，请及时生成文案并发布。

## 用户体验

### 上传产品时
1. 用户看到明确的过期提示
2. 了解产品将在72小时后自动删除
3. 提醒用户及时生成文案并发布

### 查看产品时
1. 每个产品卡片显示剩余时间
2. 剩余时间实时更新（刷新页面时）
3. 过期产品自动从列表中消失

### 过期后
1. 产品立即从列表中消失（RLS策略）
2. 数据在后台定期清理（Edge Function）
3. 用户无法访问已过期的产品

## 技术优势

### 1. 双重保障
- **RLS策略**：立即生效，用户无法看到过期产品
- **清理函数**：定期清理，节省存储空间

### 2. 性能优化
- RLS策略在数据库层面过滤，查询效率高
- 清理函数使用索引，删除速度快

### 3. 安全性
- 使用SECURITY DEFINER确保清理函数有足够权限
- RLS策略确保用户只能访问自己的产品

### 4. 可维护性
- 清理逻辑集中在数据库函数中
- Edge Function可独立部署和测试
- 前端只需显示剩余时间，无需处理删除逻辑

## 手动触发清理

如果需要手动触发清理，可以：

### 方法1：通过Supabase Dashboard
1. 进入SQL Editor
2. 执行：`SELECT cleanup_expired_products();`

### 方法2：通过Edge Function
```bash
curl -X POST https://your-project.supabase.co/functions/v1/cleanup-expired-products \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 方法3：通过前端（开发调试）
```typescript
const { data, error } = await supabase.functions.invoke('cleanup-expired-products');
```

## 监控和日志

### 查看清理日志
在Supabase Dashboard的Edge Functions日志中可以看到：
- 清理任务的执行时间
- 清理的产品数量
- 任何错误信息

### 查询产品统计
```sql
-- 查询所有产品数量
SELECT COUNT(*) FROM products;

-- 查询72小时内的产品数量
SELECT COUNT(*) FROM products 
WHERE created_at > (now() - interval '72 hours');

-- 查询即将过期的产品（剩余不到6小时）
SELECT name, created_at, 
       (created_at + interval '72 hours' - now()) as remaining
FROM products
WHERE created_at > (now() - interval '72 hours')
  AND created_at < (now() - interval '66 hours')
ORDER BY created_at;
```

## 注意事项

1. **时区问题**：所有时间计算使用UTC时区，确保全球用户一致
2. **删除不可恢复**：产品删除后无法恢复，请提醒用户及时保存
3. **Cron Job配置**：需要在Supabase Dashboard中手动配置定时任务
4. **存储空间**：图片URL指向的实际图片不会被删除（如果存储在Supabase Storage中，需要单独处理）

## 未来优化

1. **邮件提醒**：产品即将过期时发送邮件提醒用户
2. **延期功能**：允许用户延长产品保存时间（需要付费或限制次数）
3. **回收站**：删除的产品进入回收站，7天后彻底删除
4. **批量操作**：允许用户批量延期或删除产品
