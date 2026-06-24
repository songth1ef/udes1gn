# UDES1GN 友定 — 初始版实施方案

> 用户共创、共享设计和决策的社区平台。
> 本文档 = 初始版（MVP）的可执行实施方案。目标：在一台香港裸机服务器上跑通一个可对外访问的最小内核，验证"有没有人来用"。
> 起草日：2026-06-24 · 来源念头：2023-08-15 · 作者：@songth1ef

---

## 0. 一句话范围

**一个带状态机的提案投票板 + 最薄的账号与人工审核**，单区域、单服务器、单进程全栈部署。

首版上 **中英双语**，但 i18n 文案存数据库 + 后台可管理，数据结构从一开始就为**任意语言扩展 + 用户定制化多语言**留好（对标 x.com 量级，见 §9）。

明确**不做**（终态设想，初始版砍掉）：中国版/国际版**分区/法律并集**（注意：多语言 ≠ 多区域，这里砍的是后者）、加权投票/声誉/代币、OAuth、通知系统、开源协作流程、"用户治理平台本身"的元机制。

---

## 1. 核心功能（初始版只做这些）

| # | 功能 | 说明 |
|---|------|------|
| 1 | 提案 | 标题 / 描述 / 分类，列表（按赞成数排序）+ 详情页 |
| 2 | 投票 | 1 人 1 票，可取消；赞成数即排序权重 |
| 3 | 评论 | 提案详情页下盖楼 |
| 4 | 状态机 | `收集中 → 已采纳 → 开发中 → 已上线 / 已否决`，仅管理员可改 |
| 5 | 认证 | 邮箱注册/登录（Auth.js Credentials） |
| 6 | 审核 | 举报 + 管理员隐藏内容 / 封禁用户（全人工） |
| 7 | 多语言 | 中英双语；UI 文案 DB 驱动，**后台可增删语言 + 编辑文案**（见 §9） |

> 命门是 **#4 状态机**：它让"投票真的改变了东西"可见，是友定区别于普通"许愿池/论坛"的唯一东西。没有它，用户投完票石沉大海，一周走光。

---

## 2. 技术栈（贴合单台裸机）

| 层 | 选型 | 理由 |
|---|------|------|
| 全栈 | **Next.js 15（App Router + Server Actions）** | 一个进程搞定前后端，用户最熟；初始版不拆 NestJS |
| ORM/DB | **Prisma + PostgreSQL 16** | 容器内自带，零外部依赖 |
| 认证 | **Auth.js (NextAuth v5) Credentials** | 邮箱+密码，最省事；单区域不需要 OAuth |
| 反代/HTTPS | **Caddy 2** | 自动签 Let's Encrypt 证书，省掉手配 |
| 容器编排 | **Docker Compose** | 一台机 `docker compose up -d` 起全栈 |
| 守护 | Docker `restart: always` | 不引入 systemd/pm2 |

> 决策：**初始版不拆前后端**。deck 写的 Next.js + NestJS 是终态；对"验证有没有人用"的初始版，双服务只是双倍运维成本。等真有后端复杂度（后台任务、多客户端、复杂权限）再拆 NestJS。

---

## 3. 数据模型（Prisma schema 草案）

```prisma
enum Role { USER ADMIN }
enum ProposalStatus { COLLECTING ADOPTED IN_PROGRESS SHIPPED REJECTED }
enum ReportTarget { PROPOSAL COMMENT }

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String
  displayName  String
  role         Role       @default(USER)
  bannedAt     DateTime?
  createdAt    DateTime   @default(now())
  proposals    Proposal[]
  votes        Vote[]
  comments     Comment[]
  reports      Report[]
}

model Proposal {
  id        String         @id @default(cuid())
  authorId  String
  author    User           @relation(fields: [authorId], references: [id])
  title     String
  body      String
  category  String
  status    ProposalStatus @default(COLLECTING)
  hiddenAt  DateTime?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  votes     Vote[]
  comments  Comment[]
  @@index([status])
}

model Vote {
  id         String   @id @default(cuid())
  proposalId String
  proposal   Proposal @relation(fields: [proposalId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  createdAt  DateTime @default(now())
  @@unique([proposalId, userId])   // 1 人 1 票
}

model Comment {
  id         String    @id @default(cuid())
  proposalId String
  proposal   Proposal  @relation(fields: [proposalId], references: [id])
  authorId   String
  author     User      @relation(fields: [authorId], references: [id])
  body       String
  hiddenAt   DateTime?
  createdAt  DateTime  @default(now())
}

model Report {
  id         String       @id @default(cuid())
  targetType ReportTarget
  targetId   String
  reporterId String
  reporter   User         @relation(fields: [reporterId], references: [id])
  reason     String
  resolvedAt DateTime?
  createdAt  DateTime     @default(now())
}

// ── i18n：DB 驱动、后台可管理、任意语言可扩展 ──────────────
model Locale {
  code      String   @id              // BCP-47：'zh' / 'en' / 'zh-HK' / 未来任意
  name      String                    // 显示名："中文" / "English"
  enabled   Boolean  @default(true)   // 后台开关，控制前台是否可选
  isDefault Boolean  @default(false)  // 兜底语言（缺翻译时回退到它）
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}

model Translation {
  id         String   @id @default(cuid())
  namespace  String                    // 'common' / 'login' / 'proposal' ...
  key        String                    // 'submit'
  localeCode String                    // 关联 Locale.code
  value      String
  updatedAt  DateTime @updatedAt
  @@unique([namespace, key, localeCode])
  @@index([localeCode])
}
```

> Proposal/Comment 等**用户内容**首版按作者语言单语存储（后续可加 `lang` 字段 + 内容级翻译表）。本期 i18n 只覆盖**界面文案**。详见 §9。

---

## 4. 目录结构

```
udes1gn/
├── app/
│   ├── (auth)/login, register/        # 认证页
│   ├── proposals/
│   │   ├── page.tsx                   # 列表（按票数排序）
│   │   ├── new/page.tsx               # 新建提案
│   │   └── [id]/page.tsx              # 详情：投票 + 评论 + 状态
│   ├── [locale]/                      # 语言段路由：/zh/... /en/...
│   ├── admin/
│   │   ├── (proposals)/               # 改状态/审核/封禁
│   │   └── i18n/                      # 语言管理 + 文案编辑
│   └── api/auth/[...nextauth]/route.ts
├── lib/
│   ├── auth.ts                        # Auth.js 配置
│   ├── db.ts                          # Prisma client 单例
│   ├── i18n/                          # locale 配置 + DB 文案加载（带缓存/兜底）
│   └── actions/                       # Server Actions：提案/投票/评论/审核/i18n
├── prisma/schema.prisma
├── docker-compose.yml
├── Dockerfile
├── Caddyfile
├── .env.example
└── docs/                             # AGENT.md + conventions/domain/architecture/lessons
```

---

## 5. 部署：香港裸机服务器（从零）

> 假设：Ubuntu 22.04/24.04，有 root/sudo SSH，有可解析到本机的域名（记作 `YOUR_DOMAIN`）。

### 5.1 服务器一次性准备

```bash
# 1. 装 Docker + Compose 插件
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # 重新登录生效

# 2. 防火墙只放 22/80/443
sudo ufw allow 22,80,443/tcp && sudo ufw enable

# 3. DNS：把 YOUR_DOMAIN 的 A 记录指向服务器公网 IP（在域名商处操作）
```

### 5.2 容器编排

**docker-compose.yml**
```yaml
services:
  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: udes1gn
    volumes: [pgdata:/var/lib/postgresql/data]

  app:
    build: .
    restart: always
    env_file: .env
    depends_on: [db]
    # 只对内暴露，由 caddy 反代
    expose: ["3000"]

  caddy:
    image: caddy:2
    restart: always
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on: [app]

volumes:
  pgdata:
  caddy_data:
```

**Caddyfile**（自动 HTTPS）
```
YOUR_DOMAIN {
    reverse_proxy app:3000
}
```

**Dockerfile**（Next.js standalone 多阶段构建）
```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json prisma ./
RUN npm ci && npx prisma generate

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
CMD ["node", "server.js"]
```
> `next.config.js` 需设 `output: 'standalone'`。

### 5.3 首次发布

```bash
ssh hk-server
git clone <repo> udes1gn && cd udes1gn
cp .env.example .env          # 填 DB_PASSWORD / NEXTAUTH_SECRET / DATABASE_URL / NEXTAUTH_URL=https://YOUR_DOMAIN
docker compose up -d --build
docker compose exec app npx prisma migrate deploy   # 建表
```
访问 `https://YOUR_DOMAIN`，Caddy 自动签好证书。

### 5.4 日常更新

```bash
git pull && docker compose up -d --build
docker compose exec app npx prisma migrate deploy   # 如有迁移
```
> 跑通后再考虑加 GitHub Actions：push → SSH → pull + compose up，实现自动发布。

---

## 6. 里程碑（按 AI 编码速度估）

| 阶段 | 内容 | 量级 |
|---|---|---|
| M0 | 脚手架：Next.js + Prisma + Auth.js + Docker/Caddy 跑通本地 | 半天 |
| M1 | 提案 CRUD + 列表/详情 | 半天 |
| M2 | 投票 + 评论 + 状态机 | 半天 |
| M3 | 管理后台（改状态/审核/封禁）+ 举报 | 半天 |
| M4 | i18n：`[locale]` 路由 + DB 文案加载 + 中英 seed + 后台语言/文案管理 | 半天~1 天 |
| M5 | HK 服务器首次部署 + 域名 HTTPS | 半天 |
| **合计** | 可对外访问的初始版 | **~3-4 天**（实际编码 by agent） |

> 工时按 agent 实际产出算，非人月。线下环节（DNS 生效等待、域名实名）单列。

---

## 7. 真正的风险（不是技术）

技术几天就能跑通——**这恰恰说明瓶颈不在功能**：

1. **冷启动**：空平台价值为零。上线前必须想清楚"第一批 10 个提案谁来发、为什么有人留下"。
2. **"少数人"是谁**：deck 反复说"为少数人做产品"。这个目标人群没定义清楚之前，提案分类、种子内容、推广都无从下手。**这是上线前唯一必须先答的问题。**

> 建议：M0–M4 可以照搭（成本低、能练手、能 demo），但**别在没定义"少数人"前投入推广**。先把它当一个可展示的作品（portfolio）跑通，符合当前战略主线。

---

## 8. 待你确认 / 待办

- [ ] `YOUR_DOMAIN` 实际域名 + DNS A 记录指向 HK 服务器
- [ ] 服务器系统版本确认（脚本默认 Ubuntu）
- [ ] 目标"少数人"人群定义（决定冷启动与种子提案）
- [ ] 是否现在动手搭 M0 脚手架

---

## 9. 多语言架构（i18n）

> 目标分层：**首版只要中英 + 后台能管语言**，但**数据结构与路由一步到位**，未来加任意语言、乃至用户定制化多语言都不用重构。对标 x.com 这类全球平台的语言能力。

### 9.1 分层（关键：界面文案 vs 用户内容，两条线分开）

| 层 | 首版 | 未来 |
|---|---|---|
| **界面文案**（按钮/菜单/提示） | ✅ 中英，DB 驱动，后台可编辑 + 增删语言 | 任意语言，社区/AI 协作翻译 |
| **用户内容**（提案/评论正文） | 按作者语言单语存储 | 加 `lang` 字段 + 内容级翻译；用户为自己内容配多语言 |

> 首版**只做界面文案这条线**。用户内容的多语言是更重的工程（翻译 UGC、按语言过滤 feed），留 roadmap——但数据模型已为它预留空间。

### 9.2 技术方案

- **路由**：next-intl + `app/[locale]/`，locale 即 `Locale.code`（BCP-47）。新增语言 = 数据库加一行，无需改路由代码。
- **文案存储**：`Translation(namespace, key, localeCode, value)` 存库。仓库内只保留一份**默认语言 seed**（兜底，防 DB 缺失/启动期）。
- **加载**：`lib/i18n` 启动从 DB 拉全量文案 → 内存缓存（带失效）→ 喂给 next-intl 的 `getMessages`。缺某 locale 的 key 时回退 `Locale.isDefault`。
- **后台**：`app/admin/i18n`——① 语言管理（增删/启停/设默认/排序）；② 文案编辑（按 namespace 分组，缺翻译高亮）。
- **缓存失效**：后台改文案后 `revalidateTag('i18n')`，无需重启。

### 9.3 为什么不用纯静态 json（v1 的做法）

v1 用 next-intl 静态 `messages/*.json`——加语言/改文案都要改代码、重新部署，**给不了运营/社区自助管理的能力**。对标 x.com 量级必须 DB 驱动 + 后台可管。代价是首版多约半天～一天工作量（M4），值得。

### 9.4 不在首版做（避免过度工程）

- 用户内容（UGC）的翻译与按语言过滤
- AI 自动翻译、社区众包翻译工作流
- 用户自定义语言包的提交/审核流程

> 这些都靠 §9.1 的分层数据结构支撑，需求来了再加，不提前实现。
