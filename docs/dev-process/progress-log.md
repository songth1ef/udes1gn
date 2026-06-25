# 进度日志 / Progress Log

> 时间线，最新在最上。每完成一块追加一条。

## 2026-06-25 — 🎉 全量 MVP 初版构建完成（J 收尾提交）

- **状态门禁复跑全绿**（收尾前如实验证，非引用历史）：
  - `npx tsc --noEmit` → EXIT 0（0 类型错误）。
  - `npm run build`（`next build`，`output:'standalone'`）→ EXIT 0，全部 26 路由预渲染/编译成功，middleware 62.4 kB。
  - `npx playwright test` → **3 passed / 0 failed / 0 skipped**（main-flow 全链路 + responsive 双 viewport 390×844 / 1440×900），用时 ~2.9s。
- **本期交付范围（已可用）**：邮箱+密码认证（Auth.js v5 Credentials，bcrypt，服务端 session）/ 提案 CRUD / 投票 toggle（1 人 1 票唯一约束）/ 评论 / 提案状态机（仅 ADMIN 推进）/ 举报+审核（隐藏内容/封禁用户）/ 管理后台（提案状态·审核队列·用户·i18n 管理）/ 中英双语 i18n（DB 驱动 + seed 兜底 + 缺 key 回退默认语言）/ 全站 PC+手机响应式（TailwindCSS，沿用 v1 Apple 风极简白 + 深色模式）。
- **task-board.md 终态回写**：A1/A2/A4/A5、E9、F1 标 ✅（构建/E2E 实证）；A3 🟦（仅 ESLint，缺 Prettier/commitlint）；H1 ⬜、I1/I2/I4 ⬜ 标注「遗留·未创建」；I3/I5/I6 🟥（待域名/SSH）；J2–J5 ✅。

### admin 默认账号
- 邮箱 `admin@udes1gn.local` / 密码 `admin12345`（role=ADMIN，seed 注入，bcrypt 哈希）。**生产部署前务必改密**。

### 本地启动方式
1. 依赖：`npm install`（Node 22，已含 node_modules，本仓库忽略不入库）。
2. 环境：`.env` / `.env.local` 已就绪（`DATABASE_URL=postgresql://3th@localhost:5432/udes1gn`、`NEXTAUTH_SECRET`），均被 .gitignore 忽略、不入库。
3. DB：`npx prisma migrate dev`（首次）+ `npm run db:seed`（幂等 upsert：admin / zh·en Locale / UI 文案 / 示例提案）。
4. 开发态：`npm run dev` → http://localhost:3000（自动重定向到 `/zh`）。
5. 生产态：`npm run build` 后**用 `node .next/standalone/server.js` 启动**（standalone 输出），而非 `npm run start`（见遗留 #1）。

### 已知遗留问题清单
1. **`package.json` 的 `start` 脚本仍是 `next start`**，与 `output:'standalone'` 冲突，启动时 next 会告警「does not work with output: standalone」。正确本地/生产启动应为 `node .next/standalone/server.js`（需一并 copy `public/` 与 `.next/static/` 到 standalone 目录）。E2E 的 webServer 当前借 `next start` 兜底仍可服务，但属临时。建议后续改 start 脚本 + 部署脚本。
2. **DevOps 全缺（I 段）**：无 Dockerfile（I1）、docker-compose（I2）、Caddyfile（I3，待真实域名）、GitHub Actions CI（I4）、CD/首次生产部署（I5/I6，待香港服务器 SSH 访问）。本地可跑，尚未上线。
3. **A3 未完整**：仅有 `.eslintrc.json`，未配 Prettier 与 commitlint。
4. **H1 单元/集成测试缺位**：无单测框架（vitest/jest）；投票唯一性、权限、i18n 兜底等关键逻辑目前仅由 H2 E2E 间接覆盖。
5. **根 `app/layout.tsx` metadata 中文硬编码**（review-log 标 🟡）：应改 `generateMetadata` + i18n，当前为唯一文案硬编码点。
6. **C5 忘记密码**为 UI-only（`forgetPS` 页存在但后端重置 action 未实现，本期 ⏸）。
7. 注册表单字段级错误映射偏粗（review-log 🔵），不影响主流程。

---

## 2026-06-25

- **H 测试完成 H2 主链路 + H3 响应式（Playwright E2E）**。引入 `@playwright/test` + chromium，`playwright.config.ts`（webServer=`npm run start`，单 worker 串行，list+json reporter）。`e2e/main-flow.spec.ts` 覆盖 **注册→登录→发提案→列表看到→进详情→投票（toggle，aria-pressed+文案断言）→切中英（URL+Nav+投票文案，登录态/已投态跨语言保持）→登出** 全链路；`e2e/responsive.spec.ts` 在 **手机 390×844 与 PC 1440×900** 两 viewport 下对首页/列表/详情做「无横向溢出 + 关键锚点可见 + 导航形态正确」判定并截图（`e2e/screenshots/` 6 张）。`npm run build` 后 `npm run start` 跑测：**3 用例全通过（0 失败 / 0 跳过）**，DB 实际新增 E2E 提案佐证链路真实执行。结果写入 test-log.md。
  - **顺带修复 1 个 high 应用缺陷（middleware 鉴权）**：`middleware.ts` 的 `getToken` 与 NextAuth v5 (Auth.js beta.31) 发码三处失配（cookie 名 `authjs.session-token` vs v4 旧名、JWE `salt` 需显式传、`__Secure-` 前缀应按实际协议而非 `NODE_ENV` 判定），导致已登录用户访问 `/proposals/new`、`/admin/*` 被误判未登录 307 跳登录，卡死发提案步骤。改为显式 `cookieName`+`salt`，并按 `x-forwarded-proto`/`req.nextUrl.protocol` 判定 https。curl 验证：带 session→200、匿名→307。E2E 随之转绿。详见 test-log。

- **自审修复：toggleVote 取消路径幂等（high）**。`lib/actions/vote.ts` 取消投票由「`findUnique` 取 id + 按 id `delete`」改为按唯一复合键 `proposalId_userId` 直接 `delete`，并 `try/catch` 捕获 P2025 视为「已取消」(`voted=false`)，与投票路径 P2002→`voted=true` 对称，消除并发双取消时 P2025 冒泡为未处理异常。`tsc --noEmit` + `npm run build` 均通过。详见 fix-log。

- **i18n 维度自审完成（review-log.md）**。全量界面文案核查：`app/`+`components/` JSX 文本位与文本属性零硬编码（唯一例外 `app/layout.tsx` metadata 中文硬编码，🟡）；seed zh/en 双语逐 key 逐 locale 无缺漏；脚本交叉核对所有 `t('key')`（含动态状态枚举 key / errorKey 映射）均存在于 seed，无缺 key；`loadMessages` 默认语言回退链 + 后台缺翻译高亮完整。1 🟡（根 metadata 应走 `generateMetadata`+i18n）+ 1 🔵（注册表单字段错误映射偏粗）。详见 review-log。

- **构建门禁（第 1/4 轮）通过**。`npx tsc --noEmit` 0 错误；`prisma generate` 成功；`npm run build` 成功编译并预渲染全部 26 个页面（含 `[locale]` 下首页/提案/认证/admin 5 路由 ×2 locale + 动态 `proposals/[id]`、`user/[id]`、`api/auth/[...nextauth]`），middleware 62.4 kB。本轮代码已满足类型与构建门禁，无需修复即 green。

- **G 管理后台完成 G1-G4（+ F4/F5 接入）**。`app/[locale]/admin/` 全部落地，全 TailwindCSS、PC+手机响应式（sm 起侧栏 / 移动横向标签条）、文案全走新 `admin` namespace key，零硬编码。三层鉴权纵深防御：middleware（`/admin/*` 需登录→未登录 307 跳 login 带 callbackUrl，已验证）+ 布局层（登录但非 ADMIN→`notFound()`）+ action 层（每个写操作 `requireAdmin()`）。
  - **G1 布局+鉴权** `admin/layout.tsx`：`auth()` 校验 `role==='ADMIN'`，否则 `notFound()`；`admin-nav.tsx`（client，`usePathname` 高亮当前段）= 概览/提案状态/审核队列/用户/多语言 5 入口 + 返回站点。
  - **G2 提案状态管理** `admin/proposals/page.tsx` + `status-controls.tsx`（client）：列全部提案（含隐藏，`listProposalsForAdmin`），按状态机合法迁移（与 `proposal.ts` ALLOWED_TRANSITIONS 对齐）渲染「推进到 X」按钮，终态标记；隐藏/取消隐藏切换（`hideContent`）。卡片堆叠式响应式。
  - **G3 审核队列 + 用户** `admin/review/page.tsx` + `review-actions.tsx`：`listReportQueue` 聚合未决举报（批量解析被举报提案/评论摘要、当前隐藏态、作者+角色、跳转锚点，避免 N+1），逐条隐藏/取消隐藏/忽略（`hideContent(false)` resolve）/封禁作者（`banUser`，ADMIN 禁用）。`admin/users/page.tsx` + `ban-control.tsx`：用户列表（`listUsersForAdmin`）封禁/解封。
  - **G4 i18n 管理（接 F4/F5）** `admin/i18n/page.tsx` + `locale-manager.tsx` + `translation-editor.tsx`：① 语言增删/启停/设默认/排序（`createLocale`/`toggleLocale`/`setDefaultLocale`/`deleteLocale`，默认语言不可停用/删除，事务保证唯一默认）；② 按 `?ns=` 分组编辑文案（`upsertTranslation`），**缺翻译红边高亮 + missing 徽章**（implementation.md §9.2）。每个写操作 `revalidateTag('i18n')` 使前台缓存失效、无需重启。新 `lib/actions/i18n.ts` + `lib/actions/admin.ts`（后台只读聚合）。
  - i18n：seed 扩 `admin` namespace（约 70 键 ×2），重跑 seed → Translation **356 行**。
  - 验证：`npx tsc --noEmit` 0 错；`next lint` 无警告；`next build` 成功（5 个 admin 路由 ×2 locale 全编译）；运行期烟测确认 `/zh/admin` 未登录 307→login、`/zh/proposals` 公开 200。
- **E 前端页面完成 E3-E8 + F3（页面级文案）**。`app/[locale]/` 下全部页面落地，全 TailwindCSS、PC+手机响应式（sm/md/lg）、文案全走 i18n key。
  - 复用组件 `components/ProposalCard.tsx`（server）：列表/首页/用户主页共用响应式卡片（标题 2 行截断、摘要 3 行、状态徽章、分类、发起人、票数），整卡链接详情；加入 barrel。
  - 首页 `app/[locale]/page.tsx`（E3）：Hero（appName + slogan「这块地盘由你决定」+ heroLead + 浏览/发起 CTA）+「最热提案」（listProposals 已按票数降序取前 3）+「最新提案」（按 createdAt 取前 3）；提案区 grid 1→2→3 列。
  - 提案列表 `proposals/page.tsx`（E4）：listProposals 按票数排序、`?category=` server 过滤（分类项从全量去重，client `category-filter.tsx` 改 URL）、卡片 grid 响应式、空态提示、发起入口。
  - 提案详情 `proposals/[id]/page.tsx`（E5）：正文（whitespace-pre-wrap）+ StatusBadge + 发起人/时间（getFormatter 本地化）+ `vote-button.tsx`（client，接 toggleVote，乐观更新+回滚，未登录转登录链接）+ 评论区（server listComments 列表 + `comment-form.tsx` client 接 createComment，成功 refresh；未登录转登录）。隐藏提案对非 ADMIN → notFound。
  - 发布提案 `proposals/new/page.tsx`（E6）：未登录 redirect 登录（带 callbackUrl，middleware 亦护）；`new-proposal-form.tsx`（client，接 createProposal，成功跳详情，字段错误映射 i18n key）。
  - 认证页（E7）：`login`/`register`/`forgetPS` 重写为设计系统组件（Input/Button/MessageBox 移植 v1 视觉），响应式壳=移动 80vw 竖排居中 / PC 窄卡居中；login 带注册+忘记密码入口；register 成功条+去登录；forgetPS 因 C5（后端重置）本期 ⏸ 故为 UI-only（提交给 forgotPending 提示，待 C5 接 action）。
  - 用户主页 `user/[id]/page.tsx`（E8）：`lib/actions/user.ts` 新增 `getUserProfile`（公开档案+提案计数+评论计数+发起的提案列表，只读）；头像首字母+角色徽章+加入时间+统计+贡献提案列表（StatusBadge+票数）。
  - i18n（F3）：seed 扩 namespace `home`/`user` + 扩 `common`/`auth`/`proposal`/`comment` 键，补齐 zh+en，重跑 seed → Translation **202 行**（101 键 ×2）。所有新页面零硬编码文案。
  - 验证：`npx tsc --noEmit` 0 错；`next build` 成功（/zh /en SSG + 动态 [id]/user 路由），16 页全过 lint。
- **E 前端核心（布局+设计系统+i18n 接线）部分完成 E1/E2 + F2**。全 TailwindCSS、全响应式、文案全走 i18n key。
  - 设计系统组件 `components/`（移植 v1 视觉、tailwind 重写、零硬编码文案）：
    - `Button.tsx`：`.ud_btn` 风格（高 38 / 圆角 12 / select-none / hover 蓝），4 变体 default·primary·ghost·danger，`fullWidth`，forwardRef。
    - `Input.tsx`（client）：padding 12 / 圆角 12 / 1px 边框聚焦变蓝；密码框右侧 eye 切换（aria-label 走 i18n 由调用方传入）；错误红字 14px 左缩进 12；label/error 走 key。
    - `MessageBox.tsx`：反馈条 info/success/error/warning（ud-blue/green/red/amber），error/warning role=alert。
    - `StatusBadge.tsx`（client）：提案状态机徽章，枚举→配色+`proposal.statusXxx` key（COLLECTING 中性 / ADOPTED 蓝 / IN_PROGRESS amber / SHIPPED 绿 / REJECTED 红）。
    - `LanguageSwitcher.tsx`（client，F2）：选项来自 DB Locale（Nav 注入），原生 `<select>` 窄屏可用，切换复用 next-intl locale 路由（保 pathname 换前缀）。
    - `LogoutButton.tsx`（client）：调 `logoutUser` action。
    - `components/index.ts` barrel 统一出口。
  - locale 感知导航原语 `lib/i18n/navigation.ts`（`createNavigation(routing)` → Link/usePathname/useRouter/redirect），内部跳转统一从此 import。
  - 顶部 Nav（E1）：`Nav.tsx`（server，取 session/DB 启用语言/i18n 文案）+ `NavShell.tsx`（client，响应式 + 移动端汉堡）。
    - 响应式：桌面（md+）横排=品牌+链接+语言+登录/用户；移动（<md）=品牌+汉堡，展开纵向面板（链接/语言/登录入口竖排）。slogan 仅 sm+ 显示省窄屏空间。
    - 高 60px（h-nav token）、sticky+backdrop-blur、主区 max-w-main 居中。ADMIN 才显示「管理后台」链接；已登录显昵称+退出，未登录显登录/注册。
  - 接线 `app/[locale]/layout.tsx`：挂 `<Nav />` + `<main max-w-main>` 主区（替换占位注释）；首页改用 i18n 文案 + 提案入口；登录/注册页改 `section`（消除嵌套 `<main>`，正式视觉留 E7）。
  - seed 加 `nav.menu`（汉堡 aria-label）键，重跑 seed → Translation 104 行。
  - 验证：`npx tsc --noEmit` 0 错；`next lint` 0 warning；`next build` 成功（/zh /en SSG）；起 prod server curl 实测 /zh /en 均正确渲染品牌/slogan/链接/登录注册/语言 select 双选项/汉堡 localized aria-label。
  - 余下 E（E3-E9 页面、F1 已由 middleware 完成、F3 文案）留后续；本阶段交付布局+组件+设计系统+i18n 接线骨架。
- **D 后端逻辑完成**（Server Actions，每个含权限/校验 + revalidate）。
  - `lib/actions/proposal.ts`：`createProposal`（zod 校验、requireActiveUser、revalidate `/proposals`）、`listProposals`（按票数 `votes._count` 降序 + 同票时间倒序、可按分类过滤、默认排除 `hiddenAt` 非空）、`getProposal`（隐藏内容对非 ADMIN 返 null、带 `viewerHasVoted`）、`updateStatus`（**仅 ADMIN**，按 domain.md 状态机校验合法迁移 COLLECTING→ADOPTED/REJECTED、ADOPTED→IN_PROGRESS、IN_PROGRESS→SHIPPED，终态拒绝）。
  - `lib/actions/vote.ts`：`toggleVote`（1 人 1 票，靠 `@@unique([proposalId,userId])`，幂等——P2002 冲突静默视为已投；删除取消；返回 `voted`+`voteCount`；封禁/隐藏拦截）。
  - `lib/actions/comment.ts`：`createComment`（requireActiveUser、提案需可见）、`listComments`（时间正序楼层、默认排除隐藏）。
  - `lib/actions/report.ts`：`createReport`（活跃用户、目标存在性校验）、`hideContent`(**ADMIN**，置/清 `hiddenAt` + 标记相关 Report `resolvedAt`)、`banUser`(**ADMIN**，置/清 `bannedAt`，拒封 ADMIN)。
  - `lib/i18n/messages.ts`：`loadMessages(locale)`（DB Translation → `{namespace:{key:value}}` → `unstable_cache`(tag `i18n`) → 缺 key 回退 `isDefault` 语言）、`getLocales()`（enabled 按 sortOrder）、`getDefaultLocale()`。`lib/i18n/request.ts` 接通该加载器替换占位空 messages。后台改文案 `revalidateTag('i18n')` 失效。
  - 统一返回稳定英文 error code（VALIDATION_FAILED/NOT_FOUND/INVALID_TRANSITION/FORBIDDEN/BANNED/UNAUTHENTICATED…），前端映射 i18n key，不硬编码可见文案。
  - 验证：`npx tsc --noEmit` 通过（EXIT 0）。
- **C 认证完成**（Auth.js v5 Credentials，服务端 session，无 localStorage token）。
  - `lib/auth.ts`：CredentialsProvider，邮箱+密码 → `prisma.user.findUnique` + `bcrypt.compare`，封禁用户（bannedAt 非空）拒登；JWT 策略，`jwt`/`session` callback 注入 `user.id`/`user.role`；`trustHost`。
  - `app/api/auth/[...nextauth]/route.ts` 导出 `GET`/`POST`。
  - `lib/actions/auth.ts`：`registerUser`（zod 校验、邮箱唯一、bcrypt 哈希、role=USER）、`loginUser`（zod + signIn，放行 NEXT_REDIRECT，凭证/封禁统一回 INVALID_CREDENTIALS）、`logoutUser`。错误统一返回稳定英文 code（前端映射 i18n key，不硬编码文案）。
  - `lib/auth-guard.ts`：`requireUser`/`requireActiveUser`（查库复核 bannedAt）/`requireAdmin` —— action 层角色校验工具，抛 `AuthError(code)`。
  - `middleware.ts`：next-intl 中间件 + 登录保护（`/proposals/new`、`/admin`，去 locale 前缀匹配；未登录 → `/{locale}/login?callbackUrl=`）。用 `next-auth/jwt` 的 `getToken` 解 token，Edge 安全（不引 prisma/bcrypt，middleware bundle 62.4 kB）。
  - `types/next-auth.d.ts`：扩展 Session/User/JWT 的 `id`/`role` 类型。
  - 最简登录/注册页（`app/[locale]/(auth)/login|register`，client form + useActionState，文案走 i18n key；正式视觉留 E7）。
  - 验证：`npx tsc --noEmit` 通过、`next lint` 0 warning、`next build` 成功（10 页预渲染 + middleware 编译）；对真实本地 DB 跑通注册/正确密码登录/错密码拒/封禁拒/邮箱唯一/seed admin 校验，全部 ✓。
- **B 数据层完成**：按 implementation.md §3 建 `prisma/schema.prisma`（User/Proposal/Vote `@@unique([proposalId,userId])`/Comment/Report/Locale/Translation `@@unique([namespace,key,localeCode])`，枚举 Role/ProposalStatus/ReportTarget）。
- `lib/db.ts` Prisma 单例（globalThis 防 dev 热重载连接泄漏）。
- `npx prisma migrate dev --name init` 成功，迁移 `20260625011218_init` 已应用。
- `prisma/seed.ts` + `package.json#prisma.seed`(`tsx prisma/seed.ts`) + `db:seed` 脚本；新增 dev 依赖 `tsx`。seed 幂等（upsert）。
- seed 结果：admin@udes1gn.local(ADMIN, bcrypt) ×1、Locale zh(默认)/en ×2、Translation 102 行(common/nav/auth/proposal/vote/comment ×中英)、示例提案 5 条(COLLECTING/ADOPTED/IN_PROGRESS/SHIPPED/REJECTED 各一)。DB 计数已核验。

## 2026-06-25

- **会话启动**：确立今晚自动化构建计划。范围 = 纵切一条可见链路（认证 + 提案 + 投票 + 中英 i18n + 响应式）。
- **已完成**：项目文档脚手架（README/AGENT/docs 五件套 + implementation + v1-reference）、任务工作台 `task-board.md`、开发过程文档目录。
- **待解锁**：① 香港服务器 SSH 访问（部署 I5/I6）；② 真实域名填入 Caddyfile（I3）。
- **下一步**：启动后台 Workflow 跑 A→B→C→D→E→F→H→I 构建链路。
