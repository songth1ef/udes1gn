# 编码规范 — UDES1GN

## 技术栈基线

Next.js 15 App Router · TypeScript · Prisma · PostgreSQL · Auth.js v5 · **TailwindCSS（UI，唯一样式方案）**

## 样式规则

- **全面 tailwindcss**：所有布局/间距/排版用 tailwind 原生类。**禁止**引入 styled-components，**禁止**沿用 v1 自制 flex 工具类（`flexCC`/`flexB`/`absoC` 等，对照表见 `v1-reference.md`）。
- 全局 scss 只保留一处：配色 CSS 变量（`--ud-blue` 等）+ 深色模式 + 必要的 `@keyframes`。组件级不写 scss。
- 设计 token（配色/圆角/字体）沿用 v1 基线，配置进 `tailwind.config` 的 `theme.extend`，业务里用语义类名（如 `text-ud-blue`）而非硬编码色值。

## 目录结构

```
app/          # 路由与页面（App Router）
  (auth)/     # 登录注册分组
  proposals/  # 提案列表/详情/新建
  admin/      # 管理后台
  api/        # route handlers（仅 Auth.js 等必须）
lib/
  actions/    # Server Actions：业务写操作集中于此
  auth.ts     # Auth.js 配置
  db.ts       # Prisma client 单例
prisma/       # schema + migrations
docs/         # 本协作文档集
```

## 命名

- 文件/目录：kebab-case（`new-proposal`），React 组件文件 PascalCase。
- Server Action：动词开头（`createProposal`、`toggleVote`、`updateStatus`）。
- Prisma 模型：PascalCase 单数（`Proposal`），字段 camelCase。

## 数据访问

- 所有写操作走 `lib/actions/` 下的 Server Action，不在组件里直接调 Prisma。
- Prisma client 用 `lib/db.ts` 单例，避免 dev 热重载连接泄漏。
- 涉及权限的操作（改状态、审核、封禁）在 action 内校验 `session.user.role === 'ADMIN'`，不靠前端隐藏。

## 文案与 i18n

- **首版即多语言（中 + 英），DB 驱动 + 后台可管理**。所有用户可见界面文案**必须走 translation key**（`namespace.key`），严禁硬编码任何语言的字面量。
- 新增文案 = 在对应 namespace 下加 key，并补齐**所有已启用语言**的翻译（缺失会回退默认语言并在后台高亮）。
- 仓库内只维护一份**默认语言 seed**（兜底）；其余翻译以 DB 为准、后台编辑。
- **界面文案** 与 **用户内容**（提案/评论正文）两条线分开：后者首版按作者语言单语存储，不强制翻译。
- 完整架构见 [`implementation.md`](./implementation.md) §9。

## Git 规范

- Commit：英文 type/scope + 中文正文。`feat:` / `fix:` / `chore:` / `docs:`。
- 分支：`main` 为发布分支；功能走 `feat/<topic>` 分支 + PR。
- 秘密永不进库（见 `.gitignore` 与 `.env.example`）。

## 文件大小

源码文件 ≥ 1000 行按职责拆分（组件 / hooks / utils / types）。
