# UDES1GN 友定

> 一个用户共创、共享设计和决策的社区平台。
> A community platform where users co-create and share in design and decision-making.

用户不只是内容的消费者，更是**产品的设计者**——提需求、为功能投票、参与决策。每条提案的命运（采纳 / 开发中 / 已上线 / 否决）公开可见，让"投票真的改变了东西"。

## 核心功能（初始版）

- **提案** — 任何人提需求/设计，结构化字段
- **投票** — 1 人 1 票，赞成数决定排序
- **评论** — 提案下讨论
- **状态机** — `收集中 → 已采纳 → 开发中 → 已上线 / 已否决`，决策公开可追
- **认证** — 邮箱注册登录
- **审核** — 举报 + 人工隐藏/封禁

完整范围与路线见 [`docs/implementation.md`](./docs/implementation.md)。

## 技术栈

Next.js 15（App Router）· PostgreSQL + Prisma · Auth.js · Docker Compose · Caddy（自动 HTTPS）

## 自托管（一键起全栈）

需要：一台装了 Docker 的 Linux 服务器 + 一个解析到该机的域名。

```bash
git clone https://github.com/songth1ef/udes1gn && cd udes1gn
cp .env.example .env          # 填好密钥、域名、数据库密码
docker compose up -d --build
docker compose exec app npx prisma migrate deploy   # 建表
```

把 `Caddyfile` 里的 `YOUR_DOMAIN` 换成你的域名，访问即自动签发 HTTPS。详细部署步骤见 [`docs/implementation.md`](./docs/implementation.md) §5。

## 本地开发

```bash
npm install
cp .env.example .env.local    # DATABASE_URL 指向本地 postgres，NEXTAUTH_URL=http://localhost:3000
npx prisma migrate dev
npm run dev
```

## 协作文档

新贡献者从这里入手：

- [`AGENT.md`](./AGENT.md) — AI agent 行为规则与项目入口
- [`docs/conventions.md`](./docs/conventions.md) — 编码规范
- [`docs/domain.md`](./docs/domain.md) — 业务概念与术语
- [`docs/architecture.md`](./docs/architecture.md) — 架构与选型理由
- [`docs/lessons.md`](./docs/lessons.md) — 踩坑与已验证决策
- [`docs/implementation.md`](./docs/implementation.md) — 初始版完整实施方案
- [`docs/v1-reference.md`](./docs/v1-reference.md) — 旧版 v1 参考与设计基线

## License

[AGPL-3.0](./LICENSE) — 任何人可自由使用、修改、自托管；若改动后对外提供网络服务，须一并开源改动。
