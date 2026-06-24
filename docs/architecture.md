# 架构 — UDES1GN 友定

## 总体形态

**单进程全栈**：Next.js（App Router）同时承担前端渲染与后端逻辑（Server Actions / Route Handlers）。初始版**不拆**独立后端服务。

```
浏览器 ──HTTPS──> Caddy（反代/自动证书） ──> Next.js app:3000 ──> PostgreSQL
```

## 选型理由

| 决策 | 选择 | 理由 |
|---|---|---|
| 是否拆前后端 | **不拆**，单 Next.js | 单台服务器、单区域、初始版只为验证有没有人用；双服务（deck 的 NextJS+NestJS）是双倍运维成本。等真有后端复杂度（后台任务/多客户端/复杂权限）再拆 NestJS。 |
| 数据库 | PostgreSQL + Prisma | 关系型贴合提案/投票/评论的强关系；Prisma 类型安全 + 迁移管理。容器内自带，零外部依赖。 |
| 认证 | Auth.js Credentials（邮箱密码） | 单区域不需要 OAuth；最省事。**注意与 v1 分歧**：v1 用 localStorage token + 独立后端，v2 改服务端 session（更安全），v1 认证逻辑不续用。见 [`v1-reference.md`](./v1-reference.md)。 |
| 部署 | Docker Compose（app+db+caddy） | 一台机一条命令起全栈；`restart: always` 替代 systemd/pm2。 |
| HTTPS | Caddy | 自动签 Let's Encrypt，省掉手配证书。 |

## 数据流（写操作）

```
用户操作 → React Server/Client Component
        → lib/actions/<action>（Server Action，含权限校验）
        → Prisma → PostgreSQL
        → revalidatePath 刷新视图
```
写操作集中在 `lib/actions/`，组件不直接碰 Prisma。

## 模块边界

- `app/` 只管路由与展示，业务逻辑下沉到 `lib/actions/`。
- 权限校验在 action 层，不依赖前端隐藏按钮。
- `lib/db.ts` 是唯一 Prisma 入口（单例）。

## UI / 设计

沿用 v1（用户喜欢的 Apple 风极简白）的设计基线——配色变量、12px 圆角、Inter 字体、深色模式、slogan「这块地盘由你决定」。完整规范见 [`v1-reference.md`](./v1-reference.md) §设计基线。**样式全面 tailwindcss**，摈弃 v1 自制 flex 工具类，仅保留极少量全局 scss 承载配色变量与深色模式。

## 演进方向（不在初始版做）

- 拆出 NestJS 后端（当出现后台任务、定时审核、多客户端时）。
- 加通知服务、声誉系统、国际化分区。
- CI/CD：GitHub Actions push → SSH 自动发布。
