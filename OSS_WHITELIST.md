# 阿里云OSS域名白名单配置说明

## 背景
阿里云百炼生成的图像链接存储于阿里云OSS（对象存储服务）。如果您的业务系统因安全策略无法访问外部OSS链接，需要将以下OSS域名加入网络访问白名单。

## OSS域名列表

### 北京地域
```
dashscope-result-bj.oss-cn-beijing.aliyuncs.com
```

### 杭州地域
```
dashscope-result-hz.oss-cn-hangzhou.aliyuncs.com
```

### 上海地域
```
dashscope-result-sh.oss-cn-shanghai.aliyuncs.com
```

### 乌兰察布地域
```
dashscope-result-wlcb.oss-cn-wulanchabu.aliyuncs.com
dashscope-result-wlcb-acdr-1.oss-cn-wulanchabu-acdr-1.aliyuncs.com
```

### 张家口地域
```
dashscope-result-zjk.oss-cn-zhangjiakou.aliyuncs.com
```

### 深圳地域
```
dashscope-result-sz.oss-cn-shenzhen.aliyuncs.com
```

### 河源地域
```
dashscope-result-hy.oss-cn-heyuan.aliyuncs.com
```

### 成都地域
```
dashscope-result-cd.oss-cn-chengdu.aliyuncs.com
```

### 广州地域
```
dashscope-result-gz.oss-cn-guangzhou.aliyuncs.com
```

## 配置方法

### 方法1：防火墙白名单
如果您使用防火墙或安全组，请添加以上域名到出站规则白名单。

### 方法2：代理服务器
如果您使用代理服务器，请配置允许访问以上域名。

### 方法3：企业网络策略
如果您在企业网络环境中，请联系网络管理员将以上域名加入白名单。

## 验证方法

### 测试连接
使用以下命令测试是否能访问OSS域名：
```bash
# 测试北京地域
curl -I https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com

# 测试杭州地域
curl -I https://dashscope-result-hz.oss-cn-hangzhou.aliyuncs.com
```

### 预期结果
- 成功：返回HTTP 200或403（403表示域名可访问，但需要授权）
- 失败：连接超时或拒绝连接

## 常见问题

### Q1: 为什么需要配置白名单？
A: 阿里云百炼生成的图片存储在OSS上，如果您的网络环境有安全策略限制外部访问，需要将OSS域名加入白名单才能正常加载图片。

### Q2: 需要配置所有地域的域名吗？
A: 建议配置所有地域的域名，因为阿里云可能会根据负载情况将图片存储在不同地域。

### Q3: 配置后仍然无法访问怎么办？
A: 
1. 检查防火墙规则是否正确配置
2. 检查代理服务器设置
3. 使用curl命令测试连接
4. 联系网络管理员确认配置

### Q4: Supabase Edge Function需要配置吗？
A: Supabase Edge Function运行在云端，通常不需要额外配置。如果遇到问题，请联系Supabase支持。

## 技术说明

### 图片URL格式
阿里云百炼返回的图片URL格式示例：
```
https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/xxx/xxx.png
```

### 图片有效期
- 默认有效期：24小时
- 过期后：图片链接将失效，需要重新生成

### 图片存储
- 存储位置：阿里云OSS
- 访问方式：公网HTTPS
- 安全性：URL包含签名参数，防止未授权访问

## 参考文档
- 阿里云百炼官方文档：https://bailian.console.aliyun.com/
- 阿里云OSS文档：https://help.aliyun.com/product/31815.html

---

**更新时间**：2026-01-18
**适用版本**：图片工厂 v1.0
