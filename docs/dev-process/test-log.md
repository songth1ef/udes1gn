# 测试记录 / Test Log

> 单元/集成测试 + Playwright E2E 结果。格式：用例 → 结果 → 备注。

## 2026-06-25 — Playwright E2E（H2 主链路 + H3 响应式）

**结论：3 用例 / 3 通过 / 0 失败 / 0 跳过**（`expected:3, unexpected:0, flaky:0`，总耗时约 2.3s）。

环境：`npm run build` 成功后 `npm run start`（prod，http://localhost:3000，单 worker 串行）；
chromium（headless）；DB 已 seed（5 提案 + 356 文案 + admin 账户）。配置见 `playwright.config.ts`。

### 用例清单

| # | 文件 | 用例 | 结果 | 备注 |
|---|------|------|------|------|
| 1 | `e2e/main-flow.spec.ts` | 注册→登录→发提案→列表→详情→投票→切语言→登出 | ✅ pass (1.1s) | 全链路真实跑通，DB 实际新增提案 `E2E 提案 <stamp>`、投票 toggle 生效（aria-pressed=true / 文案「已赞成」） |
| 2 | `e2e/responsive.spec.ts` | 响应式 mobile-390x844：首页/列表/详情 布局不破 + 截图 | ✅ pass (0.37s) | 无横向溢出；汉堡菜单可见；3 张截图 |
| 3 | `e2e/responsive.spec.ts` | 响应式 pc-1440x900：首页/列表/详情 布局不破 + 截图 | ✅ pass (0.35s) | 无横向溢出；桌面横排 Nav 可见；3 张截图 |

### 主链路覆盖点（H2）

注册（唯一邮箱，成功条）→ 登录（Credentials，Nav 出现昵称即已登录态）→ 发提案（受保护路由，
提交后跳详情）→ 提案列表看到该卡片 → 进详情（标题/URL 校验）→ 投票（toggle，`aria-pressed`
false→true、文案「赞成」→「已赞成」，乐观更新 + server 确认）→ 切换 中→英（URL `/zh/`→`/en/`，
Nav「首页」→「Home」、投票按钮「已赞成」→「Upvoted」，登录态与已投态跨语言保持）→ 切回中 →
登出（Nav 回到未登录态，出现「登录」入口）。文案断言全部对齐 seed 的 zh/en 字面量。

### 响应式覆盖点（H3）

两个 viewport（手机 390×844 / PC 1440×900）下，对 **首页 / 提案列表 / 提案详情** 三页：
机器可判定信号 = 文档无横向溢出（`scrollWidth ≤ clientWidth + 1`）+ 关键锚点可见
（首页 Hero slogan / 列表标题「全部提案」/ 详情 `article h1`）+ 导航形态正确
（移动端汉堡可见 / PC 桌面横排 Nav 可见）。

### 截图（`e2e/screenshots/`，6 张）

- `home-mobile-390x844.png` / `home-pc-1440x900.png`
- `list-mobile-390x844.png` / `list-pc-1440x900.png`
- `detail-mobile-390x844.png` / `detail-pc-1440x900.png`

### 跑测期间发现并修复的应用缺陷（high）

**middleware 鉴权 cookie 解码失配 —— 已登录用户访问受保护路由被误跳登录页。**
`middleware.ts` 用 `next-auth/jwt` 的 `getToken` 解 session JWT，但与 NextAuth v5 (Auth.js,
beta.31) 的发码方式三处失配：① cookie 名（Auth.js 用 `authjs.session-token`，getToken 默认找
v4 旧名 `next-auth.session-token`）；② JWE 解密 `salt`（Auth.js salt == cookie 名，需显式传）；
③ `__Secure-` 前缀判定（应按**实际协议**判定，原按 `NODE_ENV` 判定 → prod 构建跑在
http://localhost 时错配前缀，cookie 找不到）。三者任一不符 `getToken` 即返回 `null` → 受保护路由
（`/proposals/new`、`/admin/*`）对已登录用户也 307 跳登录，直接卡死 H2 的「发提案」步骤。
修复：显式传 `cookieName` + `salt`，并用 `x-forwarded-proto` / `req.nextUrl.protocol` 判定
是否 https 决定 `__Secure-` 前缀与 `secureCookie`。修复后 curl 验证：带 session 访问
`/zh/proposals/new` → 200，匿名 → 307 跳 login；E2E 全链路随之转绿。
