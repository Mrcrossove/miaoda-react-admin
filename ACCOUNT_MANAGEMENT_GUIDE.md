# 账号管理系统使用指南

## 系统概述

本系统实现了完整的账号密码登录体系，关闭了注册功能，采用管理员分发账号的方式管理用户。

### 核心特性

- ✅ 账号密码登录（替代手机号验证码）
- ✅ 管理员后台生成账号
- ✅ 单个创建和批量创建
- ✅ 账号状态管理（启用/禁用）
- ✅ 密码重置功能
- ✅ 账号列表导出
- ✅ 完整的权限验证

## 系统架构

### 数据库设计

#### 1. user_accounts 表（用户账号）

```sql
CREATE TABLE user_accounts (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,        -- 用户名
  password_hash TEXT NOT NULL,          -- 密码哈希
  display_name TEXT,                    -- 显示名称
  is_active BOOLEAN DEFAULT true,       -- 是否启用
  created_at TIMESTAMPTZ DEFAULT now(), -- 创建时间
  created_by UUID,                      -- 创建者
  last_login_at TIMESTAMPTZ,            -- 最后登录时间
  notes TEXT                            -- 备注
);
```

#### 2. admin_users 表（管理员）

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,        -- 管理员用户名
  password_hash TEXT NOT NULL,          -- 密码哈希
  display_name TEXT NOT NULL,           -- 显示名称
  is_super_admin BOOLEAN DEFAULT false, -- 是否超级管理员
  is_active BOOLEAN DEFAULT true,       -- 是否启用
  created_at TIMESTAMPTZ DEFAULT now(), -- 创建时间
  last_login_at TIMESTAMPTZ             -- 最后登录时间
);
```

### 安全机制

#### 密码加密

- 使用 PostgreSQL 的 `pgcrypto` 扩展
- 采用 `bcrypt` 算法加密密码
- 密码哈希存储，不存储明文

```sql
-- 加密密码
crypt('password', gen_salt('bf'))

-- 验证密码
password_hash = crypt('input_password', password_hash)
```

#### RLS 策略

1. **user_accounts 表**：
   - 允许所有人查询活跃账号（用于登录验证）
   - 只有管理员可以插入、更新、删除

2. **admin_users 表**：
   - 超级管理员可以查看所有管理员
   - 管理员可以查看自己的信息
   - 只有超级管理员可以管理管理员

## 使用指南

### 一、管理员登录

#### 访问地址

```
/admin/login
```

#### 默认管理员账号

```
用户名：admin
密码：admin123
```

⚠️ **重要提示**：首次登录后请及时修改密码！

#### 登录步骤

1. 访问管理员登录页面
2. 输入用户名和密码
3. 点击"登录"按钮
4. 登录成功后自动跳转到账号管理页面

### 二、账号管理后台

#### 访问地址

```
/admin/accounts
```

#### 功能概览

1. **管理员信息展示**
   - 显示当前登录的管理员信息
   - 显示是否为超级管理员
   - 退出登录功能

2. **创建单个账号**
   - 输入用户名（必填）
   - 输入密码（必填，支持随机生成）
   - 输入显示名称（可选）
   - 输入备注信息（可选）

3. **批量创建账号**
   - 设置创建数量（1-100）
   - 设置用户名前缀
   - 设置统一密码
   - 预览账号格式
   - 创建完成后显示账号列表
   - 支持下载账号列表（txt格式）

4. **账号列表管理**
   - 查看所有账号信息
   - 复制用户名
   - 重置密码
   - 启用/禁用账号
   - 删除账号
   - 刷新列表

### 三、创建单个账号

#### 操作步骤

1. 点击"创建单个账号"按钮
2. 填写账号信息：
   - **用户名**：必填，建议使用字母+数字组合
   - **密码**：必填，可点击"随机生成"按钮生成8位随机密码
   - **显示名称**：可选，用于显示用户的昵称
   - **备注**：可选，记录账号用途或分配对象
3. 点击"创建账号"按钮
4. 创建成功后，账号会出现在账号列表中

#### 示例

```
用户名：zhangsan
密码：abc12345
显示名称：张三
备注：分配给市场部张三使用
```

### 四、批量创建账号

#### 操作步骤

1. 点击"批量创建账号"按钮
2. 填写批量创建参数：
   - **创建数量**：输入要创建的账号数量（1-100）
   - **用户名前缀**：输入用户名前缀（如：user）
   - **统一密码**：输入所有账号使用的密码
3. 查看预览示例（如：user001, user002, user003...）
4. 点击"开始批量创建"按钮
5. 等待创建完成
6. 查看创建结果列表
7. 点击"下载账号列表"保存账号信息

#### 示例

```
创建数量：10
用户名前缀：student
统一密码：123456

生成结果：
student001  123456
student002  123456
student003  123456
...
student010  123456
```

#### 下载的账号列表格式

```
用户名	密码
student001	123456
student002	123456
student003	123456
...
```

### 五、账号管理操作

#### 1. 复制用户名

- 点击账号行的"复制"按钮
- 用户名自动复制到剪贴板
- 可直接粘贴分发给用户

#### 2. 重置密码

- 点击账号行的"重置密码"按钮
- 在弹出的对话框中输入新密码
- 点击确定完成重置
- 将新密码告知用户

#### 3. 启用/禁用账号

- 点击账号行的"启用/禁用"按钮
- 禁用后用户无法登录
- 启用后用户可以正常登录
- 用于临时限制用户访问

#### 4. 删除账号

- 点击账号行的"删除"按钮
- 确认删除操作
- ⚠️ 删除操作不可恢复！

#### 5. 刷新列表

- 点击"刷新列表"按钮
- 重新加载最新的账号数据

### 六、用户登录

#### 访问地址

```
/login
```

#### 登录步骤

1. 访问用户登录页面
2. 输入管理员分发的账号
3. 输入管理员分发的密码
4. 点击"登录"按钮
5. 登录成功后进入应用首页

#### 注意事项

- 用户无法自行注册
- 必须使用管理员分发的账号密码
- 如需账号，请联系管理员
- 首次登录建议修改密码（功能待开发）

## 最佳实践

### 账号命名规范

1. **部门前缀**：
   ```
   sales001, sales002  （销售部）
   tech001, tech002    （技术部）
   market001, market002（市场部）
   ```

2. **角色前缀**：
   ```
   admin001, admin002  （管理员）
   user001, user002    （普通用户）
   vip001, vip002      （VIP用户）
   ```

3. **项目前缀**：
   ```
   projectA001, projectA002
   projectB001, projectB002
   ```

### 密码管理建议

1. **初始密码**：
   - 批量创建时使用统一的简单密码（如：123456）
   - 要求用户首次登录后修改密码

2. **密码强度**：
   - 建议至少8位
   - 包含字母和数字
   - 避免使用纯数字或纯字母

3. **密码重置**：
   - 定期重置长期未登录账号的密码
   - 用户忘记密码时及时重置

### 账号分发流程

1. **创建账号**：
   - 根据需求创建单个或批量账号
   - 记录账号用途和分配对象

2. **导出账号**：
   - 批量创建后下载账号列表
   - 或手动记录账号信息

3. **分发账号**：
   - 通过邮件、消息等方式发送给用户
   - 告知用户登录地址和使用说明

4. **跟踪使用**：
   - 查看账号的最后登录时间
   - 禁用长期未使用的账号

### 安全建议

1. **管理员账号**：
   - 修改默认管理员密码
   - 不要将管理员账号分享给他人
   - 定期更换管理员密码

2. **用户账号**：
   - 定期检查账号列表
   - 及时禁用离职人员账号
   - 删除不再使用的账号

3. **密码安全**：
   - 不要在公开场合展示密码
   - 使用安全的方式传递密码
   - 建议用户修改初始密码

## 常见问题

### Q1: 忘记管理员密码怎么办？

**A**: 需要数据库管理员重置密码：

```sql
UPDATE admin_users
SET password_hash = crypt('new_password', gen_salt('bf'))
WHERE username = 'admin';
```

### Q2: 用户忘记密码怎么办？

**A**: 管理员在账号管理后台重置密码：
1. 找到对应账号
2. 点击"重置密码"按钮
3. 输入新密码
4. 将新密码告知用户

### Q3: 如何批量禁用账号？

**A**: 目前需要逐个禁用，或通过数据库批量操作：

```sql
UPDATE user_accounts
SET is_active = false
WHERE username LIKE 'prefix%';
```

### Q4: 账号列表导出的文件在哪里？

**A**: 点击"下载账号列表"后，文件会自动下载到浏览器的默认下载目录，文件名格式为：`账号列表_YYYY-MM-DD.txt`

### Q5: 可以修改用户名吗？

**A**: 目前不支持修改用户名，建议：
1. 创建新账号
2. 禁用旧账号
3. 或通过数据库直接修改

### Q6: 如何查看某个账号的登录历史？

**A**: 在账号列表中查看"最后登录"列，显示最后一次登录时间。详细的登录历史功能待开发。

### Q7: 批量创建时用户名重复怎么办？

**A**: 系统会跳过已存在的用户名，继续创建其他账号。建议：
1. 使用不同的前缀
2. 或先删除旧账号

### Q8: 管理员可以登录用户账号吗？

**A**: 不可以。管理员账号和用户账号是分开的：
- 管理员登录：`/admin/login`
- 用户登录：`/login`

## API 参考

### 用户登录

```typescript
import { loginWithAccount } from '@/db/api';

const result = await loginWithAccount(username, password);

// 返回结果
{
  success: boolean;
  userId?: string;
  username?: string;
  displayName?: string;
  message: string;
}
```

### 管理员登录

```typescript
import { loginAdmin } from '@/db/api';

const result = await loginAdmin(username, password);

// 返回结果
{
  success: boolean;
  adminId?: string;
  username?: string;
  displayName?: string;
  isSuperAdmin?: boolean;
  message: string;
}
```

### 生成账号

```typescript
import { generateAccount } from '@/db/api';

const result = await generateAccount(
  username,
  password,
  displayName,  // 可选
  notes         // 可选
);

// 返回结果
{
  success: boolean;
  accountId?: string;
  username?: string;
  message: string;
}
```

### 获取账号列表

```typescript
import { getAllAccounts } from '@/db/api';

const accounts = await getAllAccounts();

// 返回结果
Array<{
  id: string;
  username: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  notes: string | null;
}>
```

### 更新账号状态

```typescript
import { updateAccountStatus } from '@/db/api';

const success = await updateAccountStatus(accountId, isActive);
```

### 删除账号

```typescript
import { deleteAccount } from '@/db/api';

const success = await deleteAccount(accountId);
```

### 重置密码

```typescript
import { resetAccountPassword } from '@/db/api';

const result = await resetAccountPassword(accountId, newPassword);

// 返回结果
{
  success: boolean;
  message: string;
}
```

## 数据库函数

### verify_user_login

验证用户登录

```sql
SELECT * FROM verify_user_login('username', 'password');
```

### verify_admin_login

验证管理员登录

```sql
SELECT * FROM verify_admin_login('admin', 'password');
```

### generate_user_account

生成用户账号

```sql
SELECT * FROM generate_user_account(
  'username',
  'password',
  'display_name',  -- 可选
  'notes'          -- 可选
);
```

### reset_user_password

重置用户密码

```sql
SELECT * FROM reset_user_password(
  'account_id',
  'new_password'
);
```

## 后续优化建议

### 功能优化

1. **用户端功能**：
   - 用户修改密码功能
   - 用户个人信息管理
   - 登录历史查看

2. **管理员功能**：
   - 批量操作（批量禁用、批量删除）
   - 账号搜索和筛选
   - 账号使用统计
   - 管理员操作日志

3. **安全增强**：
   - 密码强度验证
   - 登录失败次数限制
   - 账号锁定机制
   - 两步验证

4. **数据导出**：
   - 支持导出为Excel格式
   - 支持导出为CSV格式
   - 自定义导出字段

### 技术优化

1. **性能优化**：
   - 账号列表分页
   - 搜索索引优化
   - 缓存机制

2. **用户体验**：
   - 批量操作进度显示
   - 操作确认对话框
   - 更友好的错误提示

3. **监控和日志**：
   - 登录日志记录
   - 操作审计日志
   - 异常监控告警

## 技术支持

如有问题或建议，请联系技术支持团队。

---

**文档版本**: v1.0.0  
**最后更新**: 2026-02-01  
**作者**: 秒哒AI助手
