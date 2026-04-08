# 自建后端落地说明

## 当前状态

这次改造先完成了第一阶段：

- 新增 `server/` 自建后端目录
- 新增首批 HTTP API
- 前端首批接口支持切到 `VITE_API_BASE_URL`

首批迁移接口：

- `trending-lists`
- `vertical-trending`
- `search-xiaohongshu-notes`
- `parse-xiaohongshu-note`
- `ai-recreate-content`
- `optimize-xiaohongshu-copy`
- `generate-xiaohongshu-copy`
- `agent-chat`
- `xhs-auth`

仍然还在 Supabase 的内容：

- 数据库 CRUD
- RPC 积分系统
- Storage 文件上传
- 数字人相关接口
- 支付回调

## 本地启动

### 1. 启动后端

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 2. 前端环境变量

根目录 `.env` 增加：

```env
VITE_API_BASE_URL=http://127.0.0.1:3000
```

如果没有这个变量，前端会继续回退到原来的 Supabase URL。

## 火山引擎服务器部署

### 1. 服务器准备

建议系统：`Ubuntu 22.04`

安装 Docker：

```bash
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. 上传项目

把整个仓库上传到服务器，例如：

```bash
/opt/miaoda/app
```

### 3. 配置后端环境变量

```bash
cd /opt/miaoda/app/server
cp .env.example .env
```

然后编辑 `.env`：

```env
PORT=3000
CORS_ORIGIN=http://你的前端地址

ARK_API_KEY=你的火山方舟 Key
INTEGRATIONS_API_KEY=你的联网搜索 Key
XIAOHONGSHU_COOKIE=你的小红书 cookie
XIAOHONGSHU_API_KEY=你的小红书 api key
XHS_APP_KEY=你的小红书开放平台 app key
XHS_APP_SECRET=你的小红书开放平台 app secret
```

### 4. 启动容器

在项目根目录执行：

```bash
docker compose -f docker-compose.self-hosted.yml up -d --build
```

### 5. 验证后端

```bash
curl http://127.0.0.1:3000/health
```

### 6. Nginx 反代

建议正式环境走 Nginx：

- `/` 指向前端静态资源
- `/api/` 转发到 `127.0.0.1:3000`

示例：

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 50m;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
    }
}
```

## 下一阶段建议

下一步应该迁这几块：

1. `profiles/products` 改成走你自己的 Postgres
2. 积分和订单 RPC 改成后端 service
3. Storage 上传改成本机磁盘或 S3/R2
4. 删除前端对 `supabase.from/rpc/storage` 的直接依赖
