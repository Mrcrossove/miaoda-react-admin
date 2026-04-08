# Repository Guidelines

## Project Structure & Module Organization
This repo is a React + TypeScript + Vite app with Supabase and Android integration.

- `src/`: frontend source code (`pages/`, `components/`, `hooks/`, `contexts/`, `db/`, `services/`, `utils/`).
- `public/`: static assets (logos, error images, favicon).
- `supabase/functions/`: Edge Functions (one function per folder, usually kebab-case names).
- `supabase/migrations/`: SQL migrations in numbered files (`00001_...sql`).
- `android/`: Capacitor/Android native integration files.
- `docs/`: product and project documentation (`docs/prd.md`).

## Supabase Edge Functions Deployment Status

### ✅ Deployed Functions (17 total)
1. `agent-chat` - AI 智能体对话
2. `generate-xiaohongshu-copy` - 生成小红书文案
3. `optimize-xiaohongshu-copy` - 优化小红书文案
4. `parse-xiaohongshu-note` - 解析小红书笔记链接
5. `search-xiaohongshu-notes` - 搜索小红书笔记
6. `xhs-auth` - 小红书认证
7. `ai-recreate-content` - AI 二创文案（已移除 API Key 依赖）
8. `generate-sora-video` - 生成 SORA 视频
9. `query-sora-video` - 查询视频生成状态
10. `create_credit_order` - 创建灵感值订单
11. `trending-lists` - 获取热榜列表
12. `generate-image-factory-content` - 图片工厂内容生成
13. `generate-image-factory-caption` - 图片工厂标题生成（已移除 API Key 依赖）
14. `generate-image-dashscope` - 通义万相图片生成
15. `generate-image-prompt` - 图片提示词生成
16. `generate-xiaohongshu-content` - 小红书完整内容生成
17. `vertical-trending` - 垂直领域热榜

### ⏳ Pending Deployment (2 total)
These functions are not yet deployed to production:

1. **`coze-workflow`** - Coze AI 工作流调用
   - Purpose: Integrate with Coze AI workflows
   - Required env vars: `COZE_API_TOKEN`
   - Deploy command:
   ```bash
   npx supabase functions deploy coze-workflow --project-ref qbrxkgqhsfjgfatykyzv
   ```

2. **`generate-xiaohongshu-content-dashscope`** - 使用通义千问生成小红书内容
   - Purpose: Generate Xiaohongshu content using Alibaba DashScope (Qwen)
   - Required env vars: `DASHSCOPE_API_KEY`
   - Deploy command:
   ```bash
   npx supabase functions deploy generate-xiaohongshu-content-dashscope --project-ref qbrxkgqhsfjgfatykyzv
   ```

### Environment Variables Required

Configure these in Supabase Dashboard → Edge Functions → Secrets:

| Variable | Purpose | Required For |
|----------|---------|--------------|
| `XIAOHONGSHU_COOKIE` | Xiaohongshu API authentication | `search-xiaohongshu-notes`, `parse-xiaohongshu-note` |
| `XIAOHONGSHU_API_KEY` | Xiaohongshu API key | `search-xiaohongshu-notes`, `parse-xiaohongshu-note` |
| `ARK_API_KEY` | Doubao/ByteDance LLM API | `agent-chat` |
| `DASHSCOPE_API_KEY` | Alibaba DashScope (Qwen/Wanxiang) | `generate-xiaohongshu-content-dashscope`, `generate-image-dashscope` |
| `SORA_API_KEY` | SORA video generation | `generate-sora-video`, `query-sora-video` |

### 🗑️ Deleted Functions
- `image-to-image-submit` - 图生图任务提交（已删除）
- `image-to-image-query` - 图生图任务查询（已删除）

## Build, Test, and Development Commands
Use Node 20+ and npm 10+ (or pnpm, since `pnpm-lock.yaml` is present).

- `npm install`: install dependencies.
- `npm run lint`: primary quality gate (TypeScript check + Biome + ast-grep).
- `npx vite --host 127.0.0.1`: run local dev server when needed.

Note: `npm run dev` and `npm run build` are intentionally disabled in `package.json`; do not rely on them.

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`/`.tsx`) with React 18.
- Indentation: 2 spaces; keep imports and JSX readable and grouped logically.
- Components/pages: `PascalCase` file names (for example, `HomePage.tsx`, `RouteGuard.tsx`).
- Utilities: `camelCase` names (for example, `promptGenerator.ts`).
- Supabase function folders: `kebab-case` (for example, `generate-xiaohongshu-content`).
- Linting: Biome (`biome.json`) plus `tsgo` and `ast-grep` through `npm run lint`.

## Testing Guidelines
There is no dedicated unit-test framework configured yet. Current validation is:

- Run `npm run lint` before every commit.
- Perform targeted manual checks for changed flows (login, content generation, publish flow, etc.).
- Follow existing test docs when relevant (for example `TEST_INSTRUCTIONS.md`, `FINAL_TEST_GUIDE.md`).

When adding automated tests later, place `*.test.ts(x)` or `*.spec.ts(x)` near related source files.

## Commit & Pull Request Guidelines
Recent history shows short prefixed commits (for example, `docs: ...`) and issue-linked fixes.

- Prefer format: `type: concise summary` (`feat`, `fix`, `docs`, `refactor`, `chore`).
- Keep one logical change per commit; include migration and code updates together when coupled.
- PRs should include: purpose, impacted paths, lint result, linked issue/ticket, and screenshots for UI changes.
- For database changes, mention migration file IDs and rollback considerations in the PR description.
