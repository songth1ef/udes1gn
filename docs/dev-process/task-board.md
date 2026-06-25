# 任务工作台 — UDES1GN 初始版

> 全部任务按模块分类的总表（类 kanban）。状态图例：⬜ 待办 · 🟦 进行中 · ✅ 完成 · 🟥 阻塞 · ⏸ 本期不做
> 优先级：**P0** = 今晚纵切链路必须 · **P1** = 初始版应有 · **P2** = 第二批
> 估时按 AI 编码速度。最后更新：2026-06-25（MVP 初版构建完成收尾）
>
> **里程碑**：全量 MVP 初版完成 — 认证 / 提案 / 投票 / 评论 / 状态机 / admin / 中英 i18n / 响应式全链路可用，`tsc`+`build`+E2E(3/3) 全绿。遗留集中在 DevOps（Docker/CI/CD/部署，多为待 SSH/域名外部依赖）与 Prettier/commitlint、单测框架（H1）。详见 progress-log。

---

## A. 项目基建 / Scaffold & Infra

| ID | 任务 | 优先级 | 估时 | 状态 |
|----|------|--------|------|------|
| A1 | Next.js 15 + TypeScript 初始化（App Router、standalone 输出） | P0 | 10m | ✅ |
| A2 | TailwindCSS 配置 + 设计 token（沿用 v1 配色/圆角/Inter/深色模式） | P0 | 20m | ✅ |
| A3 | ESLint + Prettier + commitlint | P1 | 10m | 🟦 ESLint 已配；Prettier/commitlint 未配（遗留） |
| A4 | 全局 css（仅配色 CSS 变量 + 深色模式 + keyframes，`app/globals.css`） | P0 | 10m | ✅ |
| A5 | `.env` 装载、config（locales 等） | P0 | 10m | ✅ |

## B. 数据层 / DB & Prisma

| ID | 任务 | 优先级 | 估时 | 状态 |
|----|------|--------|------|------|
| B1 | Prisma 接入 + `lib/db.ts` 单例 | P0 | 10m | ✅ |
| B2 | schema：User / Proposal / Vote / Comment / Report | P0 | 20m | ✅ |
| B3 | schema：Locale / Translation（i18n） | P0 | 10m | ✅ |
| B4 | 初始迁移 migrate | P0 | 10m | ✅ |
| B5 | seed：默认 admin、中英 Locale、UI 文案、若干示例提案 | P0 | 20m | ✅ |

## C. 认证 / Auth

| ID | 任务 | 优先级 | 估时 | 状态 |
|----|------|--------|------|------|
| C1 | Auth.js (NextAuth v5) Credentials 配置 + session | P0 | 20m | ✅ |
| C2 | 注册（邮箱+密码，bcrypt 哈希，校验） | P0 | 20m | ✅ |
| C3 | 登录 / 登出 | P0 | 15m | ✅ |
| C4 | 路由保护 + action 内权限校验（USER/ADMIN） | P0 | 15m | ✅ |
| C5 | 忘记密码（参考 v1 forgetPS） | P2 | — | ⏸ |

## D. 后端逻辑 / Server Actions

| ID | 任务 | 优先级 | 估时 | 状态 |
|----|------|--------|------|------|
| D1 | 提案 CRUD（建/读列表/读详情；编辑删除受限） | P0 | 25m | ✅ |
| D2 | 投票 toggle（1 人 1 票，唯一约束） | P0 | 15m | ✅ |
| D3 | 评论 创建/读取 | P1 | 15m | ✅ |
| D4 | 状态机 推进（仅 ADMIN） | P1 | 15m | ✅ |
| D5 | 举报 + 审核（隐藏内容/封禁用户） | P2 | — | ✅ |
| D6 | i18n 文案加载器（DB → 缓存 → next-intl，带兜底） | P0 | 25m | ✅ |

## E. 前端 UI / Frontend（全部需 PC + 手机响应式）

| ID | 任务 | 优先级 | 估时 | 状态 |
|----|------|--------|------|------|
| E1 | 根布局 + 顶部 Nav（logo、语言切换、登录入口）响应式 | P0 | 25m | ✅ |
| E2 | 表单组件：Input / Button / MessageBox（移植 v1 设计、tailwind 重写）（+StatusBadge） | P0 | 25m | ✅ |
| E3 | 首页（slogan「这块地盘由你决定」+ 提案入口） | P0 | 15m | ✅ |
| E4 | 提案列表页（按票数排序、分类、响应式卡片） | P0 | 25m | ✅ |
| E5 | 提案详情页（正文 + 投票按钮 + 状态徽章 + 评论区） | P0 | 30m | ✅ |
| E6 | 发布提案页（表单） | P0 | 20m | ✅ |
| E7 | 登录 / 注册 / 忘记密码 页（响应式，移植 v1 视觉） | P0 | 25m | ✅ |
| E8 | 用户主页 user/[id]（贡献记录） | P1 | 20m | ✅ |
| E9 | 响应式总检查（手机/平板/PC 断点过一遍） | P0 | 20m | ✅ 由 H3 E2E 双 viewport 覆盖 |

## F. 多语言 / i18n

| ID | 任务 | 优先级 | 估时 | 状态 |
|----|------|--------|------|------|
| F1 | `[locale]` 路由 + middleware | P0 | 20m | ✅ |
| F2 | 语言切换组件 | P0 | 15m | ✅ |
| F3 | 中英文案 seed + 所有 UI 文案走 key | P0 | 25m | ✅ |
| F4 | 后台语言管理（增删/启停/默认） | P2 | — | ✅ |
| F5 | 后台文案编辑（按 namespace，缺翻译高亮） | P2 | — | ✅ |

## G. 管理后台 / Admin

| ID | 任务 | 优先级 | 估时 | 状态 |
|----|------|--------|------|------|
| G1 | admin 布局 + 鉴权 | P1 | 15m | ✅ |
| G2 | 提案状态管理 | P1 | 20m | ✅ |
| G3 | 审核队列（举报处理/隐藏/封禁） | P2 | — | ✅ |
| G4 | i18n 管理界面（接 F4/F5） | P2 | — | ✅ |

## H. 测试 / Testing

| ID | 任务 | 优先级 | 估时 | 状态 |
|----|------|--------|------|------|
| H1 | 关键逻辑单元/集成测试（投票唯一性、权限、i18n 兜底） | P1 | 30m | ⬜ 遗留（无单测框架；逻辑由 H2 E2E 间接覆盖） |
| H2 | Playwright E2E：注册→登录→发提案→投票→切语言 全链路 | P0 | 40m | ✅ |
| H3 | 响应式视觉 E2E（手机/PC viewport 截图） | P1 | 20m | ✅ |

## I. 运维 / 部署 DevOps

| ID | 任务 | 优先级 | 估时 | 状态 |
|----|------|--------|------|------|
| I1 | Dockerfile（standalone 多阶段） | P0 | 15m | ⬜ 遗留（未创建） |
| I2 | docker-compose（app + postgres + caddy） | P0 | 15m | ⬜ 遗留（未创建） |
| I3 | Caddyfile（真实域名 + 自动 HTTPS） | P0 | 5m | 🟥 待域名 |
| I4 | GitHub Actions CI（lint + build + test） | P1 | 20m | ⬜ 遗留（未创建） |
| I5 | CD：push → 香港服务器自动部署 | P0 | 30m | 🟥 待 SSH 访问 |
| I6 | 首次生产部署 + migrate deploy + 验证可访问 | P0 | 20m | 🟥 待 I5 |

## J. 文档 / 开发过程

| ID | 任务 | 优先级 | 估时 | 状态 |
|----|------|--------|------|------|
| J1 | 开发过程文档目录（本目录） | P0 | — | ✅ |
| J2 | 进度日志持续更新（progress-log.md） | P0 | 全程 | ✅ MVP 阶段收尾 |
| J3 | 自审记录（review-log.md） | P0 | 全程 | ✅ MVP 阶段收尾 |
| J4 | 修复记录（fix-log.md） | P0 | 全程 | ✅ MVP 阶段收尾 |
| J5 | 测试记录（test-log.md） | P1 | 全程 | ✅ MVP 阶段收尾 |

---

## 今晚纵切链路（P0 子集）

A1–A5 → B1–B5 → C1–C4 → D1/D2/D6 → E1–E7/E9 → F1–F3 → H2 → I1/I2 →（部署待 I3/I5 解锁）

> 目标产出：一个响应式、中英双语、可注册登录发提案投票的真实站点，自审+E2E 通过，commit+push。部署视 SSH 访问情况决定今晚上线还是早上一键上。
